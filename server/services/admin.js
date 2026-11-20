import { AGENTS, FEATURES, TOWNS, TYPES, slugify } from '../data/seed-data.js';
import { HttpError, cleanText, ok } from '../lib/http.js';
import { requireAdmin } from './auth.js';
import { card } from './listings.js';

const STATUSES = ['for-sale', 'under-offer', 'sold'];

function num(value, min, max, fallback = 0) {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(Math.max(Math.round(n), min), max);
}

/** Accepts an Unsplash photo ID or a full https image URL. */
function cleanImage(value) {
	const v = String(value || '').trim();
	if (/^\d{10,}-[a-z0-9]{6,}$/i.test(v)) return v;
	if (/^https:\/\/[^\s"'<>]+$/i.test(v)) return v.slice(0, 500);
	return '';
}

/** Validate listing fields from the admin form. */
function cleanListing(body) {
	const title = cleanText(body.title, 120);
	if (!title) throw new HttpError(400, 'Title is required.');
	const city = TOWNS.find((t) => t.name === body.city)?.name;
	if (!city) throw new HttpError(400, 'Choose a town.');
	const type = TYPES.includes(body.type) ? body.type : null;
	if (!type) throw new HttpError(400, 'Choose a property type.');
	const price = num(body.price, 0, 50_000_000);
	if (!price) throw new HttpError(400, 'Enter a price.');

	const images = (Array.isArray(body.images) ? body.images : String(body.images || '').split(/[\s,]+/))
		.map(cleanImage)
		.filter(Boolean)
		.slice(0, 12);
	if (!images.length) throw new HttpError(400, 'Add at least one photo (an Unsplash photo ID or an https image URL).');

	const features = (Array.isArray(body.features) ? body.features : []).filter((f) => FEATURES[f]);
	const agent = AGENTS.find((a) => a.email === body.agentEmail) || AGENTS[0];

	return {
		title,
		city,
		type,
		price,
		status: STATUSES.includes(body.status) ? body.status : 'for-sale',
		neighbourhood: cleanText(body.neighbourhood, 80),
		address: cleanText(body.address, 160),
		beds: num(body.beds, 0, 20),
		baths: num(body.baths, 0, 20),
		area: num(body.area, 0, 100_000),
		yearBuilt: num(body.yearBuilt, 1700, 2100, undefined),
		garage: num(body.garage, 0, 10),
		features,
		description: cleanText(body.description, 4000),
		images,
		featured: Boolean(body.featured),
		agent,
	};
}

async function uniqueSlug(store, title, city, ignoreId) {
	const base = slugify(`${title} ${city}`) || 'listing';
	let slug = base;
	for (let i = 2; i < 100; i += 1) {
		const clash = await store.listings.findOne({ slug });
		if (!clash || clash.id === ignoreId) return slug;
		slug = `${base}-${i}`;
	}
	return `${base}-${Date.now()}`;
}

export async function stats({ store }, { user }) {
	requireAdmin(user);
	const [listings, forSale, enquiries, newEnquiries, users] = await Promise.all([
		store.listings.count({}),
		store.listings.count({ status: 'for-sale' }),
		store.enquiries.count({}),
		store.enquiries.count({ status: 'new' }),
		store.users.count({}),
	]);
	return ok({ listings, forSale, enquiries, newEnquiries, users, agents: AGENTS });
}

export async function listListings({ store }, { user }) {
	requireAdmin(user);
	const items = await store.listings.find({}, { sort: { createdAt: -1 }, limit: 500 });
	return ok({ items: items.map(card) });
}

export async function getListing({ store }, { user, params }) {
	requireAdmin(user);
	const listing = await store.listings.findById(params.id);
	if (!listing) throw new HttpError(404, 'Listing not found.');
	return ok({ listing });
}

export async function createListing({ store }, { user, body }) {
	requireAdmin(user);
	const data = cleanListing(body);
	data.slug = await uniqueSlug(store, data.title, data.city);
	const listing = await store.listings.create(data);
	return ok({ listing }, 201);
}

export async function updateListing({ store }, { user, params, body }) {
	requireAdmin(user);
	const existing = await store.listings.findById(params.id);
	if (!existing) throw new HttpError(404, 'Listing not found.');
	const data = cleanListing(body);
	if (data.title !== existing.title || data.city !== existing.city) {
		data.slug = await uniqueSlug(store, data.title, data.city, existing.id);
	}
	const listing = await store.listings.update(existing.id, data);
	return ok({ listing });
}

export async function deleteListing({ store }, { user, params }) {
	requireAdmin(user);
	const removed = await store.listings.remove(params.id);
	if (!removed) throw new HttpError(404, 'Listing not found.');
	return ok({ ok: true });
}

export async function listEnquiries({ store }, { user }) {
	requireAdmin(user);
	const items = await store.enquiries.find({}, { sort: { createdAt: -1 }, limit: 200 });
	return ok({ items });
}

export async function updateEnquiry({ store }, { user, params, body }) {
	requireAdmin(user);
	const status = body.status === 'handled' ? 'handled' : 'new';
	const enquiry = await store.enquiries.update(params.id, { status });
	if (!enquiry) throw new HttpError(404, 'Enquiry not found.');
	return ok({ enquiry });
}
