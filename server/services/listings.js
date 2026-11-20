import { FEATURES, TOWNS, TYPES } from '../data/seed-data.js';
import { HttpError, ok } from '../lib/http.js';
import { SORTS, buildQuery, normalizeFilters } from '../lib/search.js';

const PAGE_SIZE = 9;

/** The fields shown on listing cards. */
export function card(l) {
	return {
		id: l.id,
		slug: l.slug,
		title: l.title,
		type: l.type,
		status: l.status,
		city: l.city,
		neighbourhood: l.neighbourhood,
		price: l.price,
		beds: l.beds,
		baths: l.baths,
		area: l.area,
		features: l.features || [],
		image: (l.images || [])[0] || '',
		featured: Boolean(l.featured),
		createdAt: l.createdAt,
	};
}

export async function search({ store }, { query }) {
	const filters = normalizeFilters(query);
	const sortKey = SORTS[query.sort] ? query.sort : 'newest';
	const page = Math.max(1, Math.min(100, Number.parseInt(query.page, 10) || 1));
	const mongoQuery = buildQuery(filters);
	if (query.featured === '1') {
		mongoQuery.featured = true;
	}
	const limit = Math.max(1, Math.min(24, Number.parseInt(query.limit, 10) || PAGE_SIZE));

	const [items, total] = await Promise.all([
		store.listings.find(mongoQuery, { sort: SORTS[sortKey], skip: (page - 1) * limit, limit }),
		store.listings.count(mongoQuery),
	]);

	return ok({
		items: items.map(card),
		total,
		page,
		pages: Math.max(1, Math.ceil(total / limit)),
		filters,
		sort: sortKey,
	});
}

export async function getBySlug({ store }, { params }) {
	const listing = await store.listings.findOne({ slug: String(params.slug) });
	if (!listing) {
		throw new HttpError(404, 'This property could not be found.');
	}
	const similar = await store.listings.find(
		{ status: 'for-sale', city: listing.city, slug: { $ne: listing.slug } },
		{ sort: { createdAt: -1 }, limit: 3 },
	);
	return ok({ listing, similar: similar.map(card) });
}

export async function meta({ store }) {
	const counts = await Promise.all(TOWNS.map((t) => store.listings.count({ status: 'for-sale', city: t.name })));
	return ok({
		towns: TOWNS.map((t, i) => ({ ...t, count: counts[i] })),
		types: TYPES,
		features: FEATURES,
		sorts: Object.keys(SORTS),
	});
}
