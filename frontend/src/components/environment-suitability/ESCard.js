import React from "react";

export default function ESCard({ title, subtitle, right, children, className = "" }) {
  return (
    <div className={`es-card ${className}`}>
      {(title || subtitle || right) && (
        <div className="es-card-header">
          <div>
            {title && <div className="es-card-title">{title}</div>}
            {subtitle && <div className="es-card-subtitle">{subtitle}</div>}
          </div>
          {right ? <div className="es-card-right">{right}</div> : null}
        </div>
      )}
      <div className="es-card-body">{children}</div>
    </div>
  );
}
