import { ItineraryForm } from "@/components/admin/itinerary-form";

export const metadata = { title: "New itinerary — Admin DEXTGO" };

interface NewItineraryPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function NewItineraryPage({ searchParams }: NewItineraryPageProps) {
  const { error, message } = await searchParams;
  const readableMessage = (() => {
    if (!message) return null;
    try {
      return decodeURIComponent(message);
    } catch {
      return message;
    }
  })();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New itinerary</h1>
        <p className="text-sm text-foreground/60">
          Save a draft first, then add steps below the form.
        </p>
      </header>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <p className="font-semibold">Save failed ({error})</p>
          <p className="mt-1">{readableMessage ?? "Please review the fields and try again."}</p>
        </div>
      )}
      <ItineraryForm />
    </div>
  );
}
