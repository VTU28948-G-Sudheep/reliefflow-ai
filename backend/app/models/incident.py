import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(String(50), nullable=False)  # Flood, Landslide, Structural Collapse, Fire, Medical, Utility
    
    # Location
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Impact & Urgency
    people_affected = Column(Integer, default=0, nullable=False)
    medical_urgency = Column(String(50), default="Moderate", nullable=False)  # None, Low, Moderate, High, Critical
    threat_to_life = Column(Boolean, default=False, nullable=False)
    
    # Status & Verification
    status = Column(String(50), default="Reported", nullable=False)  # Reported, Under Review, Dispatched, In Progress, Resolved
    evidence_quality = Column(String(50), default="Citizen Report", nullable=False)  # Official Responder, Corroborated, Citizen Report with Media, Unverified Citizen, Ambiguous
    is_verified = Column(Boolean, default=False, nullable=False)
    evidence_url = Column(String(500), nullable=True)
    
    # Rule-based Danger Assessment Fields (Explainable Heuristic)
    priority_score = Column(Float, default=0.0, nullable=False)
    priority_category = Column(String(50), default="Moderate", nullable=False)  # Critical, High, Moderate, Low, Insufficient Information
    assessment_reasons = Column(Text, default="[]", nullable=False)  # JSON-encoded array of strings
    assessment_uncertainty = Column(String(50), default="Moderate", nullable=False)  # Low, Moderate, High
    recommended_action = Column(Text, nullable=True)
    
    # Timestamps & Demo Flag
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
