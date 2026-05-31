import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { DashboardSideNav } from "@/components/dashboard/side-nav";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { DeleteAccountCard } from "@/components/dashboard/delete-account-card";
import { ChangePasswordCard } from "@/components/dashboard/change-password-card";

export const metadata = { title: "Settings — DEXTGO" };

interface PageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { reset } = await searchParams;
  const resetMode = reset === "1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <DashboardSideNav />
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Manage your profile, contact details and preferences.
          </p>
        </header>
        {resetMode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You arrived here via a password-reset link. Please enter your new password below.
          </div>
        )}
        <div className="rounded-2xl bg-white border border-black/[0.06] p-6 sm:p-8">
          <ProfileForm
            email={user.email ?? ""}
            initialFullName={(user.user_metadata?.full_name as string | undefined) ?? ""}
          />
        </div>
        <Suspense>
          <ChangePasswordCard resetMode={resetMode} />
        </Suspense>
        <DeleteAccountCard email={user.email ?? ""} />
      </div>
    </div>
  );
}
