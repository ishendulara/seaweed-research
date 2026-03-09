// frontend/src/components/common/Loading.js
import React from 'react';
import './Loading.css';

const Loading = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;