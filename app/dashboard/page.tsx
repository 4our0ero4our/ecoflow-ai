"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchProfile, fetchOrganizations, fetchOrganization, fetchZones, fetchAlerts, fetchCarbonStats, resolveAlert, createNotification, type User } from "../lib/api";
import { ZoneMap } from "./components/ZoneMap";
import { ZoneHeatmapMap } from "./components/ZoneHeatmapMap";
import { AlertCenter } from "./components/AlertCenter";
import { Analytics, type ActiveRoute, type DensityTrendData } from "./components/Analytics";
import { ZoneConfiguration } from "./components/ZoneConfiguration";
import { AdminSettings } from "./components/AdminSettings";
import {
  ADMIN_SETTINGS_STORAGE_KEY,
  type SetupFormData,
} from "./components/SetupForm";
import { useCustomAlert } from "../components/CustomAlert";
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
  User as UserIcon,
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

// Removed FALLBACK_ZONES

// Removed MOCK_ALERT_POOL and INITIAL_STREAM_ALERTS

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

/** Parse alert sub_heading for "Detected X/Y" or "X/Y people" → occupancy % (0–100). */
function parseOccupancyFromAlert(subHeading: string | undefined): number | null {
  if (!subHeading) return null;
  const match = subHeading.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  const detected = parseInt(match[1], 10);
  const capacity = parseInt(match[2], 10);
  if (capacity <= 0) return null;
  return Math.min(100, Math.round((detected / capacity) * 100));
}

/** Try to extract zone name from heading (e.g. "Overcrowding in Main Hall" → "Main Hall"). */
function parseZoneNameFromHeading(heading: string | undefined): string | null {
  if (!heading) return null;
  const inMatch = heading.match(/\bin\s+(.+)$/i);
  if (inMatch) return inMatch[1].trim();
  return heading.trim() || null;
}

function densityToStatus(density: number): "low" | "critical" | "warning" {
  if (density >= 90) return "critical";
  if (density >= 70) return "warning";
  return "low";
}

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
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const [user, setUser] = useState<User | null>(null);
  const heatmapRef = useRef<HTMLElement>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [firstOrganization, setFirstOrganization] = useState<{
    id: number;
    name: string;
    org_type: string;
    total_capacity: number;
    latitude: string;
    longitude: string;
    zones: any[];
  } | null>(null);
  const [realZones, setRealZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<StreamAlert[]>([]);
  const [carbonStats, setCarbonStats] = useState<any>(null);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);
  const [zoneFilter, setZoneFilter] = useState<"all" | "critical" | "warning" | "low">("all");
  const [alertLevelFilter, setAlertLevelFilter] = useState<
    "all" | "critical" | "warning" | "success"
  >("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mapZoom, setMapZoom] = useState(17);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap");
  const [hasMounted, setHasMounted] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<
    "dashboard" | "alerts-center" | "analytics" | "zone-config" | "settings"
  >("dashboard");
  const [adminSettings, setAdminSettings] = useState<SetupFormData>({
    organizationName: "",
    venueType: "",
    lat: "",
    lng: "",
    totalCapacity: "",
    zones: [],
    iotSource: "",
    refreshRate: "",
    hvacControl: "",
    baselineKwh: "",
    energySource: ""
  });

  useEffect(() => {
    setHasMounted(true);

    fetchProfile()
      .then((u) => setUser(u ?? null))
      .catch(() => setUser(null));

    let cancelled = false;

    // Load Data — no auth gating; fetch everything; display selected org (or first)
    const loadData = async () => {
      if (cancelled) return;
      const [orgsListResult, alertsResult, carbonResult] = await Promise.allSettled([
        fetchOrganizations(),
        fetchAlerts("OPEN"),
        fetchCarbonStats()
      ]);

      const orgsList = orgsListResult.status === "fulfilled" && Array.isArray(orgsListResult.value)
        ? orgsListResult.value
        : [];
      setOrganizations(orgsList);

      let orgIdToUse: number | null = selectedOrgId;
      if (orgIdToUse == null && orgsList.length > 0) {
        // Default to org with ID 1, or fallback to first org in list
        const orgWithId1 = orgsList.find((o: any) => o.id === 1);
        orgIdToUse = orgWithId1 ? orgWithId1.id : orgsList[0].id;
        setSelectedOrgId(orgIdToUse);
      }

      let firstOrg: any = null;
      if (orgIdToUse != null) {
        try {
          firstOrg = await fetchOrganization(orgIdToUse);
        } catch {
          firstOrg = null;
        }
      }

      // Dashboard displays the selected organization
      let zonesFromOrg: any[] = [];
      if (firstOrg) {
        setFirstOrganization(firstOrg);
        zonesFromOrg = firstOrg.zones || [];
        if (zonesFromOrg.length === 0) {
          try {
            const zonesList = await fetchZones(firstOrg.id);
            zonesFromOrg = Array.isArray(zonesList) ? zonesList : [];
          } catch {
            // keep empty
          }
        }
      } else {
        setFirstOrganization(null);
      }

      const orgLat = firstOrg ? parseFloat(firstOrg.latitude || "0") : 0;
      const orgLng = firstOrg ? parseFloat(firstOrg.longitude || "0") : 0;

      // Map Alerts from GET /alerts/?status=OPEN (id, heading, sub_heading, status, created_at, updated_at)
      const alerts = alertsResult.status === "fulfilled" ? alertsResult.value : null;
      // Derive zone densities from alerts: parse "Detected X/Y" and match heading to zone name
      const densityByZoneName: Record<string, number> = {};
      if (Array.isArray(alerts)) {
        for (const a of alerts) {
          const occupancy = parseOccupancyFromAlert(a.sub_heading);
          if (occupancy == null) continue;
          const zoneName = parseZoneNameFromHeading(a.heading);
          if (zoneName) {
            // Keep latest or average; use latest for simplicity
            densityByZoneName[zoneName] = occupancy;
          }
        }
      }

      const mappedZones = zonesFromOrg.map((z: any, index: number) => {
        const lat = z.latitude != null || z.lat != null
          ? parseFloat(z.latitude || z.lat || "0")
          : orgLat + (index * 0.001);
        const lng = z.longitude != null || z.lng != null
          ? parseFloat(z.longitude || z.lng || "0")
          : orgLng + (index * 0.001);
        const density = densityByZoneName[z.name] ?? 0;
        const status = densityToStatus(density);
        return {
          id: String(z.id),
          name: z.name,
          density,
          status,
          lat,
          lng,
          ...z
        };
      });
      setRealZones(mappedZones);
      // Reset selected zone when org changes
      setSelectedZone(null);
      if (Array.isArray(alerts) && alerts.length > 0) {
        const mappedAlerts = alerts.map((a: any) => {
          const level: "critical" | "warning" | "success" = a.status === "CLOSED" ? "success" : "critical";
          const status: AlertStatus = a.status === "CLOSED" ? "resolved" : "active";
          return {
            id: String(a.id),
            text: a.heading ?? "",
            desc: a.sub_heading ?? "",
            time: a.created_at ? new Date(a.created_at).toLocaleTimeString() : "",
            createdAt: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
            level,
            icon: (a.heading ?? "").toLowerCase().includes("fire") ? Flame : AlertTriangle,
            location: "Zone",
            status
          };
        });
        setLiveAlerts(mappedAlerts);
      } else {
        setLiveAlerts([]);
      }

      // Set Carbon (full response so we can use summary + recent_history for derived metrics)
      const carbon = carbonResult.status === "fulfilled" ? carbonResult.value : null;
      if (carbon) {
        setCarbonStats({ ...carbon.summary, recent_history: carbon.recent_history });
      } else {
        setCarbonStats(null);
      }
    };

    // initial load
    loadData();
    // poll every 10 seconds for live data
    const intervalId = window.setInterval(loadData, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };

  }, [router, selectedOrgId]);

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
      // ignore
    }
  }, [hasMounted]);

  // Sync Settings form with current org when loaded (so total capacity etc. show API values)
  useEffect(() => {
    if (!firstOrganization) return;
    setAdminSettings((prev) => ({
      ...prev,
      organizationName: firstOrganization.name ?? prev.organizationName,
      venueType: firstOrganization.org_type ?? prev.venueType,
      totalCapacity: firstOrganization.total_capacity != null ? String(firstOrganization.total_capacity) : prev.totalCapacity,
    }));
  }, [firstOrganization?.id, firstOrganization?.name, firstOrganization?.org_type, firstOrganization?.total_capacity]);
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
    ? realZones.filter((z) => z.name.toLowerCase().includes(q))
    : realZones;
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

  // Map real alerts to Analytics "Active Routes" (real data)
  const analyticsActiveRoutes: ActiveRoute[] = useMemo(() => {
    return liveAlerts.map((a) => {
      const deviationVariant: "red" | "amber" | "green" =
        a.level === "critical" ? "red" : a.level === "warning" ? "amber" : "green";
      const deviation =
        a.level === "critical" ? "High" : a.level === "warning" ? "Medium" : "Resolved";
      const status = a.status === "resolved" ? "Resolved" : a.status === "acknowledged" ? "Acknowledged" : "Active";
      const statusVariant: "resolved" | "auto-rerouted" | "acknowledged" =
        a.status === "resolved" ? "resolved" : "acknowledged";
      const timestamp = a.time ? `Today, ${a.time}` : (a.createdAt ? new Date(a.createdAt).toLocaleString() : "—");
      return {
        id: a.id,
        timestamp,
        type: a.text || "Alert",
        zone: a.desc || "—",
        deviation,
        deviationVariant,
        status,
        statusVariant,
      };
    });
  }, [liveAlerts]);

  // Derived: average zone density from realZones (from alerts "Detected X/Y")
  const avgDensity = useMemo(() => {
    if (!realZones.length) return null;
    const withDensity = realZones.filter((z) => z.density != null && z.density > 0);
    if (withDensity.length === 0) return null;
    const sum = withDensity.reduce((a, z) => a + z.density, 0);
    return Math.round(sum / withDensity.length);
  }, [realZones]);

  // Derived: projected carbon saved this month from total_saved_all_time (simple linear extrapolation)
  const projectedCarbonThisMonth = useMemo(() => {
    const total = carbonStats?.total_saved_all_time;
    if (total == null || typeof total !== "number") return null;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    if (dayOfMonth <= 0) return null;
    const projected = (total / dayOfMonth) * daysInMonth;
    return Math.round(projected * 10) / 10;
  }, [carbonStats?.total_saved_all_time]);

  // Derived: efficiency from carbon (average_per_detection) or from recent_history if present
  const efficiencyPercent = useMemo(() => {
    const avg = carbonStats?.average_per_detection;
    if (avg != null) return Math.round(Number(avg) * 100);
    const history = carbonStats?.recent_history;
    if (Array.isArray(history) && history.length > 0) {
      const sum = history.reduce((a: number, h: any) => a + (Number(h.saved) ?? 0), 0);
      return Math.round((sum / history.length) * 100);
    }
    return null;
  }, [carbonStats?.average_per_detection, carbonStats?.recent_history]);

  // Derive "activity by hour" from alert timestamps (proxy for when venue is busy)
  const densityTrendFromAlerts: DensityTrendData | undefined = useMemo(() => {
    if (liveAlerts.length === 0) return undefined;
    const countsByHour = new Array(24).fill(0);
    for (const a of liveAlerts) {
      const hour = new Date(a.createdAt).getHours();
      if (hour >= 0 && hour < 24) countsByHour[hour]++;
    }
    const maxCount = Math.max(...countsByHour, 1);
    const baseline = 8; // so chart isn't flat when sparse
    const scale = 100 - baseline;
    return countsByHour.map((count, hour) => ({
      hour,
      value: Math.round(baseline + scale * (count / maxCount)),
    }));
  }, [liveAlerts]);

  const greeting = user?.first_name
    ? `Welcome back, ${user.first_name}`
    : hasMounted
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

  // Removed simulated streaming effect
  useEffect(() => {
    // Optional: Real polling could go here
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
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${isActive
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
                {firstOrganization ? `${firstOrganization.name} · ${dateLabel}` : dateLabel}
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
          <div className="ml-4 flex items-center gap-4">
            {/* Organization switcher */}
            {organizations.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Organization
                </label>
                <select
                  value={selectedOrgId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedOrgId(val ? Number(val) : null);
                  }}
                  className="max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} · {org.org_type}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              <UserIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {activeView === "alerts-center" ? (
          <AlertCenter
            alerts={liveAlerts}
            formatTime={formatRelativeTime}
            onResolve={async (id) => {
              const alert = liveAlerts.find((a) => a.id === id);
              try {
                await resolveAlert(id);
                if (alert) {
                  const zone = alert.location ?? alert.desc ?? "this zone";
                  await createNotification({
                    title: "Congestion ahead",
                    message: `Predicted congestion in ${zone} in the next ~10 minutes. Consider an alternate route.`,
                  });
                }
                showAlert("Alert resolved and notification broadcast request sent.", "success");
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed to resolve alert or send notification.";
                showAlert(msg, "error");
                setLiveAlerts((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, status: "active" as const } : a))
                );
              }
            }}
            onStatusChange={(id, status) =>
              setLiveAlerts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status } : a))
              )
            }
          />
        ) : activeView === "analytics" ? (
          <Analytics
            activeRoutes={analyticsActiveRoutes}
            carbonStats={carbonStats}
            densityTrendData={densityTrendFromAlerts}
          />
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
            orgId={firstOrganization?.id ?? 1}
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
                      Total capacity
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                        {firstOrganization != null && firstOrganization.total_capacity != null
                          ? firstOrganization.total_capacity.toLocaleString()
                          : "—"}
                      </span>
                      <span className="text-sm font-semibold text-emerald-500">
                        {firstOrganization ? "Live" : ""}
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {firstOrganization
                        ? `${firstOrganization.name} · ${firstOrganization.org_type}`
                        : "No org loaded"}
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
                      {avgDensity != null ? "Avg density" : "Avg efficiency"}
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                        {avgDensity != null
                          ? `${avgDensity}%`
                          : efficiencyPercent != null
                            ? `${efficiencyPercent}%`
                            : "—"}
                      </span>
                      <span className="text-sm text-slate-500">
                        {avgDensity != null ? "from alerts" : "carbon"}
                      </span>
                      <span className="text-sm font-semibold text-emerald-500">
                        {(avgDensity != null || efficiencyPercent != null) ? "Derived" : ""}
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {avgDensity != null
                        ? "From alert sub_heading (Detected X/Y)"
                        : "Carbon avg per detection or recent_history"}
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
                      Carbon saved
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                        {carbonStats?.total_saved_all_time != null
                          ? Number(carbonStats.total_saved_all_time).toFixed(1)
                          : "0"}
                      </span>
                      <span className="text-sm text-slate-600">kg</span>
                      <span className="text-sm font-semibold text-emerald-500">
                        {carbonStats ? "Live" : "—"}
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {projectedCarbonThisMonth != null
                        ? `Projected this month: ~${projectedCarbonThisMonth} kg`
                        : "Reduced vs baseline (from stats)"}
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
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${zoneFilter === value
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
                    key={`heatmap-${firstOrganization?.id ?? 'none'}`}
                    zones={realZones}
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
                              className={`group relative w-full overflow-hidden rounded-xl border bg-white/90 text-left shadow-md shadow-slate-200/30 backdrop-blur-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${isSelected
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
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${alertLevelFilter === value
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
                              className={`rounded-xl border-l-4 bg-slate-50/80 p-4 transition-colors hover:bg-slate-50 ${alert.level === "critical"
                                ? "border-l-rose-500 bg-rose-50/50"
                                : alert.level === "warning"
                                  ? "border-l-amber-500 bg-amber-50/50"
                                  : "border-l-emerald-500 bg-emerald-50/30"
                                }`}
                            >
                              <div className="flex gap-3">
                                <span
                                  className={`shrink-0 rounded-lg p-2 ${alert.level === "critical"
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
