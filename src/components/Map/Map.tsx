import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import React from 'react';

interface MapProps {
  address: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  className?: string;
}

const Map: React.FC<MapProps> = ({ address, zoom = 14, className }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };

  // Custom map style - you can modify this
  const mapOptions = {
    styles: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7c93a3' }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ visibility: 'on' }]
      },
      // Add more style options as needed
    ],
    disableDefaultUI: true,
    zoomControl: true,
  };

  return (
    <div className={`map-container ${className || ''}`}>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={zoom}
          center={address}
          options={mapOptions}
        >
          <Marker position={address} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default Map;