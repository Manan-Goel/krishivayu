'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FirmsHotspot, DistrictSummary } from '@/types';
import { DELHI_COORDS } from '@/lib/geo';

interface MainMapProps {
  hotspots: FirmsHotspot[];
  districts: DistrictSummary[];
  selectedDistrict: DistrictSummary | null;
  onSelectDistrict: (district: DistrictSummary) => void;
}

export function MainMap({
  hotspots,
  districts,
  selectedDistrict,
  onSelectDistrict,
}: MainMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [76.0, 29.9], // Centered between Punjab, Haryana, and Delhi
      zoom: 7.2,
      minZoom: 5.5,
      maxZoom: 15,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      // 1. Add Delhi Marker / Circle Source
      map.addSource('delhi-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [DELHI_COORDS.lon, DELHI_COORDS.lat],
              },
              properties: {
                title: 'Delhi NCR (India Gate)',
              },
            },
          ],
        },
      });

      // Delhi outer ring
      map.addLayer({
        id: 'delhi-glow',
        type: 'circle',
        source: 'delhi-point',
        paint: {
          'circle-radius': 22,
          'circle-color': '#06b6d4',
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#22d3ee',
        },
      });

      // Delhi central dot
      map.addLayer({
        id: 'delhi-core',
        type: 'circle',
        source: 'delhi-point',
        paint: {
          'circle-radius': 7,
          'circle-color': '#0891b2',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // 2. Add Hotspots GeoJSON Source
      map.addSource('hotspots-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Hotspots outer thermal glow
      map.addLayer({
        id: 'hotspots-glow',
        type: 'circle',
        source: 'hotspots-data',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'frp'],
            5, 8,
            25, 14,
            50, 22,
          ],
          'circle-color': '#ef4444',
          'circle-opacity': 0.35,
          'circle-blur': 0.8,
        },
      });

      // Hotspots inner core
      map.addLayer({
        id: 'hotspots-point',
        type: 'circle',
        source: 'hotspots-data',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'frp'],
            5, 3.5,
            25, 6,
            50, 9,
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'frp'],
            5, '#fbbf24',
            20, '#f97316',
            40, '#dc2626',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // 3. Add District Centroids GeoJSON Source
      map.addSource('districts-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // District risk halo
      map.addLayer({
        id: 'districts-halo',
        type: 'circle',
        source: 'districts-data',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'riskScore'],
            0, 16,
            50, 24,
            100, 34,
          ],
          'circle-color': [
            'case',
            ['>=', ['get', 'riskScore'], 76], '#ef4444',
            ['>=', ['get', 'riskScore'], 51], '#f97316',
            ['>=', ['get', 'riskScore'], 26], '#eab308',
            '#22c55e',
          ],
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            ['>=', ['get', 'riskScore'], 76], '#dc2626',
            ['>=', ['get', 'riskScore'], 51], '#ea580c',
            ['>=', ['get', 'riskScore'], 26], '#ca8a04',
            '#16a34a',
          ],
        },
      });

      // District center dot
      map.addLayer({
        id: 'districts-core',
        type: 'circle',
        source: 'districts-data',
        paint: {
          'circle-radius': 9,
          'circle-color': [
            'case',
            ['>=', ['get', 'riskScore'], 76], '#b91c1c',
            ['>=', ['get', 'riskScore'], 51], '#c2410c',
            ['>=', ['get', 'riskScore'], 26], '#a16207',
            '#15803d',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // District label
      map.addLayer({
        id: 'districts-labels',
        type: 'symbol',
        source: 'districts-data',
        layout: {
          'text-field': ['concat', ['get', 'name'], '\n', ['to-string', ['get', 'riskScore']], '/100'],
          'text-size': 11,
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#020714',
          'text-halo-width': 2,
        },
      });

      // Click district to select
      map.on('click', 'districts-core', (e) => {
        if (!e.features || !e.features[0]) return;
        const key = e.features[0].properties?.districtKey;
        const target = districts.find((d) => d.districtKey === key);
        if (target) onSelectDistrict(target);
      });

      map.on('mouseenter', 'districts-core', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'districts-core', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click hotspot to show popup or select district
      map.on('click', 'hotspots-point', (e) => {
        if (!e.features || !e.features[0]) return;
        const geom = e.features[0].geometry as { type: string; coordinates: [number, number] };
        const props = e.features[0].properties;

        if (popupRef.current) popupRef.current.remove();

        const popup = new maplibregl.Popup({ offset: 12 })
          .setLngLat(geom.coordinates)
          .setHTML(`
            <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4;">
              <div style="font-weight: 700; color: #dc2626;">🔥 Active Fire Hotspot</div>
              <div><b>FRP:</b> ${props?.frp ?? 'N/A'} MW</div>
              <div><b>Brightness:</b> ${props?.brightness ?? 'N/A'} K</div>
              <div><b>Confidence:</b> ${props?.confidence ?? 'N/A'}</div>
              <div><b>District:</b> ${props?.district ?? 'Unknown'} (${props?.state ?? ''})</div>
              <div><b>Detected:</b> ${props?.acq_date ?? ''} ${props?.acq_time ?? ''} UTC</div>
            </div>
          `)
          .addTo(map);

        popupRef.current = popup;
      });

      map.on('mouseenter', 'hotspots-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'hotspots-point', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [districts, onSelectDistrict]);

  // Update GeoJSON layers when hotspots or districts change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Update Hotspots Source
    const hotspotsSource = map.getSource('hotspots-data') as maplibregl.GeoJSONSource | undefined;
    if (hotspotsSource) {
      hotspotsSource.setData({
        type: 'FeatureCollection',
        features: hotspots.map((h) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [h.longitude, h.latitude],
          },
          properties: {
            id: h.id,
            frp: h.frp,
            brightness: h.brightness,
            confidence: h.confidence,
            satellite: h.satellite,
            district: h.district,
            state: h.state,
            acq_date: h.acq_date,
            acq_time: h.acq_time,
          },
        })),
      });
    }

    // Update Districts Source
    const districtsSource = map.getSource('districts-data') as maplibregl.GeoJSONSource | undefined;
    if (districtsSource) {
      districtsSource.setData({
        type: 'FeatureCollection',
        features: districts.map((d) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [d.lon, d.lat],
          },
          properties: {
            districtKey: d.districtKey,
            name: d.name,
            state: d.state,
            riskScore: d.riskScore,
            riskLevel: d.riskLevel,
            fireCount: d.fireCount,
          },
        })),
      });
    }
  }, [hotspots, districts]);

  // Fly to selected district
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDistrict) return;

    map.flyTo({
      center: [selectedDistrict.lon, selectedDistrict.lat],
      zoom: 9.2,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [selectedDistrict]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#020714] overflow-hidden rounded-xl border border-white/10">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#020714]/90 backdrop-blur-md border border-white/10 rounded-lg p-3 text-[11px] shadow-xl pointer-events-none">
        <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
          <span>Map Legend</span>
        </div>
        <div className="flex flex-col gap-1.5 text-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white/80" />
            <span>Active Fire Hotspot (VIIRS 375m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 border border-white/80" />
            <span>Delhi NCR (Target Impact Receptor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-500/30" />
            <span>Critical/High Risk District (Score ≥ 51)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-yellow-500 bg-yellow-500/30" />
            <span>Moderate/Low Risk District</span>
          </div>
        </div>
      </div>
    </div>
  );
}
