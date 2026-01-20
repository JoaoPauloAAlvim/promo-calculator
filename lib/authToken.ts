import crypto from "node:crypto";

export type AuthRole = "OWNER" | "USER";

export type TokenPayload = {
  iat: number;
  exp: number;
  uid: number;
  role: AuthRole;
};

function b64urlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function b64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadB64: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createAuthToken(args: { uid: number; role: AuthRole; maxAgeSeconds: number }) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET não definido.");

  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    iat: now,
    exp: now + args.maxAgeSeconds,
    uid: args.uid,
    role: args.role,
  };

  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export function verifyAuthToken(token: string | undefined | null): TokenPayload | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || typeof payload.exp !== "number") return null;
  if (payload.exp <= now) return null;
  if (!payload.uid || typeof payload.uid !== "number") return null;
  if (payload.role !== "OWNER" && payload.role !== "USER") return null;

  return payload;
}
