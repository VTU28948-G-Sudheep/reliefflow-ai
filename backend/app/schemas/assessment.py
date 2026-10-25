from typing import Optional, List
from pydantic import BaseModel, Field

class AssessmentRequest(BaseModel):
    medical_urgency: str = Field("Moderate", description="None, Low, Moderate, High, Critical")
    threat_to_life: bool = False
    people_affected: int = Field(0, ge=0)
    evidence_quality: str = Field("Unverified Citizen", description="Official Responder, Corroborated, Citizen Report with Media, Unverified Citizen, Ambiguous")
    is_verified: bool = False
    incident_type: str = "General"
    description: Optional[str] = ""

class AssessmentResult(BaseModel):
    priority_score: float
    category: str
    reasons: List[str]
    uncertainty: str
    recommended_next_action: str
    is_ai_medically_certified: bool = False
    engine_type: str = "Explainable Rule-Based Heuristic v1.0"
    human_review_required: bool = True
