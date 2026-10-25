import { Incident, Resource, ResourceAllocation, RouteResponse, ReportsSummary, AssessmentPreview } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.detail) {
        errDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errDetail);
  }
  return response.json();
}

export const api = {
  // Incidents
  getIncidents: (params?: { search?: string; type?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.type) q.append("incident_type", params.type);
    if (params?.category) q.append("priority_category", params.category);
    if (params?.status) q.append("status", params.status);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<Incident[]>(`/incidents/${qs}`);
  },

  getIncident: (id: number) => fetchJson<Incident>(`/incidents/${id}`),

  createIncident: (data: Partial<Incident>) =>
    fetchJson<Incident>("/incidents/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateIncident: (id: number, data: Partial<Incident>) =>
    fetchJson<Incident>(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  verifyIncident: (id: number) =>
    fetchJson<Incident>(`/incidents/${id}/verify`, {
      method: "POST",
    }),

  reassessIncident: (id: number) =>
    fetchJson<Incident>(`/incidents/${id}/reassess`, {
      method: "POST",
    }),

  deleteIncident: (id: number) =>
    fetchJson<void>(`/incidents/${id}`, {
      method: "DELETE",
    }),

  // Danger Assessment Preview
  evaluateAssessment: (params: {
    medical_urgency: string;
    threat_to_life: boolean;
    people_affected: number;
    evidence_quality: string;
    is_verified: boolean;
    incident_type: string;
    description?: string;
  }) =>
    fetchJson<AssessmentPreview>("/assessment/evaluate", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // Resources
  getResources: (params?: { category?: string; low_stock_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append("category", params.category);
    if (params?.low_stock_only) q.append("low_stock_only", "true");
    const qs = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<Resource[]>(`/resources/${qs}`);
  },

  allocateResource: (data: { incident_id: number; resource_id: number; quantity: number; notes?: string }) =>
    fetchJson<ResourceAllocation>("/resources/allocate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAllocations: (incidentId?: number) => {
    const qs = incidentId ? `?incident_id=${incidentId}` : "";
    return fetchJson<ResourceAllocation[]>(`/resources/allocations${qs}`);
  },

  // Routes
  getRoadNetwork: () => fetchJson<any>("/routes/network"),

  planRoute: (data: { origin_id: string; destination_id: string; avoid_closures?: boolean }) =>
    fetchJson<RouteResponse>("/routes/plan", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  planRouteToIncident: (incidentId: number, depotId: string = "DEPOT_ALPHA", avoidClosures: boolean = true) =>
    fetchJson<RouteResponse>(`/routes/plan-to-incident/${incidentId}?depot_id=${depotId}&avoid_closures=${avoidClosures}`, {
      method: "POST",
    }),

  // Map
  getMapLayers: () => fetchJson<any>("/map/layers"),

  // Reports
  getReportsSummary: () => fetchJson<ReportsSummary>("/reports/summary"),

  getExportCsvUrl: () => `${API_BASE}/reports/export-csv`,

  seedDemoData: (force: boolean = false) =>
    fetchJson<{ status: string; incidents_seeded?: number }>(`/seed?force=${force}`, {
      method: "POST",
    }),
};
