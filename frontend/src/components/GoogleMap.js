import React from 'react';
import './GoogleMap.css';

const GoogleMap = ({ latitude, longitude, address }) => {
  if (!latitude || !longitude) {
    return (
      <div className="map-error">
        <p>📍 Location information not available</p>
      </div>
    );
  }

  return (
    <div className="google-map-container">
      <div className="map-header">
        <h3>📍 Farmer Location</h3>
        {address && <p className="map-address">{address}</p>}
        <p className="map-coordinates">
          Latitude: {Number(latitude).toFixed(6)}, Longitude:{' '}
          {Number(longitude).toFixed(6)}
        </p>
      </div>

      <div className="map-wrapper">
        <iframe
          title="Farmer Location Map"
          width="100%"
          height="400"
          frameBorder="0"
          style={{ border: 0, borderRadius: '8px' }}
          src={`https://www.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`}
          allowFullScreen
        />
      </div>

      <div className="map-actions">
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-maps"
        >
          🌐 Open in Google Maps
        </a>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-directions"
        >
          🧭 Get Directions
        </a>
      </div>
    </div>
  );
};

export default GoogleMap;
