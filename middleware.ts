import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/", "/historico", "/admin"];
const OWNER_ONLY_PATHS = ["/admin"];

type TokenPayload = {
  iat: number;
  exp: number;
  uid: number;
  role: "OWNER" | "USER";
};

function base64UrlToUint8Array(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyAuthTokenEdge(token: string | undefined): Promise<TokenPayload | null> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const expectedSig = new Uint8Array(expectedSigBuf);
  const providedSig = base64UrlToUint8Array(sigB64);

  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);

    if (!payload?.exp || typeof payload.exp !== "number") return null;
    if (payload.exp <= now) return null;

    if (!payload?.uid || typeof payload.uid !== "number") return null;
    if (payload.role !== "OWNER" && payload.role !== "USER") return null;

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/icon.png") {
    return NextResponse.next();
  }

  const isLogin = pathname === "/login";

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const isOwnerOnly = OWNER_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const token = req.cookies.get("simulador_auth")?.value;
  const payload = await verifyAuthTokenEdge(token);

  if (isProtected && !payload) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isOwnerOnly && payload?.role !== "OWNER") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isLogin && payload) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.searchParams.delete("from");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/historico/:path*", "/admin/:path*"],
};
