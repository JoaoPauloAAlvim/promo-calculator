import crypto from "node:crypto";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return {
    saltB64: salt.toString("base64"),
    hashB64: hash.toString("base64"),
  };
}

export function verifyPassword(password: string, saltB64: string, hashB64: string) {
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(password, salt, 64);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
