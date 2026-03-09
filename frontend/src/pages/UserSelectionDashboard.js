// frontend/src/pages/UserSelectionDashboard.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './UserSelectionDashboard.css';

const UserSelectionDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelection = (option) => {
    setSelectedOption(option);
    
    // Navigate based on selection
    if (option === 'food') {
      navigate('/recipe-dashboard');
    } else if (option === 'prescription') {
      navigate('/ai-prescription-calculator');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="user-selection-page">
      {/* Header */}
      <header className="selection-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🌊</div>
            <div>
              <h1>Seaweed System</h1>
              <p>Smart Seaweed Hub</p>
            </div>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <div>
                <p className="user-name">{user?.name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="selection-container">
        <div className="welcome-section">
          {/* <h2>Welcome, {user?.name}! 👋</h2>
          <p className="welcome-subtitle">
            What would you like to explore today?
          </p> */}
        </div>

        {/* Selection Cards */}
        <div className="selection-cards">
          {/* Food Recipes Card */}
          <div 
            className={`selection-card food-card ${selectedOption === 'food' ? 'selected' : ''}`}
            onClick={() => handleSelection('food')}
          >
            <div className="card-icon">🍽️</div>
            <h3>Food Recipes</h3>
            <p>Discover delicious seaweed recipes for your meals</p>
            
            <div className="card-features">
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI Recipe Recommendations</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Search by Ingredients</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>Chat with AI Assistant</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🥗</span>
                <span>Nutrition Information</span>
              </div>
            </div>

            <button className="card-button">
              Explore Recipes →
            </button>
          </div>

          {/* Prescriptions Card */}
          <div 
            className={`selection-card prescription-card ${selectedOption === 'prescription' ? 'selected' : ''}`}
            onClick={() => handleSelection('prescription')}
          >
            <div className="card-icon">💊</div>
            <h3>AI Prescription Calculator</h3>
            <p>Calculate medicine formulations using seaweed</p>
            
            <div className="card-features">
              <div className="feature-item">
                <span className="feature-icon">🧪</span>
                <span>Medicine Formulation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚖️</span>
                <span>Dosage Calculation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Ingredient Ratios</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚠️</span>
                <span>Safety Guidelines</span>
              </div>
            </div>

            <button className="card-button">
              Calculate Prescription →
            </button>

            {/* <div className="prescription-badge">
              <span className="badge-icon">✨</span>
              <span>Novelty Feature</span>
            </div> */}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">🌊</div>
            <div className="stat-content">
              <p className="stat-number">2</p>
              <p className="stat-label">Seaweed Types</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📖</div>
            <div className="stat-content">
              <p className="stat-number">50+</p>
              <p className="stat-label">Recipes Available</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <p className="stat-number">AI</p>
              <p className="stat-label">Powered Features</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💊</div>
            <div className="stat-content">
              <p className="stat-number">New</p>
              <p className="stat-label">Prescription Tool</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-card">
            <h4>🌟 About Seaweed</h4>
            <p>
              Seaweed is a nutrient-rich marine plant packed with vitamins, minerals, 
              and beneficial compounds. It's used both in culinary applications and 
              traditional medicine.
            </p>
          </div>
          <div className="info-card">
            <h4>🔬 Our Technology</h4>
            <p>
              We use AI-powered algorithms to provide personalized recipe recommendations 
              and precise medicine formulations based on your needs and available seaweed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelectionDashboard;