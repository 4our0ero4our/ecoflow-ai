"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import type { SetupFormData } from "./SetupForm";
import {
  VENUE_TYPES,
  IOT_SOURCES,
  REFRESH_RATES,
  HVAC_TYPES,
  ENERGY_SOURCES,
} from "./SetupForm";

type AdminSettingsProps = {
  data: SetupFormData;
  onSave: (data: Omit<SetupFormData, "lat" | "lng" | "totalCapacity" | "zones">) => void;
};

export function AdminSettings({ data, onSave }: AdminSettingsProps) {
  const [organizationName, setOrganizationName] = useState(data.organizationName);
  const [venueType, setVenueType] = useState(data.venueType);
  const [iotSource, setIotSource] = useState(data.iotSource);
  const [refreshRate, setRefreshRate] = useState(data.refreshRate);
  const [hvacControl, setHvacControl] = useState(data.hvacControl);
  const [baselineKwh, setBaselineKwh] = useState(data.baselineKwh);
  const [energySource, setEnergySource] = useState(data.energySource);

  useEffect(() => {
    setOrganizationName(data.organizationName);
    setVenueType(data.venueType);
    setIotSource(data.iotSource);
    setRefreshRate(data.refreshRate);
    setHvacControl(data.hvacControl);
    setBaselineKwh(data.baselineKwh);
    setEnergySource(data.energySource);
  }, [
    data.organizationName,
    data.venueType,
    data.iotSource,
    data.refreshRate,
    data.hvacControl,
    data.baselineKwh,
    data.energySource,
  ]);

  const handleSave = () => {
    onSave({
      organizationName,
      venueType,
      iotSource,
      refreshRate,
      hvacControl,
      baselineKwh,
      energySource,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/50">
            <Settings className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-800">
              Settings
            </h2>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Organization, data sources & sustainability baseline
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
          Organization
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Organization name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Qiddiya Main Hub"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Venue type</label>
            <select
              value={venueType}
              onChange={(e) => setVenueType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">Select type</option>
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg shadow-slate-200/30">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Data & sensors
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">IoT data source</label>
            <select
              value={iotSource}
              onChange={(e) => setIotSource(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">Select source</option>
              {IOT_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Data refresh rate</label>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">Select rate</option>
              {REFRESH_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">HVAC control</label>
            <select
              value={hvacControl}
              onChange={(e) => setHvacControl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">Select type</option>
              {HVAC_TYPES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-lg shadow-slate-200/30">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Sustainability baseline
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Baseline energy (kWh)</label>
            <input
              type="text"
              value={baselineKwh}
              onChange={(e) => setBaselineKwh(e.target.value)}
              placeholder="e.g. 85000"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Energy source</label>
            <select
              value={energySource}
              onChange={(e) => setEnergySource(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">Select source</option>
              {ENERGY_SOURCES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
