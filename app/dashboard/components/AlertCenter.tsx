"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Bell,
  X,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

/** Severity for display/filter: maps from level (critical → Critical, warning → High, success → Low) */
export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "active" | "resolved" | "acknowledged";

export type AlertForCenter = {
  id: string;
  text: string;
  desc: string;
  time: string;
  createdAt: number;
  level: "critical" | "warning" | "success";
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Location/zone — optional for backward compat; derived or empty if not provided */
  location?: string;
  /** Status for filter/table — optional; default "active" when not provided */
  status?: AlertStatus;
};

function levelToSeverity(level: AlertForCenter["level"]): AlertSeverity {
  switch (level) {
    case "critical":
      return "Critical";
    case "warning":
      return "High";
    case "success":
      return "Low";
    default:
      return "Low";
  }
}

function formatRelativeTime(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 10) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} mins ago`;
  const hr = Math.floor(min / 60);
  return `${hr} hour${hr !== 1 ? "s" : ""} ago`;
}

const SEVERITY_OPTIONS: { value: AlertSeverity; label: string }[] = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const STATUS_OPTIONS: { value: AlertStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "acknowledged", label: "Acknowledged" },
];

const PAGE_SIZE = 10;

export type AlertCenterProps = {
  /** Full list of alerts (e.g. from API or live stream) */
  alerts: AlertForCenter[];
  /** Format relative time; receives createdAt ms. If not provided, uses internal formatter. */
  formatTime?: (ms: number) => string;
  /** Optional: when user acknowledges an alert (for real API later) */
  onAcknowledge?: (id: string) => void;
  /** Called when admin clicks Resolve: send push notification to visitors about predicted congestion in that zone (e.g. next ~10 mins), then UI marks resolved via onStatusChange */
  onResolve?: (id: string) => void;
  /** Update alert status (e.g. acknowledged, resolved) after Resolve sends push */
  onStatusChange?: (id: string, status: AlertStatus) => void;
};

export function AlertCenter({
  alerts,
  formatTime = formatRelativeTime,
  onAcknowledge,
  onResolve,
  onStatusChange,
}: AlertCenterProps) {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity[]>([]);
  const [statusFilter, setStatusFilter] = useState<AlertStatus[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [appliedSeverity, setAppliedSeverity] = useState<AlertSeverity[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<AlertStatus[]>([]);
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<AlertForCenter | null>(null);

  const toggleSeverity = (s: AlertSeverity) => {
    setSeverityFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleStatus = (s: AlertStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const applyFilters = () => {
    setAppliedSeverity(severityFilter);
    setAppliedStatus(statusFilter);
    setAppliedDate(dateFilter);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSeverityFilter([]);
    setStatusFilter([]);
    setDateFilter("");
    setAppliedSeverity([]);
    setAppliedStatus([]);
    setAppliedDate("");
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const severity = levelToSeverity(a.level);
      const status = a.status ?? "active";
      if (appliedSeverity.length > 0 && !appliedSeverity.includes(severity)) return false;
      if (appliedStatus.length > 0 && !appliedStatus.includes(status)) return false;
      if (appliedDate) {
        const alertDate = new Date(a.createdAt).toISOString().slice(0, 10);
        if (alertDate !== appliedDate) return false;
      }
      return true;
    });
  }, [alerts, appliedSeverity, appliedStatus, appliedDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const hasActiveFilters =
    severityFilter.length > 0 || statusFilter.length > 0 || dateFilter !== "";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header — same style as dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/30 backdrop-blur-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/50">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-800">
              Alert Center
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {alerts.length} total alerts
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Filters — glass card like dashboard */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200/50 bg-white/80 p-5 shadow-lg shadow-slate-200/30 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
            <Filter className="h-5 w-5 text-slate-500" aria-hidden />
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-slate-700">
              Filters
            </h2>
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Severity
            </label>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSeverity(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    severityFilter.includes(value)
                      ? value === "Critical"
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : value === "High"
                          ? "border-amber-300 bg-amber-50 text-amber-600"
                          : value === "Medium"
                            ? "border-yellow-300 bg-yellow-50 text-yellow-600"
                            : "border-slate-300 bg-slate-100 text-slate-600"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleStatus(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    statusFilter.includes(value)
                      ? value === "active"
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : value === "resolved"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                          : "border-slate-300 bg-slate-100 text-slate-600"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Select date"
              />
              <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            </div>
          </div>

          {/* Apply / Clear */}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 rounded-xl border border-emerald-400 bg-emerald-500 py-2.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </motion.aside>

        {/* Right: Alert table — glass card, no internal scroll */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md"
        >
          {/* Table header */}
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_auto_minmax(0,0.9fr)] gap-3 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</span>
            <span className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-500">Alert Type</span>
            <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time</span>
            <span className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
          </div>

          {/* Table body — flows with page, no overflow */}
          <div>
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-slate-500">
                  {hasActiveFilters
                    ? "No alerts match the current filters."
                    : "No alerts yet."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200/80">
                <AnimatePresence mode="popLayout" initial={false}>
                  {paginated.map((alert, index) => {
                    const severity = levelToSeverity(alert.level);
                    const status = alert.status ?? "active";
                    const timeStr = formatTime(alert.createdAt);
                    return (
                      <motion.li
                        key={alert.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ delay: index * 0.02 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedAlert(alert)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedAlert(alert);
                          }
                        }}
                        className="grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_auto_minmax(0,0.9fr)] gap-3 px-4 py-3 align-middle transition-colors hover:bg-slate-50/80 sm:gap-4 sm:px-5 sm:py-4"
                      >
                        {/* Severity */}
                        <div className="flex min-w-0 shrink-0 items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              severity === "Critical"
                                ? "bg-rose-500"
                                : severity === "High"
                                  ? "bg-amber-500"
                                  : severity === "Medium"
                                    ? "bg-yellow-500"
                                    : "bg-slate-400"
                            }`}
                            aria-hidden
                          />
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              severity === "Critical"
                                ? "text-rose-600"
                                : severity === "High"
                                  ? "text-amber-600"
                                  : severity === "Medium"
                                    ? "text-yellow-600"
                                    : "text-slate-600"
                            }`}
                          >
                            {severity}
                          </span>
                        </div>

                        {/* Alert Type */}
                        <div className="min-w-0 overflow-hidden">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {alert.text}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {alert.desc}
                          </p>
                        </div>

                        {/* Location */}
                        <p className="min-w-0 truncate text-sm text-slate-600">
                          {alert.location || "—"}
                        </p>

                        {/* Time Stamp */}
                        <p className="shrink-0 text-sm tabular-nums text-slate-500">
                          {timeStr}
                        </p>

                        {/* Status + actions */}
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              status === "active"
                                ? "text-rose-600"
                                : status === "resolved"
                                  ? "text-emerald-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {status === "active"
                              ? "Active"
                              : status === "resolved"
                                ? "Resolved"
                                : "Acknowledged"}
                          </span>
                          {status === "active" && (onAcknowledge || onStatusChange) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange?.(alert.id, "acknowledged");
                                  onAcknowledge?.(alert.id);
                                }}
                                className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                Ack
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange?.(alert.id, "resolved");
                                  onResolve?.(alert.id);
                                }}
                                title="Notify visitors (push) of predicted congestion in this zone, then mark resolved"
                                className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-4 border-t border-slate-200/80 bg-slate-50/80 px-5 py-3">
              <span className="text-xs font-medium text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Alert detail overlay */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedAlert(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-detail-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 id="alert-detail-title" className="text-lg font-semibold text-slate-800">
                    {selectedAlert.text}
                  </h2>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {levelToSeverity(selectedAlert.level)} · {(selectedAlert.status ?? "active") === "active" ? "Active" : selectedAlert.status === "resolved" ? "Resolved" : "Acknowledged"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-200/80 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <p className="text-sm leading-relaxed text-slate-600">
                  {selectedAlert.desc}
                </p>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Location</dt>
                      <dd className="text-sm font-medium text-slate-800">{selectedAlert.location || "—"}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Time</dt>
                      <dd className="text-sm font-medium text-slate-800">{formatTime(selectedAlert.createdAt)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Severity</dt>
                      <dd className="text-sm font-medium text-slate-800">{levelToSeverity(selectedAlert.level)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <Bell className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</dt>
                      <dd>
                        <span
                          className={`text-sm font-semibold ${
                            (selectedAlert.status ?? "active") === "active"
                              ? "text-rose-600"
                              : (selectedAlert.status ?? "active") === "resolved"
                                ? "text-emerald-600"
                                : "text-slate-600"
                          }`}
                        >
                          {(selectedAlert.status ?? "active") === "active"
                            ? "Active"
                            : (selectedAlert.status ?? "active") === "resolved"
                              ? "Resolved"
                              : "Acknowledged"}
                        </span>
                      </dd>
                    </div>
                  </div>
                </dl>
                {(selectedAlert.status ?? "active") === "active" && (onAcknowledge || onStatusChange) && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange?.(selectedAlert.id, "acknowledged");
                        onAcknowledge?.(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange?.(selectedAlert.id, "resolved");
                        onResolve?.(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      title="Notify visitors (push) of predicted congestion in this zone, then mark resolved"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-100"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
