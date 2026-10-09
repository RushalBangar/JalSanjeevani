import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def compute_distance(lat1, lon1, lat2, lon2):
    """Simple equirectangular approximation for distance in meters"""
    R = 6371000 # Radius of Earth in meters
    x = (math.radians(lon2) - math.radians(lon1)) * math.cos(0.5 * (math.radians(lat2) + math.radians(lat1)))
    y = math.radians(lat2) - math.radians(lat1)
    return R * math.sqrt(x*x + y*y)

def create_data_model(villages, num_tankers, tanker_capacity):
    """Formats the data for the OR-Tools solver."""
    data = {}
    
    # Depot (start point) - Assume Sinnar Municipal Water Tank
    depot_lat, depot_lng = 19.8450, 74.0000
    
    # Calculate demands (Humans * 40L + Cattle * 70L)
    demands = [0] # Depot has 0 demand
    locations = [(depot_lat, depot_lng)]
    village_names = ["Sinnar Reservoir (Depot)"]
    
    for v in villages:
        demand_liters = (v.human_pop * 40) + (v.cattle_pop * 70)
        demands.append(demand_liters)
        locations.append((v.lat, v.lng))
        village_names.append(v.name)
            
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

def optimize_routes(villages, num_tankers, tanker_capacity):
    """Uses Google OR-Tools CVRP (Capacitated Vehicle Routing Problem)"""
    data = create_data_model(villages, num_tankers, tanker_capacity)
    
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
    
    # Allow dropping visits if demand is too high for the fleet (Penalty)
    # We assign a huge penalty so it only drops if absolutely physically impossible
    penalty = 1000000 
    for node in range(1, len(data['distance_matrix'])):
        routing.AddDisjunction([manager.NodeToIndex(node)], penalty)

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
