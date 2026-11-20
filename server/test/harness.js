/**
 * Runs the API route table directly (no Express), with the in-memory store.
 */
import { rateLimiter } from '../lib/http.js';
import { routes } from '../routes.js';
import { userFromHeader } from '../services/auth.js';
import { createMemoryStore } from '../store/memory.js';
import { ensureSeed } from '../store/index.js';

export async function createHarness(overrides = {}) {
	const config = { jwtSecret: 'test-secret', adminEmail: 'admin@test.example', adminPassword: 'admin-pass-123', geminiApiKey: '', geminiModel: 'test-model', ...overrides };
	const store = await createMemoryStore();
	await ensureSeed(store, config);
	const ctx = { store, config, chatLimiter: rateLimiter(1000, 60_000) };

	async function call(method, url, { body = {}, token } = {}) {
		const [pathname, qs = ''] = url.split('?');
		for (const [m, route, handler] of routes) {
			if (m !== method) continue;
			const names = [];
			const re = new RegExp(`^${route.replace(/:([a-z]+)/gi, (_, n) => { names.push(n); return '([^/]+)'; })}$`);
			const match = re.exec(pathname);
			if (!match) continue;
			const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(match[i + 1])]));
			const user = await userFromHeader(ctx, token ? `Bearer ${token}` : '');
			try {
				return await handler(ctx, { params, query: Object.fromEntries(new URLSearchParams(qs)), body, user, ip: '1.1.1.1' });
			} catch (error) {
				return { status: error.status || 500, body: { error: error.message } };
			}
		}
		return { status: 404, body: { error: 'no route' } };
	}
	return { call, store, config, ctx };
}
