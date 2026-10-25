"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, ShieldAlert, CheckCircle2, Loader2, Sparkles, Crosshair } from "lucide-react";
import { api } from "@/lib/api";
import { AssessmentPreview } from "@/lib/types";

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_LOCATIONS = [
  { name: "Velachery Lowland Basin", lat: 12.9815, lon: 80.2180 },
  { name: "Kotturpuram Adyar River", lat: 13.0180, lon: 80.2420 },
  { name: "Tambaram Mudichur Corridor", lat: 12.9250, lon: 80.0880 },
  { name: "Ennore Industrial Creek", lat: 13.2010, lon: 80.3180 },
  { name: "George Town (Parrys)", lat: 13.0910, lon: 80.2880 },
];

export default function NewIncidentModal({ isOpen, onClose, onSuccess }: NewIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("Flood");
  const [locationName, setLocationName] = useState("Velachery, Chennai");
  const [latitude, setLatitude] = useState<number>(12.9815);
  const [longitude, setLongitude] = useState<number>(80.2180);
  const [peopleAffected, setPeopleAffected] = useState<number>(15);
  const [medicalUrgency, setMedicalUrgency] = useState("Moderate");
  const [threatToLife, setThreatToLife] = useState(false);
  const [evidenceQuality, setEvidenceQuality] = useState("Citizen Report with Media");
  const [isVerified, setIsVerified] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isDemo, setIsDemo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Assessment Preview
  const [preview, setPreview] = useState<AssessmentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await api.evaluateAssessment({
          medical_urgency: medicalUrgency,
          threat_to_life: threatToLife,
          people_affected: peopleAffected,
          evidence_quality: evidenceQuality,
          is_verified: isVerified,
          incident_type: incidentType,
          description: description,
        });
        if (!cancel) setPreview(res);
      } catch {
        // ignore preview errors
      } finally {
        if (!cancel) setPreviewLoading(false);
      }
    };

    const timer = setTimeout(fetchPreview, 300);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [medicalUrgency, threatToLife, peopleAffected, evidenceQuality, isVerified, incidentType, description]);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lon);
        if (!locationName || locationName === "Velachery, Chennai") {
          setLocationName(`GPS Coordinates (${lat}, ${lon})`);
        }
      },
      (err) => {
        setLocating(false);
        alert(`Location detection failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.createIncident({
        title,
        description,
        incident_type: incidentType,
        location_name: locationName || "Chennai Sector",
        latitude: Number(latitude),
        longitude: Number(longitude),
        people_affected: Number(peopleAffected),
        medical_urgency: medicalUrgency as any,
        threat_to_life: threatToLife,
        evidence_quality: evidenceQuality,
        is_verified: isVerified,
        evidence_url: evidenceUrl || null,
        is_demo: isDemo,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit incident report");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLocationName(`${preset.name}, Chennai`);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emergency" />
              Report New Disaster Incident (Chennai Region)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input field telemetry. The explainable danger engine evaluates risk parameters immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-emergency text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inundation & Power Substation Outage in Velachery"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal focus:border-teal"
            />
          </div>

          {/* Type & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Hazard Type *
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              >
                <option value="Flood">Flood / Waterlogging</option>
                <option value="Landslide">Landslide / Road Breach</option>
                <option value="Structural Collapse">Structural Collapse</option>
                <option value="Chemical">Hazardous Material / Industrial</option>
                <option value="Fire">Fire / Explosion</option>
                <option value="Medical">Medical Outbreak / Casualty</option>
                <option value="Utility">Utility Outage (Water/Power)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Urgency *
              </label>
              <select
                value={medicalUrgency}
                onChange={(e) => setMedicalUrgency(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              >
                <option value="Critical">Critical (Immediate life hazard)</option>
                <option value="High">High (Severe injury / acute risk)</option>
                <option value="Moderate">Moderate (Chronic or triage care)</option>
                <option value="Low">Low (Minor care required)</option>
                <option value="None">None / Supply only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                People Affected *
              </label>
              <input
                type="number"
                min="0"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Description & On-Scene Situation *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details: water depth, structural damages, trapped families, live wire hazards..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal focus:border-teal"
            />
          </div>

          {/* Threat to life toggle */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={threatToLife}
                onChange={(e) => setThreatToLife(e.target.checked)}
                className="w-4 h-4 text-emergency rounded border-slate-300 focus:ring-emergency"
              />
              <span className="text-xs font-bold text-slate-800">
                Immediate Threat to Life Declared
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 text-teal rounded border-slate-300 focus:ring-teal"
              />
              <span className="text-xs font-semibold text-slate-700">
                Officially Verified by On-Scene Personnel
              </span>
            </label>
          </div>

          {/* Location details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Location Details & Coordinates
              </label>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={locating}
                  className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
                  <span>Use Live GPS</span>
                </button>
                <span>Chennai Presets:</span>
                {PRESET_LOCATIONS.slice(0, 3).map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => handleLocationPreset(p)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Sector / Colony name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>

          {/* Evidence quality & URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evidence Quality
              </label>
              <select
                value={evidenceQuality}
                onChange={(e) => setEvidenceQuality(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              >
                <option value="Official Responder">Official Responder (Police/Fire/NDRF)</option>
                <option value="Corroborated">Corroborated by Multiple Sources</option>
                <option value="Citizen Report with Media">Citizen Report with Media / Photo</option>
                <option value="Unverified Citizen">Unverified Citizen Call</option>
                <option value="Ambiguous">Ambiguous / Incomplete</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evidence URL / Wireless Radio Ref (Optional)
              </label>
              <input
                type="text"
                placeholder="https://... or Wireless Dispatch Log #204"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>

          {/* Live Danger Assessment Engine Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-light flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal" />
                Live Danger Assessment Preview (Explainable Heuristic)
              </span>
              {previewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {preview && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Calculated Score</span>
                  <span className="font-bold text-base text-white">{preview.priority_score} / 100</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Priority Category</span>
                  <span
                    className={`font-bold text-sm ${
                      preview.category === "Critical"
                        ? "text-rose-400"
                        : preview.category === "High"
                        ? "text-amber-400"
                        : preview.category === "Moderate"
                        ? "text-teal-light"
                        : "text-emerald-400"
                    }`}
                  >
                    {preview.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Uncertainty</span>
                  <span className="font-semibold text-slate-300 text-xs">{preview.uncertainty}</span>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Heuristic rule calculation. Not clinically certified. Unverified incidents require human review.
            </p>
          </div>

          {/* Demo Data Flag & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
                className="w-4 h-4 text-teal rounded border-slate-300"
              />
              <span className="text-xs text-slate-600 font-medium">Tag as DEMO DATA</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emergency hover:bg-emergency-dark text-white rounded-xl text-sm font-semibold shadow-sm shadow-emergency/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Submit & Prioritize</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
