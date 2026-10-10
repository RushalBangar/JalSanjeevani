import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from solver import optimize_routes

# Try loading .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vzfddxiiptkeeyvrfkhl.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZmRkeGlpcHRrZWV5dnJma2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDM1OTYsImV4cCI6MjEwNzE3OTU5Nn0.8NA30jSO58gV8vbyvWnsUwdgXsMGFeMtda25lQ8EEFQ")

supabase_client = None
if SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[JalSanjeevani API] Supabase client connected successfully.")
    except Exception as e:
        print(f"[JalSanjeevani API] Supabase client optional init note: {e}")

app = FastAPI(title="JalSanjeevani Logistics API")

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
    using Google OR-Tools. Optionally syncs dispatch run to Supabase.
    """
    # Filter only critical or warning villages that need water
    distressed_villages = [v for v in request.villages if v.status in ["critical", "warning"]]
    
    routes = optimize_routes(distressed_villages, request.num_tankers, request.tanker_capacity)
    
    # If Supabase client is connected, log the dispatch run
    if supabase_client:
        try:
            total_req = sum([v.human_pop * 40 + v.cattle_pop * 70 for v in distressed_villages])
            supabase_client.table("dispatches").insert({
                "routes": routes,
                "total_liters": total_req,
                "algorithm": "Google OR-Tools CVRP",
                "dispatched_by": "FastAPI Routing Engine"
            }).execute()
        except Exception as err:
            print(f"[Supabase Sync Error]: {err}")

    return {
        "status": "success", 
        "message": "Routes successfully optimized.",
        "routes": routes
    }

@app.get("/health")
def health_check():
    return {
        "status": "online", 
        "service": "JalSanjeevani Routing Engine",
        "supabase_connected": supabase_client is not None
    }
