import React, { useState, useEffect } from 'react';
import Map from './Map/Map';

interface LocationViewProps {
  address: string;
  className?: string;
}

const LocationView: React.FC<LocationViewProps> = ({ address, className }) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
          const { lat, lng } = data.results[0].geometry.location;
          setCoordinates({ lat, lng });
        } else {
          console.error('Geocoding failed:', data.status);
          setCoordinates(null);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        setCoordinates(null);
      } finally {
        setLoading(false);
      }
    };

    geocodeAddress();
  }, [address]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="text-center text-gray-500 p-4">
        Could not load map location
      </div>
    );
  }

  return (
    <div className={`location-view ${className || ''}`}>
      <Map 
        address={coordinates} 
        className="rounded-lg overflow-hidden"
      />
      <div className="mt-4 text-sm text-gray-600">
        📍 {address}
      </div>
    </div>
  );
};

export default LocationView;