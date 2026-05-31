import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, isAdmin: false });
  }
  return NextResponse.json({
    authenticated: true,
    isAdmin: !!user.is_admin,
    email: user.email ?? null,
  });
}
