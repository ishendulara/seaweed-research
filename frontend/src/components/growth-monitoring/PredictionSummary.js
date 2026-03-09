import React from "react";

function PredictionSummary({ harvestDay, harvestWeight }) {
  return (
    <div>
      <h3>Prediction Summary</h3>

      {harvestDay !== null ? (
        <>
          <p>Predicted Harvest Day: <b>Day {harvestDay}</b></p>
          <p>Estimated Harvest Weight: <b>{harvestWeight} g</b></p>
        </>
      ) : (
        <p>Growth still in progress</p>
      )}
    </div>
  );
}

export default PredictionSummary;