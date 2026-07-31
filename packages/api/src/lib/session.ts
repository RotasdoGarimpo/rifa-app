import { env } from "@rifa-app/env/server";

/**
 * Admin sessions.
 *
 * This module and `createContext` are the entire auth seam. Procedures depend
 * on `context.session`, never on how it was produced — so replacing the PIN
 * with Better Auth later means rewriting `verifySessionToken` and the context
 * builder, and nothing else.
 */

export const SESSION_COOKIE = "rifa_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type Session = { kind: "admin"; issuedAt: number };

function base64UrlEncode(bytes: Uint8Array) {
	return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string) {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(env.SESSION_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(payload),
	);

	return base64UrlEncode(new Uint8Array(signature));
}

/** Length-independent comparison, so a mismatch leaks nothing via timing. */
function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;

	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return diff === 0;
}

export async function createSessionToken(): Promise<string> {
	const payload = base64UrlEncode(
		new TextEncoder().encode(JSON.stringify({ k: "admin", t: Date.now() })),
	);

	return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
	token: string | undefined | null,
): Promise<Session | null> {
	if (!token) return null;

	const [payload, signature] = token.split(".");
	if (!payload || !signature) return null;

	if (!timingSafeEqual(signature, await sign(payload))) return null;

	try {
		const decoded: unknown = JSON.parse(
			Buffer.from(payload, "base64url").toString("utf8"),
		);

		if (
			typeof decoded !== "object" ||
			decoded === null ||
			(decoded as { k?: unknown }).k !== "admin"
		) {
			return null;
		}

		const issuedAt = (decoded as { t?: unknown }).t;
		if (typeof issuedAt !== "number") return null;
		if (Date.now() - issuedAt > SESSION_TTL_MS) return null;

		return { kind: "admin", issuedAt };
	} catch {
		return null;
	}
}

/** Pull our cookie out of a raw Cookie header. */
export function readSessionCookie(cookieHeader: string | null | undefined) {
	if (!cookieHeader) return null;

	for (const part of cookieHeader.split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === SESSION_COOKIE) return rest.join("=");
	}

	return null;
}

export function buildSessionCookie(token: string, maxAgeSeconds: number) {
	const attributes = [
		`${SESSION_COOKIE}=${token}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		`Max-Age=${maxAgeSeconds}`,
	];

	if (env.NODE_ENV === "production") {
		attributes.push("Secure");
	}

	return attributes.join("; ");
}

export const clearedSessionCookie = () => buildSessionCookie("", 0);
