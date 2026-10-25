
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  Boxes,
  Navigation,
  FileSpreadsheet,
  ShieldAlert,
  Radio,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Disaster Map", href: "/map", icon: MapPin },
  { name: "Resources", href: "/resources", icon: Boxes },
  { name: "Route Planner", href: "/routes", icon: Navigation },
  { name: "Reports", href: "/reports", icon: FileSpreadsheet },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200 select-none">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-200">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
              ReliefFlow
              <span className="text-blue-700 text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                AI
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Emergency Response Core
            </p>
          </div>
        </div>

        <div className="mt-4 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-[11px] tracking-wider uppercase">
              Demo Data Active
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Simulation</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Operations
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <Radio className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-[11px]">
            Explainable Rule Engine v1.0
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Assistive decision prototype. Unverified emergencies require human review.
        </p>
      </div>
    </aside>
  );
}
