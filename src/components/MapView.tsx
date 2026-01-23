import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DonationListing } from '@/hooks/useListings';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  listings: DonationListing[];
  onListingClick?: (listing: DonationListing) => void;
  center?: [number, number];
  zoom?: number;
}

export const MapView = ({ 
  listings, 
  onListingClick, 
  center = [35.6762, 139.6503], // Tokyo default
  zoom = 11 
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    listings.forEach(listing => {
      if (listing.latitude && listing.longitude) {
        const marker = L.marker([listing.latitude, listing.longitude])
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${listing.food_category}</h3>
              <p class="text-xs text-gray-600">${listing.quantity} ${listing.quantity_unit}</p>
              <p class="text-xs text-gray-500">${listing.location}</p>
            </div>
          `);

        if (onListingClick) {
          marker.on('click', () => onListingClick(listing));
        }

        markersRef.current.push(marker);
      }
    });

    // Fit bounds if there are markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [listings, onListingClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-lg overflow-hidden border border-border"
    />
  );
};
