/**
 * In-memory attempt limiter for the admin login.
 *
 * A single username/password pair is the only credential in the app, so without
 * this an attacker could grind the password list unthrottled.
 * In-memory is adequate for a single-instance deployment; if the server is
 * ever scaled horizontally this needs to move to Postgres or Redis, because
 * per-process counters would let an attacker get N times the attempts.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; firstAttemptAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
	| { allowed: true }
	| { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string): RateLimitResult {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
		return { allowed: true };
	}

	if (bucket.count >= MAX_ATTEMPTS) {
		return {
			allowed: false,
			retryAfterSeconds: Math.ceil(
				(WINDOW_MS - (now - bucket.firstAttemptAt)) / 1000,
			),
		};
	}

	return { allowed: true };
}

export function recordFailure(key: string) {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
		buckets.set(key, { count: 1, firstAttemptAt: now });
		return;
	}

	bucket.count += 1;
}

export function clearAttempts(key: string) {
	buckets.delete(key);
}
