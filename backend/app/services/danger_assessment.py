"""
ReliefFlow AI - Explainable Rule-Based Danger Assessment Engine
---------------------------------------------------------------
IMPORTANT SAFETY & ETHICAL NOTICE:
This module is a deterministic, explainable heuristic rule engine designed for disaster relief prioritization.
It is NOT a trained machine learning model, nor has it been clinically or medically certified.
All calculations provide assistive prioritization only.
Every unverified emergency must remain available for human operator review before dispatch decisions are executed.
"""

import datetime
from typing import Dict, Any, List, Optional

VALID_URGENCY_LEVELS = {"None": 0, "Low": 5, "Moderate": 15, "High": 25, "Critical": 35}

EVIDENCE_SCORES = {
    "Official Responder": {"score": 10, "uncertainty": "Low"},
    "Corroborated": {"score": 5, "uncertainty": "Low"},
    "Citizen Report with Media": {"score": 0, "uncertainty": "Moderate"},
    "Unverified Citizen": {"score": -5, "uncertainty": "High"},
    "Ambiguous": {"score": -15, "uncertainty": "High"},
}

def calculate_danger_assessment(
    medical_urgency: str = "Moderate",
    threat_to_life: bool = False,
    people_affected: int = 0,
    created_at: Optional[datetime.datetime] = None,
    evidence_quality: str = "Unverified Citizen",
    is_verified: bool = False,
    incident_type: str = "General",
    description: str = "",
) -> Dict[str, Any]:
    """
    Computes an explainable danger priority score (0-100), category, uncertainty,
    reasons list, and recommended next action.
    """
    reasons: List[str] = []
    base_score = 0.0

    # 1. Medical Urgency scoring (0 to 35 pts)
    urgency_clean = medical_urgency.strip().capitalize() if medical_urgency else "None"
    if urgency_clean not in VALID_URGENCY_LEVELS:
        urgency_clean = "Moderate"
    
    med_pts = VALID_URGENCY_LEVELS[urgency_clean]
    base_score += med_pts
    reasons.append(f"Medical urgency assessed as '{urgency_clean}' (+{med_pts} pts)")

    # 2. Threat to life (0 or 25 pts)
    if threat_to_life:
        base_score += 25.0
        reasons.append("Immediate threat to life declared by reporting source (+25 pts)")
    else:
        reasons.append("No immediate threat to life confirmed (0 pts)")

    # 3. People affected scale (0 to 20 pts)
    affected = max(0, people_affected or 0)
    if affected >= 100:
        base_score += 20.0
        reasons.append(f"Mass casualty/impact scale ({affected}+ people affected, +20 pts)")
    elif affected >= 21:
        base_score += 15.0
        reasons.append(f"Significant population impact ({affected} people affected, +15 pts)")
    elif affected >= 6:
        base_score += 10.0
        reasons.append(f"Moderate group impact ({affected} people affected, +10 pts)")
    elif affected >= 1:
        base_score += 5.0
        reasons.append(f"Small group impact ({affected} people affected, +5 pts)")
    else:
        reasons.append("Zero confirmed casualties or affected individuals at present (0 pts)")

    # 4. Incident type hazard bonus (0 to 10 pts)
    type_lower = incident_type.lower()
    if any(h in type_lower for h in ["flood", "landslide", "collapse", "chemical", "explosion"]):
        base_score += 8.0
        reasons.append(f"High-risk hazardous incident type '{incident_type}' (+8 pts)")

    # 5. Report Recency factor
    now = datetime.datetime.utcnow()
    report_time = created_at or now
    age_hours = max(0.0, (now - report_time).total_seconds() / 3600.0)

    if age_hours < 1.0:
        base_score += 10.0
        reasons.append("Fresh real-time report (<1 hour old, +10 pts)")
    elif age_hours < 6.0:
        base_score += 5.0
        reasons.append("Recent report (1-6 hours old, +5 pts)")
    elif age_hours > 24.0:
        base_score -= 10.0
        reasons.append(f"Report age recency decay (>{int(age_hours)} hours old, condition may have changed, -10 pts)")
    else:
        reasons.append("Standard reporting recency window (6-24 hours old, 0 pts)")

    # 6. Evidence quality and verification status
    evidence_meta = EVIDENCE_SCORES.get(evidence_quality, {"score": -5, "uncertainty": "High"})
    base_score += evidence_meta["score"]
    reasons.append(f"Evidence quality '{evidence_quality}' ({'+' if evidence_meta['score'] >= 0 else ''}{evidence_meta['score']} pts)")

    if is_verified:
        base_score += 10.0
        reasons.append("Report officially verified by field personnel (+10 pts)")
    else:
        reasons.append("Unverified report: requires human operator verification before major dispatch (0 pts)")

    # Clamp final priority score 0 to 100
    priority_score = round(max(0.0, min(100.0, base_score)), 1)

    # Determine uncertainty
    if not is_verified and evidence_quality in ["Unverified Citizen", "Ambiguous"]:
        uncertainty = "High"
    elif is_verified and evidence_quality in ["Official Responder", "Corroborated"]:
        uncertainty = "Low"
    else:
        uncertainty = "Moderate"

    # Category determination
    if len((description or "").strip()) < 10 and affected == 0 and not threat_to_life and urgency_clean in ["None", "Low"]:
        category = "Insufficient Information"
    elif priority_score >= 80:
        category = "Critical"
    elif priority_score >= 60:
        category = "High"
    elif priority_score >= 35:
        category = "Moderate"
    elif priority_score >= 15:
        category = "Low"
    else:
        category = "Insufficient Information"

    # Recommended next action
    if category == "Critical":
        if "flood" in type_lower or "water" in type_lower:
            action = "IMMEDIATE EVACUATION & BOAT RESCUE: Dispatch watercraft teams and emergency medical evacuation."
        elif urgency_clean == "Critical" or threat_to_life:
            action = "CODE RED DISPATCH: Immediate deployment of Advanced Life Support (ALS) medical teams and Search & Rescue."
        else:
            action = "EMERGENCY RESPONSE: Immediate multi-agency tactical deployment to incident coordinates."
    elif category == "High":
        action = "PRIORITY DISPATCH: Dispatch field relief unit with trauma kits, emergency water rations, and transport support."
    elif category == "Moderate":
        action = "SCHEDULED RELIEF: Allocate nearest depot supplies (water, food packs, blankets) and assign logistics transport."
    elif category == "Low":
        action = "MONITORING & WELFARE: Maintain observation; schedule non-emergency welfare check within standard shift."
    else:
        action = "FIELD RECONNAISSANCE REQUIRED: Dispatch drone scout or contact nearest local post to verify incident parameters."

    # Human review caveat for unverified items
    if not is_verified:
        action += " [HUMAN REVIEW REQUIRED: Ground contact verification pending]."

    return {
        "priority_score": priority_score,
        "category": category,
        "reasons": reasons,
        "uncertainty": uncertainty,
        "recommended_next_action": action,
        "is_ai_medically_certified": False,
        "engine_type": "Explainable Rule-Based Heuristic v1.0",
        "human_review_required": not is_verified,
    }
