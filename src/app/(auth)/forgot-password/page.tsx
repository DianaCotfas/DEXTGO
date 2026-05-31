import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isConfigured } from "@/lib/env";
import { ConfigNotice } from "@/components/auth/config-notice";

export const metadata = {
  title: "Reset password — DEXTGO",
  description: "Enter your email to receive a password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Enter the email address associated with your account and we&apos;ll send you a
        password reset link.
      </p>
      <div className="mt-8">
        {isConfigured("supabase") ? (
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        ) : (
          <ConfigNotice
            title="Authentication not configured"
            body="Supabase keys are required to send password reset emails."
          />
        )}
      </div>
    </div>
  );
}
