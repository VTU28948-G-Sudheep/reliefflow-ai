"""
ReliefFlow AI - NetworkX Graph Route Planning Engine (Chennai Disaster Network)
--------------------------------------------------------------------------------
Calculates shortest navigable paths from relief depots to emergency incident locations.
Identifies known road closures, flooded bridges, debris zones, and hazards.

SAFETY WARNING:
Never claim a route is safe simply because it is the shortest.
Real-world disaster corridors suffer sudden structural failures, flash floods, and debris.
All route calculations are simulation estimates on demo network data.
"""

import math
from typing import Dict, Any, List, Optional
import networkx as nx

# Chennai Road Network Nodes with Coordinates (lat, lon)
ROAD_NODES: Dict[str, Dict[str, Any]] = {
    # Depots
    "DEPOT_ALPHA": {"name": "Central Regional Depot (Chennai Central / Port)", "lat": 13.0827, "lon": 80.2707, "type": "depot"},
    "DEPOT_BETA": {"name": "South Logistics Base (Guindy / GST)", "lat": 13.0067, "lon": 80.2025, "type": "depot"},
    "DEPOT_GAMMA": {"name": "North Reserve Base (Madhavaram / Ennore)", "lat": 13.1480, "lon": 80.2310, "type": "depot"},
    
    # Major Intersections & Waypoints (Chennai Corridors)
    "JCT_ANNA_SALAI": {"name": "Anna Salai (Mount Road) Central Junction", "lat": 13.0600, "lon": 80.2500, "type": "junction"},
    "JCT_ADYAR_BRIDGE": {"name": "Maraimalai Adigal Bridge (Adyar River Crossing)", "lat": 13.0080, "lon": 80.2550, "type": "bridge"},
    "JCT_KATHIPARA": {"name": "Kathipara Cloverleaf Interchange", "lat": 13.0070, "lon": 80.2050, "type": "junction"},
    "JCT_KOYAMBEDU": {"name": "Koyambedu Logistics Corridor (Inner Ring Rd)", "lat": 13.0690, "lon": 80.1940, "type": "junction"},
    "JCT_OMR_GATEWAY": {"name": "OMR (IT Corridor) Madhya Kailash Junction", "lat": 13.0060, "lon": 80.2450, "type": "junction"},
    "JCT_POONAMALLEE": {"name": "Poonamallee High Road Junction", "lat": 13.0800, "lon": 80.2200, "type": "junction"},
    "JCT_MADHAVARAM_EXPRESS": {"name": "Grand Northern Trunk (GNT) Bypass", "lat": 13.1400, "lon": 80.2200, "type": "highway"},
    
    # Incident Sectors (Chennai Disaster Zones)
    "SECTOR_VELACHERY": {"name": "Velachery Residential Lowland Basin", "lat": 12.9815, "lon": 80.2180, "type": "incident"},
    "SECTOR_ADYAR_BASIN": {"name": "Kotturpuram Adyar River Flooding Zone", "lat": 13.0180, "lon": 80.2420, "type": "incident"},
    "SECTOR_TAMBARAM_MUDICHUR": {"name": "Mudichur / Tambaram Flood Sector", "lat": 12.9250, "lon": 80.0880, "type": "incident"},
    "SECTOR_ENNORE_CREEK": {"name": "Ennore Creek Industrial Area", "lat": 13.2010, "lon": 80.3180, "type": "incident"},
    "SECTOR_GEORGE_TOWN": {"name": "George Town Old Quarter Sector", "lat": 13.0910, "lon": 80.2880, "type": "incident"},
    "SECTOR_MYLAPORE": {"name": "Mylapore Heritage Zone Relief Post", "lat": 13.0330, "lon": 80.2670, "type": "incident"},
}

# Chennai Road Segments with Distance (km), Speed (km/h), and Current Disaster Status
ROAD_EDGES = [
    # Depot Alpha (Central) Connections
    {"u": "DEPOT_ALPHA", "v": "SECTOR_GEORGE_TOWN", "road": "Rajaji Salai / North Beach Rd", "distance_km": 2.1, "speed_kmh": 35, "status": "clear", "hazard": None},
    {"u": "DEPOT_ALPHA", "v": "JCT_ANNA_SALAI", "road": "Anna Salai Arterial", "distance_km": 3.4, "speed_kmh": 45, "status": "clear", "hazard": None},
    {"u": "DEPOT_ALPHA", "v": "JCT_POONAMALLEE", "road": "Poonamallee High Road", "distance_km": 4.5, "speed_kmh": 40, "status": "clear", "hazard": None},
    
    # Depot Beta (Guindy / South) Connections
    {"u": "DEPOT_BETA", "v": "JCT_KATHIPARA", "road": "GST Road Inner Connector", "distance_km": 1.2, "speed_kmh": 50, "status": "clear", "hazard": None},
    {"u": "DEPOT_BETA", "v": "JCT_OMR_GATEWAY", "road": "Sardar Patel Road", "distance_km": 4.1, "speed_kmh": 45, "status": "clear", "hazard": None},
    {"u": "DEPOT_BETA", "v": "SECTOR_TAMBARAM_MUDICHUR", "road": "GST Highway South", "distance_km": 14.2, "speed_kmh": 55, "status": "caution", "hazard": "Slow traffic, waterlogging along service lanes"},
    
    # Depot Gamma (Madhavaram / North) Connections
    {"u": "DEPOT_GAMMA", "v": "JCT_MADHAVARAM_EXPRESS", "road": "Madhavaram High Road", "distance_km": 1.8, "speed_kmh": 45, "status": "clear", "hazard": None},
    {"u": "DEPOT_GAMMA", "v": "SECTOR_ENNORE_CREEK", "road": "Ennore Express Highway", "distance_km": 8.5, "speed_kmh": 35, "status": "blocked", "hazard": "ROAD CLOSURE: Severe floodwater breach & high tide canal backflow across expressway"},
    {"u": "DEPOT_GAMMA", "v": "DEPOT_ALPHA", "road": "GNT Road / Basin Bridge Corrdior", "distance_km": 7.2, "speed_kmh": 40, "status": "clear", "hazard": None},
    
    # Central Arterials & Adyar Bridge
    {"u": "JCT_ANNA_SALAI", "v": "SECTOR_MYLAPORE", "road": "Radhakrishnan Salai (RK Road)", "distance_km": 2.8, "speed_kmh": 35, "status": "clear", "hazard": None},
    {"u": "JCT_ANNA_SALAI", "v": "SECTOR_ADYAR_BASIN", "road": "Turnbulls Road / Chamiers Rd", "distance_km": 4.6, "speed_kmh": 40, "status": "clear", "hazard": None},
    {"u": "SECTOR_MYLAPORE", "v": "JCT_ADYAR_BRIDGE", "road": "Greenways Road Arterial", "distance_km": 3.2, "speed_kmh": 35, "status": "clear", "hazard": None},
    
    # Adyar River Bridge (Closed due to river flood water level reaching deck)
    {"u": "JCT_ADYAR_BRIDGE", "v": "JCT_OMR_GATEWAY", "road": "Maraimalai Adigal Bridge Causeway", "distance_km": 1.1, "speed_kmh": 20, "status": "blocked", "hazard": "ROAD CLOSURE: Adyar river water cresting over bridge deck; structural inspection in progress"},
    
    # Detour Route avoiding closed Adyar Bridge: Kathipara to OMR & Velachery
    {"u": "JCT_KATHIPARA", "v": "SECTOR_VELACHERY", "road": "Guindy - Velachery Main Road", "distance_km": 5.4, "speed_kmh": 35, "status": "clear", "hazard": "Slow traffic, wet roadway"},
    {"u": "JCT_OMR_GATEWAY", "v": "SECTOR_VELACHERY", "road": "Taramani Link Road", "distance_km": 3.8, "speed_kmh": 40, "status": "clear", "hazard": None},
    {"u": "JCT_POONAMALLEE", "v": "JCT_KOYAMBEDU", "road": "Poonamallee Bypass", "distance_km": 3.9, "speed_kmh": 50, "status": "clear", "hazard": None},
    {"u": "JCT_KOYAMBEDU", "v": "JCT_KATHIPARA", "road": "Jawaharlal Nehru Road (100ft Inner Ring Rd)", "distance_km": 7.8, "speed_kmh": 50, "status": "clear", "hazard": None},
    {"u": "JCT_MADHAVARAM_EXPRESS", "v": "JCT_KOYAMBEDU", "road": "Chennai Bypass Northern Section", "distance_km": 9.2, "speed_kmh": 55, "status": "clear", "hazard": None},
    {"u": "JCT_MADHAVARAM_EXPRESS", "v": "SECTOR_ENNORE_CREEK", "road": "Manali Industrial Detour Trail", "distance_km": 12.1, "speed_kmh": 30, "status": "caution", "hazard": "High clearance 4x4 relief trucks only"},
]

def build_network_graph() -> nx.Graph:
    """Builds a NetworkX undirected graph representing the Chennai regional disaster road network."""
    G = nx.Graph()
    for node_id, attrs in ROAD_NODES.items():
        G.add_node(node_id, **attrs)
        
    for edge in ROAD_EDGES:
        G.add_edge(
            edge["u"],
            edge["v"],
            road=edge["road"],
            distance_km=edge["distance_km"],
            speed_kmh=edge["speed_kmh"],
            status=edge["status"],
            hazard=edge["hazard"],
            base_time_min=round((edge["distance_km"] / edge["speed_kmh"]) * 60, 1),
        )
    return G

def find_nearest_node(lat: float, lon: float, node_type: Optional[str] = None) -> str:
    """Finds the nearest road node using Euclidean distance approximation."""
    best_node = None
    min_dist = float("inf")
    for node_id, data in ROAD_NODES.items():
        if node_type and data.get("type") != node_type:
            continue
        dist = math.hypot(lat - data["lat"], lon - data["lon"])
        if dist < min_dist:
            min_dist = dist
            best_node = node_id
    return best_node or "DEPOT_ALPHA"

def plan_relief_route(
    origin_id: str,
    destination_id: str,
    avoid_closures: bool = True
) -> Dict[str, Any]:
    """
    Computes shortest route avoiding closed or impassable roads using NetworkX Dijkstra.
    Returns path nodes, distance, estimated travel time, turn-by-turn steps, and hazard alerts.
    """
    G = build_network_graph()

    if origin_id not in G.nodes:
        origin_id = "DEPOT_ALPHA"
    if destination_id not in G.nodes:
        destination_id = "SECTOR_VELACHERY"

    if origin_id == destination_id:
        return {
            "origin": ROAD_NODES.get(origin_id, {}),
            "destination": ROAD_NODES.get(destination_id, {}),
            "path_nodes": [origin_id],
            "total_distance_km": 0.0,
            "estimated_duration_minutes": 0.0,
            "steps": [{"instruction": "Already at destination coordinates.", "distance_km": 0.0, "status": "clear"}],
            "closures_avoided": [],
            "warnings": ["Origin and destination are identical."],
            "is_simulation_demo": True,
            "safety_disclaimer": "Simulated route. Never assume shortest is safest."
        }

    routing_G = nx.Graph()
    for node, data in G.nodes(data=True):
        routing_G.add_node(node, **data)

    closures_avoided: List[Dict[str, Any]] = []

    for u, v, data in G.edges(data=True):
        is_blocked = (data["status"] == "blocked")
        
        if avoid_closures and is_blocked:
            closures_avoided.append({
                "segment": f"{ROAD_NODES[u]['name']} - {ROAD_NODES[v]['name']}",
                "road": data["road"],
                "reason": data["hazard"]
            })
            continue

        penalty = 1.4 if data["status"] == "caution" else 1.0
        weight = data["distance_km"] * penalty
        routing_G.add_edge(u, v, weight=weight, **data)

    try:
        path = nx.shortest_path(routing_G, source=origin_id, target=destination_id, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        try:
            unconstrained_path = nx.shortest_path(G, source=origin_id, target=destination_id, weight="distance_km")
            return {
                "origin": ROAD_NODES.get(origin_id, {}),
                "destination": ROAD_NODES.get(destination_id, {}),
                "route_found": False,
                "error": "No safe detour available. The direct access road is fully blocked by hazardous disaster conditions.",
                "blocked_path": unconstrained_path,
                "closures_avoided": closures_avoided,
                "warnings": [
                    "CRITICAL: All known road corridors to this destination are blocked by closures or floods.",
                    "Amphibious watercraft or NDRF air rescue required."
                ],
                "is_simulation_demo": True,
                "safety_disclaimer": "CRITICAL HAZARD: Route impassable due to road closures."
            }
        except Exception:
            return {
                "route_found": False,
                "error": "Route calculation failed between selected waypoints.",
                "is_simulation_demo": True
            }

    total_km = 0.0
    total_time_min = 0.0
    steps: List[Dict[str, Any]] = []
    warnings: List[str] = [
        "DEMO DATA: Distances and travel durations are estimates from Chennai simulated network graph.",
        "SAFETY ADVISORY: Never assume a route is safe simply because it is the shortest path. On-scene conditions change rapidly."
    ]

    for i in range(len(path) - 1):
        u = path[i]
        v = path[i+1]
        edge_data = G[u][v]
        dist = edge_data["distance_km"]
        time_min = edge_data["base_time_min"]
        
        total_km += dist
        total_time_min += time_min

        step_instruction = f"Proceed on {edge_data['road']} toward {ROAD_NODES[v]['name']} ({dist} km)"
        if edge_data["status"] == "caution":
            step_instruction += f" [CAUTION: {edge_data['hazard']}]"
            warnings.append(f"Caution on segment {edge_data['road']}: {edge_data['hazard']}")

        steps.append({
            "step_number": i + 1,
            "from_node": ROAD_NODES[u]["name"],
            "to_node": ROAD_NODES[v]["name"],
            "road": edge_data["road"],
            "distance_km": dist,
            "estimated_minutes": time_min,
            "status": edge_data["status"],
            "hazard": edge_data["hazard"],
            "instruction": step_instruction,
            "from_coords": [ROAD_NODES[u]["lat"], ROAD_NODES[u]["lon"]],
            "to_coords": [ROAD_NODES[v]["lat"], ROAD_NODES[v]["lon"]],
        })

    return {
        "route_found": True,
        "origin_id": origin_id,
        "origin": ROAD_NODES.get(origin_id, {}),
        "destination_id": destination_id,
        "destination": ROAD_NODES.get(destination_id, {}),
        "path_nodes": path,
        "node_details": [ROAD_NODES[n] for n in path],
        "total_distance_km": round(total_km, 2),
        "estimated_duration_minutes": round(total_time_min, 1),
        "steps": steps,
        "closures_avoided": closures_avoided,
        "warnings": warnings,
        "is_simulation_demo": True,
        "safety_disclaimer": "DEMO SIMULATION: Route calculated using NetworkX Dijkstra shortest path on Chennai road network. Weather and ground conditions vary."
    }
