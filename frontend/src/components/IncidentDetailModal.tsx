"use client";

import { useState } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  Activity,
  FileText,
  Navigation,
  Boxes,
  Loader2
} from "lucide-react";
import { Incident } from "@/lib/types";
import { api } from "@/lib/api";
import AssessmentScoreBadge from "./AssessmentScoreBadge";
import { formatDateTime } from "@/lib/utils";

interface IncidentDetailModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onPlanRoute?: (incident: Incident) => void;
  onAllocate?: (incident: Incident) => void;
}

export default function IncidentDetailModal({
  incident,
  isOpen,
  onClose,
  onUpdated,
  onPlanRoute,
  onAllocate,
}: IncidentDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  let reasons: string[] = [];
  try {
    reasons = JSON.parse(incident.assessment_reasons || "[]");
  } catch {
    reasons = [incident.assessment_reasons];
  }

  const handleVerify = async () => {
    setLoadingAction("verify");
    try {
      await api.verifyIncident(incident.id);
      onUpdated();
    } catch (err) {
      alert("Verification failed: " + err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReassess = async () => {
    setLoadingAction("reassess");
    try {
      await api.reassessIncident(incident.id);
      onUpdated();
    } catch (err) {
      alert("Reassessment failed: " + err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoadingAction("status");
    try {
      await api.updateIncident(incident.id, { status: newStatus as any });
      onUpdated();
    } catch (err) {
      alert("Status update failed: " + err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                INC-{incident.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal/10 text-teal border border-teal/20">
                {incident.incident_type}
              </span>
              {incident.is_demo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  DEMO DATA
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-navy leading-tight">{incident.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority & Quick Stats */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Danger Priority Assessment
            </p>
            <AssessmentScoreBadge
              score={incident.priority_score}
              category={incident.priority_category}
              uncertainty={incident.assessment_uncertainty}
              isVerified={incident.is_verified}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Status</p>
              <select
                value={incident.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loadingAction === "status"}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-navy focus:outline-hidden focus:ring-1 focus:ring-teal"
              >
                <option value="Reported">Reported</option>
                <option value="Under Review">Under Review</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {!incident.is_verified && (
              <button
                onClick={handleVerify}
                disabled={loadingAction === "verify"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                title="Verify incident through authorized on-scene response personnel"
              >
                {loadingAction === "verify" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Verify Emergency</span>
              </button>
            )}

            <button
              onClick={handleReassess}
              disabled={loadingAction === "reassess"}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title="Recalculate Danger Assessment"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAction === "reassess" ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Explainable Danger Assessment Reasons Box */}
        <div className="mt-4 p-4 rounded-xl bg-navy/5 border border-navy/15 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal" />
              Explainable Rule-Based Assessment Breakdown
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Engine v1.0 • Heuristic Rules
            </span>
          </div>

          <div className="space-y-1.5">
            {reasons.map((r, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-teal font-bold leading-none mt-0.5">•</span>
                <span className="leading-snug">{r}</span>
              </div>
            ))}
          </div>

          {/* Recommended Action */}
          {incident.recommended_action && (
            <div className="pt-2 border-t border-navy/10">
              <p className="text-[11px] font-bold text-slate-900 uppercase">
                Recommended Tactical Action:
              </p>
              <p className="text-xs font-medium text-navy mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                {incident.recommended_action}
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-500 italic">
            Disclaimer: Rule-based heuristic prioritization only. Not clinically or medically validated. Unverified emergencies must be verified by a human operator.
          </p>
        </div>

        {/* Situation Details */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Location & Telemetry
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-teal shrink-0" />
                <span>{incident.location_name}</span>
              </div>
              <div className="text-slate-500 font-mono text-[11px] pl-5">
                Lat: {incident.latitude.toFixed(4)}, Lon: {incident.longitude.toFixed(4)}
              </div>
              <div className="flex items-center gap-2 text-slate-600 pl-5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Reported: {formatDateTime(incident.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Impact & Medical Urgency
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  People Affected:
                </span>
                <span className="font-bold text-slate-900">{incident.people_affected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Medical Urgency:
                </span>
                <span className="font-bold text-emergency">{incident.medical_urgency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Immediate Threat to Life:</span>
                <span className={`font-bold ${incident.threat_to_life ? "text-emergency" : "text-slate-700"}`}>
                  {incident.threat_to_life ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Evidence Quality:</span>
                <span className="font-medium text-slate-800">{incident.evidence_quality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field Description */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Field Description
          </h4>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            {incident.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ID #{incident.id} • {incident.is_demo ? "Demo Simulation Record" : "Field Telemetry"}
          </span>

          <div className="flex items-center gap-3">
            {onAllocate && (
              <button
                onClick={() => {
                  onClose();
                  onAllocate(incident);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal text-teal hover:bg-teal hover:text-white text-xs font-semibold transition-colors"
              >
                <Boxes className="w-4 h-4" />
                <span>Allocate Supplies</span>
              </button>
            )}

            {onPlanRoute && (
              <button
                onClick={() => {
                  onClose();
                  onPlanRoute(incident);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Calculate Shortest Route</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
