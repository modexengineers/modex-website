import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { PortalSession } from "./portal-types";

const COOKIE_NAME = "modex_portal_session";
const MAX_AGE = 60 * 60 * 24 * 7;

type TokenPayload = PortalSession & { exp: number };

function getSecret() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("PORTAL_SESSION_SECRET must be configured and at least 24 characters long.");
  }
  return secret;
}

function sign(data: string) {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encode(payload: TokenPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): TokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setPortalSession(session: PortalSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, encode({ ...session, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearPortalSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  return { role: payload.role, projectId: payload.projectId };
}

export async function requireAdmin() {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireProjectAccess(projectId: string) {
  const session = await getPortalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (session.role === "admin") return session;
  if (session.projectId !== projectId) throw new Error("FORBIDDEN");
  return session;
}
