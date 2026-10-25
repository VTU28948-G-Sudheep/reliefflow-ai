"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import AssessmentScoreBadge from "@/components/AssessmentScoreBadge";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import AllocateResourceModal from "@/components/AllocateResourceModal";
import { api } from "@/lib/api";
import { Incident, ReportsSummary } from "@/lib/types";
import {
  AlertTriangle,
  Users,
  Boxes,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Navigation
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [incidentToAllocate, setIncidentToAllocate] = useState<Incident | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, incRes] = await Promise.all([
        api.getReportsSummary(),
        api.getIncidents({}),
      ]);
      setSummary(sumRes);
      setRecentIncidents(incRes.slice(0, 6));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Disaster Assessment & Relief Planning"
        subtitle="AI-Assisted Multi-Agency Situational Awareness & Operational Dispatch"
        onRefresh={loadData}
        onIncidentCreated={loadData}
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-emergency text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-emergency text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Incidents */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Active Incidents</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy">
                {summary?.metrics.active_incidents ?? "--"}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {summary?.metrics.total_incidents ?? "--"} total
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                DEMO DATA
              </span>
              <span>Monitored in real-time</span>
            </div>
          </div>

          {/* Critical Priority */}
          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emergency text-xs font-semibold uppercase tracking-wider">
              <span>Critical Incidents</span>
              <ShieldAlert className="w-4 h-4 text-emergency animate-pulse" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emergency">
                {summary?.metrics.critical_incidents ?? "--"}
              </span>
              <span className="text-xs font-medium text-slate-500">Tier 1 Code Red</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emergency font-medium">
              <span className="w-2 h-2 rounded-full bg-emergency animate-ping"></span>
              <span>Immediate Tactical Dispatch</span>
            </div>
          </div>

          {/* People Affected */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Affected Population</span>
              <Users className="w-4 h-4 text-teal" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy">
                {summary?.metrics.total_affected_people ? summary.metrics.total_affected_people.toLocaleString() : "--"}
              </span>
              <span className="text-xs font-medium text-slate-500">Individuals</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              <strong className="text-emergency">{summary?.metrics.threat_to_life_cases ?? 0}</strong> life-threat cases
            </div>
          </div>

          {/* Available Resources */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Relief Supply Stock</span>
              <Boxes className="w-4 h-4 text-relief-green" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy">
                {summary?.metrics.total_resources ?? "--"}
              </span>
              <span className="text-xs font-medium text-slate-500">Cataloged items</span>
            </div>
            <div className="mt-3 text-[11px]">
              {summary?.metrics.low_stock_alerts ? (
                <span className="text-amber-600 font-semibold">
                  ⚠️ {summary.metrics.low_stock_alerts} low stock alerts
                </span>
              ) : (
                <span className="text-relief-green font-medium">Reserves nominal</span>
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Verification</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700">
                {summary?.metrics.verified_reports ?? "--"}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {summary?.metrics.total_incidents ?? "--"} verified
              </span>
            </div>
            <div className="mt-3 text-[11px] text-amber-700 font-medium">
              {summary?.metrics.unverified_pending_review ?? 0} pending ground review
            </div>
          </div>
        </div>

        {/* Charts & Operational Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Severity Breakdown Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-navy text-base">Danger Severity Distribution</h3>
                <p className="text-xs text-slate-500">
                  Calculated by explainable multi-factor heuristic assessment
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Heuristic v1.0
              </span>
            </div>

            <div className="h-64 w-full">
              {summary?.severity_distribution && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.severity_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#142B3B",
                        borderRadius: "8px",
                        border: "none",
                        color: "white",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {summary.severity_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emergency"></span> Critical (≥80)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-relief-amber"></span> High (60-79)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal"></span> Moderate (35-59)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-relief-green"></span> Low (15-34)
              </span>
            </div>
          </div>

          {/* Quick Operations Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-navy text-base">Rapid Operations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute disaster triage, spatial awareness, and depot logistics.
              </p>
            </div>

            <div className="my-4 space-y-2.5">
              <Link
                href="/map"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-teal/5 border border-slate-200 hover:border-teal/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy">Interactive Disaster Map</h4>
                    <p className="text-[11px] text-slate-500">Overlay hazards, flood lines & depots</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/routes"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-navy/5 border border-slate-200 hover:border-navy/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-navy/10 text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy">Route Navigation Planner</h4>
                    <p className="text-[11px] text-slate-500">NetworkX shortest path & closure detour</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/resources"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-relief-green group-hover:text-white transition-colors">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy">Resource Management</h4>
                    <p className="text-[11px] text-slate-500">Allocate supplies without over-stocking</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-relief-green group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              <strong className="font-semibold block mb-0.5">Tactical Safety Rule:</strong>
              Never assume an area is safe simply because no reports exist.
            </div>
          </div>
        </div>

        {/* Recent Incident Reports Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy text-base">Recent Incident Reports</h3>
              <p className="text-xs text-slate-500">
                Latest field telemetry and danger assessment scoring
              </p>
            </div>
            <Link
              href="/incidents"
              className="text-xs font-semibold text-teal hover:text-teal-dark flex items-center gap-1"
            >
              <span>View All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => {
                  setSelectedIncident(incident);
                  setDetailModalOpen(true);
                }}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 px-3 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500">#{incident.id}</span>
                    <span className="font-bold text-navy text-sm group-hover:text-teal transition-colors">
                      {incident.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                      {incident.incident_type}
                    </span>
                    {incident.is_demo && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                        DEMO DATA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {incident.location_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {incident.people_affected} affected
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(incident.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <AssessmentScoreBadge
                    score={incident.priority_score}
                    category={incident.priority_category}
                    uncertainty={incident.assessment_uncertainty}
                    isVerified={incident.is_verified}
                  />
                  <span className="text-xs text-slate-400 group-hover:text-teal font-semibold">
                    Inspect &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {detailModalOpen && (
        <IncidentDetailModal
          incident={selectedIncident}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onUpdated={loadData}
          onAllocate={(inc) => {
            setIncidentToAllocate(inc);
            setAllocateModalOpen(true);
          }}
        />
      )}

      {/* Allocate Modal */}
      {allocateModalOpen && (
        <AllocateResourceModal
          isOpen={allocateModalOpen}
          onClose={() => setAllocateModalOpen(false)}
          onSuccess={() => {
            setAllocateModalOpen(false);
            loadData();
          }}
          preselectedIncident={incidentToAllocate}
        />
      )}
    </div>
  );
}
