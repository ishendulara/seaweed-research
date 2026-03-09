// frontend/src/pages/Profile.js
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    locationAddress: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        latitude: user.location?.latitude?.toString() || '',
        longitude: user.location?.longitude?.toString() || '',
        locationAddress: user.location?.address || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const address = await getAddressFromCoordinates(lat, lng);
          setFormData({
            ...formData,
            latitude: lat.toString(),
            longitude: lng.toString(),
            locationAddress: address
          });
          toast.success('Location detected successfully!');
        } catch (error) {
          setFormData({
            ...formData,
            latitude: lat.toString(),
            longitude: lng.toString()
          });
        }
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Unable to retrieve your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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
      return `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      };

      if (formData.latitude && formData.longitude) {
        updateData.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.locationAddress
        };
      }

      const response = await axios.put('/auth/update-profile', updateData);

      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChange(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        try {
          const response = await axios.delete('/auth/delete-account');
          if (response.data.success) {
            toast.success('Account deleted successfully');
            logout();
          }
        } catch (error) {
          toast.error('Failed to delete account');
        }
      }
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p className="profile-subtitle">Manage your account information and farm details</p>
      </div>

      {/* Profile Banner */}
      <div className="profile-banner">
        <div className="profile-banner-content">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-banner-info">
            <h2>{user?.name}</h2>
            <p className="profile-role-badge">
              <span>👤</span>
              {user?.role}
            </p>
          </div>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              setIsEditing(true);
              setActiveSection('personal');
            }} 
            className="btn-edit-profile"
          >
            <span>✏️</span>
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Section Tabs */}
        <div className="profile-sections">
          <button
            className={`section-tab ${activeSection === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveSection('personal')}
          >
            <span>👤</span>
            Personal Information
          </button>
          <button
            className={`section-tab ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSection('security')}
          >
            <span>🔒</span>
            Security
          </button>
          <button
            className={`section-tab ${activeSection === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveSection('danger')}
          >
            <span>⚠️</span>
            Danger Zone
          </button>
        </div>

        {/* Section Content */}
        <div className="section-content">
          {/* Personal Information Section */}
          <div className={`section-panel ${activeSection === 'personal' ? 'active' : ''}`}>
            {!isEditing ? (
              <div className="info-grid">
                <div className="info-item">
                  <p className="info-label">
                    <span>📧</span>
                    Email
                  </p>
                  <p className="info-value">{user?.email}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">
                    <span>📱</span>
                    Phone
                  </p>
                  <p className="info-value">{user?.phone || 'Not provided'}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">
                    <span>🏠</span>
                    Address
                  </p>
                  <p className="info-value">{user?.address || 'Not provided'}</p>
                </div>

                {user?.location?.latitude && user?.location?.longitude && (
                  <div className="info-item">
                    <p className="info-label">
                      <span>📍</span>
                      Location
                    </p>
                    <p className="info-value">
                      {user.location.address || `${user.location.latitude.toFixed(4)}, ${user.location.longitude.toFixed(4)}`}
                    </p>
                    <a 
                      href={`https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-map-link"
                    >
                      <span>🗺️</span>
                      View on Map
                    </a>
                  </div>
                )}

                <div className="info-item">
                  <p className="info-label">
                    <span>📅</span>
                    Member Since
                  </p>
                  <p className="info-value">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email (cannot be changed)</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 0771234567"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter your address"
                  />
                </div>

                <div className="location-section">
                  <div className="location-header">
                    <h4>
                      <span>📍</span>
                      Location
                    </h4>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="btn-get-location"
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <span>🔄</span>
                          Getting...
                        </>
                      ) : (
                        <>
                          <span>📍</span>
                          Auto Detect
                        </>
                      )}
                    </button>
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="location-detected">
                      <p className="location-success">
                        <span>✅</span>
                        Location set
                      </p>
                      <p className="location-coords">
                        {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        step="any"
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        step="any"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location Address</label>
                    <input
                      type="text"
                      name="locationAddress"
                      value={formData.locationAddress}
                      onChange={handleChange}
                      placeholder="Auto-detected or enter manually"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security Section */}
          <div className={`section-panel ${activeSection === 'security' ? 'active' : ''}`}>
            <div className="security-content">
              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="btn-change-password"
                >
                  <span>🔑</span>
                  Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="password-form">
                  <div className="form-group">
                    <label>Current Password *</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="6"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save"
                      disabled={loading}
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className={`section-panel ${activeSection === 'danger' ? 'active' : ''}`}>
            <div className="danger-section">
              <div className="danger-warning">
                <span>⚠️</span>
                Once you delete your account, there is no going back. Please be certain.
              </div>
              <button
                onClick={handleDeleteAccount}
                className="btn-delete-account"
              >
                <span>🗑️</span>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;