// frontend/src/pages/EditRecord.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import './Forms.css';

const EditRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    seaweedType: '',
    harvestDate: '',
    weight: '',
    processingMethod: '',
    quality: '',
    latitude: '',
    longitude: '',
    locationAddress: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const response = await axios.get(`/seaweed/${id}`);
      if (response.data.success) {
        const record = response.data.data;
        
        setFormData({
          seaweedType: record.seaweedType || 'Gracilaria',
          harvestDate: record.harvestDate 
            ? new Date(record.harvestDate).toISOString().split('T')[0] 
            : '',
          weight: record.weight?.toString() || '',
          processingMethod: record.processingMethod || 'Fresh',
          quality: record.quality || 'Grade A',
          latitude: record.location?.latitude?.toString() || '',
          longitude: record.location?.longitude?.toString() || '',
          locationAddress: record.location?.address || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load record details');
      navigate('/my-records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.harvestDate || !formData.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const recordData = {
        seaweedType: formData.seaweedType,
        harvestDate: formData.harvestDate,
        weight: parseFloat(formData.weight),
        processingMethod: formData.processingMethod,
        quality: formData.quality
      };

      if (formData.latitude && formData.longitude) {
        recordData.location = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.locationAddress
        };
      }

      const response = await axios.put(`/seaweed/${id}`, recordData);

      if (response.data.success) {
        toast.success('Record updated successfully!');
        navigate('/my-records');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update record';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <span>Loading record details...</span>
      </div>
    );
  }

  return (
    <div className="add-record-page">
      <div className="form-header">
        <h1>Edit Harvest Record</h1>
        <p className="form-subtitle">Update your seaweed harvest information</p>
      </div>

      <div className="form-card modern-form">
        <form onSubmit={handleSubmit} className="record-form">
          {/* Harvest Information */}
          <div className="form-section">
            <h3 className="section-title">Harvest Information</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Seaweed Type <span className="required">*</span></label>
                <select
                  name="seaweedType"
                  value={formData.seaweedType}
                  onChange={handleChange}
                  required
                  className="modern-select"
                >
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
                <input
                  type="date"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="modern-input"
                />
              </div>

              <div className="form-group">
                <label>Weight (kg) <span className="required">*</span></label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 45.5"
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Processing & Quality */}
          <div className="form-section">
            <h3 className="section-title">Processing & Quality</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Processing Method <span className="required">*</span></label>
                <select
                  name="processingMethod"
                  value={formData.processingMethod}
                  onChange={handleChange}
                  required
                  className="modern-select"
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Dried">Dried</option>
                  <option value="Semi-dried">Semi-dried</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quality Grade <span className="required">*</span></label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  required
                  className="modern-select"
                >
                  <option value="Premium">Premium</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h3 className="section-title">Harvest Location (Optional)</h3>

            {(formData.latitude || formData.longitude) && (
              <div className="location-preview">
                <div className="location-coords">
                  <span>Lat: {parseFloat(formData.latitude).toFixed(6)}</span>
                  <span>Lng: {parseFloat(formData.longitude).toFixed(6)}</span>
                </div>
                {formData.locationAddress && (
                  <div className="location-address">
                    📍 {formData.locationAddress}
                  </div>
                )}
              </div>
            )}

            <div className="form-grid location-inputs">
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g. 7.2083"
                  className="modern-input"
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
                  placeholder="e.g. 79.8358"
                  className="modern-input"
                />
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

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/my-records')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecord;