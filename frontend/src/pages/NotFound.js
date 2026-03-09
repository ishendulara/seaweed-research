import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

const NotFound = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="error-button">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;