import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function getCategoryBadgeClasses(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case "Critical":
      return { bg: "bg-red-50", text: "text-emergency", border: "border-red-200" };
    case "High":
      return { bg: "bg-amber-50", text: "text-relief-amber", border: "border-amber-200" };
    case "Moderate":
      return { bg: "bg-teal-50", text: "text-teal", border: "border-teal-200" };
    case "Low":
      return { bg: "bg-emerald-50", text: "text-relief-green", border: "border-emerald-200" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" };
  }
}
