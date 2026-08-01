/**
 * Admin password verification.
 *
 * The password is never stored — only its argon2id hash, in ADMIN_PASSWORD_HASH.
 * Argon2 embeds the salt and parameters in the hash string, so verifying needs
 * nothing but the hash itself, and its deliberate slowness (~100ms per attempt)
 * is what makes a short password survive the env file leaking.
 *
 * Bun-only, which is fine: this runs inside apps/server. Nothing in apps/web
 * imports it — see lib/session.ts for the parts both runtimes share.
 */

export async function verifyPassword(password: string, hash: string) {
	try {
		return await Bun.password.verify(password, hash);
	} catch {
		// Malformed hash — treat as a failed login rather than a 500, so a bad
		// deploy locks the admin out instead of leaking a stack trace.
		return false;
	}
}
