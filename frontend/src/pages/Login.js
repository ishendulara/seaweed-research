// frontend\src\pages\Login.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      // Redirect based on role
    if (result.user.role === 'admin') {
      navigate('/admin/records');
    } else if (result.user.role === 'user') {
      navigate('/user-selection');  // User - selection dashboard
    } else {
      navigate('/dashboard');  // Farmer → Regular Dashboard
    }
  }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* LEFT PANEL */}
        <div className="auth-hero">
          <div>
            <div className="auth-hero-header">
              <div className="auth-logo">🌊</div>
              <div>
                <h3 className="auth-hero-small">Smart Seaweed Hub</h3>
              </div>
            </div>

            <h2 className="auth-hero-title">
              Smart Seaweed Cultivation Assistant
            </h2>
            <p className="auth-hero-subtitle">
              IoT‑driven monitoring and AI guidance to keep your seaweed farms healthy, productive, and export ready.
            </p>

            <ul className="auth-hero-list">
              <li>
                <span className="auth-hero-badge">⚙️</span>
                <span>AI‑powered medicine formulation for disease control.</span>
              </li>
              <li>
                <span className="auth-hero-badge">📡</span>
                <span>Real‑time environmental monitoring for each raft.</span>
              </li>
              <li>
                <span className="auth-hero-badge">📦</span>
                <span>End‑to‑end packaging and batch tracking.</span>
              </li>
              <li>
                <span className="auth-hero-badge">🌍</span>
                <span>Export‑ready documentation for buyers and audits.</span>
              </li>
            </ul>
          </div>

          <p className="auth-hero-footer">
            Designed for Sri Lankan seaweed farmers, optimized for Indian Ocean conditions.
          </p>
        </div>

        {/* RIGHT PANEL – LOGIN FORM */}
        <div className="auth-container">
          <div className="auth-card">
            <Link to="/" className="back-to-home">
              <span>←</span> Back to home
            </Link>

            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">
              Sign in to monitor your farms, batches, and export records.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  required
                  placeholder="farmer@example.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </button>

              <p className="auth-footer">
                New to the platform? <Link to="/register">Create an account</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;