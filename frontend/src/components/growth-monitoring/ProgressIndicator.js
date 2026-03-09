import React from "react";

function ProgressIndicator({ progress, stage }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h4>Growth Progress</h4>

      <div style={{ background: "#ddd", height: 20, width: "100%" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#2e8b57"
          }}
        />
      </div>

      <p>{progress}% – {stage}</p>
    </div>
  );
}

export default ProgressIndicator;