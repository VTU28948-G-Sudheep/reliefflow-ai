"use client";

import { ShieldAlert, Info } from "lucide-react";

export default function PrototypeNotice() {
  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3.5 rounded-r-xl mb-6 text-slate-800 text-xs flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">Prototype Notice</span>
          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">DEMO DATA</span>
        </div>
        <p className="mt-1 text-slate-700 leading-relaxed">
          ReliefFlow AI is a disaster relief planning prototype and training simulation. It is{" "}
          <strong className="font-semibold text-slate-900">NOT an official emergency dispatch service</strong>. Danger assessments use an explainable heuristic rule engine and require human verification before tactical dispatch. Do not assume areas without reports are safe.
        </p>
      </div>
    </div>
  );
}
