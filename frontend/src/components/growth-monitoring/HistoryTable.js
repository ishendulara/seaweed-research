import React from "react";

function HistoryTable({ history, plantId }) {
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3>Growth History — Plant: {plantId}</h3>
      {history.length === 0 ? (
        <p>No previous growth cycles for this plant.</p>
      ) : (
        <table width="100%">
          <thead>
            <tr>
              <th>Date</th>
              <th>Species</th>
              <th>Day</th>
              <th>Initial Weight (g)</th>
              <th>Harvest Day</th>
              <th>Harvest Weight (g)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{h.date}</td>
                <td>{h.species}</td>
                <td>{h.startDay}</td>
                <td>{h.initialWeight}</td>
                <td>{h.harvestDay ?? "—"}</td>
                <td>{h.harvestWeight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HistoryTable;