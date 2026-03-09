// frontend/src/App.js
import React from 'react';
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Navbar from './components/Navbar';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecipeDashboard from './pages/RecipeDashboard';
import AIRecipeAssistant from './pages/AIRecipeAssistant/AIRecipeAssistant';
import RecipeDetails from './pages/RecipeDetails';
import AddRecord from './pages/AddRecord';
import MyRecords from './pages/MyRecords';
import EditRecord from './pages/EditRecord';
import RecordDetails from './pages/RecordDetails';
import AdminRecords from './pages/AdminRecords';
import PackingChecklist from './pages/PackingChecklist';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import UserSelectionDashboard from './pages/UserSelectionDashboard';
import AIPrescriptionCalculator from './pages/AIPrescriptionCalculator';
import PrescriptionResult from "./pages/PrescriptionResult";
import QualityFactorsPage from "./pages/QualityFactorsPage";
import Prediction from "./pages/growth-monitoring/Prediction";
import SpeciesIdentification from "./pages/species-identification/SpeciesIdentification";
import EnvironmentalSuitability from "./pages/environment-suitability/EnvironmentalSuitability";



import './App.css';

// Inner component so we can use useLocation
const AppContent = () => {
  const location = useLocation();

  // not nav bar 
  const hideNavbarRoutes = ['/login', '/register', '/', '/recipe-dashboard', '/ai-recipe-assistant', '/user-selection', '/ai-prescription-calculator', '/prescription-result', '/quality-factors', '/prediction', '/ai-identify', '/environment-suitability'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname) || location.pathname.startsWith('/recipe/');
  // const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="App">
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recipe-dashboard" element={<RecipeDashboard />} />
        <Route path="/ai-recipe-assistant" element={<AIRecipeAssistant />} />
        <Route path="/user-selection" element={<UserSelectionDashboard />} />
        <Route path="/ai-prescription-calculator" element={<AIPrescriptionCalculator />} />
        <Route path="/prescription-result" element={<PrescriptionResult />} />
        <Route path="/quality-factors" element={<QualityFactorsPage />} />
        <Route path="/prediction" element={<Prediction />} />
        <Route path="/ai-identify" element={<SpeciesIdentification />} />
        <Route path="/environment-suitability" element={<EnvironmentalSuitability />} />
        

        {/* NEW: User Selection Dashboard */}
        <Route
          path="/user-selection"
          element={
            <PrivateRoute>
              <UserSelectionDashboard />
            </PrivateRoute>
          }
        />
        
        {/* Protected Routes - Both Farmer and Admin */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Protected User Routes (role: 'user') */}
          <Route
            path="/recipe-dashboard"
            element={
              <PrivateRoute>
                <RecipeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-recipe-assistant"
            element={
              <PrivateRoute>
                <AIRecipeAssistant />
              </PrivateRoute>
            }
          />
          <Route
            path="/recipe/:id"
            element={
              <PrivateRoute>
                <RecipeDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-prescription-calculator"
            element={
              <PrivateRoute allowedRoles={['user']}>
                <AIPrescriptionCalculator />
              </PrivateRoute>
            }
          />
          <Route
            path="/prescription-result"
            element={
                <PrescriptionResult />
            }
          />
          <Route 
            path="/quality-factors" 
            element={
                <QualityFactorsPage />
            } 
          />

          <Route 
            path="/prediction" 
            element={
                <Prediction />
            } 
          />

          <Route 
            path="/ai-identify" 
            element={
                <SpeciesIdentification />
            } 
          />

          <Route 
            path="/environment-suitability" 
            element={
                <EnvironmentalSuitability />
            } 
          />
          

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/record/:id"
          element={
            <PrivateRoute>
              <RecordDetails />
            </PrivateRoute>
          }
        />

        {/* Farmer Only */}
        <Route
          path="/add-record"
          element={
            <PrivateRoute requireRole="farmer">
              <AddRecord />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-records"
          element={
            <PrivateRoute requireRole="farmer">
              <MyRecords />
            </PrivateRoute>
          }
        />

        <Route
          path="/edit-record/:id"
          element={
            <PrivateRoute requireRole="farmer">
              <EditRecord />
            </PrivateRoute>
          }
        />

        {/* Admin Only */}
        <Route
          path="/admin/records"
          element={
            <PrivateRoute requireRole="admin">
              <AdminRecords />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/checklist/:id"
          element={
            <PrivateRoute requireRole="admin">
              <PackingChecklist />
            </PrivateRoute>
          }
        />

        {/* Error pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />

        {/* Defaults */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

// Dashboard Router - Redirect based on role
const DashboardRouter = () => {
  const userStr = localStorage.getItem('user');
  
  if (userStr) {
    const user = JSON.parse(userStr);
    
    // User role → Recipe Dashboard
    if (user.role === 'user') {
      return <Navigate to="/recipe-dashboard" replace />;
    }
    
    // Farmer/Admin → Regular Dashboard
    return <Dashboard />;
  }
  
  // Default
  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
