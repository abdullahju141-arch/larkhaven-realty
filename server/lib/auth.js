/**
 * Password hashing (scrypt) and login tokens (JWT, HS256), using only Node's
 * built-in crypto module.
 */

import crypto from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH).toString('hex');
	return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
	const [scheme, salt, hash] = String(stored || '').split('$');
	if (scheme !== 'scrypt' || !salt || !hash) {
		return false;
	}
	const candidate = crypto.scryptSync(String(password), salt, KEY_LENGTH);
	const expected = Buffer.from(hash, 'hex');
	return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function b64url(input) {
	return Buffer.from(input).toString('base64url');
}

/**
 * Sign a token.
 *
 * @param {object} payload Claims to include.
 * @param {string} secret Signing secret.
 * @param {number} ttlSeconds Lifetime in seconds.
 * @returns {string}
 */
export function signToken(payload, secret, ttlSeconds = 7 * 24 * 3600) {
	const now = Math.floor(Date.now() / 1000);
	const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }));
	const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	return `${header}.${body}.${signature}`;
}

/**
 * Verify a token and return its claims, or null if invalid or expired.
 *
 * @param {string} token
 * @param {string} secret
 * @returns {object|null}
 */
export function verifyToken(token, secret) {
	const parts = String(token || '').split('.');
	if (parts.length !== 3) {
		return null;
	}
	const [header, body, signature] = parts;
	const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
		return null;
	}
	try {
		const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
		if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}
		return claims;
	} catch {
		return null;
	}
}
