// frontend/src/pages/AddRecord.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import './Forms.css';

const AddRecord = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    seaweedType: 'Gracilaria',
    harvestDate: '',
    weight: '',
    processingMethod: 'Fresh',
    quality: 'Grade A',
    latitude: '',
    longitude: '',
    locationAddress: ''
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Get current location
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

        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));

        try {
          const address = await getAddressFromCoordinates(lat, lng);
          setFormData(prev => ({
            ...prev,
            locationAddress: address
          }));
          toast.success('Location detected successfully!');
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          toast.warning('Location detected but could not get address');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        let msg = 'Unable to get location';
        if (error.code === 1) msg = 'Location permission denied';
        if (error.code === 2) msg = 'Location unavailable';
        if (error.code === 3) msg = 'Location request timed out';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      return data.display_name || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.harvestDate || !formData.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        seaweedType: formData.seaweedType,
        harvestDate: formData.harvestDate,
        weight: parseFloat(formData.weight),
        processingMethod: formData.processingMethod,
        quality: formData.quality
      };

      // Add location only if coordinates exist
      if (formData.latitude && formData.longitude) {
        payload.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.locationAddress.trim() || undefined
        };
      }

      const response = await axios.post('/seaweed', payload);

      if (response.data.success) {
        toast.success('Harvest record created successfully!');
        navigate('/my-records');
      } else {
        toast.error(response.data.message || 'Failed to create record');
      }
    } catch (error) {
      console.error('Create record error:', error);
      const msg = error.response?.data?.message 
        || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-record-page">
      <div className="form-header">
        <h1>Add New Harvest Record</h1>
        <p className="form-subtitle">Record your latest seaweed harvest details</p>
      </div>

      <div className="form-card modern-form">
        <form onSubmit={handleSubmit} className="record-form">
          {/* Harvest Information */}
          <div className="form-section">
            <h3 className="section-title">Harvest Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Seaweed Type <span className="required">*</span></label>
                <select name="seaweedType" value={formData.seaweedType} onChange={handleChange} required className="modern-select">
                  <option value="Gracilaria">Gracilaria</option>
                  <option value="Sargassum">Sargassum</option>
                  <option value="Ulva">Ulva</option>
                  <option value="Caulerpa">Caulerpa</option>
                  <option value="Gelidium">Gelidium</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Harvest Date <span className="required">*</span></label>
                <input type="date" name="harvestDate" value={formData.harvestDate} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} className="modern-input" />
              </div>

              <div className="form-group">
                <label>Weight (kg) <span className="required">*</span></label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} required min="0" step="0.01" placeholder="e.g. 45.5" className="modern-input" />
              </div>
            </div>
          </div>

          {/* Processing & Quality */}
          <div className="form-section">
            <h3 className="section-title">Processing & Quality</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Processing Method <span className="required">*</span></label>
                <select name="processingMethod" value={formData.processingMethod} onChange={handleChange} required className="modern-select">
                  <option value="Fresh">Fresh</option>
                  <option value="Dried">Dried</option>
                  <option value="Semi-dried">Semi-dried</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quality Grade <span className="required">*</span></label>
                <select name="quality" value={formData.quality} onChange={handleChange} required className="modern-select">
                  <option value="Premium">Premium</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="section-title">Harvest Location (Optional)</h3>

            <button
              type="button"
              onClick={getCurrentLocation}
              className={`btn-location ${locationLoading ? 'loading' : ''}`}
              disabled={locationLoading}
            >
              {locationLoading ? '🔄 Detecting location...' : '📍 Use Current Location'}
            </button>

            {(formData.latitude || formData.longitude) && (
              <div className="location-preview">
                <div className="location-coords">
                  <span>Lat: {parseFloat(formData.latitude).toFixed(6)}</span>
                  <span>Lng: {parseFloat(formData.longitude).toFixed(6)}</span>
                </div>
                {formData.locationAddress && (
                  <div className="location-address">📍 {formData.locationAddress}</div>
                )}
              </div>
            )}

            <div className="form-grid location-inputs">
              <div className="form-group">
                <label>Latitude</label>
                <input type="number" name="latitude" value={formData.latitude} readOnly className="modern-input" />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input type="number" name="longitude" value={formData.longitude} readOnly className="modern-input" />
              </div>
            </div>

            <div className="form-group">
              <label>Address / Description</label>
              <input
                type="text"
                name="locationAddress"
                value={formData.locationAddress}
                onChange={handleChange}
                placeholder="e.g. Negombo Beach, Sri Lanka"
                className="modern-input"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/my-records')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecord;