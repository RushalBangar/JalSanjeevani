import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def compute_distance(lat1, lon1, lat2, lon2):
    """Simple equirectangular approximation for distance in meters"""
    R = 6371000 # Radius of Earth in meters
    x = (math.radians(lon2) - math.radians(lon1)) * math.cos(0.5 * (math.radians(lat2) + math.radians(lat1)))
    y = math.radians(lat2) - math.radians(lat1)
    return R * math.sqrt(x*x + y*y)

def get_attr(obj, attr, default=0):
    """Safely retrieves attribute from Pydantic model or dict."""
    if isinstance(obj, dict):
        return obj.get(attr, default)
    return getattr(obj, attr, default)

def create_data_model(villages, num_tankers, tanker_capacity, depot_coords=None, depot_name=None):
    """Formats the data for the OR-Tools solver with dynamic regional depot routing."""
    data = {}
    
    # Regional Depots
    DEPOT_AHILYA = (19.1120, 74.7710)
    DEPOT_SINNAR = (19.8450, 74.0000)

    if depot_coords is not None:
        depot_lat, depot_lng = depot_coords
        depot_title = depot_name or "Regional Headworks (Depot)"
    elif villages:
        # Calculate centroid of requested distressed villages to route from nearest bulk depot
        avg_lat = sum(float(get_attr(v, 'lat')) for v in villages) / len(villages)
        avg_lng = sum(float(get_attr(v, 'lng')) for v in villages) / len(villages)
        dist_ahilya = compute_distance(avg_lat, avg_lng, DEPOT_AHILYA[0], DEPOT_AHILYA[1])
        dist_sinnar = compute_distance(avg_lat, avg_lng, DEPOT_SINNAR[0], DEPOT_SINNAR[1])

        if dist_ahilya < dist_sinnar:
            depot_lat, depot_lng = DEPOT_AHILYA
            depot_title = depot_name or "Ahilyanagar Headworks (Depot)"
        else:
            depot_lat, depot_lng = DEPOT_SINNAR
            depot_title = depot_name or "Sinnar Reservoir (Depot)"
    else:
        depot_lat, depot_lng = DEPOT_SINNAR
        depot_title = "Sinnar Reservoir (Depot)"
    
    # Calculate demands (Humans * 40L + Cattle * 70L)
    demands = [0] # Depot has 0 demand
    locations = [(depot_lat, depot_lng)]
    village_names = [depot_title]
    
    for v in villages:
        h_pop = int(get_attr(v, 'human_pop', 0))
        c_pop = int(get_attr(v, 'cattle_pop', 0))
        total_demand = (h_pop * 40) + (c_pop * 70)
        # Single tanker delivery drop capped at tanker capacity to ensure feasible CVRP trip
        demand_liters = min(total_demand, tanker_capacity)
        demands.append(demand_liters)
        locations.append((float(get_attr(v, 'lat')), float(get_attr(v, 'lng'))))
        village_names.append(str(get_attr(v, 'name', 'Village')))
            
    data['demands'] = demands
    data['num_vehicles'] = num_tankers
    data['vehicle_capacities'] = [tanker_capacity] * num_tankers
    data['depot'] = 0
    
    # Distance matrix (in meters)
    num_locations = len(locations)
    distance_matrix = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            dist = compute_distance(locations[i][0], locations[i][1], locations[j][0], locations[j][1])
            row.append(int(dist))
        distance_matrix.append(row)
        
    data['distance_matrix'] = distance_matrix
    data['locations'] = locations
    data['names'] = village_names
    return data

def optimize_routes(villages, num_tankers, tanker_capacity, depot_coords=None, depot_name=None):
    """Uses Google OR-Tools CVRP (Capacitated Vehicle Routing Problem)"""
    data = create_data_model(villages, num_tankers, tanker_capacity, depot_coords, depot_name)
    
    if len(data['demands']) <= 1:
        return [] # No villages need water
        
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']), data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands'][from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        data['vehicle_capacities'],  # vehicle maximum capacities
        True,  # start cumul to zero
        'Capacity'
    )
    
    # Prioritized disjunction penalties:
    # Critical/Depleted villages have 10,000,000 penalty (must serve first to prevent loss of life/cattle)
    # Warning villages have 500,000 penalty (deferrable if fleet capacity is constrained)
    for node in range(1, len(data['distance_matrix'])):
        village_obj = villages[node - 1]
        v_status = str(get_attr(village_obj, 'status', 'normal')).lower()
        if 'critical' in v_status or 'depleted' in v_status:
            node_penalty = 10000000
        elif 'warning' in v_status:
            node_penalty = 500000
        else:
            node_penalty = 100000
        routing.AddDisjunction([manager.NodeToIndex(node)], node_penalty)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    
    solution = routing.SolveWithParameters(search_parameters)
    
    routes = []
    if solution:
        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            route = []
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route.append({
                    "name": data['names'][node_index],
                    "coords": data['locations'][node_index],
                    "delivery_drop": data['demands'][node_index]
                })
                index = solution.Value(routing.NextVar(index))
            
            # Add final return to depot
            node_index = manager.IndexToNode(index)
            route.append({
                "name": data['names'][node_index],
                "coords": data['locations'][node_index],
                "delivery_drop": 0
            })
            
            # Only return routes that actually visited a village
            if len(route) > 2: 
                routes.append(route)
                
    return routes
