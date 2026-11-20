import { HttpError, cleanText, isEmail, ok } from '../lib/http.js';

export async function create({ store }, { body }) {
	// Spam trap: real visitors never see or fill this field.
	if (body.website) {
		return ok({ ok: true }, 201);
	}
	const name = cleanText(body.name, 80);
	const email = cleanText(body.email, 120).toLowerCase();
	const phone = cleanText(body.phone, 40);
	const message = cleanText(body.message, 2000);
	if (!name) throw new HttpError(400, 'Please enter your name.');
	if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');

	let listingTitle = '';
	let listingId = '';
	if (body.listingId) {
		const listing = await store.listings.findById(String(body.listingId));
		if (!listing) throw new HttpError(404, 'This property could not be found.');
		listingId = listing.id;
		listingTitle = listing.title;
	}

	await store.enquiries.create({ listingId, listingTitle, name, email, phone, message, status: 'new' });
	return ok({ ok: true }, 201);
}
