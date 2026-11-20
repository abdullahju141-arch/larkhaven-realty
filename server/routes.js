/**
 * Every API route in one table. The Express app (app.js) turns these into
 * Express routes; the tests use the same table without Express.
 */

import * as admin from './services/admin.js';
import * as auth from './services/auth.js';
import * as chat from './services/chat.js';
import * as enquiries from './services/enquiries.js';
import * as favourites from './services/favourites.js';
import * as listings from './services/listings.js';

export const routes = [
	['GET', '/api/meta', listings.meta],
	['GET', '/api/listings', listings.search],
	['GET', '/api/listings/:slug', listings.getBySlug],

	['POST', '/api/auth/register', auth.register],
	['POST', '/api/auth/login', auth.login],
	['GET', '/api/auth/me', auth.me],

	['GET', '/api/favourites', favourites.list],
	['POST', '/api/favourites/:id', favourites.add],
	['DELETE', '/api/favourites/:id', favourites.remove],

	['POST', '/api/enquiries', enquiries.create],

	['GET', '/api/chat/status', chat.status],
	['POST', '/api/chat', chat.chat],

	['GET', '/api/admin/stats', admin.stats],
	['GET', '/api/admin/listings', admin.listListings],
	['GET', '/api/admin/listings/:id', admin.getListing],
	['POST', '/api/admin/listings', admin.createListing],
	['PUT', '/api/admin/listings/:id', admin.updateListing],
	['DELETE', '/api/admin/listings/:id', admin.deleteListing],
	['GET', '/api/admin/enquiries', admin.listEnquiries],
	['PATCH', '/api/admin/enquiries/:id', admin.updateEnquiry],
];
