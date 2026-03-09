import React from "react";

function SensorCard({ title, value }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p style={{ fontSize: 18, marginTop: 10 }}>{value}</p>
    </div>
  );
}

export default SensorCard;