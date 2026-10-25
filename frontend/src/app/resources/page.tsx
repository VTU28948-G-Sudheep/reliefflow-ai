"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PrototypeNotice from "@/components/PrototypeNotice";
import AllocateResourceModal from "@/components/AllocateResourceModal";
import { api } from "@/lib/api";
import { Resource, ResourceAllocation } from "@/lib/types";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  MapPin
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const loadResources = async () => {
    setLoading(true);
    try {
      const [resData, allocData] = await Promise.all([
        api.getResources({
          category: selectedCategory || undefined,
          low_stock_only: lowStockOnly || undefined,
        }),
        api.getAllocations(),
      ]);
      setResources(resData);
      setAllocations(allocData);
    } catch (err) {
      console.error("Failed to load relief resources", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [selectedCategory, lowStockOnly]);

  const lowStockCount = resources.filter((r) => r.is_low_stock).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Relief Resource Management & Inventory"
        subtitle="Track drinking water, medical kits, rations, and allocate supplies without negative stock"
        onRefresh={loadResources}
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <PrototypeNotice />

        {/* Low Stock Advisory Banner */}
        {lowStockCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{lowStockCount} relief supply items</strong> have fallen below safe reserve thresholds. Prioritize resupply replenishment.
              </span>
            </div>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {lowStockOnly ? "Show All Items" : "Filter Low Stock"}
            </button>
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            {["", "Medical", "Water", "Food", "Shelter", "Rescue Equipment"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-teal text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {cat || "All Supplies"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedResource(null);
              setAllocateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            <span>Allocate to Incident</span>
          </button>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item) => {
            const pctAvailable = item.total_quantity > 0
              ? Math.round((item.available_quantity / item.total_quantity) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    {item.is_low_stock && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-navy text-base leading-tight mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {item.depot_name}
                  </p>

                  {/* Stock Quantities */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Available:</span>
                      <span className="font-extrabold text-navy text-sm">
                        {item.available_quantity.toLocaleString()} {item.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pctAvailable < 20
                            ? "bg-emergency"
                            : pctAvailable < 50
                            ? "bg-relief-amber"
                            : "bg-teal"
                        }`}
                        style={{ width: `${pctAvailable}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total: {item.total_quantity.toLocaleString()} {item.unit}</span>
                      <span>Allocated: {item.allocated_quantity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Min Reserve: {item.min_threshold} {item.unit}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedResource(item);
                      setAllocateModalOpen(true);
                    }}
                    disabled={item.available_quantity <= 0}
                    className="px-3 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal hover:text-white text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Allocate
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Allocation History Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-navy text-base">Recent Supply Allocations</h3>
              <p className="text-xs text-slate-500">
                Log of relief supplies assigned to field emergency incidents
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {allocations.length} records logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Target Incident</th>
                  <th className="p-3">Supply Item</th>
                  <th className="p-3">Depot Origin</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(a.allocated_at)}
                    </td>
                    <td className="p-3 font-semibold text-navy max-w-xs truncate">
                      {a.incident_title || `#${a.incident_id}`}
                    </td>
                    <td className="p-3 text-slate-800 font-medium">
                      {a.resource_name}
                    </td>
                    <td className="p-3 text-slate-600">{a.depot_name}</td>
                    <td className="p-3 text-right font-bold text-teal">
                      {a.quantity.toLocaleString()} {a.resource_unit}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal/10 text-teal border border-teal/20">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic max-w-xs truncate">
                      {a.notes || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Allocate Modal */}
      {allocateModalOpen && (
        <AllocateResourceModal
          isOpen={allocateModalOpen}
          onClose={() => setAllocateModalOpen(false)}
          onSuccess={() => {
            setAllocateModalOpen(false);
            loadResources();
          }}
          preselectedResource={selectedResource}
        />
      )}
    </div>
  );
}
