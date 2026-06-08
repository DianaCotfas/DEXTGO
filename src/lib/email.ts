import "server-only";
import { Resend } from "resend";
import { env, isConfigured } from "@/lib/env";
import { getPublicSiteUrl } from "@/lib/site-url";
import { formatPrice } from "@/lib/format";

let cached: Resend | null = null;

function client(): Resend | null {
  if (!isConfigured("resend")) return null;
  if (cached) return cached;
  cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

const fromHeader = () => `DEXTGO <${env.RESEND_FROM_EMAIL}>`;

function parseEmailList(value: string) {
  return value
    .split(/[,\n;]+/g)
    .map((item) => item.trim())
    .map((item) => item.toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

function resolveNotificationRecipients() {
  const recipients = new Set<string>();
  for (const email of parseEmailList(env.CONTACT_NOTIFICATION_EMAILS)) recipients.add(email);
  for (const email of parseEmailList(env.RESEND_INBOX_EMAIL)) recipients.add(email);
  if (recipients.size === 0) recipients.add(env.RESEND_FROM_EMAIL);
  return [...recipients];
}

type SendEmailResult = { skipped: true } | { skipped: false; id?: string };

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

function extractResendErrorMessage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  const resend = client();
  if (!resend) return { skipped: true };

  const response = (await resend.emails.send({
    from: fromHeader(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  })) as {
    data?: { id?: string } | null;
    error?: unknown;
  };

  const errorMessage = extractResendErrorMessage(response?.error);
  if (errorMessage) {
    throw new Error(`Email delivery failed: ${errorMessage}`);
  }

  return { skipped: false, id: response?.data?.id };
}

const wrap = (title: string, preheader: string, body: string) => {
  // ALWAYS render white DEXTGO text (guaranteed visible on dark background regardless of email client)
  // The text rendering is the source of truth — no image is used in the header to avoid white-on-white
  // and broken-image issues across email clients.

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">
      ${preheader}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f7;">
      <tr><td style="padding:28px 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" align="center" style="margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(17,24,39,0.06);">
          <tr>
            <td style="padding:28px;background:#0f172a;text-align:left;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:5px;font-family:Arial,Helvetica,sans-serif;line-height:1;">DEXTGO</p>
              <p style="margin:4px 0 0 0;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:2.5px;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Travel Operations</p>
            </td>
          </tr>
          <tr><td style="padding:28px;">${body}</td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
            Sent by DEXTGO &bull; ${new Date().getFullYear()} &bull; Replies are monitored.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

export async function sendOrderConfirmationEmail(params: {
  to: string;
  itineraryTitle: string;
  itinerarySlug: string;
  amountCents: number;
  currency: string;
}) {
  const link = `${getPublicSiteUrl()}/account/itineraries`;
  const receipt = formatPrice(params.amountCents, params.currency);
  const safeTitle = escapeHtml(params.itineraryTitle);
  const html = wrap(
    "Your DEXTGO itinerary",
    `Payment received for ${params.itineraryTitle}.`,
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Order confirmation</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        Payment received.
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        Thank you for choosing DEXTGO. Your itinerary <strong>${safeTitle}</strong> is now in production and our team is finalizing it for delivery.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Purchase details</p>
          <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Itinerary:</strong> ${safeTitle}</p>
          <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;"><strong>Receipt:</strong> ${receipt}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 22px 0;">
        <a href="${link}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Open my itineraries</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        We will email you again as soon as the itinerary is officially ready. Need help in the meantime? Reply to this email.
      </p>
    `,
  );

  const text = [
    "Payment received for your itinerary.",
    "",
    `Itinerary: ${params.itineraryTitle}`,
    `Receipt: ${receipt}`,
    "",
    "Status: Your itinerary is being finalized and will be delivered as soon as it is ready.",
    "",
    `Open your dashboard: ${link}`,
    "",
    "Need help? Reply to this email.",
  ].join("\n");

  return sendEmail({
    to: params.to,
    subject: `Your DEXTGO itinerary — ${params.itineraryTitle}`,
    html,
    text,
  });
}

/**
 * Delivery email template reserved for when Diana manually marks an itinerary as complete.
 * Not auto-triggered at payment time.
 */
export async function sendItineraryReadyEmail(params: {
  to: string;
  itineraryTitle: string;
  itinerarySlug: string;
  amountCents: number;
  currency: string;
}) {
  const link = `${getPublicSiteUrl()}/account/itineraries`;
  const receipt = formatPrice(params.amountCents, params.currency);
  const safeTitle = escapeHtml(params.itineraryTitle);
  const html = wrap(
    "Your DEXTGO itinerary is ready",
    `Your itinerary ${params.itineraryTitle} is ready in your dashboard.`,
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Itinerary delivery</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        Your itinerary is ready.
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        Great news. <strong>${safeTitle}</strong> is now ready with full map navigation, audio guides, and downloadable PDF access.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order details</p>
          <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Itinerary:</strong> ${safeTitle}</p>
          <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;"><strong>Receipt:</strong> ${receipt}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 22px 0;">
        <a href="${link}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Open my itineraries</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        Need help with access or delivery? Reply to this email and our team will assist quickly.
      </p>
    `,
  );

  const text = [
    "Your itinerary is ready.",
    "",
    `Itinerary: ${params.itineraryTitle}`,
    `Receipt: ${receipt}`,
    "",
    `Open your dashboard: ${link}`,
    "",
    "Need help? Reply to this email.",
  ].join("\n");

  return sendEmail({
    to: params.to,
    subject: `Your DEXTGO itinerary is ready — ${params.itineraryTitle}`,
    html,
    text,
  });
}

export async function sendPrivatePaymentRequestEmail(params: {
  to: string;
  itineraryTitle: string;
  itinerarySlug: string;
  amountCents: number;
  currency: string;
  checkoutUrl: string;
}) {
  const receipt = formatPrice(params.amountCents, params.currency);
  const safeTitle = escapeHtml(params.itineraryTitle);
  const html = wrap(
    "Complete payment for your DEXTGO itinerary",
    `Complete payment for ${params.itineraryTitle} to unlock your private itinerary.`,
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Private itinerary request</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        Confirm your payment to start delivery
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        Your custom itinerary <strong>${safeTitle}</strong> is ready for checkout. Once payment is completed, access is unlocked automatically in your DEXTGO dashboard.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Payment details</p>
          <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Itinerary:</strong> ${safeTitle}</p>
          <p style="margin:4px 0 0 0;font-size:14px;color:#0f172a;"><strong>Total:</strong> ${receipt}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 20px 0;">
        <a href="${params.checkoutUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Pay and unlock itinerary</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        If the button does not open, copy this secure payment link:<br />
        <span style="word-break:break-all;color:#334155;">${escapeHtml(params.checkoutUrl)}</span>
      </p>
    `,
  );

  const text = [
    "Your private itinerary payment link",
    "",
    `Itinerary: ${params.itineraryTitle}`,
    `Total: ${receipt}`,
    "",
    `Pay here: ${params.checkoutUrl}`,
    "",
    "After successful payment, your itinerary unlocks automatically.",
  ].join("\n");

  return sendEmail({
    to: params.to,
    subject: `Payment required — ${params.itineraryTitle}`,
    html,
    text,
  });
}

export async function sendCustomItineraryPaidConfirmationEmail(params: {
  to: string;
  name?: string;
  destination?: string;
  amountCents: number;
  currency: string;
  deliveryEstimate: string;
}) {
  const receipt = formatPrice(params.amountCents, params.currency);
  const safeName = escapeHtml((params.name ?? "").trim());
  const safeDestination = escapeHtml((params.destination ?? "").trim());
  const safeEstimate = escapeHtml(params.deliveryEstimate);
  const greeting = safeName ? `Hi ${safeName},` : "Hi there,";
  const destinationLine = safeDestination
    ? `<p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;"><strong>Destination:</strong> ${safeDestination}</p>`
    : "";
  const html = wrap(
    "Custom itinerary payment confirmed",
    "Your custom itinerary payment is confirmed.",
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Payment confirmed</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        Your custom itinerary order is confirmed
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        ${greeting} thank you for your order. We have received your payment and started planning your custom itinerary.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order details</p>
          ${destinationLine}
          <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;"><strong>Paid:</strong> ${receipt}</p>
          <p style="margin:0;font-size:14px;color:#0f172a;"><strong>Estimated delivery:</strong> ${safeEstimate}</p>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        We'll contact you at this email address with updates and final delivery.
      </p>
    `,
  );

  const text = [
    "Your custom itinerary order is confirmed.",
    "",
    greeting.replace(/<[^>]+>/g, ""),
    safeDestination ? `Destination: ${safeDestination}` : null,
    `Paid: ${receipt}`,
    `Estimated delivery: ${params.deliveryEstimate}`,
    "",
    "We'll email you with progress updates and final delivery.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({
    to: params.to,
    subject: "Payment confirmed — custom itinerary order",
    html,
    text,
  });
}

export async function sendAdminNotificationEmail({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  const recipients = resolveNotificationRecipients();
  await sendEmail({
    to: recipients,
    subject,
    html: `<pre style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
    text: body,
  });
}

export async function sendContactNotification(params: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  const safeName = escapeHtml(params.name);
  const safeEmail = escapeHtml(params.email);
  const safeSubject = params.subject ? escapeHtml(params.subject) : "No subject provided";
  const safeMessage = escapeHtml(params.message).replace(/\n/g, "<br />");
  const recipients = resolveNotificationRecipients();
  const replySubject = encodeURIComponent(
    `Re: ${params.subject ?? "Your DEXTGO request"}`,
  );
  const replyMailto = `mailto:${params.email}?subject=${replySubject}`;

  const html = wrap(
    "New contact form message",
    "New website enquiry received via dextgo.com",
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Website inbox</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        New website enquiry
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        A visitor submitted a new message on dextgo.com. Reply directly to continue the conversation.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Sender</p>
          <p style="margin:0;font-size:14px;color:#0f172a;"><strong>${safeName}</strong> &lt;${safeEmail}&gt;</p>
          <p style="margin:10px 0 0 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Subject</p>
          <p style="margin:0;font-size:14px;color:#0f172a;">${safeSubject}</p>
          <p style="margin:10px 0 0 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Recipients</p>
          <p style="margin:0;font-size:13px;color:#334155;">${escapeHtml(recipients.join(", "))}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
      <div style="margin:0;padding:14px 16px;font-size:14px;line-height:1.7;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;">
        ${safeMessage}
      </div>
      <p style="margin:18px 0 0 0;">
        <a href="${replyMailto}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Reply to sender</a>
      </p>
    `,
  );

  const text = [
    "New website enquiry via dextgo.com",
    "",
    `From: ${params.name} <${params.email}>`,
    `Subject: ${params.subject ?? "No subject provided"}`,
    `Recipients: ${recipients.join(", ")}`,
    "",
    "Message:",
    params.message,
  ].join("\n");

  return sendEmail({
    to: recipients,
    replyTo: params.email,
    subject: `[DEXTGO contact] ${params.subject ?? params.name}`,
    html,
    text,
  });
}

export async function sendNewsletterWelcome(email: string) {
  const siteUrl = getPublicSiteUrl();
  const blogUrl = `${siteUrl}/blog`;
  const html = wrap(
    "Welcome to DEXTGO",
    "You are subscribed to DEXTGO travel notes.",
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Newsletter</p>
      <h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;">
        Welcome to DEXTGO Journal
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        You are in. We will send practical destination guides, curated itineraries, and occasional behind-the-scenes notes from our travel research.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;font-size:14px;line-height:1.7;color:#0f172a;">
          <strong>What to expect:</strong><br />
          - Destination insights from real trips<br />
          - New itinerary drops and launch offers<br />
          - No spam, unsubscribe anytime
        </td></tr>
      </table>
      <p style="margin:0;">
        <a href="${blogUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Read the latest stories</a>
      </p>
    `,
  );

  const text = [
    "Welcome to DEXTGO Journal",
    "",
    "You'll receive destination insights, itinerary launches, and occasional updates.",
    "No spam. Unsubscribe anytime.",
    "",
    `Latest stories: ${blogUrl}`,
  ].join("\n");

  return sendEmail({
    to: email,
    subject: "Welcome to DEXTGO",
    html,
    text,
  });
}

export async function sendItineraryRequestConfirmationEmail(params: {
  to: string;
  name: string;
  destination: string;
  deliveryEstimate: string;
}) {
  const safeName = escapeHtml(params.name);
  const safeDest = escapeHtml(params.destination);
  const html = wrap(
    "Custom itinerary request received",
    `Hi ${params.name}, we received your request for ${params.destination}.`,
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Request confirmed</p>
      <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.2;font-weight:700;color:#0f172a;">
        We've received your request!
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        Hi ${safeName}, thank you for reaching out to DEXTGO. We've received your custom itinerary request for <strong>${safeDest}</strong>.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">What happens next</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;">1. We'll review your request and prepare a personalised quote.</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;">2. You'll receive a payment link by email within <strong>${escapeHtml(params.deliveryEstimate)}</strong>.</p>
          <p style="margin:0;font-size:14px;color:#0f172a;">3. Once payment is confirmed, we'll start crafting your itinerary.</p>
        </td></tr>
      </table>
      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#334155;">
        No payment is required right now. We'll be in touch soon!
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">
        Questions? Simply reply to this email.
      </p>
    `,
  );

  const text = [
    `Hi ${params.name},`,
    "",
    `We've received your custom itinerary request for ${params.destination}.`,
    "",
    "What happens next:",
    "1. We'll review your request and prepare a personalised quote.",
    `2. You'll receive a payment link within ${params.deliveryEstimate}.`,
    "3. Once payment is confirmed, we'll start crafting your itinerary.",
    "",
    "No payment is required right now.",
    "",
    "Questions? Reply to this email.",
  ].join("\n");

  return sendEmail({
    to: params.to,
    subject: `DEXTGO — Custom itinerary request received for ${params.destination}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  const safeResetUrl = escapeHtml(params.resetUrl);
  const html = wrap(
    "Access your DEXTGO account",
    "Use this secure link to access your DEXTGO account.",
    `
      <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">Account security</p>
      <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.2;font-weight:700;color:#0f172a;">
        Access your account
      </h1>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        We received a request to access your DEXTGO account. Use the secure button below to continue with Magic Link sign-in.
      </p>
      <p style="margin:0 0 20px 0;">
        <a href="${params.resetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px;">Access account</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
        If the button does not open, copy and paste this link into your browser:<br />
        <span style="word-break:break-all;color:#334155;">${safeResetUrl}</span>
      </p>
      <p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        Once you are inside your dashboard, you can change your password from account settings.
      </p>
      <p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
        If you did not request this, you can safely ignore this email.
      </p>
    `,
  );

  const text = [
    "Access your DEXTGO account",
    "",
    "Use this secure Magic Link to access your account:",
    params.resetUrl,
    "",
    "After signing in, you can change your password from dashboard settings.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  return sendEmail({
    to: params.to,
    subject: "DEXTGO — Access your account",
    html,
    text,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
