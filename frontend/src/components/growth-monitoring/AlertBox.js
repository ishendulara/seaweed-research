import React from "react";

function AlertBox({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h4>System Alerts</h4>
      {alerts.map((alert, index) => (
        <p key={index}>{alert}</p>
      ))}
    </div>
  );
}

export default AlertBox;