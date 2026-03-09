import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

const Unauthorized = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2 className="error-title">Access Denied</h2>
        <p className="error-message">
          You don't have permission to access this page.
        </p>
        <Link to="/dashboard" className="error-button">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;