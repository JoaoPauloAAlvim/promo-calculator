import crypto from "node:crypto";

type TokenPayload = {
  iat: number; 
  exp: number; 
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

export function createAuthToken(maxAgeSeconds: number) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET não definido.");

  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = { iat: now, exp: now + maxAgeSeconds };

  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const sig = sign(payloadB64, secret);

  return `${payloadB64}.${sig}`;
}

export function verifyAuthToken(token: string | undefined | null) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return false;
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64));
  } catch {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || typeof payload.exp !== "number") return false;
  if (payload.exp <= now) return false;

  return true;
}
