/**
 * The Express application: API routes, the built React app, and error handling.
 */

import path from 'node:path';
import express from 'express';
import { rateLimiter } from './lib/http.js';
import { routes } from './routes.js';
import { userFromHeader } from './services/auth.js';

export function createApp({ store, config }) {
	const ctx = {
		store,
		config,
		chatLimiter: rateLimiter(20, 60_000),
		authLimiter: rateLimiter(10, 60_000),
	};

	const app = express();
	app.disable('x-powered-by');
	// Free hosts sit behind a proxy; this makes req.ip the visitor's address.
	app.set('trust proxy', 1);

	app.use((req, res, next) => {
		res.set({
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'SAMEORIGIN',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
		});
		next();
	});
	app.use(express.json({ limit: '100kb' }));

	app.get('/api/health', (req, res) => res.json({ ok: true, store: store.kind }));

	for (const [method, route, handler] of routes) {
		app[method.toLowerCase()](route, async (req, res, next) => {
			try {
				if (route.startsWith('/api/auth/') && method === 'POST' && !ctx.authLimiter(req.ip)) {
					return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
				}
				const user = await userFromHeader(ctx, req.get('authorization'));
				const result = await handler(ctx, {
					params: req.params,
					query: req.query,
					body: req.body || {},
					user,
					ip: req.ip,
				});
				res.status(result.status).json(result.body);
			} catch (error) {
				next(error);
			}
		});
	}

	app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

	// The built React app. Everything that is not an API call gets index.html,
	// so links like /listings/some-home work when opened directly.
	const publicDir = path.join(config.root, 'server', 'public');
	app.use(express.static(publicDir, { index: false, maxAge: config.production ? '1h' : 0 }));
	app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

	// eslint-disable-next-line no-unused-vars
	app.use((error, req, res, next) => {
		const status = error.status && error.status < 600 ? error.status : 500;
		if (status >= 500) {
			console.error('[error]', error);
		}
		if (error.type === 'entity.parse.failed') {
			return res.status(400).json({ error: 'The request was not valid JSON.' });
		}
		res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : error.message });
	});

	return app;
}
