"""
Unit tests for FastAPI endpoints: Incidents, Resources, Allocation guards, and Reports
Direct endpoint execution testing (Thread-safe & deterministic across all Python versions)
"""

import pytest
from app.core.database import SessionLocal
from app.services.seed_data import seed_database
from app.schemas.incident import IncidentCreate
from app.schemas.resource import ResourceAllocationCreate
from app.api.endpoints.incidents import get_incidents, create_incident, get_incident
from app.api.endpoints.resources import get_resources, allocate_resource
from app.api.endpoints.reports import get_reports_summary, export_incidents_csv
from app.main import health_check

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    seed_database(db, force=False)
    yield db
    db.close()

def test_health_check(db_session):
    res = health_check(db=db_session)
    assert res["status"] == "healthy"
    assert res["is_prototype"] is True
    assert res["database"] == "connected"

def test_get_and_create_incident(db_session):
    # Test listing
    incidents = get_incidents(db=db_session)
    assert len(incidents) >= 1

    # Test creating new incident
    new_inc = IncidentCreate(
        title="Eastside Levee Seepage Test",
        description="Water seepage through secondary berm. Evacuation of 25 families advised.",
        incident_type="Flood",
        location_name="Eastside Levee Berm 4",
        latitude=37.7725,
        longitude=-122.3910,
        people_affected=25,
        medical_urgency="High",
        threat_to_life=True,
        evidence_quality="Official Responder",
        is_verified=True,
        is_demo=False
    )
    created = create_incident(incident_in=new_inc, db=db_session)
    assert created.id > 0
    assert created.priority_score >= 60.0
    assert created.priority_category in ["High", "Critical"]

    # Test retrieve
    fetched = get_incident(incident_id=created.id, db=db_session)
    assert fetched.title == new_inc.title

def test_allocation_guards_prevent_overallocation(db_session):
    resources = get_resources(db=db_session)
    assert len(resources) > 0
    target_res = resources[0]

    excessive_qty = target_res.available_quantity + 50000
    alloc_req = ResourceAllocationCreate(
        incident_id=1,
        resource_id=target_res.id,
        quantity=excessive_qty,
        notes="Attempting allocation beyond stock"
    )

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        allocate_resource(alloc_in=alloc_req, db=db_session)
    
    assert exc_info.value.status_code == 400
    assert "Insufficient stock" in exc_info.value.detail

def test_reports_summary_and_csv(db_session):
    summary = get_reports_summary(db=db_session)
    assert "metrics" in summary
    assert summary["metrics"]["total_incidents"] > 0
    assert summary["metrics"]["active_incidents"] > 0
    assert len(summary["severity_distribution"]) > 0

    csv_res = export_incidents_csv(db=db_session)
    csv_text = csv_res.body.decode("utf-8")
    assert "Incident ID,Title,Type" in csv_text
    assert "Eastside Levee Seepage Test" in csv_text or "Elderly Care Center" in csv_text
