import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5)
    incident_type: str = Field(..., description="Flood, Landslide, Fire, Structural Collapse, Medical, Utility, Other")
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    people_affected: int = Field(0, ge=0)
    medical_urgency: str = Field("Moderate", description="None, Low, Moderate, High, Critical")
    threat_to_life: bool = False
    evidence_quality: str = Field("Unverified Citizen", description="Official Responder, Corroborated, Citizen Report with Media, Unverified Citizen, Ambiguous")
    is_verified: bool = False
    evidence_url: Optional[str] = None
    is_demo: bool = False

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_type: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    people_affected: Optional[int] = None
    medical_urgency: Optional[str] = None
    threat_to_life: Optional[bool] = None
    status: Optional[str] = None
    evidence_quality: Optional[str] = None
    is_verified: Optional[bool] = None
    evidence_url: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    status: str
    priority_score: float
    priority_category: str
    assessment_reasons: str  # JSON list
    assessment_uncertainty: str
    recommended_action: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentFilter(BaseModel):
    search: Optional[str] = None
    incident_type: Optional[str] = None
    priority_category: Optional[str] = None
    status: Optional[str] = None
    is_verified: Optional[bool] = None
    is_demo: Optional[bool] = None
