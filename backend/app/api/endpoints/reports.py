import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.incident import Incident
from app.models.resource import Resource, ResourceAllocation

router = APIRouter()

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    """Provides high-level disaster assessment aggregates, severity distributions, and resource stats."""
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(Incident.status.in_(["Reported", "In Progress", "Dispatched", "Under Review"])).count()
    critical_incidents = db.query(Incident).filter(Incident.priority_category == "Critical").count()
    high_incidents = db.query(Incident).filter(Incident.priority_category == "High").count()
    moderate_incidents = db.query(Incident).filter(Incident.priority_category == "Moderate").count()
    low_incidents = db.query(Incident).filter(Incident.priority_category == "Low").count()
    insufficient_incidents = db.query(Incident).filter(Incident.priority_category == "Insufficient Information").count()

    total_affected = db.query(func.sum(Incident.people_affected)).scalar() or 0
    threat_to_life_count = db.query(Incident).filter(Incident.threat_to_life == True).count()
    verified_count = db.query(Incident).filter(Incident.is_verified == True).count()
    unverified_count = total_incidents - verified_count

    resources = db.query(Resource).all()
    total_stock_items = len(resources)
    low_stock_count = sum(1 for r in resources if (r.total_quantity - r.allocated_quantity) <= r.min_threshold)
    total_allocations = db.query(ResourceAllocation).count()

    type_counts = (
        db.query(Incident.incident_type, func.count(Incident.id))
        .group_by(Incident.incident_type)
        .all()
    )
    by_type = [{"type": t, "count": c} for t, c in type_counts]

    severity_distribution = [
        {"category": "Critical", "count": critical_incidents, "color": "#D94841"},
        {"category": "High", "count": high_incidents, "color": "#F2A93B"},
        {"category": "Moderate", "count": moderate_incidents, "color": "#178F8B"},
        {"category": "Low", "count": low_incidents, "color": "#25845B"},
        {"category": "Insufficient Info", "count": insufficient_incidents, "color": "#8E9AA0"},
    ]

    return {
        "metrics": {
            "total_incidents": total_incidents,
            "active_incidents": active_incidents,
            "critical_incidents": critical_incidents,
            "total_affected_people": total_affected,
            "threat_to_life_cases": threat_to_life_count,
            "verified_reports": verified_count,
            "unverified_pending_review": unverified_count,
            "total_resources": total_stock_items,
            "low_stock_alerts": low_stock_count,
            "total_allocations": total_allocations,
        },
        "severity_distribution": severity_distribution,
        "type_distribution": by_type,
        "is_demo_data": True,
        "notice": "DEMO DATA: Metrics compiled from local prototype database.",
    }

@router.get("/export-csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    """Exports all incidents with priority scores, coordinates, and assessment reasons as a downloadable CSV."""
    incidents = db.query(Incident).order_by(Incident.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Incident ID",
        "Title",
        "Type",
        "Location",
        "Latitude",
        "Longitude",
        "People Affected",
        "Medical Urgency",
        "Threat to Life",
        "Status",
        "Priority Score (0-100)",
        "Priority Category",
        "Assessment Uncertainty",
        "Verified",
        "Evidence Quality",
        "Recommended Action",
        "Demo Record",
        "Reported Timestamp (UTC)"
    ])

    for inc in incidents:
        writer.writerow([
            inc.id,
            inc.title,
            inc.incident_type,
            inc.location_name,
            inc.latitude,
            inc.longitude,
            inc.people_affected,
            inc.medical_urgency,
            "YES" if inc.threat_to_life else "NO",
            inc.status,
            inc.priority_score,
            inc.priority_category,
            inc.assessment_uncertainty,
            "YES" if inc.is_verified else "NO (PENDING REVIEW)",
            inc.evidence_quality,
            inc.recommended_action or "None",
            "DEMO DATA" if inc.is_demo else "FIELD RECORD",
            inc.created_at.strftime("%Y-%m-%d %H:%M:%S") if inc.created_at else "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reliefflow_ai_incidents_report.csv"}
    )
