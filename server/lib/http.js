/**
 * Small helpers shared by the services.
 */

export class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

export const ok = (body, status = 200) => ({ status, body });

/**
 * Fixed-window rate limiter kept in memory (fine for a single small server).
 *
 * @param {number} limit Requests allowed per window.
 * @param {number} windowMs Window length in milliseconds.
 */
export function rateLimiter(limit, windowMs) {
	const hits = new Map();
	return function allow(key) {
		const now = Date.now();
		const entry = hits.get(key);
		if (!entry || entry.reset < now) {
			hits.set(key, { count: 1, reset: now + windowMs });
			if (hits.size > 5000) {
				for (const [k, v] of hits) {
					if (v.reset < now) hits.delete(k);
				}
			}
			return true;
		}
		entry.count += 1;
		return entry.count <= limit;
	};
}

export function cleanText(value, max) {
	return String(value ?? '')
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
		.trim()
		.slice(0, max);
}

export function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || ''));
}
