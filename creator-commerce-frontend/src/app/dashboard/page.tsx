"use client";

import { AppShell } from "@/components/app-shell";
import { BrandDashboard } from "@/components/dashboard/brand-dashboard";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "BRAND" ? <BrandDashboard /> : <CreatorDashboard />;
}
