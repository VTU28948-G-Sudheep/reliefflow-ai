import json
import datetime
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.resource import Resource, ResourceAllocation
from app.services.danger_assessment import calculate_danger_assessment

# Chennai Regional Disaster Demo Incidents
DEMO_INCIDENTS = [
    {
        "title": "Velachery Residential Lowlands - Heavy Inundation & Senior Home Evacuation",
        "description": "Continuous storm surge and local lake backflow caused 3 to 4 feet inundation in Velachery low-lying colonies. 65 residents (including 14 elderly individuals) stranded on 1st floors needing inflatable boat evacuation and drinking water.",
        "incident_type": "Flood",
        "location_name": "Velachery Residential Lowland Basin, Chennai",
        "latitude": 12.9815,
        "longitude": 80.2180,
        "people_affected": 65,
        "medical_urgency": "Critical",
        "threat_to_life": True,
        "status": "In Progress",
        "evidence_quality": "Official Responder",
        "is_verified": True,
        "evidence_url": "https://example.com/evidence/tn-fire-rescue-velachery.pdf",
        "is_demo": True,
        "hours_ago": 0.5,
    },
    {
        "title": "Adyar River Basin (Kotturpuram) - River Overflow & Slum Cluster Waterlogging",
        "description": "Adyar river discharge breached riverbank containment near Kotturpuram bridge approach. Around 120 residents displaced; emergency shelter opened at local higher secondary school.",
        "incident_type": "Flood",
        "location_name": "Kotturpuram Adyar River Bank, Chennai",
        "latitude": 13.0180,
        "longitude": 80.2420,
        "people_affected": 120,
        "medical_urgency": "High",
        "threat_to_life": True,
        "status": "Dispatched",
        "evidence_quality": "Corroborated",
        "is_verified": True,
        "evidence_url": "https://example.com/evidence/chennai-corp-adyar-alert.jpg",
        "is_demo": True,
        "hours_ago": 1.5,
    },
    {
        "title": "Mudichur / Tambaram Lowland Overflow - Submerged Roadways & Stranded Commuters",
        "description": "Severe stagnation along Mudichur road corridor following Chembarambakkam surplus canal outflow. Vehicles submerged, power sub-station precautionary shutdown enacted for 95 households.",
        "incident_type": "Flood",
        "location_name": "Mudichur Road, Tambaram South, Chennai",
        "latitude": 12.9250,
        "longitude": 80.0880,
        "people_affected": 95,
        "medical_urgency": "High",
        "threat_to_life": True,
        "status": "Reported",
        "evidence_quality": "Citizen Report with Media",
        "is_verified": False,
        "evidence_url": "https://example.com/evidence/mudichur-flood-video.mp4",
        "is_demo": True,
        "hours_ago": 2.2,
    },
    {
        "title": "Ennore Creek Industrial Area - Drainage Overflow & Chemical Hazmat Alert",
        "description": "High tide backflow inundated industrial storage yard stormwater trenches near Ennore thermal corridor. Precautionary containment boom deployed; 180 plant staff and nearby fishing hamlet warned.",
        "incident_type": "Chemical",
        "location_name": "Ennore Creek Logistics Zone, North Chennai",
        "latitude": 13.2010,
        "longitude": 80.3180,
        "people_affected": 180,
        "medical_urgency": "Moderate",
        "threat_to_life": False,
        "status": "Under Review",
        "evidence_quality": "Official Responder",
        "is_verified": True,
        "evidence_url": "https://example.com/evidence/tnpcb-ennore-report.pdf",
        "is_demo": True,
        "hours_ago": 4.0,
    },
    {
        "title": "George Town (Parrys) Heritage Building Masonry Cracking",
        "description": "Historic masonry multi-story structure on Armenian Street developed deep wall fissures following ground saturation and high winds. 25 occupants safely evacuated; barricade cordon established.",
        "incident_type": "Structural Collapse",
        "location_name": "Armenian Street, George Town / Parrys, Chennai",
        "latitude": 13.0910,
        "longitude": 80.2880,
        "people_affected": 25,
        "medical_urgency": "Low",
        "threat_to_life": False,
        "status": "In Progress",
        "evidence_quality": "Corroborated",
        "is_verified": True,
        "evidence_url": "https://example.com/evidence/gcc-structural-inspect.png",
        "is_demo": True,
        "hours_ago": 5.5,
    },
    {
        "title": "Mylapore Community Center Disaster Shelter Resupply",
        "description": "Public relief shelter at local corporation community hall housing 210 evacuated residents from coastal settlements. In immediate need of chlorine water purification kits, high-protein food packs, and bedding.",
        "incident_type": "Medical",
        "location_name": "Mylapore Relief Center, South Chennai",
        "latitude": 13.0330,
        "longitude": 80.2670,
        "people_affected": 210,
        "medical_urgency": "Low",
        "threat_to_life": False,
        "status": "Dispatched",
        "evidence_quality": "Official Responder",
        "is_verified": True,
        "evidence_url": "https://example.com/evidence/red-cross-chennai-log.pdf",
        "is_demo": True,
        "hours_ago": 7.0,
    },
]

DEMO_RESOURCES = [
    # Depot Alpha - Chennai Central / Port
    {"name": "Emergency Trauma Medical Kits", "category": "Medical", "unit": "kits", "total_quantity": 450, "allocated_quantity": 120, "min_threshold": 50, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    {"name": "Clean Drinking Water (Bottled Cases)", "category": "Water", "unit": "liters", "total_quantity": 18000, "allocated_quantity": 5500, "min_threshold": 2500, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    {"name": "Emergency Ready-to-Eat Food Packs", "category": "Food", "unit": "packs", "total_quantity": 10000, "allocated_quantity": 3200, "min_threshold": 1500, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    {"name": "High-Thermal Blankets & Mats", "category": "Shelter", "unit": "units", "total_quantity": 4000, "allocated_quantity": 1100, "min_threshold": 500, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    {"name": "Inflatable Swiftwater Rescue Boats (NDRF Spec)", "category": "Rescue Equipment", "unit": "boats", "total_quantity": 15, "allocated_quantity": 9, "min_threshold": 4, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    {"name": "Mobile Heavy-Duty Power Generators (25kVA)", "category": "Rescue Equipment", "unit": "generators", "total_quantity": 30, "allocated_quantity": 18, "min_threshold": 6, "depot_name": "Central Regional Depot (Chennai Central / Port)", "latitude": 13.0827, "longitude": 80.2707, "is_demo": True},
    
    # Depot Beta - Guindy / GST South
    {"name": "Chlorine Water Purification Tablets", "category": "Water", "unit": "boxes", "total_quantity": 1500, "allocated_quantity": 400, "min_threshold": 200, "depot_name": "South Logistics Base (Guindy / GST)", "latitude": 13.0067, "longitude": 80.2025, "is_demo": True},
    {"name": "High-Volume Mobile Dewatering Pumps", "category": "Rescue Equipment", "unit": "pumps", "total_quantity": 45, "allocated_quantity": 28, "min_threshold": 10, "depot_name": "South Logistics Base (Guindy / GST)", "latitude": 13.0067, "longitude": 80.2025, "is_demo": True},
    {"name": "Emergency Cots & Rainproof Tents", "category": "Shelter", "unit": "sets", "total_quantity": 800, "allocated_quantity": 350, "min_threshold": 120, "depot_name": "South Logistics Base (Guindy / GST)", "latitude": 13.0067, "longitude": 80.2025, "is_demo": True},
    {"name": "Pediatric First Aid & ORS Packs", "category": "Medical", "unit": "kits", "total_quantity": 300, "allocated_quantity": 75, "min_threshold": 40, "depot_name": "South Logistics Base (Guindy / GST)", "latitude": 13.0067, "longitude": 80.2025, "is_demo": True},
    
    # Depot Gamma - Madhavaram / Ennore North
    {"name": "Satellite Emergency Radios (VHF/UHF)", "category": "Rescue Equipment", "unit": "radios", "total_quantity": 40, "allocated_quantity": 12, "min_threshold": 6, "depot_name": "North Reserve Base (Madhavaram / Ennore)", "latitude": 13.1480, "longitude": 80.2310, "is_demo": True},
    {"name": "Infant Formula & Hygiene Supplies", "category": "Food", "unit": "packs", "total_quantity": 950, "allocated_quantity": 210, "min_threshold": 120, "depot_name": "North Reserve Base (Madhavaram / Ennore)", "latitude": 13.1480, "longitude": 80.2310, "is_demo": True},
    {"name": "Chemical Splash Suits & Gas Masks", "category": "Medical", "unit": "sets", "total_quantity": 120, "allocated_quantity": 30, "min_threshold": 25, "depot_name": "North Reserve Base (Madhavaram / Ennore)", "latitude": 13.1480, "longitude": 80.2310, "is_demo": True},
]

def seed_database(db: Session, force: bool = False):
    """Populates repeatable realistic sample demo data for Chennai disaster relief."""
    incident_count = db.query(Incident).count()
    if incident_count > 0 and not force:
        return {"status": "skipped", "message": f"Database already has {incident_count} incidents."}

    if force:
        db.query(ResourceAllocation).delete()
        db.query(Incident).delete()
        db.query(Resource).delete()
        db.commit()

    now = datetime.datetime.utcnow()
    created_incidents = []

    for item in DEMO_INCIDENTS:
        created_time = now - datetime.timedelta(hours=item["hours_ago"])
        assessment = calculate_danger_assessment(
            medical_urgency=item["medical_urgency"],
            threat_to_life=item["threat_to_life"],
            people_affected=item["people_affected"],
            created_at=created_time,
            evidence_quality=item["evidence_quality"],
            is_verified=item["is_verified"],
            incident_type=item["incident_type"],
            description=item["description"],
        )
        
        inc = Incident(
            title=item["title"],
            description=item["description"],
            incident_type=item["incident_type"],
            location_name=item["location_name"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            people_affected=item["people_affected"],
            medical_urgency=item["medical_urgency"],
            threat_to_life=item["threat_to_life"],
            status=item["status"],
            evidence_quality=item["evidence_quality"],
            is_verified=item["is_verified"],
            evidence_url=item["evidence_url"],
            priority_score=assessment["priority_score"],
            priority_category=assessment["category"],
            assessment_reasons=json.dumps(assessment["reasons"]),
            assessment_uncertainty=assessment["uncertainty"],
            recommended_action=assessment["recommended_next_action"],
            is_demo=True,
            created_at=created_time,
            updated_at=created_time,
        )
        db.add(inc)
        created_incidents.append(inc)

    db.commit()

    created_resources = []
    for res_data in DEMO_RESOURCES:
        available = max(0, res_data["total_quantity"] - res_data["allocated_quantity"])
        res = Resource(
            name=res_data["name"],
            category=res_data["category"],
            unit=res_data["unit"],
            total_quantity=res_data["total_quantity"],
            allocated_quantity=res_data["allocated_quantity"],
            available_quantity=available,
            min_threshold=res_data["min_threshold"],
            depot_name=res_data["depot_name"],
            latitude=res_data["latitude"],
            longitude=res_data["longitude"],
            is_demo=True,
            created_at=now,
            updated_at=now,
        )
        db.add(res)
        created_resources.append(res)

    db.commit()

    # Seed sample allocations in Chennai
    if created_incidents and created_resources:
        alloc1 = ResourceAllocation(
            incident_id=created_incidents[0].id,
            resource_id=created_resources[4].id,  # Swiftwater rescue boats to Velachery
            quantity=4,
            notes="Inflatable watercraft dispatched for senior citizen evacuation in flooded lowlands.",
            status="Dispatched",
            allocated_at=now - datetime.timedelta(minutes=25)
        )
        alloc2 = ResourceAllocation(
            incident_id=created_incidents[0].id,
            resource_id=created_resources[1].id,  # Bottled water to Velachery
            quantity=1500,
            notes="Emergency drinking water cases delivered for residential stranded population.",
            status="Delivered",
            allocated_at=now - datetime.timedelta(minutes=20)
        )
        alloc3 = ResourceAllocation(
            incident_id=created_incidents[1].id,
            resource_id=created_resources[0].id,  # Trauma medical kits to Kotturpuram
            quantity=35,
            notes="Emergency field triage kits for flood-impacted families.",
            status="Allocated",
            allocated_at=now - datetime.timedelta(minutes=45)
        )
        alloc4 = ResourceAllocation(
            incident_id=created_incidents[5].id,
            resource_id=created_resources[2].id,  # Food rations to Mylapore
            quantity=800,
            notes="Ready-to-eat meal packs for community relief camp.",
            status="Delivered",
            allocated_at=now - datetime.timedelta(hours=2)
        )
        db.add_all([alloc1, alloc2, alloc3, alloc4])
        db.commit()

    return {
        "status": "success",
        "incidents_seeded": len(DEMO_INCIDENTS),
        "resources_seeded": len(DEMO_RESOURCES),
        "allocations_seeded": 4,
    }
