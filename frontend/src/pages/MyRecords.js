// frontend/src/pages/MyRecords.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import './Records.css';

const MyRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/seaweed/my-records');
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load your records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this harvest record permanently?')) return;

    try {
      const response = await axios.delete(`/seaweed/${id}`);
      if (response.data.success) {
        toast.success('Record deleted');
        setRecords(prev => prev.filter(r => r._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete record');
    }
  };

  const downloadLabel = async (id, recordId) => {
    try {
      const response = await axios.get(`/seaweed/${id}/label`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seaweed-label-${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Label downloaded');
    } catch (error) {
      toast.error('Failed to download label');
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
      <div className="records-loading">
        <div className="spinner"></div>
        <span>Loading your seaweed records...</span>
      </div>
    );
  }

  return (
    <div className="records-page">
      {/* Hero Header Section */}
      <header className="records-header">
        <div className="records-header-content">
          <div className="records-header-text">
            <h1>My Harvest Records</h1>
            <p className="subtitle">Track and manage your seaweed batches</p>
          </div>
          <Link to="/add-record" className="btn btn-primary btn-add">
            + New Record
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="records-content">
        {/* Filter Bar */}
        <div className="filter-bar">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              className={`filter-chip ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All Records' : getStatusProps(status).label}
              <span className="count">
                {records.filter(r => status === 'all' || r.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {/* Empty State or Records List */}
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌊</div>
            <h3>No records found</h3>
            <p>
              {filter === 'all' 
                ? 'Start by adding your first seaweed harvest record'
                : `No ${filter} records available`
              }
            </p>
            {filter === 'all' && (
              <Link to="/add-record" className="btn btn-primary">
                Create First Record
              </Link>
            )}
          </div>
        ) : (
          <div className="records-list">
            {filteredRecords.map(record => {
              const status = getStatusProps(record.status);
              return (
                <div key={record._id} className={`record-item status-${record.status}`}>
                  <div className="record-main">
                    <div className="record-id-line">
                      <span className="record-id">{record.recordId}</span>
                      <span className={`status-pill ${status.color}`}>
                        {status.label}
                      </span>
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
                      👁️ View
                    </Link>
                    
                    <button 
                      onClick={() => downloadLabel(record._id, record.recordId)}
                      className="btn btn-outline btn-download"
                    >
                      📄 Label
                    </button>

                    {record.status === 'pending' && (
                      <>
                        <Link to={`/edit-record/${record._id}`} className="btn btn-outline btn-edit">
                          ✏️ Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(record._id)}
                          className="btn btn-outline btn-delete"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>

                  {record.adminNotes && (
                    <div className="admin-note-preview">
                      <strong>Admin Note:</strong> {record.adminNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRecords;