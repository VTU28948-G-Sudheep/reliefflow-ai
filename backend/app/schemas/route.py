from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RouteRequest(BaseModel):
    origin_id: str = Field(..., description="ID of origin depot or junction")
    destination_id: str = Field(..., description="ID of target incident sector or junction")
    avoid_closures: bool = True

class RouteFromCoordsRequest(BaseModel):
    depot_id: Optional[str] = "DEPOT_ALPHA"
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    avoid_closures: bool = True

class RouteStep(BaseModel):
    step_number: int
    from_node: str
    to_node: str
    road: str
    distance_km: float
    estimated_minutes: float
    status: str
    hazard: Optional[str] = None
    instruction: str
    from_coords: List[float]
    to_coords: List[float]

class RouteResponse(BaseModel):
    route_found: bool
    origin_id: Optional[str] = None
    origin: Optional[Dict[str, Any]] = None
    destination_id: Optional[str] = None
    destination: Optional[Dict[str, Any]] = None
    path_nodes: Optional[List[str]] = None
    node_details: Optional[List[Dict[str, Any]]] = None
    total_distance_km: Optional[float] = None
    estimated_duration_minutes: Optional[float] = None
    steps: Optional[List[RouteStep]] = None
    closures_avoided: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[str]] = None
    error: Optional[str] = None
    is_simulation_demo: bool = True
    safety_disclaimer: str
