import { Suspense } from "react";
import AuthConfirmClient from "./confirm-client";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center px-6">
          <p className="text-sm font-medium text-foreground">Signing you in…</p>
        </div>
      }
    >
      <AuthConfirmClient />
    </Suspense>
  );
}
