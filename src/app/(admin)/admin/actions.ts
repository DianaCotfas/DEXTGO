"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { syncStaticContentToDatabase } from "@/lib/admin/content-sync";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export async function syncStaticContentAction() {
  await requireAdmin();

  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) throw new Error("Supabase not configured");

  await syncStaticContentToDatabase(supabase);

  revalidatePath("/admin");
  revalidatePath("/admin/blog");
  revalidatePath("/admin/itineraries");
  revalidatePath("/admin/orders");
  revalidatePath("/blog");
  revalidatePath("/itineraries");
}

const GrantAdminSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function grantAdminByEmailAction(formData: FormData) {
  await requireAdmin();
  const parsed = GrantAdminSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/admin?error=invalid-admin-email");
  }

  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    redirect("/admin?error=missing-service-role");
  }

  const email = parsed.data.email;
  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    redirect(`/admin?error=profile-lookup-failed&email=${encodeURIComponent(email)}`);
  }
  if (!profile) {
    redirect(`/admin?error=admin-user-not-found&email=${encodeURIComponent(email)}`);
  }
  if (profile.is_admin) {
    redirect(`/admin?notice=admin-already-exists&email=${encodeURIComponent(email)}`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", profile.id);
  if (updateError) {
    redirect(`/admin?error=grant-admin-failed&email=${encodeURIComponent(email)}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?notice=admin-added&email=${encodeURIComponent(email)}`);
}
