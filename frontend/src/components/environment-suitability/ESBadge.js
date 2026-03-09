import React from "react";

const styles = {
  safe: "es-badge-safe",
  warning: "es-badge-warning",
  danger: "es-badge-danger",
  unknown: "es-badge-unknown"
};

export default function ESBadge({ tone = "unknown", children }) {
  return (
    <span className={`es-badge ${styles[tone] || styles.unknown}`}>
      {children}
    </span>
  );
}
