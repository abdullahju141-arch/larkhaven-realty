import { HttpError, ok } from '../lib/http.js';
import { requireUser } from './auth.js';
import { card } from './listings.js';

export async function list({ store }, { user }) {
	requireUser(user);
	const ids = user.favourites || [];
	const listings = (await Promise.all(ids.map((id) => store.listings.findById(id)))).filter(Boolean);
	return ok({ items: listings.map(card) });
}

export async function add({ store }, { user, params }) {
	requireUser(user);
	const listing = await store.listings.findById(params.id);
	if (!listing) throw new HttpError(404, 'This property could not be found.');
	const favourites = [...new Set([...(user.favourites || []), listing.id])].slice(-200);
	await store.users.update(user.id, { favourites });
	return ok({ favourites });
}

export async function remove({ store }, { user, params }) {
	requireUser(user);
	const favourites = (user.favourites || []).filter((id) => id !== String(params.id));
	await store.users.update(user.id, { favourites });
	return ok({ favourites });
}
