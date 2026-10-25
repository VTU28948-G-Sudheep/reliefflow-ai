from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.route import RouteRequest, RouteResponse
from app.services.route_planner import (
    ROAD_NODES,
    ROAD_EDGES,
    plan_relief_route,
    find_nearest_node
)

router = APIRouter()

@router.get("/network")
def get_road_network():
    """Returns the full road network nodes, edges, active road closures, and hazard locations."""
    closures = [e for e in ROAD_EDGES if e["status"] == "blocked"]
    cautions = [e for e in ROAD_EDGES if e["status"] == "caution"]
    depots = [
        {"id": k, **v} for k, v in ROAD_NODES.items() if v.get("type") == "depot"
    ]
    return {
        "nodes": ROAD_NODES,
        "edges": ROAD_EDGES,
        "depots": depots,
        "active_closures": closures,
        "caution_segments": cautions,
        "disclaimer": "DEMO DATA: Road network simulation. Real-world conditions vary."
    }

@router.post("/plan", response_model=RouteResponse)
def plan_route(request: RouteRequest):
    """
    Calculates shortest route from depot or origin to target waypoint using NetworkX Dijkstra.
    Avoids known blocked roadways when avoid_closures=True.
    """
    route_data = plan_relief_route(
        origin_id=request.origin_id,
        destination_id=request.destination_id,
        avoid_closures=request.avoid_closures
    )
    return route_data

@router.post("/plan-to-incident/{incident_id}")
def plan_route_to_incident(
    incident_id: int,
    depot_id: Optional[str] = "DEPOT_ALPHA",
    avoid_closures: bool = True,
    db: Session = Depends(get_db)
):
    """
    Finds shortest route from selected depot to the nearest road network node for a specific incident.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident #{incident_id} not found")

    # Match coordinates to nearest network node
    dest_node = find_nearest_node(incident.latitude, incident.longitude)

    route_data = plan_relief_route(
        origin_id=depot_id or "DEPOT_ALPHA",
        destination_id=dest_node,
        avoid_closures=avoid_closures
    )
    
    # Attach incident metadata
    route_data["incident_id"] = incident.id
    route_data["incident_title"] = incident.title
    route_data["incident_location"] = incident.location_name
    route_data["incident_coords"] = [incident.latitude, incident.longitude]

    return route_data
