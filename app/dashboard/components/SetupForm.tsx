"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";

export const VENUE_TYPES = ["Stadium", "Hotel", "Airport", "Mall", "Outdoor Park"] as const;
export const IOT_SOURCES = ["CCTV / Computer Vision", "Wi-Fi Counters", "Turnstiles", "Manual Entry"] as const;
export const REFRESH_RATES = ["Real-time / Stream", "Every 5 mins", "Every 15 mins", "Every hour"] as const;
export const HVAC_TYPES = ["Manual", "BMS API", "Smart Thermostat"] as const;
export const ENERGY_SOURCES = ["Grid", "Solar", "Hybrid"] as const;

export type ZoneFormEntry = {
  id: string;
  name: string;
  zoneType: "Indoor" | "Outdoor";
  maxCapacity: string;
};

export type SetupFormData = {
  organizationName: string;
  venueType: string;
  lat: string;
  lng: string;
  totalCapacity: string;
  zones: ZoneFormEntry[];
  iotSource: string;
  refreshRate: string;
  hvacControl: string;
  baselineKwh: string;
  energySource: string;
};

const INITIAL_FORM: SetupFormData = {
  organizationName: "",
  venueType: "",
  lat: "",
  lng: "",
  totalCapacity: "",
  zones: [{ id: "z1", name: "", zoneType: "Indoor", maxCapacity: "" }],
  iotSource: "",
  refreshRate: "",
  hvacControl: "",
  baselineKwh: "",
  energySource: "",
};

export const ADMIN_SETTINGS_STORAGE_KEY = "ecoflow-admin-settings";

/** Qiddiya demo data — matches ZONE_GRID names and coordinates; default for dashboard settings */
export const DEMO_DATA: SetupFormData = {
  organizationName: "Qiddiya Main Hub",
  venueType: "Outdoor Park",
  lat: "24.759",
  lng: "46.7386",
  totalCapacity: "50000",
  zones: [
    { id: "d1", name: "Main Plaza", zoneType: "Outdoor", maxCapacity: "5000" },
    { id: "d2", name: "North Gate", zoneType: "Outdoor", maxCapacity: "2000" },
    { id: "d3", name: "Food Court", zoneType: "Indoor", maxCapacity: "1500" },
    { id: "d4", name: "East Wing", zoneType: "Indoor", maxCapacity: "2200" },
    { id: "d5", name: "Concert Hall", zoneType: "Indoor", maxCapacity: "4000" },
    { id: "d6", name: "VIP Lounge", zoneType: "Indoor", maxCapacity: "200" },
  ],
  iotSource: "CCTV / Computer Vision",
  refreshRate: "Real-time / Stream",
  hvacControl: "BMS API",
  baselineKwh: "85000",
  energySource: "Hybrid",
};

const STEPS = [
  { title: "Organization & Location", icon: Building2 },
  { title: "Zone Mapping", icon: MapPin },
  { title: "Data & Sensors", icon: Sparkles },
  { title: "Sustainability Baseline", icon: Check },
] as const;

export function SetupForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SetupFormData>(INITIAL_FORM);

  const update = (key: keyof SetupFormData, value: string | ZoneFormEntry[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addZone = () => {
    setForm((prev) => ({
      ...prev,
      zones: [
        ...prev.zones,
        {
          id: `z-${Date.now()}`,
          name: "",
          zoneType: "Indoor",
          maxCapacity: "",
        },
      ],
    }));
  };

  const removeZone = (id: string) => {
    if (form.zones.length <= 1) return;
    setForm((prev) => ({ ...prev, zones: prev.zones.filter((z) => z.id !== id) }));
  };

  const updateZone = (id: string, field: keyof ZoneFormEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === id ? { ...z, [field]: value } : z)),
    }));
  };

  const useDemoData = () => {
    setForm(DEMO_DATA);
  };

  const canNext = () => {
    if (step === 0) {
      return form.organizationName.trim() && form.venueType && form.lat && form.lng && form.totalCapacity;
    }
    if (step === 1) {
      return form.zones.every((z) => z.name.trim() && z.maxCapacity);
    }
    if (step === 2) {
      return form.iotSource && form.refreshRate && form.hvacControl;
    }
    return true;
  };

  const handleSubmit = () => {
    try {
      localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(form));
    } catch (e) {
      console.warn("Could not persist admin settings", e);
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header + Demo Data */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/30 backdrop-blur-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/50">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-800">
              Organization Setup
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={useDemoData}
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Use Demo Data (Qiddiya)
        </button>
      </motion.div>

      {/* Step indicators */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              step === i
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <s.icon className="h-4 w-4" aria-hidden />
            {s.title}
          </button>
        ))}
      </div>

      {/* Form card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        className="rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-lg shadow-slate-200/30 backdrop-blur-md"
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h2 className="text-base font-semibold text-slate-800">Organization & location</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization name</label>
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={(e) => update("organizationName", e.target.value)}
                    placeholder="e.g. Qiddiya Main Hub"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Venue type</label>
                  <select
                    value={form.venueType}
                    onChange={(e) => update("venueType", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select type</option>
                    {VENUE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Total venue capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalCapacity}
                    onChange={(e) => update("totalCapacity", e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Latitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.lat}
                    onChange={(e) => update("lat", e.target.value)}
                    placeholder="e.g. 24.759"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Longitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.lng}
                    onChange={(e) => update("lng", e.target.value)}
                    placeholder="e.g. 46.7386"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Zone mapping</h2>
                <button
                  type="button"
                  onClick={addZone}
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add zone
                </button>
              </div>
              <p className="text-sm text-slate-500">
                Define zones for the heatmap. Density = people ÷ area (m²).
              </p>
              <div className="flex flex-col gap-4">
                {form.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Zone
                      </span>
                      {form.zones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeZone(zone.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove zone"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                          placeholder="e.g. Main Plaza"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                        />
                      </div>
                      <div>
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
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Max capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={zone.maxCapacity}
                          onChange={(e) => updateZone(zone.id, "maxCapacity", e.target.value)}
                          placeholder="e.g. 1000"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h2 className="text-base font-semibold text-slate-800">Data & sensors</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">IoT data source</label>
                  <select
                    value={form.iotSource}
                    onChange={(e) => update("iotSource", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select source</option>
                    {IOT_SOURCES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Refresh rate</label>
                  <select
                    value={form.refreshRate}
                    onChange={(e) => update("refreshRate", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select rate</option>
                    {REFRESH_RATES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">HVAC control</label>
                  <select
                    value={form.hvacControl}
                    onChange={(e) => update("hvacControl", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select type</option>
                    {HVAC_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Determines whether the system can auto-adjust AC or only send alerts.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h2 className="text-base font-semibold text-slate-800">Sustainability baseline</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Baseline energy (kWh/month) <span className="text-slate-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.baselineKwh}
                    onChange={(e) => update("baselineKwh", e.target.value)}
                    placeholder="e.g. 85000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Current energy source</label>
                  <select
                    value={form.energySource}
                    onChange={(e) => update("energySource", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select source</option>
                    {ENERGY_SOURCES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Affects carbon footprint calculation for the dashboard.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canNext()}
            className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500"
          >
            <Check className="h-4 w-4" aria-hidden />
            Save setup
          </button>
        )}
      </div>
    </div>
  );
}
