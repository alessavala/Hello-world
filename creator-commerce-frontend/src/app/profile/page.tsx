"use client";

import { AppShell } from "@/components/app-shell";
import { CreatorProfileForm } from "@/components/creator-profile-form";
import { BrandProfileForm } from "@/components/brand-profile-form";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted">
          {user?.role === "BRAND"
            ? "Esta información es la que ven los creadores cuando reciben una invitación."
            : "Esta información es la que ven las marcas cuando descubren tu perfil."}
        </p>
      </div>

      {user?.role === "BRAND" ? <BrandProfileForm /> : <CreatorProfileForm />}
    </div>
  );
}
