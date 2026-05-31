"use server";

import { revalidatePath } from "next/cache";
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
