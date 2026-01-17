import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Marker Icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMessage = ({ lat, lng }) => {
  if (!lat || !lng) return <span>Invalid Location</span>;
  
  const position = [lat, lng];

  return (
    <div className="h-48 w-64 rounded overflow-hidden mt-1">
       <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Shared Location
          </Popup>
        </Marker>
      </MapContainer>
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block bg-gray-700 text-center text-xs py-1 text-blue-300 hover:text-blue-100"
      >
        Open in Google Maps
      </a>
    </div>
  );
};

export default LocationMessage;
