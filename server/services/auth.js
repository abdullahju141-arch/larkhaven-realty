import { hashPassword, signToken, verifyPassword, verifyToken } from '../lib/auth.js';
import { HttpError, cleanText, isEmail, ok } from '../lib/http.js';

export function publicUser(user) {
	return { id: user.id, name: user.name, email: user.email, role: user.role, favourites: user.favourites || [] };
}

/** Resolve the logged-in user from an "Authorization: Bearer ..." header. */
export async function userFromHeader({ store, config }, header) {
	const match = /^Bearer\s+(.+)$/i.exec(header || '');
	if (!match) return null;
	const claims = verifyToken(match[1], config.jwtSecret);
	if (!claims?.sub) return null;
	return store.users.findById(claims.sub);
}

export function requireUser(user) {
	if (!user) throw new HttpError(401, 'Please log in first.');
	return user;
}

export function requireAdmin(user) {
	requireUser(user);
	if (user.role !== 'admin') throw new HttpError(403, 'Admins only.');
	return user;
}

export async function register({ store, config }, { body }) {
	const name = cleanText(body.name, 60);
	const email = cleanText(body.email, 120).toLowerCase();
	const password = String(body.password || '');
	if (!name) throw new HttpError(400, 'Please enter your name.');
	if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
	if (password.length < 8) throw new HttpError(400, 'Use a password of at least 8 characters.');
	if (await store.users.findOne({ email })) throw new HttpError(409, 'An account with this email already exists. Try logging in.');

	const user = await store.users.create({ name, email, passwordHash: hashPassword(password), role: 'user', favourites: [] });
	return ok({ user: publicUser(user), token: signToken({ sub: user.id }, config.jwtSecret) }, 201);
}

export async function login({ store, config }, { body }) {
	const email = cleanText(body.email, 120).toLowerCase();
	const user = email ? await store.users.findOne({ email }) : null;
	if (!user || !verifyPassword(String(body.password || ''), user.passwordHash)) {
		throw new HttpError(401, 'That email and password do not match.');
	}
	return ok({ user: publicUser(user), token: signToken({ sub: user.id }, config.jwtSecret) });
}

export async function me(ctx, { user }) {
	return ok({ user: publicUser(requireUser(user)) });
}
