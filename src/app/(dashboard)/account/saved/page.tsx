import { requireUser } from "@/lib/auth";
import { DashboardSideNav } from "@/components/dashboard/side-nav";
import { SavedTripsClient } from "@/components/dashboard/saved-trips-client";

export const metadata = { title: "Saved trips — DEXTGO" };

export default async function SavedTripsPage() {
  await requireUser();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <DashboardSideNav />
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Saved trips</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Bookmark itineraries to plan or buy later.
          </p>
        </header>
        <SavedTripsClient />
      </div>
    </div>
  );
}
