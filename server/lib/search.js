/**
 * Turns search filters (from the URL, the filter panel or the AI assistant)
 * into a clean filter object and a MongoDB query. Everything is whitelisted,
 * so nothing a visitor or the AI sends can reach the database unchecked.
 */

import { FEATURES, TOWNS, TYPES } from '../data/seed-data.js';

export const SORTS = {
	newest: { createdAt: -1 },
	'price-asc': { price: 1 },
	'price-desc': { price: -1 },
	'beds-desc': { beds: -1, price: 1 },
};

const CITY_NAMES = TOWNS.map((t) => t.name);

const FEATURE_PHRASES = {
	garden: 'a garden',
	pool: 'a pool',
	garage: 'a garage',
	balcony: 'a balcony',
	fireplace: 'a fireplace',
	'home-office': 'a home office',
	waterfront: 'a waterfront setting',
	'new-build': 'new-build status',
	'pet-friendly': 'room for pets',
	solar: 'solar panels',
};

function toInt(value, min, max) {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const n = Math.round(Number(String(value).replace(/[^0-9.]/g, '')));
	if (!Number.isFinite(n)) {
		return undefined;
	}
	return Math.min(Math.max(n, min), max);
}

function matchCity(value) {
	if (!value) {
		return undefined;
	}
	const v = String(value).trim().toLowerCase();
	return CITY_NAMES.find((name) => name.toLowerCase() === v);
}

function matchType(value) {
	if (!value) {
		return undefined;
	}
	const v = String(value).trim().toLowerCase().replace(/s$/, '');
	return TYPES.includes(v) ? v : undefined;
}

function matchFeatures(value) {
	if (!value) {
		return [];
	}
	const list = Array.isArray(value) ? value : String(value).split(',');
	const keys = Object.keys(FEATURES);
	const out = [];
	for (const item of list) {
		const v = String(item).trim().toLowerCase().replace(/\s+/g, '-');
		if (keys.includes(v) && !out.includes(v)) {
			out.push(v);
		}
	}
	return out.slice(0, 6);
}

/**
 * Clean any filter input into a safe, predictable shape.
 *
 * @param {object} input Raw filters.
 * @returns {object} Normalised filters (only keys that are set).
 */
export function normalizeFilters(input = {}) {
	const f = {};
	const city = matchCity(input.city);
	const type = matchType(input.type);
	const minPrice = toInt(input.minPrice, 0, 50_000_000);
	const maxPrice = toInt(input.maxPrice, 0, 50_000_000);
	const beds = toInt(input.beds ?? input.minBeds, 0, 10);
	const baths = toInt(input.baths ?? input.minBaths, 0, 10);
	const features = matchFeatures(input.features);
	const q = input.q ? String(input.q).trim().slice(0, 80) : '';

	if (city) f.city = city;
	if (type) f.type = type;
	if (minPrice) f.minPrice = minPrice;
	if (maxPrice) f.maxPrice = maxPrice;
	if (f.minPrice && f.maxPrice && f.minPrice > f.maxPrice) {
		[f.minPrice, f.maxPrice] = [f.maxPrice, f.minPrice];
	}
	if (beds) f.beds = beds;
	if (baths) f.baths = baths;
	if (features.length) f.features = features;
	if (q) f.q = q;
	return f;
}

function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a MongoDB filter from normalised filters.
 *
 * @param {object} f Output of normalizeFilters().
 * @returns {object}
 */
export function buildQuery(f) {
	const query = { status: 'for-sale' };
	if (f.city) query.city = f.city;
	if (f.type) query.type = f.type;
	if (f.minPrice || f.maxPrice) {
		query.price = {};
		if (f.minPrice) query.price.$gte = f.minPrice;
		if (f.maxPrice) query.price.$lte = f.maxPrice;
	}
	if (f.beds) query.beds = { $gte: f.beds };
	if (f.baths) query.baths = { $gte: f.baths };
	if (f.features && f.features.length) query.features = { $all: f.features };
	if (f.q) {
		const pattern = escapeRegex(f.q);
		query.$or = [
			{ title: { $regex: pattern, $options: 'i' } },
			{ neighbourhood: { $regex: pattern, $options: 'i' } },
			{ description: { $regex: pattern, $options: 'i' } },
		];
	}
	return query;
}

/**
 * A short human description of the filters, e.g. "3+ bed houses in Millbrook under $600k".
 *
 * @param {object} f Normalised filters.
 * @returns {string}
 */
export function describeFilters(f) {
	const parts = [];
	const noun = f.type ? (f.type === 'townhouse' ? 'townhouses' : `${f.type}s`) : 'homes';
	parts.push(f.beds ? `${f.beds}+ bed ${noun}` : noun);
	if (f.city) parts.push(`in ${f.city}`);
	if (f.minPrice && f.maxPrice) parts.push(`between ${money(f.minPrice)} and ${money(f.maxPrice)}`);
	else if (f.maxPrice) parts.push(`under ${money(f.maxPrice)}`);
	else if (f.minPrice) parts.push(`over ${money(f.minPrice)}`);
	if (f.baths) parts.push(`with ${f.baths}+ bathrooms`);
	if (f.features && f.features.length) {
		const list = f.features.map((k) => FEATURE_PHRASES[k] || FEATURES[k].toLowerCase());
		parts.push(`with ${list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]}`);
	}
	if (f.q) parts.push(`matching “${f.q}”`);
	return parts.join(' ');
}

export function money(n) {
	if (n >= 1_000_000) {
		return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')}m`;
	}
	if (n >= 1000) {
		return `$${Math.round(n / 1000)}k`;
	}
	return `$${n}`;
}

/** Filters as URL query parameters, for "see all results" links. */
export function toQueryString(f) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(f)) {
		params.set(key, Array.isArray(value) ? value.join(',') : String(value));
	}
	return params.toString();
}
