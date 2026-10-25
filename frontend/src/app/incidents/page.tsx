"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import AssessmentScoreBadge from "@/components/AssessmentScoreBadge";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import AllocateResourceModal from "@/components/AllocateResourceModal";
import { api } from "@/lib/api";
import { Incident } from "@/lib/types";
import {
  Search,
  Filter,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  ShieldAlert,
  Boxes,
  Navigation,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateTarget, setAllocateTarget] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIncidents({
        search: search || undefined,
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      setIncidents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedType, selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handlePlanRoute = (inc: Incident) => {
    router.push(`/routes?incidentId=${inc.id}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Disaster Incident Reporting & Triage"
        subtitle="Live multi-agency incident logs, triage prioritization, and field evidence tracking"
        onRefresh={fetchIncidents}
        onIncidentCreated={fetchIncidents}
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        {/* Filter and Search Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search incident title, description, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filters:
            </span>

            {/* Severity Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
              <option value="Insufficient Information">Insufficient Info</option>
            </select>

            {/* Incident Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="">All Hazard Types</option>
              <option value="Flood">Flood</option>
              <option value="Landslide">Landslide</option>
              <option value="Structural Collapse">Structural Collapse</option>
              <option value="Chemical">Chemical / Hazmat</option>
              <option value="Fire">Fire / Explosion</option>
              <option value="Medical">Medical Outbreak</option>
              <option value="Utility">Utility Outage</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="">All Operational Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {(search || selectedCategory || selectedType || selectedStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedType("");
                  setSelectedStatus("");
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-emergency text-sm">
            {error}
          </div>
        )}

        {/* Incidents Count */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {incidents.length} incident records</span>
          <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            DEMO SIMULATION DATA
          </span>
        </div>

        {/* Incidents List Cards */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            Loading incident records...
          </div>
        ) : incidents.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            No incidents match the active filters.
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">#{incident.id}</span>
                    <h3
                      onClick={() => {
                        setSelectedIncident(incident);
                        setDetailOpen(true);
                      }}
                      className="font-bold text-navy text-base hover:text-teal cursor-pointer transition-colors"
                    >
                      {incident.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {incident.incident_type}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-navy-light/10 text-navy">
                      {incident.status}
                    </span>
                    {incident.is_demo && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                        DEMO DATA
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal" />
                      {incident.location_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{incident.people_affected}</strong> affected
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(incident.created_at)}
                    </span>
                    {incident.threat_to_life && (
                      <span className="text-[10px] font-bold text-emergency bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                        ⚡ Threat to Life
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action / Badges */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <AssessmentScoreBadge
                      score={incident.priority_score}
                      category={incident.priority_category}
                      uncertainty={incident.assessment_uncertainty}
                      isVerified={incident.is_verified}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedIncident(incident);
                        setDetailOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => {
                        setAllocateTarget(incident);
                        setAllocateOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal hover:text-white text-xs font-semibold transition-colors"
                    >
                      Allocate
                    </button>
                    <button
                      onClick={() => handlePlanRoute(incident)}
                      className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold transition-colors"
                      title="Calculate shortest route from depot"
                    >
                      Route
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {detailOpen && (
        <IncidentDetailModal
          incident={selectedIncident}
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          onUpdated={fetchIncidents}
          onPlanRoute={handlePlanRoute}
          onAllocate={(inc) => {
            setAllocateTarget(inc);
            setAllocateOpen(true);
          }}
        />
      )}

      {/* Allocate Modal */}
      {allocateOpen && (
        <AllocateResourceModal
          isOpen={allocateOpen}
          onClose={() => setAllocateOpen(false)}
          onSuccess={() => {
            setAllocateOpen(false);
            fetchIncidents();
          }}
          preselectedIncident={allocateTarget}
        />
      )}
    </div>
  );
}
