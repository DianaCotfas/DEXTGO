import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api/webhooks/* (Stripe + Resend webhooks)
     * - Next internals (_next/static, _next/image, favicon, etc.)
     * - public files
     */
    "/((?!api/webhooks|_next/static|_next/image|favicon.ico|brand|hero|blog|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|m3u8|mp3)).*)",
  ],
};
