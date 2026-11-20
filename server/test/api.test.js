import assert from 'node:assert/strict';
import test from 'node:test';
import { createHarness } from './harness.js';

test('listings search, filters, paging and detail', async () => {
	const { call } = await createHarness();
	const all = await call('GET', '/api/listings');
	assert.equal(all.status, 200);
	assert.equal(all.body.total, 16);
	assert.equal(all.body.items.length, 9);
	assert.equal(all.body.pages, 2);

	const r = await call('GET', '/api/listings?city=Millbrook&maxPrice=600000&beds=3&sort=price-asc');
	assert.ok(r.body.total >= 2);
	assert.ok(r.body.items.every((l) => l.city === 'Millbrook' && l.price <= 600000 && l.beds >= 3));
	assert.ok(r.body.items[0].price <= r.body.items[1].price);

	const detail = await call('GET', `/api/listings/${r.body.items[0].slug}`);
	assert.equal(detail.status, 200);
	assert.equal(detail.body.listing.images.length, 5);
	assert.ok(detail.body.similar.every((s) => s.city === 'Millbrook' && s.slug !== r.body.items[0].slug));

	assert.equal((await call('GET', '/api/listings/does-not-exist')).status, 404);
	const meta = await call('GET', '/api/meta');
	assert.equal(meta.body.towns.reduce((s, t) => s + t.count, 0), 16);
});

test('accounts, favourites and enquiries', async () => {
	const { call, store } = await createHarness();
	assert.equal((await call('POST', '/api/auth/register', { body: { name: 'Ali', email: 'bad', password: 'longenough' } })).status, 400);
	const reg = await call('POST', '/api/auth/register', { body: { name: 'Ali', email: 'Ali@Example.com', password: 'longenough' } });
	assert.equal(reg.status, 201);
	assert.equal(reg.body.user.email, 'ali@example.com');
	assert.equal(reg.body.user.passwordHash, undefined);
	assert.equal((await call('POST', '/api/auth/register', { body: { name: 'Ali', email: 'ali@example.com', password: 'longenough' } })).status, 409);
	assert.equal((await call('POST', '/api/auth/login', { body: { email: 'ali@example.com', password: 'nope' } })).status, 401);
	const { token } = (await call('POST', '/api/auth/login', { body: { email: 'ali@example.com', password: 'longenough' } })).body;

	assert.equal((await call('GET', '/api/favourites')).status, 401);
	const listing = (await call('GET', '/api/listings')).body.items[0];
	await call('POST', `/api/favourites/${listing.id}`, { token });
	await call('POST', `/api/favourites/${listing.id}`, { token });
	const favs = await call('GET', '/api/favourites', { token });
	assert.deepEqual(favs.body.items.map((l) => l.id), [listing.id]);
	await call('DELETE', `/api/favourites/${listing.id}`, { token });
	assert.equal((await call('GET', '/api/favourites', { token })).body.items.length, 0);

	assert.equal((await call('POST', '/api/enquiries', { body: { listingId: listing.id, name: 'Ali', email: 'x' } })).status, 400);
	assert.equal((await call('POST', '/api/enquiries', { body: { listingId: listing.id, name: 'Ali', email: 'ali@example.com', message: 'Can I view it?' } })).status, 201);
	assert.equal((await call('POST', '/api/enquiries', { body: { name: 'Bot', email: 'b@b.co', website: 'spam' } })).status, 201);
	assert.equal(await store.enquiries.count({}), 1);
});

test('admin routes are protected and work for admins', async () => {
	const { call } = await createHarness();
	const user = (await call('POST', '/api/auth/register', { body: { name: 'U', email: 'u@example.com', password: 'longenough' } })).body.token;
	assert.equal((await call('GET', '/api/admin/stats')).status, 401);
	assert.equal((await call('GET', '/api/admin/stats', { token: user })).status, 403);

	const admin = (await call('POST', '/api/auth/login', { body: { email: 'admin@test.example', password: 'admin-pass-123' } })).body.token;
	const stats = await call('GET', '/api/admin/stats', { token: admin });
	assert.equal(stats.body.listings, 16);

	const body = { title: 'Test cottage', city: 'Millbrook', type: 'house', price: '250000', beds: 2, baths: 1, images: '1570129477492-45c003edd2be\njavascript:alert(1)', features: ['garden', 'moat'] };
	assert.equal((await call('POST', '/api/admin/listings', { token: admin, body: { ...body, images: '' } })).status, 400);
	const created = await call('POST', '/api/admin/listings', { token: admin, body });
	assert.equal(created.status, 201);
	assert.deepEqual(created.body.listing.images, ['1570129477492-45c003edd2be']);
	assert.deepEqual(created.body.listing.features, ['garden']);
	assert.equal(created.body.listing.slug, 'test-cottage-millbrook');

	const updated = await call('PUT', `/api/admin/listings/${created.body.listing.id}`, { token: admin, body: { ...body, price: 260000, status: 'sold' } });
	assert.equal(updated.body.listing.price, 260000);
	assert.equal((await call('GET', '/api/listings?q=Test%20cottage')).body.total, 0, 'sold homes are hidden from search');
	assert.equal((await call('DELETE', `/api/admin/listings/${created.body.listing.id}`, { token: admin })).status, 200);

	await call('POST', '/api/enquiries', { body: { name: 'A', email: 'a@b.co' } });
	const enq = await call('GET', '/api/admin/enquiries', { token: admin });
	assert.equal(enq.body.items.length, 1);
	const patched = await call('PATCH', `/api/admin/enquiries/${enq.body.items[0].id}`, { token: admin, body: { status: 'handled' } });
	assert.equal(patched.body.enquiry.status, 'handled');
});

test('assistant in basic mode: search, refine, relax, FAQ, greeting', async () => {
	const { call } = await createHarness();
	const say = (message, context, history) => call('POST', '/api/chat', { body: { message, context, history } });

	const a = await say('3 bed house in Millbrook under 600k');
	assert.equal(a.body.mode, 'basic');
	assert.ok(a.body.total >= 2, a.body.reply);
	assert.match(a.body.reply, /3\+ bed houses in Millbrook under \$600k/);
	assert.ok(a.body.listings.every((l) => l.city === 'Millbrook' && l.price <= 600000));
	assert.match(a.body.searchUrl, /^\/listings\?/);

	const b = await say('with a fireplace', a.body.filters);
	assert.equal(b.body.filters.city, 'Millbrook');
	assert.deepEqual(b.body.filters.features, ['fireplace']);
	assert.ok(b.body.listings.every((l) => l.features.includes('fireplace')));

	const c = await say('villa in Northgate under 300k');
	assert.ok(c.body.listings.length > 0, 'relaxes filters instead of returning nothing');
	assert.match(c.body.reply, /closest/i);

	const d = await say('What fees do buyers pay?');
	assert.match(d.body.reply, /does not charge buyers/);
	assert.equal(d.body.listings.length, 0);

	const e = await say('hello');
	assert.match(e.body.reply, /Lark/);

	assert.equal((await say('')).status, 400);
});

test('assistant with AI: uses Gemini output, validates it, and falls back on errors', async () => {
	const realFetch = globalThis.fetch;
	const { call } = await createHarness({ geminiApiKey: 'fake-key' });
	let sent;
	try {
		globalThis.fetch = async (url, init) => {
			sent = { url, init };
			const text = JSON.stringify({ intent: 'search', filters: { city: 'Ashford Bay', type: 'villa', maxPrice: 2000000, features: ['pool', 'lasers'], beds: null }, reply: '' });
			return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
		};
		const r = await call('POST', '/api/chat', { body: { message: 'somewhere by the sea with a pool, money no object (under 2m)' } });
		assert.equal(r.body.mode, 'ai');
		assert.match(sent.url, /models\/test-model:generateContent$/);
		assert.equal(sent.init.headers['x-goog-api-key'], 'fake-key');
		assert.deepEqual(r.body.filters, { city: 'Ashford Bay', type: 'villa', maxPrice: 2000000, features: ['pool'] });
		assert.equal(r.body.listings[0].type, 'villa');

		globalThis.fetch = async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ intent: 'question', filters: {}, reply: 'We do not charge buyers.' }) }] } }] }), { status: 200 });
		const q = await call('POST', '/api/chat', { body: { message: 'fees?' } });
		assert.equal(q.body.reply, 'We do not charge buyers.');

		globalThis.fetch = async () => new Response('quota', { status: 429 });
		const f = await call('POST', '/api/chat', { body: { message: '2 bed apartment in Northgate' } });
		assert.equal(f.body.mode, 'basic');
		assert.match(f.body.reply, /busy/);
		assert.ok(f.body.listings.length > 0);
	} finally {
		globalThis.fetch = realFetch;
	}
});
