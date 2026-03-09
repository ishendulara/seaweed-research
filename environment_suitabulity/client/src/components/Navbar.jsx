import React from "react";
import { NavLink } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/suitability", label: "Environmental Suitability" },
  { to: "/growth", label: "Growth Prediction" },
  { to: "/identify", label: "Seaweed Identification" }
];

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-marine-400/30 to-emerald-500/10 ring-1 ring-white/10">
            <div className="h-5 w-5 rounded-md bg-emerald-300/50 ring-1 ring-emerald-200/30" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-100">
              Seaweed Smart Farming Platform
            </div>
            <div className="text-xs text-slate-400">Marine Research Dashboard</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-xl px-4 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-marine-500/25 text-emerald-100 ring-1 ring-emerald-400/25"
                    : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 md:block">
            Realtime: <span className="text-emerald-200">Socket.io</span>
          </div>
        </div>
      </div>
    </div>
  );
}

