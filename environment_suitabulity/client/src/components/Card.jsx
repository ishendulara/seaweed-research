import React from "react";

export default function Card({ title, subtitle, right, children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-slate-950/50 shadow-soft backdrop-blur",
        className
      ].join(" ")}
    >
      {(title || subtitle || right) && (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            {title && <div className="text-sm font-semibold text-slate-100">{title}</div>}
            {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

