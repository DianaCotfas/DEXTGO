import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { adminEmailAllowlist, isConfigured } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

export interface SessionUser extends User {
  is_admin?: boolean;
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Self-heal account sync for old/custom orders:
  // if a user logs in with password (no callback flow), link prior paid orders by email.
  if (user.id && user.email) {
    try {
      const admin = await createSupabaseAdminClient();
      if (admin) {
        const normalizedUserEmail = normalizeEmail(user.email);
        const { data: unlinkedOrders } = await admin
          .from("orders")
          .select("id, email")
          .is("user_id", null)
          .eq("status", "paid");

        const relinkIds = (unlinkedOrders ?? [])
          .filter((order) => normalizeEmail(order.email) === normalizedUserEmail)
          .map((order) => order.id);

        if (relinkIds.length > 0) {
          await admin
            .from("orders")
            .update({ user_id: user.id })
            .in("id", relinkIds);
        }
      }
    } catch {
      // Non-blocking best effort
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  const allowlistMatch = adminEmailAllowlist().includes(
    (user.email ?? "").toLowerCase(),
  );

  return { ...user, is_admin: !!profile?.is_admin || allowlistMatch };
}

export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  if (!isConfigured("supabase")) redirect("/login?reason=not-configured");
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/login?next=/admin");
  if (!user.is_admin) redirect("/account?notice=admin-only");
  return user;
}
