/**
 * Add the demo listings and admin account to the database.
 *   npm run seed          add demo data only if there are no listings yet
 *   npm run seed:reset    delete all listings and add the demo data again
 */

import { config } from './config.js';
import { createStore, ensureSeed } from './store/index.js';

const reset = process.argv.includes('--reset');

if (!config.mongoUri) {
	console.error('Set MONGODB_URI first (in .env or your environment).');
	process.exit(1);
}

const store = await createStore(config);
const log = await ensureSeed(store, config, { reset });
console.log(log.length ? log.join('\n') : 'Nothing to do: listings already exist.');
await store.close();
