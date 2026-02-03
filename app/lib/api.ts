
// app/lib/api.ts
// We now use relative paths to leverage the Next.js proxy defined in next.config.ts
const API_BASE_URL = "";

export interface User {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    role: string;
    eco_points?: number;
}

interface Tokens {
    access: string;
    refresh: string;
}

interface AuthResponse {
    access: string;
    refresh: string;
    user_id: number;
    email: string;
    role: string;
    name: string;
}

// --- Token Management ---

const TOKEN_KEY = "ecoflow_tokens";

export function setTokens(tokens: Tokens) {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    }
}

export function getTokens(): Tokens | null {
    if (typeof window !== "undefined") {
        const raw = localStorage.getItem(TOKEN_KEY);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function clearTokens() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
    }
}

// --- Fetch Wrapper with Auto-Refresh ---

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const tokens = getTokens();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    } as Record<string, string>;

    if (tokens?.access) {
        headers["Authorization"] = `Bearer ${tokens.access}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 (Unauthorized) - Attempt Refresh (no redirects; app works with or without auth)
    if (response.status === 401 && tokens?.refresh) {
        try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: tokens.refresh }),
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const newAccess = data.access;
                setTokens({ ...tokens, access: newAccess });
                headers["Authorization"] = `Bearer ${newAccess}`;
                response = await fetch(url, { ...options, headers });
            } else {
                clearTokens();
                throw new Error("Session expired");
            }
        } catch (error) {
            clearTokens();
            throw error;
        }
    }

    if (!response.ok) {
        // Attempt to parse error message
        let errorMsg = response.statusText;
        try {
            const errorData = await response.json();
            if (errorData.detail) errorMsg = errorData.detail;
            else if (errorData.message) errorMsg = errorData.message;
            else if (typeof errorData === "object") errorMsg = JSON.stringify(errorData);
        } catch {
            // ignore json parse error
        }
        throw new Error(errorMsg);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// --- Auth Endpoints ---

// --- Auth Endpoints ---

export async function login(email: string, password: string): Promise<User> {
    // This is now handled locally in login/page.tsx, but keeping signature for safety
    return { id: 0, email, role: "USER" };
}

export async function register(userData: any) {
    // Handled locally
    return {};
}

export async function fetchProfile(): Promise<User | null> {
    // Check local session first
    if (typeof window !== "undefined") {
        const session = localStorage.getItem("ecoflow_session");
        if (session) {
            try {
                const u = JSON.parse(session);
                return {
                    id: u.id || 0,
                    email: u.email,
                    first_name: u.first_name,
                    last_name: u.last_name,
                    role: "USER"
                };
            } catch { }
        }
        // Only call /auth/me when we have a token; otherwise avoid redirect/401 loop
        const tokens = getTokens();
        if (!tokens?.access) {
            return null;
        }
    }
    try {
        return await apiFetch<User>("/auth/me");
    } catch {
        return null;
    }
}

export function logout() {
    clearTokens();
    if (typeof window !== "undefined") {
        localStorage.removeItem("ecoflow_session");
        window.location.href = "/login";
    }
}

// --- Data Endpoints ---

export async function fetchOrganizations() {
    return apiFetch<any[]>("/organizations");
}

/** GET single organization (via /proxy Route Handler to avoid rewrite redirect loop) */
export async function fetchOrganization(id: number) {
    return apiFetch<any>(`/proxy/organizations/${id}`);
}

/** POST /organizations/ — body: { name, org_type, total_capacity, latitude, longitude } */
export async function createOrganization(data: {
    name: string;
    org_type: string;
    total_capacity: number;
    latitude: number;
    longitude: number;
}) {
    return apiFetch<any>("/organizations/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** PUT /organizations/<id>/ — update org (partial body: name, org_type, total_capacity, latitude, longitude) */
export async function updateOrganization(
    id: number,
    data: Partial<{ name: string; org_type: string; total_capacity: number; latitude: number; longitude: number }>
) {
    return apiFetch<any>(`/proxy/organizations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/** POST /zones/ — body: { name, zone_type, capacity, latitude, longitude, organization_id } */
export async function createZone(data: {
    name: string;
    zone_type: string;
    capacity: number;
    latitude: number;
    longitude: number;
    organization_id: number;
}) {
    return apiFetch<any>("/zones/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function fetchZones(orgId?: number) {
    const query = orgId ? `?org_id=${orgId}` : "";
    return apiFetch<any[]>(`/zones${query}`);
}

/** POST /cameras/ — body: { name, is_active, zone_id } */
export async function createCamera(data: {
    name: string;
    is_active: boolean;
    zone_id: number;
}) {
    return apiFetch<any>("/cameras/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** GET alerts (via /proxy to avoid rewrite; Auth: token sent by apiFetch) */
export async function fetchAlerts(status?: "OPEN" | "CLOSED") {
    const query = status ? `?status=${status}` : "";
    return apiFetch<any[]>(`/proxy/alerts${query}`);
}

/** GET alerts filtered by organization id (via /proxy). */
export async function fetchOrgAlerts(orgId: number, status?: "OPEN" | "CLOSED") {
    const params = new URLSearchParams();
    params.set("org_id", String(orgId));
    if (status) params.set("status", status);
    const query = `?${params.toString()}`;
    return apiFetch<any[]>(`/proxy/alerts${query}`);
}

/** PUT alert status (resolve/close). Backend can trigger push to mobile when closed. */
export async function resolveAlert(alertId: string | number): Promise<void> {
    await apiFetch(`/proxy/alerts/${alertId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "CLOSED" }),
    });
}

export async function fetchNotifications() {
    return apiFetch<any[]>("/notifications/");
}

/** POST notification (broadcast to all users). */
export async function createNotification(payload: { title: string; message: string }) {
    return apiFetch<any>("/notifications/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/** GET carbon stats (via /proxy Route Handler to avoid rewrite redirect loop) */
export async function fetchCarbonStats() {
    return apiFetch<any>("/proxy/carbon/stats");
}

/**
 * Total visitors for an organization (current count).
 * No such route in current API docs; call this when backend adds e.g. GET /organizations/:id/visitors
 * or GET /visitors?org_id= returning { count } or { total_visitors }.
 */
export async function fetchTotalVisitors(orgId: number): Promise<number | null> {
    try {
        const data = await apiFetch<{ count?: number; total_visitors?: number }>(
            `/organizations/${orgId}/visitors`
        );
        const count = data?.count ?? data?.total_visitors;
        return typeof count === "number" ? count : null;
    } catch {
        return null;
    }
}

// --- Types for your App ---
// You can expand these as needed based on the API docs you provided
