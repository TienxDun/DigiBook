import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    onLocationSelect: (lat: number, lon: number) => void;
    initialLat?: number;
    initialLon?: number;
}

// Component to handle map clicks
const LocationMarker: React.FC<{
    position: [number, number] | null,
    setPosition: (pos: [number, number]) => void,
    onLocationSelect: (lat: number, lon: number) => void
}> = ({ position, setPosition, onLocationSelect }) => {

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

// Component to update map center when props change
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLon }) => {
    // Default to Ho Chi Minh City if no initial coords
    const defaultCenter: [number, number] = [10.762622, 106.660172];
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLon ? [initialLat, initialLon] : null
    );
    const [center, setCenter] = useState<[number, number]>(
        initialLat && initialLon ? [initialLat, initialLon] : defaultCenter
    );

    useEffect(() => {
        if (initialLat && initialLon) {
            const newPos: [number, number] = [initialLat, initialLon];
            setPosition(newPos);
            setCenter(newPos);
        }
    }, [initialLat, initialLon]);

    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden shadow-inner border-2 border-slate-100 z-0 relative">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationSelect={onLocationSelect}
                />
                <MapUpdater center={center} />
            </MapContainer>

            {/* Overlay instruction */}
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 text-xs font-bold text-slate-600 text-center pointer-events-none">
                <i className="fa-solid fa-hand-pointer mr-2 text-indigo-500"></i>
                Chạm vào bản đồ để chọn vị trí chính xác
            </div>
        </div>
    );
};
