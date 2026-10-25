from fastapi import APIRouter
from app.schemas.assessment import AssessmentRequest, AssessmentResult
from app.services.danger_assessment import calculate_danger_assessment

router = APIRouter()

@router.post("/evaluate", response_model=AssessmentResult)
def evaluate_danger_parameters(payload: AssessmentRequest):
    """
    On-the-fly explainable danger assessment calculation.
    Provides immediate score, category, breakdown reasons, uncertainty,
    and recommended action without altering the database.
    """
    result = calculate_danger_assessment(
        medical_urgency=payload.medical_urgency,
        threat_to_life=payload.threat_to_life,
        people_affected=payload.people_affected,
        evidence_quality=payload.evidence_quality,
        is_verified=payload.is_verified,
        incident_type=payload.incident_type,
        description=payload.description or "",
    )
    return result
