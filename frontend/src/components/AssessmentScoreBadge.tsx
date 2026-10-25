"use client";

import { AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { getCategoryBadgeClasses } from "@/lib/utils";

interface AssessmentScoreBadgeProps {
  score: number;
  category: string;
  uncertainty?: string;
  isVerified?: boolean;
  showScore?: boolean;
}

export default function AssessmentScoreBadge({
  score,
  category,
  uncertainty,
  isVerified = false,
  showScore = true,
}: AssessmentScoreBadgeProps) {
  const badgeClasses = getCategoryBadgeClasses(category);

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            category === "Critical"
              ? "bg-emergency animate-ping"
              : category === "High"
              ? "bg-relief-amber"
              : category === "Moderate"
              ? "bg-teal"
              : "bg-relief-green"
          }`}
        ></span>
        <span>{category}</span>
        {showScore && (
          <span className="ml-1 px-1.5 py-0.2 rounded bg-white/80 font-mono text-[11px] shadow-2xs">
            {score.toFixed(0)}/100
          </span>
        )}
      </div>

      {uncertainty && (
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
            uncertainty === "High"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : uncertainty === "Moderate"
              ? "bg-slate-100 text-slate-700 border-slate-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
          title={`Assessment Uncertainty: ${uncertainty}`}
        >
          {uncertainty} Uncertainty
        </span>
      )}

      {isVerified ? (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700" title="Verified by authorized responder">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700" title="Unverified emergency: human operator review required">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Review</span>
        </span>
      )}
    </div>
  );
}
