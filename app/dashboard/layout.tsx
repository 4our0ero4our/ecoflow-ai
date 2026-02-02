export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="dashboard-theme min-h-screen text-slate-900"
      style={{
        background: "var(--cc-bg)",
        backgroundImage: "var(--cc-bg-soft)",
      }}
    >
      {children}
    </div>
  );
}
