"use client";

import { useMemo, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, HeatmapLayerF, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

export type ZoneForHeatmap = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  density: number;
  status: string;
};

const HEATMAP_LOADER_ID = "ecoflow-google-maps";
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

/** Gradient: green (not crowded) → yellow → orange → red (crowded) */
const DENSITY_GRADIENT = [
  "rgba(16, 185, 129, 0)",       // 0 – transparent green
  "rgba(16, 185, 129, 0.6)",    // low density – green
  "rgba(134, 239, 172, 0.75)",   // light green
  "rgba(250, 204, 21, 0.85)",    // yellow – moderate
  "rgba(251, 146, 60, 0.9)",     // orange
  "rgba(244, 63, 94, 1)",        // high density – red (crowded)
];

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

export type ZoneHeatmapMapProps = {
  zones: ZoneForHeatmap[];
  /** Optional: center map on this zone and show a marker */
  selectedZoneId?: string | null;
  onZoneClick?: (zone: ZoneForHeatmap) => void;
  className?: string;
};

/** 
 * Get the center of the zones
 * @param zones - The zones to get the center of
 * @returns The center of the zones
 */
function getCenter(zones: ZoneForHeatmap[]): { lat: number; lng: number } {
  if (zones.length === 0) return { lat: 24.759, lng: 46.7386 };
  const sum = zones.reduce(
    (acc, z) => ({ lat: acc.lat + z.lat, lng: acc.lng + z.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / zones.length,
    lng: sum.lng / zones.length,
  };
}

/**
 * ZoneHeatmapMap component
 * @param zones - The zones to display on the heatmap
 * @param selectedZoneId - The id of the selected zone
 * @param onZoneClick - The function to call when a zone is clicked
 * @param className - The class name to apply to the component
 * @returns The ZoneHeatmapMap component
 */
export function ZoneHeatmapMap({
  zones,
  selectedZoneId = null,
  onZoneClick,
  className = "",
}: ZoneHeatmapMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: HEATMAP_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: ["visualization"],
  });

  /** The center of the zones */
  const center = useMemo(() => getCenter(zones), [zones]);

  /**
   * Heatmap data is built in state so it's only computed after the script has loaded
   * (when google is defined). HeatmapLayerF only uses the initial data, so we must
   * pass correct data on first render.
   */
  const [heatmapData, setHeatmapData] = useState<google.maps.visualization.WeightedLocation[]>([]);
  useEffect(() => {
    if (!isLoaded || typeof google === "undefined" || zones.length === 0) {
      setHeatmapData([]);
      return;
    }
    const maxDensity = Math.max(...zones.map((z) => z.density), 1);
    setHeatmapData(
      zones.map((z) => ({
        location: new google.maps.LatLng(z.lat, z.lng),
        weight: z.density / maxDensity,
      }))
    );
  }, [isLoaded, zones]);

  const heatmapOptions: google.maps.visualization.HeatmapLayerOptions = useMemo(
    () => ({
      gradient: DENSITY_GRADIENT,
      radius: 80,
      opacity: 0.85,
      dissipating: true,
      maxIntensity: 1,
    }),
    []
  );

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId),
    [zones, selectedZoneId]
  );

  if (!apiKey) {
    return (
      <div className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 50% 50% at 30% 30%, rgba(244,63,94,0.35) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 70% 60%, rgba(250,204,21,0.25) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 50% 70%, rgba(16,185,129,0.3) 0%, transparent 50%),
              linear-gradient(180deg, rgba(148,163,184,0.12) 0%, transparent 40%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,116,139,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,116,139,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />
        {selectedZone && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <MapPin className="h-10 w-10 drop-shadow-lg" fill="#ef4444" stroke="#b91c1c" strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <p className="relative z-10 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for density heatmap
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 ${className}`}>
        <p className="text-sm text-slate-500">Map failed to load.</p>
      </div>
    );
  }

  const dataReady = zones.length === 0 || heatmapData.length > 0;
  if (!isLoaded || !dataReady) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 ${className}`}>
        <p className="text-sm text-slate-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={selectedZone ? { lat: selectedZone.lat, lng: selectedZone.lng } : center}
        zoom={16}
        options={mapOptions}
      >
        <HeatmapLayerF data={heatmapData} options={heatmapOptions} />
        {selectedZone && (
          <Marker
            position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
            zIndex={10}
          />
        )}
      </GoogleMap>
      {/* Legend: green = not crowded, red = crowded */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
        <span className="text-[10px] font-medium text-slate-500">Density</span>
        <div className="flex h-2 w-24 rounded-full overflow-hidden border border-slate-200">
          <div className="flex-1 bg-emerald-500" title="Low" />
          <div className="flex-1 bg-yellow-400" title="Moderate" />
          <div className="flex-1 bg-orange-500" title="High" />
          <div className="flex-1 bg-rose-500" title="Crowded" />
        </div>
        <span className="text-[10px] font-medium text-slate-500">Low → Crowded</span>
      </div>
    </div>
  );
}