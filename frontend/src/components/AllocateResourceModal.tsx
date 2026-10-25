"use client";

import { useState, useEffect } from "react";
import { X, Boxes, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Incident, Resource } from "@/lib/types";

interface AllocateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedIncident?: Incident | null;
  preselectedResource?: Resource | null;
}

export default function AllocateResourceModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedIncident,
  preselectedResource,
}: AllocateResourceModalProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | "">("");
  const [selectedResourceId, setSelectedResourceId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getIncidents().then(setIncidents).catch(console.error);
      api.getResources().then(setResources).catch(console.error);

      if (preselectedIncident) {
        setSelectedIncidentId(preselectedIncident.id);
      }
      if (preselectedResource) {
        setSelectedResourceId(preselectedResource.id);
      }
    }
  }, [isOpen, preselectedIncident, preselectedResource]);

  if (!isOpen) return null;

  const currentResource = resources.find((r) => r.id === Number(selectedResourceId));
  const currentIncident = incidents.find((i) => i.id === Number(selectedIncidentId));

  const availableStock = currentResource ? currentResource.available_quantity : 0;
  const isOverAllocated = quantity > availableStock;
  const isInvalidQuantity = quantity <= 0 || isOverAllocated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !selectedResourceId) {
      setError("Please select both a target incident and a relief resource.");
      return;
    }

    if (isInvalidQuantity) {
      setError(`Quantity must be between 1 and ${availableStock} ${currentResource?.unit || "units"}.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.allocateResource({
        incident_id: Number(selectedIncidentId),
        resource_id: Number(selectedResourceId),
        quantity: Number(quantity),
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to allocate resources.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal" />
              Allocate Relief Resources
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatch inventory from relief depots to confirmed incident sites.
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
          {/* Target Incident */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Incident *
            </label>
            <select
              required
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
            >
              <option value="">-- Select Target Incident --</option>
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  #{inc.id} - {inc.title} ({inc.priority_category}, {inc.people_affected} affected)
                </option>
              ))}
            </select>
          </div>

          {/* Relief Resource */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relief Supply Item *
            </label>
            <select
              required
              value={selectedResourceId}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : "";
                setSelectedResourceId(id);
                const res = resources.find((r) => r.id === id);
                if (res && quantity > res.available_quantity) {
                  setQuantity(Math.max(1, Math.min(10, res.available_quantity)));
                }
              }}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
            >
              <option value="">-- Select Supply Inventory Item --</option>
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name} — {res.available_quantity} {res.unit} available ({res.depot_name})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Telemetry Card */}
          {currentResource && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Depot Origin:</span>
                <span className="font-semibold text-navy">{currentResource.depot_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Category / Unit:</span>
                <span className="font-medium text-slate-800">
                  {currentResource.category} ({currentResource.unit})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600">Current Available Stock:</span>
                <span className="font-bold text-teal text-sm">
                  {currentResource.available_quantity} {currentResource.unit}
                </span>
              </div>
              {currentResource.is_low_stock && (
                <div className="text-[11px] text-amber-700 font-semibold pt-1">
                  ⚠️ Caution: Supply item is at or below minimum reserve threshold ({currentResource.min_threshold} {currentResource.unit}).
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Quantity to Allocate *
              </label>
              {currentResource && (
                <span className="text-[11px] text-slate-500">
                  Max available: {availableStock} {currentResource.unit}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={availableStock > 0 ? availableStock : 1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={`w-full text-sm px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 ${
                  isOverAllocated
                    ? "border-red-300 text-emergency focus:ring-emergency"
                    : "border-slate-300 focus:ring-teal"
                }`}
              />
              {currentResource && (
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">
                  {currentResource.unit}
                </span>
              )}
            </div>

            {isOverAllocated && (
              <p className="text-[11px] text-emergency font-medium mt-1">
                Allocation exceeds available inventory. Maximum permitted is {availableStock} {currentResource?.unit}.
              </p>
            )}
          </div>

          {/* Allocation Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Purpose / Operator Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority dispatch for emergency evacuation shelter"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidQuantity}
              className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-sm font-semibold shadow-sm shadow-teal/30 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm Allocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
