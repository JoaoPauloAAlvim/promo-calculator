import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/", "/historico"];

function base64UrlToUint8Array(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyAuthTokenEdge(token: string | undefined) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return false;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

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

  if (!timingSafeEqual(providedSig, expectedSig)) return false;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || typeof payload.exp !== "number") return false;
    if (payload.exp <= now) return false;
  } catch {
    return false;
  }

  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/icon.png") {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  const isLogin = pathname === "/login";

  const token = req.cookies.get("simulador_auth")?.value;
  const hasAuth = await verifyAuthTokenEdge(token);

  if (isProtected && !hasAuth) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && hasAuth) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.searchParams.delete("from");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/historico/:path*","/admin/:path*"],
};
