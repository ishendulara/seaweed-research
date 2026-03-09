import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EnvironmentalSuitability from "./pages/EnvironmentalSuitability.jsx";
import GrowthPrediction from "./pages/GrowthPrediction.jsx";
import SeaweedIdentification from "./pages/SeaweedIdentification.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="marine-grid min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suitability" element={<EnvironmentalSuitability />} />
          <Route path="/growth" element={<GrowthPrediction />} />
          <Route path="/identify" element={<SeaweedIdentification />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

