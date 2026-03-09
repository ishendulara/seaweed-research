// frontend/src/pages/RecordDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import GoogleMap from '../components/GoogleMap';
import './RecordDetails.css';

const RecordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await axios.get(`/seaweed/${id}`);
      if (res.data.success) {
        setRecord(res.data.data);
      }
    } catch (err) {
      toast.error('Unable to load record details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const downloadLabel = async () => {
    try {
      const res = await axios.get(`/seaweed/${id}/label`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `label-${record.recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Label downloaded');
    } catch (err) {
      toast.error('Failed to download label');
    }
  };

  const viewDeliverySummary = async () => {
    try {
      const res = await axios.get(`/seaweed/${id}/delivery-summary`);
      if (res.data.success) {
        const summary = res.data.data;
        alert(`
Delivery Summary
────────────────────
Record ID: ${summary.recordId}

Product:
  • Type: ${summary.productDetails.type}
  • Weight: ${summary.productDetails.weight} kg
  • Quality: ${summary.productDetails.quality}
  • Processing: ${summary.productDetails.processingMethod}
  • Harvest: ${summary.productDetails.harvestDate}

Farmer:
  • Name: ${summary.farmerDetails.name}
  • Phone: ${summary.farmerDetails.phone || '—'}
  • Email: ${summary.farmerDetails.email}

Location: ${summary.locationDetails.address || 'Not specified'}

Status: ${summary.status.toUpperCase()}
Notes: ${summary.adminNotes || 'None'}
        `);
        toast.success('Delivery summary ready');
      }
    } catch (err) {
      toast.error('Could not generate summary');
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

  if (!record) {
    return <div className="error-message">Record not found</div>;
  }

  const location = record.location || record.farmer?.location;

  return (
    <div className="record-detail-page">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back to Records
        </button>
        <h1>Harvest Record ID: {record.recordId}</h1>
      </header>

      <div className="detail-layout">
        {/* Main Content */}
        <main className="detail-main">
          {/* Status & Quick Info Banner */}
          <div className={`status-banner status-${record.status}`}>
            <div className="status-pill">
              {record.status.toUpperCase()}
            </div>
            <div className="quick-info">
              <span>{record.seaweedType} • {record.weight} kg</span>
              <span>{new Date(record.harvestDate).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Product Card */}
          <section className="detail-card">
            <h2>Product Details</h2>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">Seaweed Type</span>
                <span className="info-value">{record.seaweedType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Weight</span>
                <span className="info-value">{record.weight} kg</span>
              </div>
              <div className="info-row">
                <span className="info-label">Quality</span>
                <span className="info-value">{record.quality}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Processing</span>
                <span className="info-value">{record.processingMethod}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Harvest Date</span>
                <span className="info-value">
                  {new Date(record.harvestDate).toLocaleDateString('en-GB', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">
                  {new Date(record.createdAt).toLocaleString('en-GB', {
                    dateStyle: 'medium', timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Farmer Info */}
          {record.farmer && (
            <section className="detail-card farmer-card">
              <h2>Farmer Information</h2>
              <div className="farmer-info-grid">
                <div>
                  <span className="label">Name</span>
                  <p className="value">{record.farmer.name}</p>
                </div>
                <div>
                  <span className="label">Email</span>
                  <p className="value">{record.farmer.email}</p>
                </div>
                {record.farmer.phone && (
                  <div>
                    <span className="label">Phone</span>
                    <p className="value">{record.farmer.phone}</p>
                  </div>
                )}
                {record.farmer.address && (
                  <div>
                    <span className="label">Address</span>
                    <p className="value">{record.farmer.address}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Location Map */}
          {location?.latitude && location?.longitude && (
            <section className="detail-card map-card">
              <h2>Harvest Location</h2>
              <div className="map-container">
                <GoogleMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  address={location.address}
                />
              </div>
              {location.address && (
                <p className="map-address">📍 {location.address}</p>
              )}
            </section>
          )}

          {/* Admin Notes */}
          {record.adminNotes && (
            <section className="detail-card notes-card">
              <h2>Admin Notes</h2>
              <div className="admin-notes">
                {record.adminNotes}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="detail-card actions-card">
            <div className="action-buttons">
              <button onClick={downloadLabel} className="btn-action primary">
                📄 Download Label
              </button>
              <button onClick={viewDeliverySummary} className="btn-action secondary">
                📊 View Delivery Summary
              </button>

              {user?.role === 'farmer' && record.status === 'pending' && (
                <Link to={`/edit-record/${record._id}`} className="btn-action edit">
                  ✏️ Edit Record
                </Link>
              )}

              {user?.role === 'admin' && record.status === 'approved' && (
                <Link to={`/admin/checklist/${record._id}`} className="btn-action checklist">
                  📋 Packing Checklist
                </Link>
              )}
            </div>
          </section>
        </main>

        {/* Sidebar - QR Code */}
        <aside className="detail-sidebar">
          {record.qrCode && (
            <div className="qr-card">
              <h3>Product QR Code</h3>
              <div className="qr-container">
                <img src={record.qrCode} alt="QR Code" className="qr-image" />
              </div>
              <p className="qr-note">Scan to view traceability details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default RecordDetails;