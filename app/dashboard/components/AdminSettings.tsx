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
import { updateOrganization } from "../../lib/api";
import { useCustomAlert } from "../../components/CustomAlert";

type AdminSettingsProps = {
  data: SetupFormData;
  /** Organization ID to update on backend (e.g. 9). When set, Save calls PUT /organizations/:id/ */
  orgId?: number;
  onSave: (data: Partial<SetupFormData>) => void;
};

export function AdminSettings({ data, orgId, onSave }: AdminSettingsProps) {
  const { showAlert } = useCustomAlert();
  const [organizationName, setOrganizationName] = useState(data.organizationName);
  const [venueType, setVenueType] = useState(data.venueType);
  const [totalCapacity, setTotalCapacity] = useState(data.totalCapacity);
  const [iotSource, setIotSource] = useState(data.iotSource);
  const [refreshRate, setRefreshRate] = useState(data.refreshRate);
  const [hvacControl, setHvacControl] = useState(data.hvacControl);
  const [baselineKwh, setBaselineKwh] = useState(data.baselineKwh);
  const [energySource, setEnergySource] = useState(data.energySource);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrganizationName(data.organizationName);
    setVenueType(data.venueType);
    setTotalCapacity(data.totalCapacity);
    setIotSource(data.iotSource);
    setRefreshRate(data.refreshRate);
    setHvacControl(data.hvacControl);
    setBaselineKwh(data.baselineKwh);
    setEnergySource(data.energySource);
  }, [
    data.organizationName,
    data.venueType,
    data.totalCapacity,
    data.iotSource,
    data.refreshRate,
    data.hvacControl,
    data.baselineKwh,
    data.energySource,
  ]);

  const handleSave = async () => {
    const partial = {
      organizationName,
      venueType,
      totalCapacity,
      iotSource,
      refreshRate,
      hvacControl,
      baselineKwh,
      energySource,
    };
    if (orgId != null) {
      setSaving(true);
      try {
        const capacityNum = totalCapacity ? parseInt(String(totalCapacity), 10) : undefined;
        await updateOrganization(orgId, {
          ...(organizationName && { name: organizationName }),
          ...(venueType && { org_type: venueType }),
          ...(capacityNum != null && !Number.isNaN(capacityNum) && { total_capacity: capacityNum }),
        });
        onSave(partial);
        showAlert("Settings saved successfully.", "success");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save settings.";
        showAlert(message, "error");
      } finally {
        setSaving(false);
      }
    } else {
      onSave(partial);
      showAlert("Settings saved locally.", "success");
    }
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
          disabled={saving}
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500"
        >
          {saving ? "Saving…" : "Save changes"}
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Total capacity</label>
            <input
              type="number"
              min={0}
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
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
