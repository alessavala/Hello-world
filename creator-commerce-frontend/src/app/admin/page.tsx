"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { apiFetch, ApiError } from "@/lib/api";
import { translateApiError } from "@/lib/error-messages";
import { useAuth } from "@/lib/auth-context";
import type {
  AdminBrand,
  AdminCreator,
  AdminDashboard,
  AdminDispute,
  AdminUser,
  Campaign,
  Collaboration,
  Paginated,
  UserStatus,
  VerificationLevel,
} from "@/lib/types";

const TABS = ["dashboard", "users", "creators", "brands", "campaigns", "collaborations", "disputes"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  dashboard: "Panel",
  users: "Usuarios",
  creators: "Creadores",
  brands: "Marcas",
  campaigns: "Campañas",
  collaborations: "Colaboraciones",
  disputes: "Disputas",
};

const VERIFICATION_LEVELS: VerificationLevel[] = ["REGISTERED", "IDENTITY", "VERIFIED_COMMERCE", "PRO"];

export default function AdminPage() {
  return (
    <AppShell>
      <AdminPanel />
    </AppShell>
  );
}

function AdminPanel() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    // Only admins belong on this screen - everyone else gets bounced, which
    // this effect is exactly responsible for doing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && user && user.role !== "ADMIN") router.replace("/creators");
  }, [authLoading, user, router]);

  if (user && user.role !== "ADMIN") return null;
  if (!token) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <p className="text-sm text-muted">Usuarios, verificación, campañas y disputas de toda la plataforma.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab token={token} />}
      {tab === "users" && <UsersTab token={token} />}
      {tab === "creators" && <CreatorsTab token={token} />}
      {tab === "brands" && <BrandsTab token={token} />}
      {tab === "campaigns" && <CampaignsTab token={token} />}
      {tab === "collaborations" && <CollaborationsTab token={token} />}
      {tab === "disputes" && <DisputesTab token={token} />}
    </div>
  );
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>
        Anterior
      </Button>
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
        Siguiente
      </Button>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function DashboardTab({ token }: { token: string }) {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the dashboard counts on mount is what this effect does
    apiFetch<AdminDashboard>("/admin/dashboard", { token })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar el panel."));
  }, [token]);

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  const cards: { label: string; value: number }[] = [
    { label: "Usuarios", value: data.users },
    { label: "Creadores", value: data.creators },
    { label: "Marcas", value: data.brands },
    { label: "Campañas", value: data.campaigns },
    { label: "Colaboraciones activas", value: data.activeCollaborations },
    { label: "Disputas abiertas", value: data.openDisputes },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-3xl border border-border bg-surface p-5 text-center shadow-sm">
          <p className="text-3xl font-semibold">{c.value}</p>
          <p className="mt-1 text-sm text-muted">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Paginated<AdminUser>>("/admin/users", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar los usuarios."));
  }, [token, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    load();
  }, [load]);

  async function toggleStatus(u: AdminUser) {
    const next: UserStatus = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await apiFetch(`/admin/users/${u.id}/status`, { method: "PATCH", token, body: { status: next } }).catch(() => {});
    load();
  }

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Email", "Rol", "Estado", "Acción"]}>
        {result.data.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">{u.role}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.status === "SUSPENDED" ? "bg-rose-100 text-rose-700" : "bg-accent-olive/15 text-accent-olive"}`}>
                {u.status}
              </span>
            </td>
            <td className="px-4 py-3">
              {u.role !== "ADMIN" && (
                <button type="button" onClick={() => toggleStatus(u)} className="text-sm font-semibold text-accent hover:underline">
                  {u.status === "SUSPENDED" ? "Reactivar" : "Suspender"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}

function CreatorsTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<AdminCreator> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Paginated<AdminCreator>>("/admin/creators", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar los creadores."));
  }, [token, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    load();
  }, [load]);

  async function verify(id: string, level: VerificationLevel) {
    await apiFetch(`/admin/creators/${id}/verify`, { method: "PATCH", token, body: { level } }).catch(() => {});
    load();
  }

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Nombre", "Email", "Nivel de verificación", "Score"]}>
        {result.data.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">{c.displayName}</td>
            <td className="px-4 py-3">{c.user.email}</td>
            <td className="px-4 py-3">
              <Select value={c.verificationLevel} onChange={(e) => verify(c.id, e.target.value as VerificationLevel)} className="w-auto">
                {VERIFICATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </Select>
            </td>
            <td className="px-4 py-3">{Math.round(c.reliabilityScore)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}

function BrandsTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<AdminBrand> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Paginated<AdminBrand>>("/admin/brands", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar las marcas."));
  }, [token, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    load();
  }, [load]);

  async function toggleVerify(b: AdminBrand) {
    await apiFetch(`/admin/brands/${b.id}/verify`, { method: "PATCH", token, body: { verified: !b.verificationStatus } }).catch(() => {});
    load();
  }

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Marca", "Email", "Verificada", "Acción"]}>
        {result.data.map((b) => (
          <tr key={b.id}>
            <td className="px-4 py-3">{b.businessName}</td>
            <td className="px-4 py-3">{b.user.email}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.verificationStatus ? "bg-accent-olive/15 text-accent-olive" : "bg-border text-muted"}`}>
                {b.verificationStatus ? "Verificada" : "Sin verificar"}
              </span>
            </td>
            <td className="px-4 py-3">
              <button type="button" onClick={() => toggleVerify(b)} className="text-sm font-semibold text-accent hover:underline">
                {b.verificationStatus ? "Quitar verificación" : "Verificar"}
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}

function CampaignsTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<Campaign> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    apiFetch<Paginated<Campaign>>("/admin/campaigns", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar las campañas."));
  }, [token, page]);

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Campaña", "Marca", "Estado", "Marketplace"]}>
        {result.data.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">{c.name}</td>
            <td className="px-4 py-3">{c.brand?.businessName}</td>
            <td className="px-4 py-3">{c.status}</td>
            <td className="px-4 py-3">{c.marketplace}</td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}

function CollaborationsTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<Collaboration> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    apiFetch<Paginated<Collaboration>>("/admin/collaborations", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar las colaboraciones."));
  }, [token, page]);

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Campaña", "Creador", "Marca", "Estado"]}>
        {result.data.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">{c.campaign?.name}</td>
            <td className="px-4 py-3">{c.creator?.displayName}</td>
            <td className="px-4 py-3">{c.campaign?.brand?.businessName}</td>
            <td className="px-4 py-3">{c.status}</td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}

function DisputesTab({ token }: { token: string }) {
  const [result, setResult] = useState<Paginated<AdminDispute> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetching when the page changes is what this effect does
    apiFetch<Paginated<AdminDispute>>("/admin/disputes", { token, query: { page, pageSize: 15 } })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? translateApiError(err.message) : "No pudimos cargar las disputas."));
  }, [token, page]);

  if (error) return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!result) return <p className="py-8 text-center text-sm text-muted">Cargando…</p>;

  if (result.data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No hay disputas.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Table head={["Motivo", "Descripción", "Estado", "Fecha"]}>
        {result.data.map((d) => (
          <tr key={d.id}>
            <td className="px-4 py-3">{d.reason}</td>
            <td className="max-w-xs truncate px-4 py-3">{d.description}</td>
            <td className="px-4 py-3">{d.status}</td>
            <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString("es-MX")}</td>
          </tr>
        ))}
      </Table>
      <Pager page={result.meta.page} totalPages={result.meta.totalPages} onChange={setPage} />
    </div>
  );
}
