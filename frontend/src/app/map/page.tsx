"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import LeafletMap from "@/components/LeafletMap";
import AssessmentScoreBadge from "@/components/AssessmentScoreBadge";
import IncidentDetailModal from "@/components/IncidentDetailModal";
import AllocateResourceModal from "@/components/AllocateResourceModal";
import { api } from "@/lib/api";
import { Incident } from "@/lib/types";
import {
  MapPin,
  ShieldAlert,
  Boxes,
  Navigation,
  Clock,
  Users,
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function DisasterMapPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [layerData, incData] = await Promise.all([
        api.getMapLayers(),
        api.getIncidents({}),
      ]);
      setIncidents(incData);
      setDepots(layerData.depots || []);
      setHazards(layerData.hazard_corridors || []);
      if (incData.length > 0 && !selectedIncident) {
        setSelectedIncident(incData[0]);
      }
    } catch (err) {
      console.error("Failed to load map spatial layers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Interactive Disaster Map & Hazard Corridors"
        subtitle="Geographic overview of emergency triage, relief supply bases, and road network disruptions"
        onRefresh={loadMapData}
        onIncidentCreated={loadMapData}
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Map Canvas Column */}
          <div className="lg:col-span-2 space-y-3">
            <LeafletMap
              incidents={incidents}
              depots={depots}
              hazardCorridors={hazards}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              selectedIncidentId={selectedIncident?.id}
              height="600px"
            />

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal" />
                Click any marker on the map to inspect telemetry, assess risk, and dispatch routes.
              </span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] uppercase">
                Demo Coordinates Only
              </span>
            </div>
          </div>

          {/* Selected Incident Telemetry Inspector Pane */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-navy text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal" />
                  Selected Telemetry Sector
                </h3>
                {selectedIncident?.is_demo && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                    DEMO DATA
                  </span>
                )}
              </div>

              {selectedIncident ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <span>INC-{selectedIncident.id}</span>
                      <span>•</span>
                      <span className="font-semibold text-teal">{selectedIncident.incident_type}</span>
                    </div>
                    <h4 className="font-bold text-navy text-base leading-snug">
                      {selectedIncident.title}
                    </h4>
                  </div>

                  <AssessmentScoreBadge
                    score={selectedIncident.priority_score}
                    category={selectedIncident.priority_category}
                    uncertainty={selectedIncident.assessment_uncertainty}
                    isVerified={selectedIncident.is_verified}
                  />

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Location:</span>
                      <span className="font-semibold text-slate-900">{selectedIncident.location_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">People Affected:</span>
                      <span className="font-bold text-slate-900">{selectedIncident.people_affected}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Medical Urgency:</span>
                      <span className="font-bold text-emergency">{selectedIncident.medical_urgency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Threat to Life:</span>
                      <span className={`font-bold ${selectedIncident.threat_to_life ? "text-emergency" : "text-slate-700"}`}>
                        {selectedIncident.threat_to_life ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>

                  {selectedIncident.recommended_action && (
                    <div className="p-3 rounded-xl bg-teal/5 border border-teal/20 text-xs">
                      <strong className="block text-teal font-semibold mb-0.5 text-[11px] uppercase">
                        Recommended Action
                      </strong>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedIncident.recommended_action}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => setDetailModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      Inspect Explainable Reasons & Details
                    </button>

                    <button
                      onClick={() => router.push(`/routes?incidentId=${selectedIncident.id}`)}
                      className="w-full py-2.5 px-3 rounded-xl bg-navy hover:bg-navy-light text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Plan Shortest Route from Depot</span>
                    </button>

                    <button
                      onClick={() => setAllocateModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl border border-teal text-teal hover:bg-teal hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Allocate Supplies</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Select an incident marker on the map to inspect details.
                </div>
              )}
            </div>

            {/* Relief Supply Depots Quick List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-teal" />
                Relief Depots Telemetry ({depots.length})
              </h3>
              <div className="space-y-2">
                {depots.map((d) => (
                  <div key={d.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-navy flex items-center justify-between">
                      <span>{d.name}</span>
                      <span className="text-[10px] text-teal font-semibold">Ready</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Lat: {d.latitude.toFixed(4)}, Lon: {d.longitude.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {detailModalOpen && (
        <IncidentDetailModal
          incident={selectedIncident}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onUpdated={loadMapData}
          onPlanRoute={(inc) => router.push(`/routes?incidentId=${inc.id}`)}
          onAllocate={() => setAllocateModalOpen(true)}
        />
      )}

      {/* Allocate Modal */}
      {allocateModalOpen && (
        <AllocateResourceModal
          isOpen={allocateModalOpen}
          onClose={() => setAllocateModalOpen(false)}
          onSuccess={() => {
            setAllocateModalOpen(false);
            loadMapData();
          }}
          preselectedIncident={selectedIncident}
        />
      )}
    </div>
  );
}
