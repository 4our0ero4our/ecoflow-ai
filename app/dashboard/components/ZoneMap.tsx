"use client";

import { useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

type MapTypeId = "roadmap" | "satellite" | "hybrid" | "terrain";

export type ZoneMapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  mapTypeId?: MapTypeId;
  className?: string;
  /** When true, show Map/Satellite toggle and zoom controls (for detail panel) */
  showControls?: boolean;
  onMapTypeChange?: (mapTypeId: MapTypeId) => void;
  onZoomChange?: (zoom: number) => void;
};

const mapContainerStyle = { width: "100%", height: "100%" };
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

export function ZoneMap({
  lat,
  lng,
  zoom = 17,
  mapTypeId = "roadmap",
  className = "",
  showControls = false,
  onMapTypeChange,
  onZoomChange,
}: ZoneMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "ecoflow-google-maps",
    googleMapsApiKey: apiKey,
    libraries: ["visualization"],
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const handleZoomIn = () => {
    onZoomChange?.(Math.min(zoom + 1, 21));
  };

  const handleZoomOut = () => {
    onZoomChange?.(Math.max(zoom - 1, 1));
  };

  if (!apiKey) {
    return (
      <div className={`relative flex flex-col ${className}`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: `
                radial-gradient(ellipse 60% 50% at 50% 50%, rgba(244,63,94,0.4) 0%, transparent 50%),
                radial-gradient(ellipse 80% 70% at 50% 50%, rgba(245,158,11,0.25) 0%, transparent 55%),
                radial-gradient(ellipse 100% 100% at 50% 50%, rgba(16,185,129,0.2) 0%, transparent 60%),
                linear-gradient(180deg, rgba(148,163,184,0.15) 0%, transparent 30%)
              `,
            }}
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(rgba(100,116,139,0.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100,116,139,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "16px 16px",
            }}
          />
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <MapPin
              className="h-12 w-12 drop-shadow-lg"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <p className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for live map
          </p>
        </div>
        {showControls && (
          <div className="mt-2 flex items-center gap-2">
            <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm" disabled>
              Map
            </button>
            <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500" disabled>
              Satellite
            </button>
            <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500" disabled aria-label="Zoom in">
              +
            </button>
            <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500" disabled aria-label="Zoom out">
              −
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 ${className}`}>
        <p className="text-sm text-slate-500">Map failed to load. Check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 ${className}`}>
        <p className="text-sm text-slate-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          mapTypeId={mapTypeId}
        >
          <Marker position={center} />
        </GoogleMap>
      </div>
      {showControls && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onMapTypeChange?.("roadmap");
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm ${
              mapTypeId === "roadmap"
                ? "border-slate-200 bg-white text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => {
              onMapTypeChange?.("satellite");
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm ${
              mapTypeId === "satellite"
                ? "border-slate-200 bg-white text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            Satellite
          </button>
          <div className="ml-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
