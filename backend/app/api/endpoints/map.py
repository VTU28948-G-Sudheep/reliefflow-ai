from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Incident
from app.models.resource import Resource
from app.services.route_planner import ROAD_NODES, ROAD_EDGES

router = APIRouter()

@router.get("/layers")
def get_map_layers(db: Session = Depends(get_db)):
    """
    Returns spatial layers for Leaflet map:
    - Active incidents with priority markers
    - Relief supply depots with inventory counts
    - Road closures and hazard corridors
    """
    incidents = db.query(Incident).all()
    resources = db.query(Resource).all()

    # Aggregate resources by depot
    depot_resources = {}
    for r in resources:
        if r.depot_name not in depot_resources:
            depot_resources[r.depot_name] = []
        depot_resources[r.depot_name].append({
            "name": r.name,
            "category": r.category,
            "available": max(0, r.total_quantity - r.allocated_quantity),
            "unit": r.unit,
        })

    depot_markers = []
    for node_id, data in ROAD_NODES.items():
        if data.get("type") == "depot":
            depot_name = data["name"]
            depot_markers.append({
                "id": node_id,
                "name": depot_name,
                "latitude": data["lat"],
                "longitude": data["lon"],
                "type": "depot",
                "supplies": depot_resources.get(depot_name, []),
                "is_demo": True,
            })

    # Incidents markers
    incident_markers = []
    for inc in incidents:
        incident_markers.append({
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "incident_type": inc.incident_type,
            "location_name": inc.location_name,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "people_affected": inc.people_affected,
            "medical_urgency": inc.medical_urgency,
            "threat_to_life": inc.threat_to_life,
            "status": inc.status,
            "priority_score": inc.priority_score,
            "priority_category": inc.priority_category,
            "assessment_uncertainty": inc.assessment_uncertainty,
            "recommended_action": inc.recommended_action,
            "is_verified": inc.is_verified,
            "is_demo": inc.is_demo,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
        })

    # Road closures for polylines
    closures = []
    for edge in ROAD_EDGES:
        if edge["status"] in ["blocked", "caution"]:
            u_node = ROAD_NODES[edge["u"]]
            v_node = ROAD_NODES[edge["v"]]
            closures.append({
                "road": edge["road"],
                "status": edge["status"],
                "hazard": edge["hazard"],
                "coordinates": [
                    [u_node["lat"], u_node["lon"]],
                    [v_node["lat"], v_node["lon"]],
                ]
            })

    return {
        "incidents": incident_markers,
        "depots": depot_markers,
        "hazard_corridors": closures,
        "center": [13.0827, 80.2707],
        "default_zoom": 12,
        "region_name": "Chennai Metropolitan Area, Tamil Nadu",
        "disclaimer": "DEMO DATA: Spatial coordinates and road hazard geometries for Chennai disaster response simulation."
    }
