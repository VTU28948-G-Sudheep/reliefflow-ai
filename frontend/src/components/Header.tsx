
"use client";

import { useState } from "react";
import { PlusCircle, RefreshCw } from "lucide-react";
import NewIncidentModal from "./NewIncidentModal";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onIncidentCreated?: () => void;
}

export default function Header({
  title,
  subtitle,
  onRefresh,
  onIncidentCreated,
}: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="min-h-[72px] px-4 sm:px-8 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-blue-700 tracking-tight">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-relief-green text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-relief-green animate-pulse" />
            <span>Relief Dispatch Active</span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
              title="Refresh Data"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emergency hover:bg-emergency-dark text-white rounded-xl text-sm font-semibold shadow-sm shadow-emergency/30 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </header>

      {modalOpen && (
        <NewIncidentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            if (onIncidentCreated) onIncidentCreated();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
