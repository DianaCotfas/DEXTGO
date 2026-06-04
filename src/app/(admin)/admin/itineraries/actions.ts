"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database, Json } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendOrderConfirmationEmail,
  sendPrivatePaymentRequestEmail,
} from "@/lib/email";
import { getStripe, siteUrl } from "@/lib/stripe";
import {
  regenerateItineraryPdf,
  regenerateItineraryPdfSilently,
} from "@/lib/itineraries/pdf-cache";

type ItineraryStepInsert = Database["public"]["Tables"]["itinerary_steps"]["Insert"];
type ItineraryStepUpdate = Database["public"]["Tables"]["itinerary_steps"]["Update"];

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional().nullable(),
);

const PointOfInterestSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  hours: z.string().optional().default(""),
  url: z.string().optional().default(""),
  lat: z.union([z.number(), z.null()]).optional(),
  lng: z.union([z.number(), z.null()]).optional(),
});

const TeaserFeatureSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

const PublicTeaserSchema = z.object({
  subtitle: z.string().trim().optional().default(""),
  lockedTitle: z.string().trim().optional().default(""),
  lockedIntro: z.string().trim().optional().default(""),
  leftFeatures: z.array(TeaserFeatureSchema).optional().default([]),
  lockedFeatures: z.array(TeaserFeatureSchema).optional().default([]),
});

const CustomSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(PointOfInterestSchema).optional().default([]),
});

const ExtrasSchema = z
  .object({
    pharmacies: z.array(PointOfInterestSchema).optional().default([]),
    hospitals: z.array(PointOfInterestSchema).optional().default([]),
    emergencyNumbers: z
      .array(
        z.object({
          label: z.string().min(1),
          number: z.string().min(1),
          description: z.string().optional().default(""),
        }),
      )
      .optional()
      .default([]),
    publicTeaser: PublicTeaserSchema.optional(),
    customSections: z.array(CustomSectionSchema).optional().default([]),
  })
  .nullable()
  .optional();

const ItinerarySchema = z.object({
  id: z.string().uuid().optional(),
  // Normalize slug to lowercase + safe characters (admin sometimes enters uppercase / spaces)
  slug: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : v,
    optionalText,
  ),
  title: optionalText,
  excerpt: optionalText,
  description: optionalText,
  sales_preview: optionalText,
  preview_image_urls: z.array(z.string().trim().min(1)).optional().default([]),
  extras: ExtrasSchema,
  hero_image_url: optionalText,
  hero_video_id: optionalText,
  // Normalize country/region slugs to lowercase so admin can enter ITALY, Italy, italy interchangeably
  country_slug: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    optionalText,
  ),
  region_slug: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    optionalText,
  ),
  duration: optionalText,
  price_cents: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).optional(),
  ),
  currency: optionalText,
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["draft", "published", "archived"]).optional(),
  ),
  category: optionalText,
  category_color: optionalText,
});

function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function errorCodeFrom(err: unknown) {
  if (err instanceof z.ZodError) return "validation";
  if (typeof err === "object" && err && "code" in err) {
    const code = String((err as { code?: string }).code ?? "");
    if (code === "23505") return "duplicate";
  }
  const message = err instanceof Error ? err.message : "unknown";
  if (/validation/i.test(message)) return "validation";
  if (/not configured/i.test(message)) return "not-configured";
  return "save-failed";
}

function errorMessageFrom(err: unknown) {
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    if (!first) return "Validation failed";
    const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
    return `${path}${first.message}`;
  }
  if (typeof err === "object" && err && "message" in err) {
    const msg = String((err as { message?: string }).message ?? "").trim();
    if (msg) return msg;
  }
  return "Unexpected error while saving.";
}

function isNextRedirectError(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT")
  );
}

function slugify(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string,
  currentId?: string,
) {
  const fallback = `itinerary-${Date.now().toString(36)}`;
  const safeBase = slugify(baseSlug) || fallback;

  let candidate = safeBase;
  let attempt = 0;
  while (attempt < 12) {
    const { data } = await supabase
      .from("itineraries")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || (currentId && data.id === currentId)) return candidate;
    attempt += 1;
    candidate = `${safeBase}-${attempt + 1}`;
  }
  return `${safeBase}-${Date.now().toString(36)}`;
}

export async function saveItinerary(formData: FormData) {
  const raw = Object.fromEntries(formData);
  try {
    await requireAdmin();
    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (!supabase) throw new Error("Supabase not configured");

    const previewImages = parseJson<string[]>(formData.get("preview_image_urls"), []);
    const extras = parseJson<Json | null>(formData.get("extras"), null);

    const parsed = ItinerarySchema.parse({
      ...raw,
      preview_image_urls: previewImages,
      extras,
    });

    if (parsed.id) {
      const { data: existing, error: existingError } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", parsed.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) throw new Error("Itinerary not found");

      const slug = await ensureUniqueSlug(
        supabase,
        parsed.slug ?? existing.slug,
        parsed.id,
      );
      const payload = {
        slug,
        title: parsed.title ?? existing.title,
        excerpt: parsed.excerpt ?? existing.excerpt,
        description: parsed.description ?? existing.description,
        sales_preview: parsed.sales_preview ?? existing.sales_preview,
        preview_image_urls:
          previewImages.length > 0
            ? previewImages
            : (existing.preview_image_urls ?? []),
        extras: extras ?? existing.extras ?? null,
        hero_image_url: parsed.hero_image_url ?? existing.hero_image_url,
        hero_video_id: parsed.hero_video_id ?? existing.hero_video_id,
        country_slug: parsed.country_slug ?? existing.country_slug,
        region_slug: parsed.region_slug ?? existing.region_slug,
        duration: parsed.duration ?? existing.duration,
        price_cents: parsed.price_cents ?? existing.price_cents ?? 0,
        currency: parsed.currency ?? existing.currency ?? "eur",
        status: parsed.status ?? existing.status ?? "draft",
        category: parsed.category ?? existing.category,
        category_color: parsed.category_color ?? existing.category_color,
      };

      const { error } = await supabase
        .from("itineraries")
        .update(payload)
        .eq("id", parsed.id);
      if (error) throw error;
      await regenerateItineraryPdfSilently(parsed.id, supabase);
      revalidatePath("/admin/itineraries");
      revalidatePath(`/itineraries/${slug}`);
      redirect(`/admin/itineraries/${parsed.id}?status=updated`);
    } else {
      const slug = await ensureUniqueSlug(
        supabase,
        parsed.slug ?? parsed.title ?? "",
      );
      const payload = {
        slug,
        title: parsed.title ?? "Untitled itinerary",
        excerpt: parsed.excerpt ?? null,
        description: parsed.description ?? null,
        sales_preview: parsed.sales_preview ?? null,
        preview_image_urls: previewImages,
        extras: extras ?? null,
        hero_image_url: parsed.hero_image_url ?? null,
        hero_video_id: parsed.hero_video_id ?? null,
        country_slug: parsed.country_slug ?? null,
        region_slug: parsed.region_slug ?? null,
        duration: parsed.duration ?? null,
        price_cents: parsed.price_cents ?? 0,
        currency: parsed.currency ?? "eur",
        status: parsed.status ?? "draft",
        category: parsed.category ?? null,
        category_color: parsed.category_color ?? null,
      };
      const { data, error } = await supabase
        .from("itineraries")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      await regenerateItineraryPdfSilently(data.id, supabase);
      revalidatePath("/admin/itineraries");
      redirect(`/admin/itineraries/${data.id}?status=created`);
    }
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    const id = formData.get("id")?.toString();
    const code = errorCodeFrom(err);
    const msg = encodeURIComponent(errorMessageFrom(err).slice(0, 220));
    redirect(
      id
        ? `/admin/itineraries/${id}?error=${code}&message=${msg}`
        : `/admin/itineraries/new?error=${code}&message=${msg}`,
    );
  }
}

export async function deleteItinerary(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = await createSupabaseAdminClient();
  const client = supabaseAdmin ?? supabase;
  if (!client) throw new Error("Supabase not configured");
  await client.from("itineraries").delete().eq("id", id);
  revalidatePath("/admin/itineraries");
  redirect("/admin/itineraries?status=deleted");
}

export async function regenerateItineraryPdfAction(formData: FormData) {
  try {
    await requireAdmin();
    const itineraryId = formData.get("itinerary_id")?.toString();
    if (!itineraryId) {
      redirect("/admin/itineraries?status=pdf-regenerate-failed");
    }

    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (!supabase) throw new Error("Supabase not configured");

    const regenerated = await regenerateItineraryPdf(itineraryId, supabase);
    revalidatePath("/admin/itineraries");

    if (!regenerated?.key) {
      redirect("/admin/itineraries?status=pdf-regenerate-failed");
    }
    redirect("/admin/itineraries?status=pdf-regenerated");
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    const msg = encodeURIComponent(errorMessageFrom(err).slice(0, 220));
    redirect(`/admin/itineraries?status=pdf-regenerate-failed&message=${msg}`);
  }
}

const GrantAccessSchema = z.object({
  itinerary_id: z.string().uuid(),
  recipient_email: z.string().trim().email(),
});

async function loadPrivateDeliveryEntities(
  supabase: SupabaseClient<Database>,
  parsed: z.infer<typeof GrantAccessSchema>,
) {
  const email = parsed.recipient_email.toLowerCase();
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("id, slug, title, currency, price_cents")
    .eq("id", parsed.itinerary_id)
    .maybeSingle();
  if (itineraryError) throw itineraryError;
  if (!itinerary) throw new Error("Itinerary not found");

  // Profile is optional — if the client hasn't registered yet, the order is stored
  // by email and automatically linked when they create their account.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  const { data: steps, error: stepsError } = await supabase
    .from("itinerary_steps")
    .select("id, title, body, description_long")
    .eq("itinerary_id", itinerary.id)
    .order("position");
  if (stepsError) throw stepsError;

  return { email, itinerary, profile: profile ?? null };
}

async function assertHasMeaningfulSteps(
  supabase: SupabaseClient<Database>,
  itineraryId: string,
) {
  const { data: steps, error: stepsError } = await supabase
    .from("itinerary_steps")
    .select("id, title, body, description_long")
    .eq("itinerary_id", itineraryId)
    .order("position");
  if (stepsError) throw stepsError;

  const hasMeaningfulStep = (steps ?? []).some((step) => {
    const title = (step.title ?? "").trim();
    const body = (step.body ?? "").trim();
    const longDescription = (step.description_long ?? "").trim();
    return (
      body.length > 0 ||
      longDescription.length > 0 ||
      (title.length > 0 && title.toLowerCase() !== "untitled step")
    );
  });
  if (!hasMeaningfulStep) {
    throw new Error(
      "This itinerary has no step content yet. Add at least one completed step before delivery.",
    );
  }
}

export async function sendPrivateItineraryPaymentLink(formData: FormData) {
  try {
    await requireAdmin();
    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (!supabase) throw new Error("Supabase not configured");

    const parsed = GrantAccessSchema.parse({
      itinerary_id: formData.get("itinerary_id"),
      recipient_email: formData.get("recipient_email"),
    });
    const { email, itinerary, profile } = await loadPrivateDeliveryEntities(
      supabase,
      parsed,
    );

    if ((itinerary.price_cents ?? 0) <= 0) {
      throw new Error(
        "Set a price above 0 before sending a payment link for this private itinerary.",
      );
    }

    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");

    // Custom itinerary payments should land on a neutral thank-you page.
    // The itinerary stays hidden while Diana is building it.
    const successUrl = `${siteUrl()}/thank-you?type=custom-itinerary`;
    const cancelUrl = `${siteUrl()}/itineraries/${itinerary.slug}?canceled=1`;
    const metadata = {
      itinerary_id: itinerary.id,
      itinerary_slug: itinerary.slug,
      user_id: profile?.id ?? "",
      private_request: "true",
    };

    const baseSessionParams = {
      mode: "payment" as const,
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (itinerary.currency ?? "eur").toLowerCase(),
            unit_amount: itinerary.price_cents,
            product_data: {
              name: itinerary.title,
              description: "Private custom itinerary by DEXTGO",
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "auto" as const,
    };

    let session;
    try {
      // Faster path: request card+paypal immediately.
      session = await stripe.checkout.sessions.create({
        ...baseSessionParams,
        payment_method_types: ["card", "paypal"],
      });
    } catch (paypalError) {
      const paypalMessage =
        paypalError instanceof Error ? paypalError.message : String(paypalError);
      console.warn(
        "[private-payment-link] paypal-unavailable, falling back to card-only",
        paypalMessage,
      );
      session = await stripe.checkout.sessions.create({
        ...baseSessionParams,
        payment_method_types: ["card"],
      });
    }

    if (!session.url) {
      throw new Error("Stripe checkout URL was not generated.");
    }

    // Enforce private workflow: once a payment link is sent, keep itinerary in draft.
    const { error: draftError } = await supabase
      .from("itineraries")
      .update({ status: "draft" })
      .eq("id", itinerary.id);
    if (draftError) throw draftError;

    let emailFailed = false;
    try {
      const sent = await sendPrivatePaymentRequestEmail({
        to: email,
        itineraryTitle: itinerary.title,
        itinerarySlug: itinerary.slug,
        amountCents: itinerary.price_cents ?? 0,
        currency: itinerary.currency ?? "eur",
        checkoutUrl: session.url,
      });
      if (sent && typeof sent === "object" && "skipped" in sent && sent.skipped) {
        emailFailed = true;
      }
    } catch (emailError) {
      emailFailed = true;
      console.error("private-delivery: payment-link-email-failed", emailError);
    }

    revalidatePath(`/admin/itineraries/${parsed.itinerary_id}`);
    const base = `/admin/itineraries/${parsed.itinerary_id}`;
    if (emailFailed) {
      redirect(
        `${base}?status=payment-link-created&message=${encodeURIComponent("Payment link created, but email failed. Share the link manually below.")}&payment_url=${encodeURIComponent(session.url)}`,
      );
    }
    redirect(
      `${base}?status=payment-link-created&message=${encodeURIComponent("Payment link created and sent to requester email.")}&payment_url=${encodeURIComponent(session.url)}`,
    );
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    const itineraryId = formData.get("itinerary_id")?.toString();
    if (itineraryId) {
      const code = "payment-link-failed";
      const msg = encodeURIComponent(errorMessageFrom(err).slice(0, 220));
      redirect(`/admin/itineraries/${itineraryId}?error=${code}&message=${msg}`);
    }
    redirect("/admin/itineraries?error=payment-link-failed");
  }
}

export async function grantPrivateItineraryAccess(formData: FormData) {
  try {
    await requireAdmin();
    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (!supabase) throw new Error("Supabase not configured");

    const parsed = GrantAccessSchema.parse({
      itinerary_id: formData.get("itinerary_id"),
      recipient_email: formData.get("recipient_email"),
    });

    const { email, itinerary, profile } = await loadPrivateDeliveryEntities(
      supabase,
      parsed,
    );

    await assertHasMeaningfulSteps(supabase, itinerary.id);

    const manualSessionId = `manual-${itinerary.id}-${email}`;
    const priceCents = itinerary.price_cents ?? 0;
    const { error: upsertError } = await supabase.from("orders").upsert(
      {
        stripe_session_id: manualSessionId,
        stripe_payment_intent_id: null,
        user_id: profile?.id ?? null,
        email,
        itinerary_id: itinerary.id,
        itinerary_slug: itinerary.slug,
        amount_cents: priceCents,
        currency: (itinerary.currency ?? "eur").toLowerCase(),
        status: "paid",
      },
      { onConflict: "stripe_session_id" },
    );
    if (upsertError) throw upsertError;

    const { error: privacyError } = await supabase
      .from("itineraries")
      .update({ status: "archived" })
      .eq("id", itinerary.id);
    if (privacyError) throw privacyError;

    let emailFailed = false;
    let emailErrorMessage = "";
    try {
      await sendOrderConfirmationEmail({
        to: email,
        itineraryTitle: itinerary.title,
        itinerarySlug: itinerary.slug,
        amountCents: priceCents,
        currency: itinerary.currency ?? "eur",
      });
    } catch (emailError) {
      emailFailed = true;
      emailErrorMessage =
        emailError instanceof Error ? emailError.message : "Unknown email delivery error.";
      console.error("private-delivery: manual-override-email-failed", emailError);
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/itineraries/${parsed.itinerary_id}`);
    if (emailFailed) {
      redirect(
        `/admin/itineraries/${parsed.itinerary_id}?status=granted&message=${encodeURIComponent(`Access granted, but confirmation email failed: ${emailErrorMessage}`)}`,
      );
    }
    redirect(
      `/admin/itineraries/${parsed.itinerary_id}?status=granted&message=${encodeURIComponent("Access granted and confirmation email sent.")}`,
    );
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    const itineraryId = formData.get("itinerary_id")?.toString();
    if (itineraryId) {
      const code = "grant-failed";
      const msg = encodeURIComponent(errorMessageFrom(err).slice(0, 220));
      redirect(`/admin/itineraries/${itineraryId}?error=${code}&message=${msg}`);
    }
    redirect("/admin/itineraries?error=grant-failed");
  }
}

const StepSchema = z.object({
  id: z.string().uuid().optional(),
  itinerary_id: z.string().uuid(),
  position: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).optional(),
  ),
  kind: z.preprocess(
    emptyToUndefined,
    z.enum(["step", "pin", "audio", "tip"]).optional(),
  ),
  title: optionalText,
  body: optionalText,
  lat: z.preprocess(emptyToUndefined, z.coerce.number().optional().nullable()),
  lng: z.preprocess(emptyToUndefined, z.coerce.number().optional().nullable()),
  audio_url: optionalText,
  day: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).optional().nullable(),
  ),
  day_title: optionalText,
  official_url: optionalText,
  google_maps_url: optionalText,
  address: optionalText,
  day_intro: optionalText,
  info_data: optionalText,
  description_long: optionalText,
  description_kids: optionalText,
  expert_tips: optionalText,
  image_urls: z.array(z.string().trim().min(1)).optional().default([]),
  extra_links: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional()
    .default([]),
});

async function resequenceDaySteps(
  supabase: SupabaseClient<Database>,
  itineraryId: string,
  day: number,
) {
  const { data: daySteps, error } = await supabase
    .from("itinerary_steps")
    .select("id, position, created_at")
    .eq("itinerary_id", itineraryId)
    .eq("day", day)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = daySteps ?? [];
  for (let index = 0; index < rows.length; index += 1) {
    const nextPosition = index + 1;
    if (rows[index].position !== nextPosition) {
      const { error: updateError } = await supabase
        .from("itinerary_steps")
        .update({ position: nextPosition })
        .eq("id", rows[index].id);
      if (updateError) throw updateError;
    }
  }
}

export async function saveStep(formData: FormData) {
  const raw = Object.fromEntries(formData);
  try {
    await requireAdmin();
    const imageUrls = parseJson<string[]>(formData.get("image_urls"), []);
    const extraLinks = parseJson<{label: string; url: string}[]>(formData.get("extra_links"), []);
    const parsed = StepSchema.parse({ ...raw, image_urls: imageUrls, extra_links: extraLinks });
    const supabase =
      (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
    if (!supabase) throw new Error("Supabase not configured");

    if (parsed.id) {
      const { data: existing, error: existingError } = await supabase
        .from("itinerary_steps")
        .select("*")
        .eq("id", parsed.id)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) throw new Error("Step not found");

      const payload = {
        itinerary_id: parsed.itinerary_id ?? existing.itinerary_id,
        position: parsed.position ?? existing.position,
        kind: parsed.kind ?? existing.kind,
        title: parsed.title ?? existing.title ?? "Untitled step",
        // Allow clearing fields: empty input should persist as null (not keep stale old value)
        body: parsed.body ?? null,
        lat: parsed.lat ?? null,
        lng: parsed.lng ?? null,
        audio_url: parsed.audio_url ?? null,
        day: parsed.day ?? null,
        day_title: parsed.day_title ?? null,
        official_url: parsed.official_url ?? null,
        google_maps_url: parsed.google_maps_url ?? null,
        address: parsed.address ?? null,
        day_intro: parsed.day_intro ?? null,
        info_data: parsed.info_data ?? null,
        description_long: parsed.description_long ?? null,
        description_kids: parsed.description_kids ?? null,
        expert_tips: parsed.expert_tips ?? null,
        image_urls:
          parsed.image_urls.length > 0 ? parsed.image_urls : (existing.image_urls ?? []),
        extra_links: parsed.extra_links.length > 0 ? parsed.extra_links : [],
      };
      const { error } = await supabase
        .from("itinerary_steps")
        .update(payload as unknown as ItineraryStepUpdate)
        .eq("id", parsed.id);
      if (error) throw error;
      await resequenceDaySteps(supabase, parsed.itinerary_id, parsed.day ?? existing.day ?? 1);
      await regenerateItineraryPdfSilently(parsed.itinerary_id, supabase);
      revalidatePath(`/admin/itineraries/${parsed.itinerary_id}`);
      return { stepId: parsed.id };
    } else {
      const payload = {
        itinerary_id: parsed.itinerary_id,
        position: parsed.position ?? 0,
        kind: parsed.kind ?? "step",
        title: parsed.title ?? "Untitled step",
        body: parsed.body ?? null,
        lat: parsed.lat ?? null,
        lng: parsed.lng ?? null,
        audio_url: parsed.audio_url ?? null,
        day: parsed.day ?? null,
        day_title: parsed.day_title ?? null,
        official_url: parsed.official_url ?? null,
        google_maps_url: parsed.google_maps_url ?? null,
        address: parsed.address ?? null,
        day_intro: parsed.day_intro ?? null,
        info_data: parsed.info_data ?? null,
        description_long: parsed.description_long ?? null,
        description_kids: parsed.description_kids ?? null,
        expert_tips: parsed.expert_tips ?? null,
        image_urls: parsed.image_urls,
        extra_links: parsed.extra_links,
      };
      const { data: inserted, error } = await supabase
        .from("itinerary_steps")
        .insert(payload as unknown as ItineraryStepInsert)
        .select("id")
        .single();
      if (error) throw error;
      await resequenceDaySteps(supabase, parsed.itinerary_id, parsed.day ?? 1);
      await regenerateItineraryPdfSilently(parsed.itinerary_id, supabase);
      revalidatePath(`/admin/itineraries/${parsed.itinerary_id}`);
      return { stepId: inserted.id };
    }
  } catch (err) {
    if (isNextRedirectError(err)) throw err;
    const itineraryId = formData.get("itinerary_id")?.toString();
    if (itineraryId) {
      const code = errorCodeFrom(err);
      const msg = encodeURIComponent(errorMessageFrom(err).slice(0, 220));
      redirect(`/admin/itineraries/${itineraryId}?error=${code}&message=${msg}`);
    }
  }
  return { stepId: null };
}

export async function deleteStep(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const itineraryId = formData.get("itinerary_id")?.toString();
  if (!id) return;
  // Client-only stub (never saved to DB) — nothing to delete server-side
  if (id.startsWith("tmp-")) {
    if (itineraryId) revalidatePath(`/admin/itineraries/${itineraryId}`);
    return;
  }
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) throw new Error("Supabase not configured");
  const { data: rowBeforeDelete } = await supabase
    .from("itinerary_steps")
    .select("day")
    .eq("id", id)
    .maybeSingle();
  const { error, count } = await supabase
    .from("itinerary_steps")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  if (count === 0) {
    throw new Error("Row was not deleted (possibly due to row-level security or missing permissions). Contact support.");
  }
  if (itineraryId) {
    await resequenceDaySteps(supabase, itineraryId, rowBeforeDelete?.day ?? 1);
    await regenerateItineraryPdfSilently(itineraryId, supabase);
  }
  if (itineraryId) revalidatePath(`/admin/itineraries/${itineraryId}`);
}
