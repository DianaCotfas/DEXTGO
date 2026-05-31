import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { isConfigured } from "@/lib/env";
import { ConfigNotice } from "@/components/auth/config-notice";

export const metadata = {
  title: "Create account — DEXTGO",
  description: "Create your DEXTGO account to start planning unforgettable trips.",
};

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Save itineraries, unlock private maps, and get tailored recommendations.
      </p>
      <div className="mt-8">
        {isConfigured("supabase") ? (
          <Suspense>
            <SignupForm />
          </Suspense>
        ) : (
          <ConfigNotice
            title="Authentication not configured yet"
            body="Once Diana shares the Supabase keys, signup is wired and ready — no further code changes needed."
          />
        )}
      </div>
    </div>
  );
}
