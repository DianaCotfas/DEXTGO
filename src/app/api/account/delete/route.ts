import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "auth-required", message: "Sign in to delete your account." },
      { status: 401 },
    );
  }

  const admin = await createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        code: "not-configured",
        message:
          "Account deletion is temporarily unavailable. Please email info@dextgo.com.",
      },
      { status: 503 },
    );
  }

  // Anonymize order history (kept for tax/accounting compliance) but cut the
  // link back to the user's identity.
  await admin
    .from("orders")
    .update({ user_id: null })
    .eq("user_id", user.id);

  // Remove user-owned auxiliary rows.
  await admin.from("saved_trips").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // Guard against provider-side soft-delete quirks by freeing the original email
  // before deletion, then hard-delete the auth user.
  const tombstoneEmail = `deleted-${Date.now()}-${user.id.slice(0, 8)}@deleted.dextgo.local`;
  await admin.auth.admin.updateUserById(user.id, {
    email: tombstoneEmail,
    email_confirm: true,
    user_metadata: { deleted_at: new Date().toISOString() },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id, false);
  if (error) {
    return NextResponse.json(
      { code: "delete-failed", message: error.message },
      { status: 500 },
    );
  }

  // Clear the active session cookie on this device.
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
