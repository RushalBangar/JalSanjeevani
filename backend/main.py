from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from solver import optimize_routes

app = FastAPI(title="JalSetu Logistics API")

# Allow frontend to call this API locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Village(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    human_pop: int
    cattle_pop: int
    status: str

class DispatchRequest(BaseModel):
    villages: List[Village]
    num_tankers: int
    tanker_capacity: int = 10000  # 10,000 Liters standard capacity

@app.post("/api/allocate")
async def allocate_tankers(request: DispatchRequest):
    """
    Takes village distress data and computes optimal tanker routes
    using Google OR-Tools.
    """
    # Filter only critical or warning villages that need water
    distressed_villages = [v for v in request.villages if v.status in ["critical", "warning"]]
    
    routes = optimize_routes(distressed_villages, request.num_tankers, request.tanker_capacity)
    
    return {
        "status": "success", 
        "message": "Routes successfully optimized.",
        "routes": routes
    }

@app.get("/health")
def health_check():
    return {"status": "online", "service": "JalSetu Routing Engine"}
