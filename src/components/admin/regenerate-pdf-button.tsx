"use client";

import { useFormStatus } from "react-dom";

export function RegeneratePdfButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-semibold text-indigo-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Regenerating..." : "Regenerate PDF"}
    </button>
  );
}
