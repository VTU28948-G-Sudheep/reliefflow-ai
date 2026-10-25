"""
Unit tests for ReliefFlow AI NetworkX Route Planning Module (Chennai Disaster Network)
"""

from app.services.route_planner import (
    build_network_graph,
    plan_relief_route,
    find_nearest_node
)

def test_graph_construction():
    """Verify road graph contains required depots and waypoints."""
    G = build_network_graph()
    assert "DEPOT_ALPHA" in G.nodes
    assert "DEPOT_BETA" in G.nodes
    assert "DEPOT_GAMMA" in G.nodes
    assert G.number_of_nodes() >= 10
    assert G.number_of_edges() >= 12

def test_shortest_route_avoiding_closures():
    """Verify route planner detours around blocked bridge/causeway."""
    # From DEPOT_ALPHA to SECTOR_VELACHERY
    result = plan_relief_route("DEPOT_ALPHA", "SECTOR_VELACHERY", avoid_closures=True)
    assert result["route_found"] is True
    assert result["total_distance_km"] > 0
    assert len(result["steps"]) > 0
    # Confirm blocked roads (e.g. Maraimalai Adigal Bridge Causeway) were tracked and avoided
    avoided_roads = [c["road"] for c in result.get("closures_avoided", [])]
    assert "Maraimalai Adigal Bridge Causeway" in avoided_roads

def test_disclaimer_present():
    """Verify safety disclaimer is always included in route response."""
    result = plan_relief_route("DEPOT_ALPHA", "SECTOR_VELACHERY")
    assert "safety_disclaimer" in result
    assert "Never assume" in result["safety_disclaimer"] or "DEMO" in result["safety_disclaimer"]

def test_find_nearest_node():
    """Test spatial snap to nearest graph node in Chennai."""
    # Near Chennai Central: 13.0820, 80.2700
    nearest = find_nearest_node(13.0820, 80.2700)
    assert nearest in ["DEPOT_ALPHA", "SECTOR_GEORGE_TOWN", "JCT_ANNA_SALAI"]
