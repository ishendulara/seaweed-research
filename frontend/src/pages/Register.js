// frontend\src\pages\Register.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    locationAddress: ''
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    name,
    email,
    password,
    confirmPassword,
    role,
    phone,
    address,
    latitude,
    longitude,
    locationAddress
  } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      }

      return `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    }
  };

  // Get current location automatically
  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const addressFromApi = await getAddressFromCoordinates(lat, lng);

          setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
            locationAddress: addressFromApi
          }));
        } catch (error) {
          console.error('Error getting address:', error);
          setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
        }

        setLocationLoading(false);
        alert('✅ Location detected successfully!');
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Unable to retrieve your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please enable location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const userData = {
      name,
      email,
      password,
      role,
      phone,
      address
    };

    if (latitude && longitude) {
      userData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: locationAddress
      };
    }

    const result = await register(userData);

    setLoading(false);

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        navigate('/dashboard');
      } else if (result.user.role === 'user') {
        navigate('/user-selection');
      } else {
        navigate('/dashboard');
      }
    }

  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* LEFT PANEL – BRANDING */}
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

        {/* RIGHT PANEL – REGISTER FORM */}
        <div className="auth-container">
          <div className="auth-card">
            <Link to="/" className="back-to-home">
              <span>←</span> Back to home
            </Link>
            
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">
              Register as a farmer or admin and start managing your seaweed farms.
            </p>

            <form onSubmit={handleSubmit} className="auth-form register-form">
              {/* Name */}
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Min 6 characters"
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label>Register As *</label>
                <select
                  name="role"
                  value={role}
                  onChange={handleChange}
                  required
                >
                  <option value="farmer">Farmer</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={handleChange}
                  placeholder="e.g., 0771234567"
                />
              </div>

              {/* Address - Full Width */}
              <div className="form-group form-group-full">
                <label>Address</label>
                <textarea
                  name="address"
                  value={address}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter your address"
                />
              </div>

              {/* Location Section - Full Width */}
              {/* <div className="form-group-full">
                <div className="location-section">
                  <div className="location-header">
                    <h4>📍 Location Details (Optional)</h4>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="btn-get-location"
                      disabled={locationLoading}
                    >
                      {locationLoading
                        ? '🔄 Getting Location...'
                        : '📍 Auto Detect Location'}
                    </button>
                  </div>

                  {latitude && longitude && (
                    <div className="location-detected">
                      <p className="location-success">
                        ✅ Location detected successfully!
                      </p>
                      <p className="location-coords">
                        Lat: {parseFloat(latitude).toFixed(6)}, Lng:{' '}
                        {parseFloat(longitude).toFixed(6)}
                      </p>
                      {locationAddress && (
                        <p className="location-address-preview">
                          📍 {locationAddress}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        name="latitude"
                        value={latitude}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g., 7.2083"
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        name="longitude"
                        value={longitude}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g., 79.8358"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location Address</label>
                    <input
                      type="text"
                      name="locationAddress"
                      value={locationAddress}
                      onChange={handleChange}
                      placeholder="Auto-detected or enter manually"
                    />
                  </div>

                  <p className="location-note">
                    💡 Click "Auto Detect Location" to automatically get your
                    current location
                  </p>
                </div>
              </div> */}

              {/* Submit Button - Full Width */}
              <div className="form-actions form-group-full">
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <p className="auth-footer">
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;