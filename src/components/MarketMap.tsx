'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Listing } from '@/types/market';
import type { PublicListing } from '@/lib/marketSanitizer';

type MarketMapListing = Listing | PublicListing;

// Coordinates lookup for Punjab districts
const DISTRICT_COORDS: Record<string, [number, number]> = {
  Sangrur: [75.84, 30.24],
  Bathinda: [74.95, 30.21],
  Ludhiana: [75.85, 30.90],
  Barnala: [75.55, 30.38],
  Mansa: [75.39, 29.98],
  Patiala: [76.39, 30.34],
  Firozpur: [74.61, 30.92],
  Faridkot: [74.76, 30.67],
  Moga: [75.17, 30.82],
  'Tarn Taran': [74.92, 31.45],
  Amritsar: [74.87, 31.63],
  Jalandhar: [75.58, 31.33],
  Kapurthala: [75.38, 31.38],
  'Fatehgarh Sahib': [76.40, 30.65],
  Fazilka: [74.03, 30.40],
  Gurdaspur: [75.52, 32.04],
  Hoshiarpur: [75.91, 31.53],
  Muktsar: [74.52, 30.48],
  Rupnagar: [76.53, 30.97],
  'SAS Nagar (Mohali)': [76.72, 30.70],
  'SBS Nagar (Nawanshahr)': [76.12, 31.12],
  Malerkotla: [75.88, 30.52],
};

interface MarketMapProps {
  listings: MarketMapListing[];
  selectedListing: MarketMapListing | null;
  onSelectListing: (listing: MarketMapListing) => void;
}

export function MarketMap({
  listings,
  selectedListing,
  onSelectListing,
}: MarketMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [75.5, 30.6], // Punjab center
      zoom: 7.2,
      minZoom: 6,
      maxZoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers on listings change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((listing) => {
      const coords = DISTRICT_COORDS[listing.district] || [75.5, 30.5];
      // Jitter slightly based on listing id hash to avoid perfect overlap of multiple listings in same district
      const hash = listing.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitterLat = ((hash % 10) - 5) * 0.015;
      const jitterLon = (((hash >> 2) % 10) - 5) * 0.015;
      const pos: [number, number] = [coords[0] + jitterLon, coords[1] + jitterLat];

      const isSelected = selectedListing?.id === listing.id;

      // Custom marker DOM element
      const el = document.createElement('div');
      el.className = `cursor-pointer transition-transform duration-200 ${
        isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
      }`;

      const colorClass =
        listing.status === 'accepted'
          ? 'bg-amber-500 border-amber-300'
          : listing.status === 'collected'
          ? 'bg-slate-500 border-slate-300'
          : 'bg-emerald-500 border-emerald-300';

      el.innerHTML = `
        <div class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-white shadow-lg border-2 ${colorClass}">
          <span>🌾</span>
          <span>${listing.quantityQuintals} Q</span>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectListing(listing);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pos)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [listings, selectedListing, onSelectListing]);

  // Pan to selected listing
  useEffect(() => {
    if (!mapRef.current || !selectedListing) return;
    const coords = DISTRICT_COORDS[selectedListing.district];
    if (coords) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 9.5,
        speed: 1.2,
      });
    }
  }, [selectedListing]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs flex items-center gap-3 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Open Listing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-300">Accepted</span>
        </div>
      </div>
    </div>
  );
}
