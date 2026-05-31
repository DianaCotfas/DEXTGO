import { CountryForm } from "@/components/admin/country-form";

export const metadata = { title: "New country — Admin DEXTGO" };

export default function NewCountryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New country</h1>
      <CountryForm />
    </div>
  );
}
