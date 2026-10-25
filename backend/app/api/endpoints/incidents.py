import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse
from app.services.danger_assessment import calculate_danger_assessment

router = APIRouter()

@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    incident_type: Optional[str] = None,
    priority_category: Optional[str] = None,
    status: Optional[str] = None,
    is_verified: Optional[bool] = None,
    is_demo: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Incident)

    if search and isinstance(search, str):
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Incident.title.ilike(search_fmt),
                Incident.description.ilike(search_fmt),
                Incident.location_name.ilike(search_fmt),
                Incident.incident_type.ilike(search_fmt),
            )
        )
    if incident_type and isinstance(incident_type, str):
        query = query.filter(Incident.incident_type == incident_type)
    if priority_category and isinstance(priority_category, str):
        query = query.filter(Incident.priority_category == priority_category)
    if status and isinstance(status, str):
        query = query.filter(Incident.status == status)
    if is_verified is not None and isinstance(is_verified, bool):
        query = query.filter(Incident.is_verified == is_verified)
    if is_demo is not None and isinstance(is_demo, bool):
        query = query.filter(Incident.is_demo == is_demo)

    incidents = query.order_by(desc(Incident.priority_score), desc(Incident.created_at)).offset(skip).limit(limit).all()
    return incidents

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db)
):
    # Run explainable rule-based assessment automatically
    assessment = calculate_danger_assessment(
        medical_urgency=incident_in.medical_urgency,
        threat_to_life=incident_in.threat_to_life,
        people_affected=incident_in.people_affected,
        evidence_quality=incident_in.evidence_quality,
        is_verified=incident_in.is_verified,
        incident_type=incident_in.incident_type,
        description=incident_in.description,
    )

    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        incident_type=incident_in.incident_type,
        location_name=incident_in.location_name,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        people_affected=incident_in.people_affected,
        medical_urgency=incident_in.medical_urgency,
        threat_to_life=incident_in.threat_to_life,
        status="Reported",
        evidence_quality=incident_in.evidence_quality,
        is_verified=incident_in.is_verified,
        evidence_url=incident_in.evidence_url,
        is_demo=incident_in.is_demo,
        priority_score=assessment["priority_score"],
        priority_category=assessment["category"],
        assessment_reasons=json.dumps(assessment["reasons"]),
        assessment_uncertainty=assessment["uncertainty"],
        recommended_action=assessment["recommended_next_action"],
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    reassess_needed = False
    for field, val in update_data.model_dump(exclude_unset=True).items():
        setattr(incident, field, val)
        if field in ["medical_urgency", "threat_to_life", "people_affected", "evidence_quality", "is_verified", "incident_type"]:
            reassess_needed = True

    if reassess_needed:
        assessment = calculate_danger_assessment(
            medical_urgency=incident.medical_urgency,
            threat_to_life=incident.threat_to_life,
            people_affected=incident.people_affected,
            created_at=incident.created_at,
            evidence_quality=incident.evidence_quality,
            is_verified=incident.is_verified,
            incident_type=incident.incident_type,
            description=incident.description,
        )
        incident.priority_score = assessment["priority_score"]
        incident.priority_category = assessment["category"]
        incident.assessment_reasons = json.dumps(assessment["reasons"])
        incident.assessment_uncertainty = assessment["uncertainty"]
        incident.recommended_action = assessment["recommended_next_action"]

    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/reassess", response_model=IncidentResponse)
def reassess_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    assessment = calculate_danger_assessment(
        medical_urgency=incident.medical_urgency,
        threat_to_life=incident.threat_to_life,
        people_affected=incident.people_affected,
        created_at=incident.created_at,
        evidence_quality=incident.evidence_quality,
        is_verified=incident.is_verified,
        incident_type=incident.incident_type,
        description=incident.description,
    )

    incident.priority_score = assessment["priority_score"]
    incident.priority_category = assessment["category"]
    incident.assessment_reasons = json.dumps(assessment["reasons"])
    incident.assessment_uncertainty = assessment["uncertainty"]
    incident.recommended_action = assessment["recommended_next_action"]

    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/verify", response_model=IncidentResponse)
def verify_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.is_verified = True
    incident.evidence_quality = "Official Responder"

    assessment = calculate_danger_assessment(
        medical_urgency=incident.medical_urgency,
        threat_to_life=incident.threat_to_life,
        people_affected=incident.people_affected,
        created_at=incident.created_at,
        evidence_quality="Official Responder",
        is_verified=True,
        incident_type=incident.incident_type,
        description=incident.description,
    )

    incident.priority_score = assessment["priority_score"]
    incident.priority_category = assessment["category"]
    incident.assessment_reasons = json.dumps(assessment["reasons"])
    incident.assessment_uncertainty = assessment["uncertainty"]
    incident.recommended_action = assessment["recommended_next_action"]

    db.commit()
    db.refresh(incident)
    return incident

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return None
