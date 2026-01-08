import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = requireAuth();
  if (denied) return denied;
  return NextResponse.json({ ok: true });
}
