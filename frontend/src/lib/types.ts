export interface Incident {
  id: number;
  title: string;
  description: string;
  incident_type: string;
  location_name: string;
  latitude: number;
  longitude: number;
  people_affected: number;
  medical_urgency: "None" | "Low" | "Moderate" | "High" | "Critical";
  threat_to_life: boolean;
  status: "Reported" | "Under Review" | "Dispatched" | "In Progress" | "Resolved";
  evidence_quality: string;
  is_verified: boolean;
  evidence_url?: string | null;
  priority_score: number;
  priority_category: "Critical" | "High" | "Moderate" | "Low" | "Insufficient Information";
  assessment_reasons: string; // JSON array
  assessment_uncertainty: "Low" | "Moderate" | "High";
  recommended_action?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  name: string;
  category: "Medical" | "Water" | "Food" | "Shelter" | "Rescue Equipment";
  unit: string;
  total_quantity: number;
  allocated_quantity: number;
  available_quantity: number;
  min_threshold: number;
  depot_name: string;
  latitude: number;
  longitude: number;
  is_demo: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceAllocation {
  id: number;
  incident_id: number;
  incident_title?: string;
  resource_id: number;
  resource_name?: string;
  resource_unit?: string;
  depot_name?: string;
  quantity: number;
  notes?: string;
  status: string;
  allocated_at: string;
}

export interface RouteStep {
  step_number: number;
  from_node: string;
  to_node: string;
  road: string;
  distance_km: number;
  estimated_minutes: number;
  status: string;
  hazard?: string | null;
  instruction: string;
  from_coords: [number, number];
  to_coords: [number, number];
}

export interface RouteResponse {
  route_found: boolean;
  origin_id?: string;
  origin?: { name: string; lat: number; lon: number };
  destination_id?: string;
  destination?: { name: string; lat: number; lon: number };
  path_nodes?: string[];
  total_distance_km?: number;
  estimated_duration_minutes?: number;
  steps?: RouteStep[];
  closures_avoided?: { segment: string; road: string; reason: string }[];
  warnings?: string[];
  error?: string;
  is_simulation_demo: boolean;
  safety_disclaimer: string;
  incident_id?: number;
  incident_title?: string;
  incident_location?: string;
}

export interface AssessmentPreview {
  priority_score: number;
  category: "Critical" | "High" | "Moderate" | "Low" | "Insufficient Information";
  reasons: string[];
  uncertainty: "Low" | "Moderate" | "High";
  recommended_next_action: string;
  is_ai_medically_certified: boolean;
  engine_type: string;
  human_review_required: boolean;
}

export interface ReportsSummary {
  metrics: {
    total_incidents: number;
    active_incidents: number;
    critical_incidents: number;
    total_affected_people: number;
    threat_to_life_cases: number;
    verified_reports: number;
    unverified_pending_review: number;
    total_resources: number;
    low_stock_alerts: number;
    total_allocations: number;
  };
  severity_distribution: { category: string; count: number; color: string }[];
  type_distribution: { type: string; count: number }[];
  is_demo_data: boolean;
  notice: string;
}
