/**
 * Pick the data store and make sure demo data and the admin account exist.
 */

import { seedListings } from '../data/seed-data.js';
import { hashPassword } from '../lib/auth.js';
import { createMemoryStore } from './memory.js';

export async function createStore(config) {
	if (config.mongoUri) {
		// Imported only when needed, so the app can run without Mongoose installed.
		const { createMongoStore } = await import('./mongo.js');
		return createMongoStore(config.mongoUri);
	}
	return createMemoryStore();
}

/**
 * Add the demo listings if the database has none, and create the admin account
 * from ADMIN_EMAIL / ADMIN_PASSWORD if it does not exist yet.
 *
 * @returns {Promise<string[]>} What was done, for the start-up log.
 */
export async function ensureSeed(store, config, { reset = false } = {}) {
	const log = [];
	if (reset) {
		await store.listings.clear();
		log.push('cleared listings');
	}
	if ((await store.listings.count({})) === 0) {
		await store.listings.insertMany(seedListings());
		log.push('added demo listings');
	}
	if (config.adminEmail && config.adminPassword) {
		const email = config.adminEmail.toLowerCase();
		const existing = await store.users.findOne({ email });
		if (!existing) {
			await store.users.create({ name: 'Larkhaven Admin', email, passwordHash: hashPassword(config.adminPassword), role: 'admin', favourites: [] });
			log.push(`created admin ${email}`);
		} else if (existing.role !== 'admin') {
			await store.users.update(existing.id, { role: 'admin' });
			log.push(`made ${email} an admin`);
		}
	}
	return log;
}
