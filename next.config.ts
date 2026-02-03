import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/:path*",
      },
      // Handle the root auth/org paths which might not be under /api prefix in the docs
      {
        source: "/auth/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/auth/:path*",
      },
      // Org/zones/cameras — support both with and without trailing slash so POST body is never lost
      {
        source: "/organizations",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/organizations/",
      },
      {
        source: "/organizations/",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/organizations/",
      },
      {
        source: "/organizations/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/organizations/:path*",
      },
      {
        source: "/zones",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/zones/",
      },
      {
        source: "/zones/",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/zones/",
      },
      {
        source: "/zones/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/zones/:path*",
      },
      {
        source: "/cameras",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/cameras/",
      },
      {
        source: "/cameras/",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/cameras/",
      },
      {
        source: "/cameras/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/cameras/:path*",
      },
      {
        source: "/alerts",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/alerts/",
      },
      {
        source: "/alerts/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/alerts/:path*",
      },
      {
        source: "/notifications",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/notifications/",
      },
      {
        source: "/notifications/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/notifications/:path*",
      },
      {
        source: "/carbon/stats",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/carbon/stats/",
      },
      {
        source: "/carbon/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/carbon/:path*",
      },
      {
        source: "/auth/me",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/auth/me/",
      },
      {
        source: "/sensor/:path*",
        destination: "https://ecoflow-backend-490388308724.us-central1.run.app/sensor/:path*",
      },
    ];
  },
};

export default nextConfig;
