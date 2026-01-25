import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Sample locations for demo
const sampleLocations = [
  { lat: 35.6762, lng: 139.6503, name: 'Shibuya Restaurant', meals: 50 },
  { lat: 35.6895, lng: 139.6917, name: 'Tokyo Central Kitchen', meals: 75 },
  { lat: 35.6586, lng: 139.7454, name: 'Minato Bakery', meals: 30 },
  { lat: 35.7090, lng: 139.7320, name: 'Ikebukuro Diner', meals: 45 },
  { lat: 35.6284, lng: 139.7387, name: 'Shinagawa Cafe', meals: 25 },
];

export const LandingMapPreview = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Tokyo
    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([35.6762, 139.6503], 12);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add sample markers
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    sampleLocations.forEach((loc) => {
      L.marker([loc.lat, loc.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b><br/>${loc.meals} meals available`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bento-card overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-100">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold">Live Map Integration</h3>
          <p className="text-xs text-muted-foreground">Find donations near you</p>
        </div>
      </div>
      <div 
        ref={mapRef}
        className="h-48 rounded-xl overflow-hidden relative"
      />
      <p className="text-xs text-muted-foreground text-center mt-3">
        Real-time location-based matching for efficient food rescue
      </p>
    </div>
  );
};
