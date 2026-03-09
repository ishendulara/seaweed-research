// frontend/src/pages/Dashboard.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-wrapper">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="hero-pattern-bg">
          <div className="pattern-circle circle-1"></div>
          <div className="pattern-circle circle-2"></div>
          <div className="pattern-circle circle-3"></div>
        </div>
        
        <div className="dashboard-hero-content">
          <div className="welcome-badge">
            <span className="badge-icon">{user?.role === 'farmer' ? '🌊' : '👨‍💼'}</span>
            {user?.role === 'farmer' ? 'Farmer Dashboard' : 'Admin Dashboard'}
          </div>
          
          <h1 className="dashboard-main-title">
            Welcome back, {user?.name}!
          </h1>
          
          <p className="dashboard-description">
            {user?.role === 'farmer' 
              ? 'Manage your seaweed harvest records, track packaging, and generate QR codes for your products' 
              : 'Oversee farmer submissions, approve records, and manage the seaweed supply chain'}
          </p>

          <button className="logout-btn-hero" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="dashboard-main-content">
        {/* Quick Actions Section */}
        <div className="section-header">
          <h2>
            <span className="section-icon">⚡</span>
            Quick Actions
          </h2>
        </div>

        <div className="action-cards-grid">
          {user?.role === 'farmer' ? (
            <>
              {/* Farmer Cards */}
              
              <Link to="/ai-identify" className="action-card ai-card">
                <div className="action-card-badge">AI Powered</div>
                <div className="action-card-icon">🤖</div>
                <h3>AI Seaweed Identify</h3>
                <p>Use AI to instantly identify seaweed species and quality from photos</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/environment-suitability" className="action-card iot-card">
                <div className="action-card-badge">Live</div>
                <div className="action-card-icon">📡</div>
                <h3>Environmental Suitability</h3>
                <p>Real-time sensor data for water temperature, pH, TDS, and light levels with suitability analysis</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/prediction" className="action-card growth-card">
                <div className="action-card-icon">🌱</div>
                <h3>Growth Harvest</h3>
                <p>Track seaweed growth cycles and plan optimal harvest schedules</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/ai-prescription-calculator" className="action-card prescription-card">
                <div className="action-card-badge">Smart</div>
                <div className="action-card-icon">💊</div>
                <h3>Quality-Aware Prescription Engine</h3>
                <p>Get AI-driven treatment and nutrient prescriptions based on seaweed quality analysis</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/recipe-dashboard" className="action-card recipe-card">
                <div className="action-card-icon">🍲</div>
                <h3>Seaweed Food Recipes</h3>
                <p>Explore nutritious seaweed recipes, cooking tips and meal ideas</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/my-records" className="action-card primary-card">
                <div className="action-card-icon">📋</div>
                <h3>My Records</h3>
                <p>View and manage all your seaweed harvest records</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/add-record" className="action-card secondary-card">
                <div className="action-card-icon">➕</div>
                <h3>Add New Record</h3>
                <p>Submit new seaweed harvest details and information</p>
                <div className="card-arrow">→</div>
              </Link>
            </>
          ) : (
            <>
              {/* Admin Cards */}
              <Link to="/admin/records" className="action-card primary-card">
                <div className="action-card-icon">📊</div>
                <h3>All Records</h3>
                <p>View and manage all farmer harvest submissions</p>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/admin/records" className="action-card secondary-card">
                <div className="action-card-icon">👥</div>
                <h3>Manage Farmers</h3>
                <p>View farmer profiles and track their activities</p>
                <div className="card-arrow">→</div>
              </Link>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="features-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">✨</span>
              {user?.role === 'farmer' ? 'Available Features' : 'Admin Tools'}
            </h2>
          </div>

          <div className="features-grid">
            {user?.role === 'farmer' ? (
              <>
                <div className="feature-card">
                  <div className="feature-icon">📦</div>
                  <h4>Smart Packaging</h4>
                  <ul className="feature-list">
                    <li>Generate unique QR codes</li>
                    <li>Download product labels</li>
                    <li>Track delivery status</li>
                    <li>Print packing slips</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">📈</div>
                  <h4>Analytics</h4>
                  <ul className="feature-list">
                    <li>Harvest statistics</li>
                    <li>Quality metrics</li>
                    <li>Revenue tracking</li>
                    <li>Seasonal trends</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">💼</div>
                  <h4>Market Connection</h4>
                  <ul className="feature-list">
                    <li>Buyer marketplace</li>
                    <li>Price comparisons</li>
                    <li>Order management</li>
                    <li>Negotiation tools</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="feature-card">
                  <div className="feature-icon">✅</div>
                  <h4>Approvals</h4>
                  <ul className="feature-list">
                    <li>Review submissions</li>
                    <li>Approve/reject records</li>
                    <li>Quality verification</li>
                    <li>Batch processing</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">📋</div>
                  <h4>Reports</h4>
                  <ul className="feature-list">
                    <li>Generate summaries</li>
                    <li>Export data</li>
                    <li>Packing checklists</li>
                    <li>Delivery reports</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h4>Monitoring</h4>
                  <ul className="feature-list">
                    <li>Track submissions</li>
                    <li>Monitor quality</li>
                    <li>Audit logs</li>
                    <li>System alerts</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">👤</span>
              Your Profile
            </h2>
          </div>

          <div className="profile-card">
            <div className="profile-avatar">
              <span className="avatar-text">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            
            <div className="profile-details">
              <div className="profile-row">
                <span className="profile-label">Name</span>
                <span className="profile-value">{user?.name}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user?.email}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Role</span>
                <span className="profile-value">
                  <span className={`role-badge ${user?.role}`}>
                    {user?.role === 'farmer' ? '🌊 Farmer' : '👨‍💼 Admin'}
                  </span>
                </span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Phone</span>
                <span className="profile-value">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Address</span>
                <span className="profile-value">{user?.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;