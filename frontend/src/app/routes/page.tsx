
"use client";

import { Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import { api } from "@/lib/api";
import { RouteResponse, Incident } from "@/lib/types";
import {
  Navigation,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

function RoutePlannerContent() {
  const searchParams = useSearchParams();
  const initialIncidentId = searchParams.get("incidentId");

  const [depots, setDepots] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedDepot, setSelectedDepot] = useState("DEPOT_ALPHA");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    initialIncidentId || ""
  );
  const [avoidClosures, setAvoidClosures] = useState(true);

  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial depot and incident data.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [net, incs] = await Promise.all([
          api.getRoadNetwork(),
          api.getIncidents(),
        ]);

        if (cancelled) return;

        setDepots(net.depots || []);
        setIncidents(incs);

        const requestedId = initialIncidentId || "";
        const validRequestedId = incs.some(
          (inc) => inc.id === Number(requestedId)
        );

        if (validRequestedId) {
          setSelectedIncidentId(requestedId);
        } else if (incs.length > 0) {
          setSelectedIncidentId(String(incs[0].id));
        } else {
          setSelectedIncidentId("");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load route planning data."
          );
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [initialIncidentId]);

  // Calculate a route for the current selections.
  const handleCalculateRoute = async () => {
    setLoading(true);
    setError(null);

    try {
      const [net, incs] = await Promise.all([
        api.getRoadNetwork(),
        api.getIncidents(),
      ]);

      setDepots(net.depots || []);
      setIncidents(incs);

      let incidentId = selectedIncidentId;

      const selectionExists = incs.some(
        (inc) => inc.id === Number(incidentId)
      );

      if (!incidentId || !selectionExists) {
        incidentId = incs.length > 0 ? String(incs[0].id) : "";
        setSelectedIncidentId(incidentId);
      }

      if (!incidentId) {
        setRouteResult(null);
        setError(
          "No incidents available. Create an incident before planning a route."
        );
        return;
      }

      const res = await api.planRouteToIncident(
        Number(incidentId),
        selectedDepot,
        avoidClosures
      );

      setRouteResult(res);
    } catch (err: unknown) {
      setRouteResult(null);
      setError(
        err instanceof Error ? err.message : "Route calculation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // Automatically recalculate when the user changes route parameters.
  useEffect(() => {
    if (
      selectedIncidentId &&
      incidents.some((inc) => inc.id === Number(selectedIncidentId))
    ) {
      const calculate = async () => {
        setLoading(true);
        setError(null);

        try {
          const res = await api.planRouteToIncident(
            Number(selectedIncidentId),
            selectedDepot,
            avoidClosures
          );

          setRouteResult(res);
        } catch (err: unknown) {
          setRouteResult(null);
          setError(
            err instanceof Error
              ? err.message
              : "Route calculation failed."
          );
        } finally {
          setLoading(false);
        }
      };

      calculate();
    }
  }, [selectedIncidentId, selectedDepot, avoidClosures, incidents]);

  const targetIncident = incidents.find(
    (inc) => inc.id === Number(selectedIncidentId)
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="NetworkX Disaster Route Planning"
        subtitle="Graph-based shortest path navigation, hazard avoidance, and estimated travel time calculations"
        onRefresh={handleCalculateRoute}
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        <div className="p-4 rounded-xl bg-red-500/10 border-l-4 border-emergency text-slate-800 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-emergency uppercase tracking-wider text-[11px] block mb-0.5">
              Critical Tactical Route Safety Protocol
            </span>
            <p className="leading-relaxed">
              <strong>
                Never assume a route is safe simply because it is the shortest
                path.
              </strong>{" "}
              Real disaster corridors experience rapid flash floods, structural
              bridge failures, live downed electrical wires, and secondary
              landslides. All route distances and times are algorithmic
              estimates based on a simulated road network graph.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            Route Parameters Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Origin (Relief Depot)
              </label>
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="DEPOT_ALPHA">
                  Central Regional Depot (Alpha)
                </option>
                <option value="DEPOT_BETA">
                  Riverside Logistics Base (Beta)
                </option>
                <option value="DEPOT_GAMMA">
                  North Hills Reserve (Gamma)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Destination (Incident Site)
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    #{inc.id} - {inc.title} ({inc.priority_category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidClosures}
                  onChange={(e) => setAvoidClosures(e.target.checked)}
                  className="w-4 h-4 accent-blue-700 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Avoid Known Road Closures
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Reroute around flooded bridges &amp; mudslides
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {loading && (
          <div
            className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm"
            role="status"
          >
            Refreshing route data and calculating route...
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-emergency text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {routeResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Travel Distance
                </span>
                <span className="text-3xl font-extrabold text-blue-700 mt-1 block">
                  {routeResult.total_distance_km ?? "--"}{" "}
                  <span className="text-base font-medium text-slate-500">
                    km
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dijkstra NetworkX Shortest Path
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Estimated Travel Duration
                </span>
                <span className="text-3xl font-extrabold text-sky-500 mt-1 block">
                  {routeResult.estimated_duration_minutes ?? "--"}{" "}
                  <span className="text-base font-medium text-slate-500">
                    min
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Simulated base speed with hazard penalties
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Closures Detoured
                </span>
                <span className="text-3xl font-extrabold text-relief-amber mt-1 block">
                  {routeResult.closures_avoided?.length ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Known hazards circumvented
                </span>
              </div>
            </div>

            {routeResult.closures_avoided &&
              routeResult.closures_avoided.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
                  <strong className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Road Corridors Circumvented by Detour:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-800">
                    {routeResult.closures_avoided.map((c, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{c.road}:</span>{" "}
                        {c.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-blue-700 text-base">
                    Turn-by-Turn Route Navigation Steps
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step-by-step navigation instructions along simulated road
                    corridors
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  DEMO ROAD DATA
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Step</th>
                      <th className="p-3">Instruction</th>
                      <th className="p-3">Roadway</th>
                      <th className="p-3 text-right">Distance</th>
                      <th className="p-3 text-right">Est. Time</th>
                      <th className="p-3">Road Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routeResult.steps?.map((step) => (
                      <tr
                        key={step.step_number}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="p-3 font-bold text-slate-500">
                          #{step.step_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 max-w-sm">
                          {step.instruction}
                        </td>
                        <td className="p-3 text-slate-700">{step.road}</td>
                        <td className="p-3 text-right font-medium text-slate-800">
                          {step.distance_km} km
                        </td>
                        <td className="p-3 text-right font-bold text-blue-700">
                          {step.estimated_minutes} min
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              step.status === "caution"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {step.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoutePlannerPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-slate-500">Loading Route Planner...</div>}
    >
      <RoutePlannerContent />
    </Suspense>
  );
}
