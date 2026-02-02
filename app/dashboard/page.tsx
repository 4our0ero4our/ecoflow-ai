"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoneMap } from "./components/ZoneMap";
import { ZoneHeatmapMap } from "./components/ZoneHeatmapMap";
import { AlertCenter } from "./components/AlertCenter";
import { Analytics } from "./components/Analytics";
import { ZoneConfiguration } from "./components/ZoneConfiguration";
import { AdminSettings } from "./components/AdminSettings";
import {
  DEMO_DATA,
  ADMIN_SETTINGS_STORAGE_KEY,
  type SetupFormData,
} from "./components/SetupForm";
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  MapPin,
  Settings,
  X,
  Menu,
  Leaf,
  Bell,
  Search,
  User,
  Map,
  Layers,
  Maximize2,
  Minimize2,
  LogOut,
  Users,
  Activity,
  AlertTriangle,
  Flame,
  Wrench,
  UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Alerts Center", icon: Bell, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Zone Configuration", icon: MapPin, active: false },
  // { label: "Predictions", icon: TrendingUp, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

/** Zone coordinates — Qiddiya City area (approximate venue layout) */
const ZONE_GRID = [
  { id: "1", name: "Main Plaza", density: 92, status: "critical" as const, lat: 24.7592, lng: 46.7388 },
  { id: "2", name: "North Gate", density: 65, status: "low" as const, lat: 24.7608, lng: 46.7386 },
  { id: "3", name: "Food Court", density: 30, status: "low" as const, lat: 24.7588, lng: 46.7392 },
  { id: "4", name: "East Wing", density: 25, status: "low" as const, lat: 24.7590, lng: 46.7400 },
  { id: "5", name: "Concert Hall", density: 78, status: "warning" as const, lat: 24.7578, lng: 46.7382 },
  { id: "6", name: "VIP Lounge", density: 15, status: "low" as const, lat: 24.7582, lng: 46.7378 },
];

/** Mock alert templates — pool for simulating streaming alerts */
const MOCK_ALERT_POOL: Array<{
  text: string;
  desc: string;
  level: "critical" | "warning" | "success";
  icon: typeof Flame;
}> = [
  {
    text: "Fire alarm triggered in Zone C",
    desc: "Emergency protocols activated. Evacuation in progress.",
    level: "critical",
    icon: Flame,
  },
  {
    text: "Grid Maintenance in Zone C",
    desc: "Scheduled optimization complete. Systems nominal.",
    level: "success",
    icon: Wrench,
  },
  {
    text: "Unusual crowd formation in Plaza",
    desc: "Peak density predicted in 15 mins. Consider routing.",
    level: "warning",
    icon: UsersRound,
  },
  {
    text: "Main Plaza: Critical Density",
    desc: "Crowd threshold exceeded. Eco-route suggested.",
    level: "critical",
    icon: Flame,
  },
  {
    text: "HVAC optimization active — North Wing",
    desc: "Energy-saving mode engaged. No action required.",
    level: "success",
    icon: Wrench,
  },
  {
    text: "Peak prediction in 30 mins — East Wing",
    desc: "Vertex AI surge forecast. Prepare routing.",
    level: "warning",
    icon: UsersRound,
  },
  {
    text: "Water usage spike in Food Court",
    desc: "Monitoring. May trigger conservation protocol.",
    level: "warning",
    icon: UsersRound,
  },
  {
    text: "Carbon offset milestone reached",
    desc: "450 kg saved this session. Target on track.",
    level: "success",
    icon: Wrench,
  },
];

export type AlertStatus = "active" | "resolved" | "acknowledged";

type StreamAlert = {
  id: string;
  text: string;
  desc: string;
  time: string;
  createdAt: number;
  level: "critical" | "warning" | "success";
  icon: typeof Flame;
  /** Location/zone for Alert Center table */
  location?: string;
  /** Status for filtering and actions */
  status?: AlertStatus;
};

function formatRelativeTime(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 10) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

const INITIAL_STREAM_ALERTS: StreamAlert[] = [
  {
    id: "a1",
    text: MOCK_ALERT_POOL[0].text,
    desc: MOCK_ALERT_POOL[0].desc,
    time: "2m ago",
    createdAt: Date.now() - 120_000,
    level: "critical",
    icon: Flame,
    location: "Main Plaza",
    status: "active",
  },
  {
    id: "a2",
    text: MOCK_ALERT_POOL[1].text,
    desc: MOCK_ALERT_POOL[1].desc,
    time: "1m ago",
    createdAt: Date.now() - 60_000,
    level: "success",
    icon: Wrench,
    location: "North Gate",
    status: "resolved",
  },
  {
    id: "a3",
    text: MOCK_ALERT_POOL[2].text,
    desc: MOCK_ALERT_POOL[2].desc,
    time: "30s ago",
    createdAt: Date.now() - 30_000,
    level: "warning",
    icon: UsersRound,
    location: "Food Court",
    status: "acknowledged",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardOverviewPage() {
  const heatmapRef = useRef<HTMLElement>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<
    (typeof ZONE_GRID)[number] | null
  >(null);
  const [liveAlerts, setLiveAlerts] = useState<StreamAlert[]>(
    () => INITIAL_STREAM_ALERTS
  );
  const [zoneFilter, setZoneFilter] = useState<"all" | "critical" | "warning" | "low">("all");
  const [alertLevelFilter, setAlertLevelFilter] = useState<
    "all" | "critical" | "warning" | "success"
  >("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap");
  const [hasMounted, setHasMounted] = useState(false);
  const [activeView, setActiveView] = useState<
    "dashboard" | "alerts-center" | "analytics" | "zone-config" | "settings"
  >("dashboard");
  const [adminSettings, setAdminSettings] = useState<SetupFormData>(DEMO_DATA);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    try {
      const raw = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SetupFormData;
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.zones)) {
          setAdminSettings(parsed);
        }
      }
    } catch {
      // keep DEMO_DATA
    }
  }, [hasMounted]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isMobile]);

  const q = searchQuery.trim().toLowerCase();
  const zonesBySearch = q
    ? ZONE_GRID.filter((z) => z.name.toLowerCase().includes(q))
    : ZONE_GRID;
  const filteredZones =
    zoneFilter === "all"
      ? zonesBySearch
      : zonesBySearch.filter((z) => z.status === zoneFilter);
  const alertsBySearch = q
    ? liveAlerts.filter(
        (a) =>
          a.text.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
      )
    : liveAlerts;
  const filteredAlerts =
    alertLevelFilter === "all"
      ? alertsBySearch
      : alertsBySearch.filter((a) => a.level === alertLevelFilter);

  const criticalCount = liveAlerts.filter((a) => a.level === "critical").length;
  const warningCount = liveAlerts.filter((a) => a.level === "warning").length;

  const greeting = hasMounted
    ? (new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening")
    : "—";
  const dateLabel = hasMounted
    ? new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  // Simulate streaming: push a new alert from the pool at random intervals
  useEffect(() => {
    const MAX_ALERTS = 50;
    const MIN_INTERVAL_MS = 4000;
    const MAX_INTERVAL_MS = 12000;

    const scheduleNext = () => {
      const delay =
        MIN_INTERVAL_MS +
        Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      return window.setTimeout(() => {
        const template =
          MOCK_ALERT_POOL[
            Math.floor(Math.random() * MOCK_ALERT_POOL.length)
          ];
        const now = Date.now();
        const zone = ZONE_GRID[Math.floor(Math.random() * ZONE_GRID.length)];
        const newAlert: StreamAlert = {
          id: `alert-${now}-${Math.random().toString(36).slice(2, 9)}`,
          text: template.text,
          desc: template.desc,
          time: "Just now",
          createdAt: now,
          level: template.level,
          icon: template.icon,
          location: zone.name,
          status: "active",
        };
        setLiveAlerts((prev) => {
          const next = [newAlert, ...prev];
          return next.length > MAX_ALERTS ? next.slice(0, MAX_ALERTS) : next;
        });
        timeoutRef.current = scheduleNext();
      }, delay);
    };

    let timeoutRef = { current: scheduleNext() };
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Re-render periodically so relative timestamps ("Just now" → "30s ago") update
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setTimeTick((t) => t + 1),
      30_000
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = heatmapRef.current;
    if (!el) return;
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!heatmapRef.current) return;
    if (!document.fullscreenElement) {
      heatmapRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden">
      {/* Mobile backdrop — closes sidebar when tapped */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Sidebar — glass nav; fixed overlay on mobile, static on md+ */}
      <motion.aside
        initial={false}
        animate={{ x: isMobile && !sidebarOpen ? "-100%" : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-slate-200/50 bg-white/95 shadow-xl backdrop-blur-xl md:relative md:translate-x-0 md:bg-white/75 md:shadow-[2px_0_32px_-8px_rgba(0,0,0,0.08)]`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-5">
          <a
            href="/"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <Leaf className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight">
              <span className="text-emerald-600">EcoFlow</span>{" "}
              <span className="text-slate-800">AI</span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Main">
          <ul className="space-y-0.5 px-3">
            {NAV_ITEMS.map(({ label, icon: Icon }) => {
              const isActive =
                (label === "Dashboard" && activeView === "dashboard") ||
                (label === "Alerts Center" && activeView === "alerts-center") ||
                (label === "Analytics" && activeView === "analytics") ||
                (label === "Zone Configuration" && activeView === "zone-config") ||
                (label === "Settings" && activeView === "settings");
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (label === "Dashboard") setActiveView("dashboard");
                      else if (label === "Alerts Center") setActiveView("alerts-center");
                      else if (label === "Analytics") setActiveView("analytics");
                      else if (label === "Zone Configuration") setActiveView("zone-config");
                      else if (label === "Settings") setActiveView("settings");
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="uppercase tracking-wider">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-200/80 p-3">
          <a
            href="/login"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span className="uppercase tracking-wider">Logout</span>
          </a>
        </div>
      </motion.aside>

      {/* Main content — min-h-0 lets flex child shrink so overflow-y-auto can scroll */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Header — fixed at top while content scrolls */}
        <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-4 border-b border-slate-200/50 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
            <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">
              {greeting}
            </h1>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              {dateLabel}
            </p>
            </div>
          </div>
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Q  Search for zones, alerts..."
              className="w-full rounded-2xl border border-slate-200/80 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              aria-label="Search zones and alerts"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 ring-2 ring-slate-100"
              aria-label="User menu"
            >
              <User className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {activeView === "alerts-center" ? (
          <AlertCenter
            alerts={liveAlerts}
            formatTime={formatRelativeTime}
            onResolve={(id) => {
              const alert = liveAlerts.find((a) => a.id === id);
              if (alert) {
                // Notify visitors' app via push: predicted congestion in this zone (e.g. next ~10 mins).
                // Backend should send push to registered visitor devices for this venue.
                const zone = alert.location ?? "this zone";
                const payload = {
                  alertId: id,
                  title: "Congestion ahead",
                  body: `Predicted congestion in ${zone} in the next ~10 minutes. Consider an alternate route.`,
                  zone,
                };
                try {
                  // TODO: replace with real API, e.g. POST /api/alerts/notify-visitors
                  if (typeof window !== "undefined" && (window as unknown as { __ecoflowNotify?: (p: unknown) => void }).__ecoflowNotify) {
                    (window as unknown as { __ecoflowNotify: (p: unknown) => void }).__ecoflowNotify(payload);
                  } else {
                    console.info("[EcoFlow] Notify visitors (push):", payload);
                  }
                } catch (e) {
                  console.warn("Failed to send visitor notification", e);
                }
              }
            }}
            onStatusChange={(id, status) =>
              setLiveAlerts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status } : a))
              )
            }
          />
        ) : activeView === "analytics" ? (
          <Analytics />
        ) : activeView === "zone-config" ? (
          <ZoneConfiguration
            data={adminSettings}
            onSave={(partial) => {
              const next = { ...adminSettings, ...partial };
              setAdminSettings(next);
              try {
                localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(next));
              } catch {
                // ignore
              }
            }}
          />
        ) : activeView === "settings" ? (
          <AdminSettings
            data={adminSettings}
            onSave={(partial) => {
              const next = { ...adminSettings, ...partial };
              setAdminSettings(next);
              try {
                localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(next));
              } catch {
                // ignore
              }
            }}
          />
        ) : (
        <>
        {/* KPI row — glass cards */}
        <motion.section
          className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4 md:p-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-5 shadow-lg shadow-slate-200/30 backdrop-blur-md transition-all hover:shadow-xl hover:shadow-slate-200/40"
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-slate-100/60 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Total Visitors
                </p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    12,450
                  </span>
                  <span className="text-sm font-semibold text-emerald-500">
                    +12%
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Session total · vs last period
                </p>
              </div>
              <span className="rounded-xl bg-slate-100/80 p-2.5 text-slate-600 backdrop-blur-sm">
                <Users className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-5 shadow-lg shadow-slate-200/30 backdrop-blur-md transition-all hover:shadow-xl hover:shadow-slate-200/40"
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-slate-100/60 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Avg Density
                </p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    0.8
                  </span>
                  <span className="text-sm text-slate-500">p/m²</span>
                  <span className="text-sm font-semibold text-emerald-500">
                    +5%
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Venue-wide average
                </p>
              </div>
              <span className="rounded-xl bg-slate-100/80 p-2.5 text-slate-600 backdrop-blur-sm">
                <Activity className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-white/85 p-5 shadow-lg shadow-emerald-500/10 backdrop-blur-md transition-all hover:shadow-xl hover:shadow-emerald-500/15"
          >
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-emerald-100/50" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  Carbon Emission
                </p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    450
                  </span>
                  <span className="text-sm text-slate-600">kg</span>
                  <span className="text-sm font-semibold text-rose-500">
                    -8%
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Reduced vs baseline · on track
                </p>
              </div>
              <span className="rounded-xl bg-emerald-100/80 p-2.5 text-emerald-600 backdrop-blur-sm">
                <Leaf className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-rose-200/60 bg-white/85 p-5 shadow-lg shadow-rose-500/10 backdrop-blur-md transition-all hover:shadow-xl hover:shadow-rose-500/15"
          >
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-rose-100/50" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-600">
                  Active Alerts
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {liveAlerts.length}
                  </span>
                  <span className="text-sm font-semibold text-rose-600">
                    {criticalCount} Critical
                  </span>
                  <span className="relative flex h-2.5 w-2.5" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Live stream · require attention
                </p>
              </div>
              <span className="rounded-xl bg-rose-100/80 p-2.5 text-rose-600 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
            </div>
          </motion.div>
        </motion.section>

        {/* Center + Right: Heatmap grid + Live Alerts — stack on mobile so both are visible */}
        <div className="flex flex-1 min-h-0 flex-col gap-6 p-4 pt-0 md:flex-row md:p-6">
          {/* Real-time Zone Heatmap — glass card + filter chips */}
          <section
            ref={heatmapRef}
            className="flex min-h-[340px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md md:min-h-0"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200/50 px-4 py-4 md:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-shrink-0 items-center gap-2 md:gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 backdrop-blur-sm ring-1 ring-slate-200/50">
                    <Map className="h-5 w-5" aria-hidden />
                  </span>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-800 md:text-base">
                    Real-time Zone Heatmap
                  </h2>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                    Live
                  </span>
                </div>
                <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLayersOpen((open) => !open)}
                  className={`rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 ${layersOpen ? "bg-slate-100 text-slate-700" : ""}`}
                  aria-label="Layer options"
                  aria-expanded={layersOpen}
                >
                  <Layers className="h-5 w-5" aria-hidden />
                </button>
                {layersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setLayersOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Map layers
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                        Density
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                        Alerts
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" className="rounded border-slate-300" />
                        Routes
                      </label>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" aria-hidden />
                  ) : (
                    <Maximize2 className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { value: "all" as const, label: "All" },
                    { value: "critical" as const, label: "Critical" },
                    { value: "warning" as const, label: "Warning" },
                    { value: "low" as const, label: "Normal" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setZoneFilter(value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      zoneFilter === value
                        ? "bg-slate-800 text-white shadow-md"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex flex-1 min-h-[260px] flex-col gap-4 overflow-auto p-4 md:min-h-0 md:p-5">
              {/* Density heatmap: red = crowded, green = not crowded (model prediction) */}
              <ZoneHeatmapMap
                zones={ZONE_GRID}
                selectedZoneId={selectedZone?.id}
              />
              <AnimatePresence mode="wait">
                {filteredZones.length === 0 ? (
                  <motion.div
                    key="zones-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-slate-600">
                      {searchQuery.trim()
                        ? `No zones match "${searchQuery}"`
                        : "No zones"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try a different search term
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`zones-grid-${q}`}
                    className="relative grid grid-cols-2 gap-4 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                {filteredZones.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  return (
                    <motion.button
                      key={zone.id}
                      type="button"
                      variants={itemVariants}
                      onClick={() => setSelectedZone(zone)}
                      className={`group relative w-full overflow-hidden rounded-xl border bg-white/90 text-left shadow-md shadow-slate-200/30 backdrop-blur-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                        isSelected
                          ? "ring-2 ring-emerald-500 ring-offset-2 border-emerald-400"
                          : "border-slate-200/60 hover:border-slate-300/80"
                      }`}
                      style={{
                        borderTopWidth: "3px",
                        borderTopColor:
                          zone.status === "critical"
                            ? "rgb(244 63 94)"
                            : zone.status === "warning"
                              ? "rgb(245 158 11)"
                              : "rgb(16 185 129)",
                      }}
                    >
                      <div className="p-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {zone.name}
                        </p>
                        <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                          {zone.density}%
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Density
                        </p>
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
                        style={{
                          backgroundColor:
                            zone.status === "critical"
                              ? "rgb(244 63 94)"
                              : zone.status === "warning"
                                ? "rgb(245 158 11)"
                                : "rgb(16 185 129)",
                        }}
                      />
                    </motion.button>
                  );
                })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Live Alerts — glass panel + summary; min-height on mobile so list is visible */}
          <aside className="flex min-h-[320px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-md md:min-h-0 md:max-w-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200/50 px-4 py-4 md:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 backdrop-blur-sm ring-1 ring-slate-200/50">
                  <Bell className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-base font-semibold tracking-tight text-slate-800">
                  Live Alerts
                </h2>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {criticalCount} Critical · {warningCount} Warning · {liveAlerts.length - criticalCount - warningCount} Info
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(
                  [
                    { value: "all" as const, label: "All" },
                    { value: "critical" as const, label: "Critical" },
                    { value: "warning" as const, label: "Warning" },
                    { value: "success" as const, label: "Info" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAlertLevelFilter(value)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      alertLevelFilter === value
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-h-[240px] flex-1 flex-col overflow-y-auto p-4 md:min-h-0">
              <motion.ul
                layout
                className="flex flex-col gap-3"
                aria-label="Real-time alerts"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {filteredAlerts.length === 0 ? (
                    <motion.li
                      key="alerts-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-500"
                    >
                      {searchQuery.trim()
                        ? `No alerts match "${searchQuery}"`
                        : alertLevelFilter !== "all"
                          ? `No ${alertLevelFilter === "success" ? "info" : alertLevelFilter} alerts`
                          : "No alerts"}
                    </motion.li>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const Icon = alert.icon;
                      const timeDisplay = hasMounted ? formatRelativeTime(alert.createdAt) : "—";
                      return (
                        <motion.li
                          key={alert.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                          }}
                          className={`rounded-xl border-l-4 bg-slate-50/80 p-4 transition-colors hover:bg-slate-50 ${
                            alert.level === "critical"
                              ? "border-l-rose-500 bg-rose-50/50"
                              : alert.level === "warning"
                                ? "border-l-amber-500 bg-amber-50/50"
                                : "border-l-emerald-500 bg-emerald-50/30"
                          }`}
                        >
                          <div className="flex gap-3">
                            <span
                              className={`shrink-0 rounded-lg p-2 ${
                                alert.level === "critical"
                                  ? "bg-rose-100 text-rose-600"
                                  : alert.level === "warning"
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-emerald-100 text-emerald-600"
                              }`}
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {alert.text}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 leading-snug">
                                {alert.desc}
                              </p>
                              <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                {timeDisplay}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })
                  )}
                </AnimatePresence>
              </motion.ul>
            </div>
          </aside>
        </div>
        </>
        )}
      </main>

      {/* Location detail panel — shown when a zone is clicked */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedZone(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-detail-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id="location-detail-title" className="text-lg font-semibold text-slate-800">
                {selectedZone.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex gap-4 p-5">
              <div className="flex flex-1 flex-col gap-3">
                <ZoneMap
                  lat={selectedZone.lat}
                  lng={selectedZone.lng}
                  zoom={mapZoom}
                  mapTypeId={mapTypeId}
                  showControls
                  onMapTypeChange={setMapTypeId}
                  onZoomChange={setMapZoom}
                />
              </div>
              <div className="flex w-48 shrink-0 flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Zone details
                </p>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {selectedZone.density}%
                  </p>
                  <p className="text-xs text-slate-500">Density</p>
                </div>
                <p className="text-xs">
                  Status:{" "}
                  <span
                    className="font-medium"
                    style={{
                      color:
                        selectedZone.status === "critical"
                          ? "rgb(244 63 94)"
                          : selectedZone.status === "warning"
                            ? "rgb(245 158 11)"
                            : "rgb(16 185 129)",
                    }}
                  >
                    {selectedZone.status === "critical"
                      ? "Critical"
                      : selectedZone.status === "warning"
                        ? "Warning"
                        : "Normal"}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
