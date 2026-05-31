"use server";

import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { sendContactNotification } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function submitContactForm(data: ContactFormData) {
  const parsed = contactFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  // Persist to Supabase if configured (best-effort; never block the user).
  try {
    const supabase = await createSupabaseAdminClient();
    if (supabase) {
      await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
    }
  } catch (error) {
    console.error("contact: failed to persist message", error);
  }

  try {
    await sendContactNotification({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
  } catch (error) {
    console.error("contact: failed to send email", error);
    return { success: false, error: "Failed to send message" };
  }

  return { success: true };
}
