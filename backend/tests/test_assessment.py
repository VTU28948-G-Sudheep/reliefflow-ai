"""
Unit tests for ReliefFlow AI Explainable Danger Assessment Module
"""

import datetime
import pytest
from app.services.danger_assessment import calculate_danger_assessment

def test_critical_danger_assessment():
    """Test that immediate threat to life with critical medical urgency and mass affected generates Critical category."""
    result = calculate_danger_assessment(
        medical_urgency="Critical",
        threat_to_life=True,
        people_affected=50,
        incident_type="Flood",
        evidence_quality="Official Responder",
        is_verified=True,
        description="Elderly care home ground floor inundated with floodwater.",
    )
    assert result["priority_score"] >= 80.0
    assert result["category"] == "Critical"
    assert result["uncertainty"] == "Low"
    assert result["is_ai_medically_certified"] is False
    assert result["human_review_required"] is False
    assert any("threat to life" in r.lower() for r in result["reasons"])

def test_unverified_citizen_report_requires_human_review():
    """Test that unverified citizen reports flag human review requirement."""
    result = calculate_danger_assessment(
        medical_urgency="High",
        threat_to_life=True,
        people_affected=10,
        incident_type="Landslide",
        evidence_quality="Unverified Citizen",
        is_verified=False,
        description="Possible mudslide near mountain highway.",
    )
    assert result["human_review_required"] is True
    assert result["uncertainty"] == "High"
    assert "HUMAN REVIEW REQUIRED" in result["recommended_next_action"]

def test_low_urgency_minor_incident():
    """Test low urgency incident produces Low or Moderate category with appropriate action."""
    result = calculate_danger_assessment(
        medical_urgency="None",
        threat_to_life=False,
        people_affected=0,
        incident_type="General",
        evidence_quality="Official Responder",
        is_verified=True,
        description="Routine supply inquiry for city hall warehouse.",
    )
    assert result["priority_score"] < 35.0
    assert result["category"] in ["Low", "Insufficient Information"]

def test_insufficient_information_case():
    """Test that missing or minimal descriptions with no casualties yield Insufficient Information."""
    result = calculate_danger_assessment(
        medical_urgency="None",
        threat_to_life=False,
        people_affected=0,
        incident_type="General",
        evidence_quality="Ambiguous",
        is_verified=False,
        description="Help",
    )
    assert result["category"] == "Insufficient Information"
    assert "FIELD RECONNAISSANCE REQUIRED" in result["recommended_next_action"]

def test_recency_decay():
    """Test that an old report (>24 hours) receives a recency decay penalty."""
    old_time = datetime.datetime.utcnow() - datetime.timedelta(hours=36)
    result = calculate_danger_assessment(
        medical_urgency="Moderate",
        threat_to_life=False,
        people_affected=5,
        created_at=old_time,
        evidence_quality="Corroborated",
        is_verified=True,
        description="Water main break reported yesterday afternoon.",
    )
    assert any("recency decay" in r.lower() for r in result["reasons"])
