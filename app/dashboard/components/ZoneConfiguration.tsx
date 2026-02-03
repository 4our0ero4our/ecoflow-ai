"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import type { SetupFormData, ZoneFormEntry } from "./SetupForm";

type ZoneConfigurationProps = {
  data: SetupFormData;
  onSave: (data: Pick<SetupFormData, "lat" | "lng" | "totalCapacity" | "zones">) => void;
};

export function ZoneConfiguration({ data, onSave }: ZoneConfigurationProps) {
  const [lat, setLat] = useState(data.lat);
  const [lng, setLng] = useState(data.lng);
  const [totalCapacity, setTotalCapacity] = useState(data.totalCapacity);
  const [zones, setZones] = useState<ZoneFormEntry[]>(data.zones);

  useEffect(() => {
    setLat(data.lat);
    setLng(data.lng);
    setTotalCapacity(data.totalCapacity);
    setZones(data.zones.map((z) => ({ ...z, cameras: z.cameras ?? [] })));
  }, [data.lat, data.lng, data.totalCapacity, data.zones]);

  const updateZone = (id: string, field: keyof ZoneFormEntry, value: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z))
    );
  };

  const addZone = () => {
    setZones((prev) => [
      ...prev,
      {
        id: `z-${Date.now()}`,
        name: "",
        zoneType: "Indoor",
        maxCapacity: "",
        cameras: [],
      },
    ]);
  };

  const removeZone = (id: string) => {
    if (zones.length <= 1) return;
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  const handleSave = () => {
    onSave({ lat, lng, totalCapacity, zones });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/50">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-800">
              Zone Configuration
            </h2>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Venue location, capacity & zones
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
        >
          Save changes
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg shadow-slate-200/30">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Venue location & capacity
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 24.759"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Longitude</label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 46.7386"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Total capacity</label>
            <input
              type="text"
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg shadow-slate-200/30">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Zones
          </h3>
          <button
            type="button"
            onClick={addZone}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus className="h-4 w-4" /> Add zone
          </button>
        </div>
        <div className="space-y-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200/50 bg-slate-50/50 p-4"
            >
              <div className="min-w-0 flex-1 sm:min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                <input
                  type="text"
                  value={zone.name}
                  onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                  placeholder="e.g. Main Plaza"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="w-full sm:w-[120px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                <select
                  value={zone.zoneType}
                  onChange={(e) => updateZone(zone.id, "zoneType", e.target.value as "Indoor" | "Outdoor")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
              <div className="w-full sm:w-[120px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">Max capacity</label>
                <input
                  type="text"
                  value={zone.maxCapacity}
                  onChange={(e) => updateZone(zone.id, "maxCapacity", e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <button
                type="button"
                onClick={() => removeZone(zone.id)}
                disabled={zones.length <= 1}
                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                aria-label="Remove zone"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
