/**
 * Keyword parser used when the AI is not available (no API key, rate limit,
 * or an error). It understands the common ways people describe a home search:
 * "3 bed house in Millbrook under 500k", "apartment with balcony", "below $1.2m".
 */

import { FEATURES, TOWNS, TYPES } from '../data/seed-data.js';
import { FAQ } from '../data/faq.js';

const TYPE_WORDS = {
	house: ['house', 'houses', 'home with garden', 'detached', 'family home'],
	apartment: ['apartment', 'apartments', 'flat', 'flats', 'condo', 'penthouse', 'studio'],
	townhouse: ['townhouse', 'townhouses', 'town house', 'terrace'],
	villa: ['villa', 'villas'],
	cabin: ['cabin', 'cabins', 'a-frame', 'lodge'],
};

const FEATURE_WORDS = {
	garden: ['garden', 'yard', 'backyard', 'lawn'],
	pool: ['pool', 'swimming'],
	garage: ['garage', 'parking'],
	balcony: ['balcony', 'terrace', 'roof terrace'],
	fireplace: ['fireplace', 'wood burner', 'log burner', 'stove'],
	'home-office': ['home office', 'office', 'study', 'work from home', 'wfh'],
	waterfront: ['waterfront', 'sea view', 'sea views', 'beach', 'river', 'harbour', 'harbor', 'lake'],
	'new-build': ['new build', 'new-build', 'brand new', 'newly built'],
	'pet-friendly': ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats'],
	solar: ['solar', 'eco', 'energy efficient', 'heat pump'],
};

function amount(numText, suffix) {
	let n = Number(numText.replace(/,/g, ''));
	if (!Number.isFinite(n)) {
		return undefined;
	}
	const s = (suffix || '').toLowerCase();
	if (s.startsWith('m')) n *= 1_000_000;
	else if (s === 'k' || s.startsWith('thousand')) n *= 1000;
	// "under 500" almost certainly means $500k for a house.
	else if (n > 0 && n < 10_000) n *= 1000;
	return Math.round(n);
}

const MONEY = '\\$?\\s?(\\d[\\d,]*(?:\\.\\d+)?)\\s?(k|m|mil|million|thousand)?\\b';

function has(text, word) {
	return new RegExp(`(^|[^a-z])${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([^a-z]|$)`, 'i').test(text);
}

/**
 * Pull search filters out of a free-text message.
 *
 * @param {string} message
 * @returns {object} Raw filters (run through normalizeFilters before use).
 */
export function parseSearch(message) {
	const text = ` ${String(message).toLowerCase()} `;
	const f = {};

	for (const town of TOWNS) {
		if (text.includes(town.name.toLowerCase())) {
			f.city = town.name;
			break;
		}
	}

	for (const type of TYPES) {
		if (TYPE_WORDS[type].some((w) => has(text, w))) {
			f.type = type;
			break;
		}
	}

	const between = text.match(new RegExp(`between\\s+${MONEY}\\s+(?:and|-|to)\\s+${MONEY}`, 'i'));
	if (between) {
		f.minPrice = amount(between[1], between[2]);
		f.maxPrice = amount(between[3], between[4]);
	} else {
		const max = text.match(new RegExp(`(?:under|below|less than|up to|max(?:imum)?|budget(?: of| is)?|no more than|within)\\s+${MONEY}`, 'i'));
		if (max) f.maxPrice = amount(max[1], max[2]);
		const min = text.match(new RegExp(`(?:over|above|more than|at least|from|min(?:imum)?)\\s+${MONEY}`, 'i'));
		if (min) f.minPrice = amount(min[1], min[2]);
	}

	const beds = text.match(/(\d+)\s*\+?\s*(?:-|\s)?(?:bed|beds|bedroom|bedrooms|br)\b/);
	if (beds) f.beds = Number(beds[1]);
	const baths = text.match(/(\d+)\s*\+?\s*(?:-|\s)?(?:bath|baths|bathroom|bathrooms)\b/);
	if (baths) f.baths = Number(baths[1]);

	const features = [];
	for (const [key, words] of Object.entries(FEATURE_WORDS)) {
		if (words.some((w) => has(text, w))) {
			features.push(key);
		}
	}
	// "beach" or "river" as a town hint should not force the waterfront feature
	// when the town itself is already on the water.
	if (f.city === 'Ashford Bay' && features.includes('waterfront') && !/(waterfront|sea view|on the water)/.test(text)) {
		features.splice(features.indexOf('waterfront'), 1);
	}
	if (features.length) f.features = features;

	if (/\b(cheap|cheapest|affordable|budget|first home|starter)\b/.test(text) && !f.maxPrice) {
		f.sort = 'price-asc';
	}
	if (/\b(luxury|biggest|largest|most expensive)\b/.test(text)) {
		f.sort = 'price-desc';
	}

	return f;
}

/** True when a parsed result contains at least one real search filter. */
export function isSearch(f) {
	return Boolean(f.city || f.type || f.minPrice || f.maxPrice || f.beds || f.baths || (f.features && f.features.length));
}

/**
 * Find the FAQ entry that best matches a question, if any.
 *
 * @param {string} message
 * @returns {object|null}
 */
export function matchFaq(message) {
	const text = String(message).toLowerCase();
	let best = null;
	let bestScore = 0;
	for (const item of FAQ) {
		const score = item.keywords.reduce((sum, k) => sum + (text.includes(k) ? k.length : 0), 0);
		if (score > bestScore) {
			best = item;
			bestScore = score;
		}
	}
	return bestScore >= 3 ? best : null;
}

export { FEATURES };
