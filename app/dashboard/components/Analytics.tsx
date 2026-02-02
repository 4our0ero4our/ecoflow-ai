"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, X, Route } from "lucide-react";

/** Single point for time-series charts (replace with API data later) */
export type TimeSeriesPoint = {
  hour: number;
  value: number;
};

/** Crowd density trend — one value per hour */
export type DensityTrendData = TimeSeriesPoint[];

/** Energy vs carbon — two series over time */
export type EnergyCarbonPoint = {
  hour: number;
  energy: number;
  carbon: number;
};
export type EnergyCarbonData = EnergyCarbonPoint[];

/** Active route / event row (replace with API data later) */
export type ActiveRoute = {
  id: string;
  timestamp: string;
  type: string;
  zone: string;
  deviation: string;
  deviationVariant: "red" | "amber" | "green";
  status: string;
  statusVariant: "resolved" | "auto-rerouted" | "acknowledged";
};

export type AnalyticsProps = {
  /** Crowd density by hour (0–23). If not provided, mock data is used. */
  densityTrendData?: DensityTrendData;
  /** Energy and carbon by hour. If not provided, mock data is used. */
  energyCarbonData?: EnergyCarbonData;
  /** Active routes / events list. If not provided, mock data is used. */
  activeRoutes?: ActiveRoute[];
};

/** Mock density trend: rough curve 0–100 over 0–22h */
function defaultDensityTrend(): DensityTrendData {
  const points: DensityTrendData = [];
  for (let h = 0; h <= 22; h++) {
    const t = h / 22;
    const value = Math.round(20 + 70 * Math.sin(t * Math.PI) + (h < 8 ? 0 : (h - 8) * 2));
    points.push({ hour: h, value: Math.min(100, Math.max(0, value)) });
  }
  return points;
}

/** Mock energy vs carbon */
function defaultEnergyCarbon(): EnergyCarbonData {
  const data: EnergyCarbonData = [];
  for (let h = 0; h <= 22; h++) {
    const t = h / 22;
    data.push({
      hour: h,
      energy: Math.round(30 + 50 * Math.sin(t * Math.PI) + Math.random() * 15),
      carbon: Math.round(25 + 55 * Math.sin(t * Math.PI * 0.9) + Math.random() * 12),
    });
  }
  return data;
}

/** Build SVG path for area under a line (y from bottom, values 0–100) */
function areaPath(points: TimeSeriesPoint[], width: number, height: number): string {
  if (points.length === 0) return "";
  const minH = Math.min(...points.map((p) => p.hour));
  const maxH = Math.max(...points.map((p) => p.hour));
  const rangeH = maxH - minH || 1;
  const maxV = Math.max(...points.map((p) => p.value), 1);
  const x = (h: number) => ((h - minH) / rangeH) * width;
  const y = (v: number) => height - (v / maxV) * height;
  let d = `M ${x(points[0].hour)} ${height} L ${x(points[0].hour)} ${y(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${x(points[i].hour)} ${y(points[i].value)}`;
  }
  d += ` L ${x(points[points.length - 1].hour)} ${height} Z`;
  return d;
}

/** Build SVG path for a line only */
function linePath(points: { hour: number; value: number }[], width: number, height: number, maxV: number): string {
  if (points.length === 0) return "";
  const minH = Math.min(...points.map((p) => p.hour));
  const maxH = Math.max(...points.map((p) => p.hour));
  const rangeH = maxH - minH || 1;
  const x = (h: number) => ((h - minH) / rangeH) * width;
  const y = (v: number) => height - (v / maxV) * height;
  let d = `M ${x(points[0].hour)} ${y(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${x(points[i].hour)} ${y(points[i].value)}`;
  }
  return d;
}

const CHART_WIDTH = 400;
const CHART_HEIGHT = 180;
const PADDING = { top: 8, right: 8, bottom: 24, left: 32 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

/** Default active routes derived from current app context (zones/alerts) */
function defaultActiveRoutes(): ActiveRoute[] {
  return [
    { id: "r1", timestamp: "Today, 14:30", type: "Power Surge", zone: "East Wing", deviation: "+45% vs avg", deviationVariant: "red", status: "Resolved", statusVariant: "resolved" },
    { id: "r2", timestamp: "Today, 14:30", type: "Power Surge", zone: "Main Plaza", deviation: "+120% vs avg", deviationVariant: "amber", status: "Auto-rerouted", statusVariant: "auto-rerouted" },
    { id: "r3", timestamp: "Today, 11:15", type: "Crowd Bottleneck", zone: "East Wing", deviation: "+45% vs avg", deviationVariant: "red", status: "Resolved", statusVariant: "resolved" },
    { id: "r4", timestamp: "Today, 11:15", type: "Crowd Bottleneck", zone: "Main Plaza", deviation: "+120% vs avg", deviationVariant: "amber", status: "Acknowledged", statusVariant: "acknowledged" },
  ];
}

export function Analytics({
  densityTrendData,
  energyCarbonData,
  activeRoutes = defaultActiveRoutes(),
}: AnalyticsProps) {
  const density = densityTrendData ?? defaultDensityTrend();
  const energyCarbon = energyCarbonData ?? defaultEnergyCarbon();
  const [selectedRoute, setSelectedRoute] = useState<ActiveRoute | null>(null);

  const energyPoints = energyCarbon.map((p) => ({ hour: p.hour, value: p.energy }));
  const carbonPoints = energyCarbon.map((p) => ({ hour: p.hour, value: p.carbon }));
  const maxEC = Math.max(
    ...energyCarbon.flatMap((p) => [p.energy, p.carbon]),
    1
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/30 backdrop-blur-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/50">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-800">
              Analytics
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Crowd density, energy & carbon, active routes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Crowd Density Trends — area chart */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md"
        >
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800">
              Crowd Density Trends
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Density over time (0–22h)
            </p>
          </div>
          <div className="p-4">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full max-w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                <path
                  d={areaPath(density, INNER_WIDTH, INNER_HEIGHT)}
                  fill="url(#densityGradient)"
                  className="opacity-90"
                />
                <path
                  d={linePath(density, INNER_WIDTH, INNER_HEIGHT, 100)}
                  fill="none"
                  stroke="rgb(16 185 129)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              {/* X-axis labels */}
              {[0, 6, 12, 18, 22].map((h) => (
                <text
                  key={h}
                  x={PADDING.left + (h / 22) * INNER_WIDTH}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-medium"
                >
                  {h}:00
                </text>
              ))}
              <defs>
                <linearGradient id="densityGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.section>

        {/* Energy Consumption vs Carbon — two lines */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md"
        >
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800">
              Energy Consumption vs Carbon
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Energy (blue) and Carbon (green) over time
            </p>
          </div>
          <div className="p-4">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="w-full max-w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                <path
                  d={linePath(energyPoints, INNER_WIDTH, INNER_HEIGHT, maxEC)}
                  fill="none"
                  stroke="rgb(59 130 246)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={linePath(carbonPoints, INNER_WIDTH, INNER_HEIGHT, maxEC)}
                  fill="none"
                  stroke="rgb(16 185 129)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              {[0, 6, 12, 18, 22].map((h) => (
                <text
                  key={h}
                  x={PADDING.left + (h / 22) * INNER_WIDTH}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-medium"
                >
                  {h}:00
                </text>
              ))}
            </svg>
            <div className="mt-3 flex justify-center gap-6">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden />
                Energy
              </span>
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                Carbon
              </span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Active Routes table */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 border-b border-slate-200/80 px-5 py-4">
          <Route className="h-5 w-5 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight text-slate-800">
            Active Routes
          </h2>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Time Stamp
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Zone
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Deviation
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {activeRoutes.map((route) => (
                <tr
                  key={route.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRoute(route)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedRoute(route);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-5 py-3 text-sm text-slate-600">{route.timestamp}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-800">{route.type}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{route.zone}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-semibold ${
                        route.deviationVariant === "red"
                          ? "text-rose-600"
                          : route.deviationVariant === "amber"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {route.deviation}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-semibold ${
                        route.statusVariant === "resolved"
                          ? "text-emerald-600"
                          : route.statusVariant === "auto-rerouted"
                            ? "text-amber-600"
                            : "text-blue-600"
                      }`}
                    >
                      {route.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Route detail overlay */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedRoute(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-detail-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <h2 id="route-detail-title" className="text-lg font-semibold text-slate-800">
                  {selectedRoute.type}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedRoute(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Time Stamp</dt>
                  <dd className="font-medium text-slate-800">{selectedRoute.timestamp}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Zone</dt>
                  <dd className="font-medium text-slate-800">{selectedRoute.zone}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Deviation</dt>
                  <dd
                    className={`font-semibold ${
                      selectedRoute.deviationVariant === "red"
                        ? "text-rose-600"
                        : selectedRoute.deviationVariant === "amber"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {selectedRoute.deviation}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-500">Status</dt>
                  <dd
                    className={`font-semibold ${
                      selectedRoute.statusVariant === "resolved"
                        ? "text-emerald-600"
                        : selectedRoute.statusVariant === "auto-rerouted"
                          ? "text-amber-600"
                          : "text-blue-600"
                    }`}
                  >
                    {selectedRoute.status}
                  </dd>
                </div>
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
