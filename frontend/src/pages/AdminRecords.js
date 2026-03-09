// frontend/src/pages/AdminRecords.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import './AdminRecords.css';

const AdminRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState({ show: false, record: null });
  const [reviewData, setReviewData] = useState({ status: 'approved', adminNotes: '' });

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      const res = await axios.get('/seaweed/admin/all');
      if (res.data.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load farmer records');
    } finally {
      setLoading(false);
    }
  };

  const openReview = (record) => {
    setReviewModal({ show: true, record });
    setReviewData({ status: 'approved', adminNotes: '' });
  };

  const closeReview = () => {
    setReviewModal({ show: false, record: null });
    setReviewData({ status: 'approved', adminNotes: '' });
  };

  const submitReview = async () => {
    try {
      const res = await axios.put(
        `/seaweed/admin/${reviewModal.record._id}/review`,
        reviewData
      );

      if (res.data.success) {
        toast.success(`Record ${reviewData.status === 'approved' ? 'approved' : 'rejected'}`);
        setRecords(prev => 
          prev.map(r => r._id === reviewModal.record._id ? res.data.data : r)
        );
        closeReview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review submission failed');
    }
  };

  const getStatusProps = (status) => {
    const map = {
      pending:  { label: 'Pending',  color: 'warning' },
      approved: { label: 'Approved', color: 'success' },
      rejected: { label: 'Rejected', color: 'danger' }
    };
    return map[status] || { label: status, color: 'default' };
  };

  const filteredRecords = records.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <span>Loading all farmer records...</span>
      </div>
    );
  }

  return (
    <div className="admin-records-page">
      <header className="admin-header">
  <div className="header-title-section">
    <h1>Manage Farmer Records</h1>
    <p className="subtitle">Review and process all seaweed harvest submissions</p>
  </div>

  <div className="stats-dashboard">
    <div className="stat-card total">
      <div className="stat-icon">📊</div>
      <div className="stat-content">
        <span className="stat-value">{records.length}</span>
        <span className="stat-label">Total Records</span>
      </div>
    </div>

    <div className="stat-card pending">
      <div className="stat-icon">⏳</div>
      <div className="stat-content">
        <span className="stat-value">
          {records.filter(r => r.status === 'pending').length}
        </span>
        <span className="stat-label">Pending Review</span>
      </div>
    </div>

    <div className="stat-card approved">
      <div className="stat-icon">✅</div>
      <div className="stat-content">
        <span className="stat-value">
          {records.filter(r => r.status === 'approved').length}
        </span>
        <span className="stat-label">Approved</span>
      </div>
    </div>

    {/* Optional: You can add Rejected as 4th card if you want */}
    {/* 
    <div className="stat-card rejected">
      <div className="stat-icon">❌</div>
      <div className="stat-content">
        <span className="stat-value">
          {records.filter(r => r.status === 'rejected').length}
        </span>
        <span className="stat-label">Rejected</span>
      </div>
    </div>
    */}
  </div>
</header>

      <div className="filter-bar">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            className={`filter-chip ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All Records' : getStatusProps(status).label}
            <span className="count-badge">
              {records.filter(r => status === 'all' || r.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No records found</h3>
          <p>No submissions match your current filter</p>
        </div>
      ) : (
        <div className="admin-records-list">
          {filteredRecords.map(record => {
            const status = getStatusProps(record.status);
            return (
              <div key={record._id} className={`record-item status-${record.status}`}>
                <div className="record-main-info">
                  <div className="record-top-row">
                    <div className="record-id-section">
                      <span className="record-id">{record.recordId}</span>
                      <span className={`status-pill ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="farmer-line">
                    <span className="farmer-label">Farmer:</span>
                    <span className="farmer-name">{record.farmer?.name || '—'}</span>
                    {record.farmer?.phone && (
                      <span className="farmer-phone">({record.farmer.phone})</span>
                    )}
                  </div>

                  <div className="record-info-grid">
                    <div className="info-block">
                      <span className="label">Type</span>
                      <span className="value">{record.seaweedType}</span>
                    </div>
                    <div className="info-block">
                      <span className="label">Weight</span>
                      <span className="value">{record.weight} kg</span>
                    </div>
                    <div className="info-block">
                      <span className="label">Quality</span>
                      <span className="value">{record.quality}</span>
                    </div>
                    <div className="info-block">
                      <span className="label">Harvested</span>
                      <span className="value">
                        {new Date(record.harvestDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="record-actions">
                  <Link to={`/record/${record._id}`} className="btn btn-outline btn-view">
                    View Details
                  </Link>

                  {record.status === 'pending' && (
                    <button 
                      onClick={() => openReview(record)}
                      className="btn btn-primary btn-review"
                    >
                      Review Now
                    </button>
                  )}

                  {record.status === 'approved' && (
                    <Link
                      to={`/admin/checklist/${record._id}`}
                      className="btn btn-outline btn-checklist"
                    >
                      Packing Checklist
                    </Link>
                  )}
                </div>

                {record.adminNotes && (
                  <div className="admin-note-preview">
                    <strong>Admin note:</strong> {record.adminNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal - Modern version */}
      {reviewModal.show && (
        <div className="modal-backdrop" onClick={closeReview}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Harvest Record</h2>
              <button className="modal-close-btn" onClick={closeReview}>✕</button>
            </div>

            <div className="modal-content-body">
              <div className="quick-info-strip">
                <div>
                  <span className="label-small">Record ID</span>
                  <div className="value-bold">{reviewModal.record?.recordId}</div>
                </div>
                <div>
                  <span className="label-small">Farmer</span>
                  <div className="value-bold">{reviewModal.record?.farmer?.name}</div>
                </div>
                <div>
                  <span className="label-small">Weight</span>
                  <div className="value-bold">{reviewModal.record?.weight} kg</div>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Decision</label>
                <select
                  value={reviewData.status}
                  onChange={e => setReviewData({...reviewData, status: e.target.value})}
                  className="modern-select"
                >
                  <option value="approved">Approve ✓</option>
                  <option value="rejected">Reject ✗</option>
                </select>
              </div>

              <div className="form-section">
                <label className="form-label">Admin Notes (optional)</label>
                <textarea
                  value={reviewData.adminNotes}
                  onChange={e => setReviewData({...reviewData, adminNotes: e.target.value})}
                  placeholder="Quality feedback, issues found, recommendations..."
                  rows={4}
                  className="modern-textarea"
                />
              </div>

              {reviewModal.record?.location?.latitude && (
                <div className="location-preview-box">
                  <div className="location-header">
                    <span>📍 Farm Location</span>
                  </div>
                  <div className="location-info">
                    <div>{reviewModal.record.location.address || 'No address provided'}</div>
                    <div className="coords">
                      Lat: {Number(reviewModal.record.location.latitude).toFixed(6)} • 
                      Lng: {Number(reviewModal.record.location.longitude).toFixed(6)}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${reviewModal.record.location.latitude},${reviewModal.record.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-map-link"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline btn-cancel" onClick={closeReview}>
                Cancel
              </button>
              <button className="btn btn-primary btn-submit-review" onClick={submitReview}>
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecords;