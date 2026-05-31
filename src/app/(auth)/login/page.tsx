import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { isConfigured } from "@/lib/env";
import { ConfigNotice } from "@/components/auth/config-notice";

export const metadata = {
  title: "Log in — DEXTGO",
  description: "Sign in to access your itineraries and saved trips.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Sign in to access your purchased itineraries and saved trips.
      </p>
      <div className="mt-8">
        {isConfigured("supabase") ? (
          <Suspense>
            <LoginForm />
          </Suspense>
        ) : (
          <ConfigNotice
            title="Authentication not configured yet"
            body="Once Diana shares the Supabase keys, login is wired and ready — no further code changes needed."
          />
        )}
      </div>
    </div>
  );
}
