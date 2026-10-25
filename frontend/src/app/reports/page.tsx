"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import { api } from "@/lib/api";
import { ReportsSummary } from "@/lib/types";
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  ShieldAlert,
  Users,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Layers,
  Activity
} from "lucide-react";
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

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getReportsSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleExportCsv = () => {
    const url = api.getExportCsvUrl();
    window.open(url, "_blank");
  };

  const handleResetDemoData = async () => {
    if (!confirm("Are you sure you want to reset all records to default repeatable DEMO DATA?")) {
      return;
    }
    setResetting(true);
    try {
      await api.seedDemoData(true);
      alert("Database successfully reset and re-seeded with demo records.");
      loadSummary();
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Disaster Reports & Analytics"
        subtitle="Incident summaries, severity counts, resource logistics analysis, and export"
        onRefresh={loadSummary}
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        {/* Top Action Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal" />
              Operational Data Export
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export comprehensive incident telemetry, coordinates, and danger priority scores as a standard CSV report.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
              <span>Reset & Re-Seed Demo Data</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Logged Incidents
            </span>
            <span className="text-3xl font-extrabold text-navy mt-1 block">
              {summary?.metrics.total_incidents ?? "--"}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {summary?.metrics.active_incidents ?? "--"} currently active
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Population Impact
            </span>
            <span className="text-3xl font-extrabold text-navy mt-1 block">
              {summary?.metrics.total_affected_people ? summary.metrics.total_affected_people.toLocaleString() : "--"}
            </span>
            <span className="text-xs text-emergency font-medium mt-1 block">
              {summary?.metrics.threat_to_life_cases ?? 0} direct life threats
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Verified Emergency Rate
            </span>
            <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
              {summary?.metrics.total_incidents
                ? `${Math.round(((summary.metrics.verified_reports || 0) / summary.metrics.total_incidents) * 100)}%`
                : "--"}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {summary?.metrics.unverified_pending_review ?? 0} unverified reports
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Depot Allocations
            </span>
            <span className="text-3xl font-extrabold text-teal mt-1 block">
              {summary?.metrics.total_allocations ?? "--"}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {summary?.metrics.low_stock_alerts ? `${summary.metrics.low_stock_alerts} low-stock warnings` : "Stock levels nominal"}
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Severity Categories Breakdown</h3>
                <p className="text-xs text-slate-500">Heuristic assessment distribution</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Rule Engine
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
          </div>

          {/* Incident Types Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy text-base">Hazard Incidents by Type</h3>
                <p className="text-xs text-slate-500">Classifications across reported disaster events</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Multi-Hazard
              </span>
            </div>

            <div className="h-64 w-full">
              {summary?.type_distribution && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.type_distribution} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis dataKey="type" type="category" width={110} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#142B3B",
                        borderRadius: "8px",
                        border: "none",
                        color: "white",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#178F8B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Prototype Disclaimers & Ethics Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h4 className="font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emergency" />
            Safety, Reliability & Human Verification Disclaimers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Assistive Decision Heuristic:</strong> The danger assessment scoring engine implements deterministic, explainable heuristic scoring based on medical urgency, reported threats to life, affected headcount, and evidence recency. It is NOT a medically validated or clinical model.
            </p>
            <p>
              <strong>Human Oversight Required:</strong> All unverified incidents remain explicitly flagged for human triage officer review before dispatch of life-saving medical supplies or tactical evacuation assets.
            </p>
            <p>
              <strong>Simulation Road Data:</strong> Shortest route planning utilizes NetworkX Dijkstra graph calculations on demo road topologies. Never assume a route is safe simply because it is the shortest distance.
            </p>
            <p>
              <strong>No Assumption of Safety:</strong> Absence of reports does not indicate an area is undamaged. In real catastrophes, communication infrastructure blackouts frequently isolate heavily impacted communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
