import React from "react";

const styles = {
  safe: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  warning: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  danger: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
  unknown: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-400/30"
};

export default function Badge({ tone = "unknown", children }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium",
        styles[tone] || styles.unknown
      ].join(" ")}
    >
      {children}
    </span>
  );
}

