import { createApp } from './app.js';
import { config } from './config.js';
import { createStore, ensureSeed } from './store/index.js';

async function main() {
	const store = await createStore(config);
	const seeded = await ensureSeed(store, config);

	const app = createApp({ store, config });
	app.listen(config.port, () => {
		console.log(`Larkhaven Realty running on port ${config.port}`);
		console.log(`  data: ${store.kind === 'mongo' ? 'MongoDB' : 'in-memory demo data (set MONGODB_URI to keep data)'}`);
		console.log(`  assistant: ${config.geminiApiKey ? `Gemini (${config.geminiModel})` : 'basic keyword mode (set GEMINI_API_KEY for AI)'}`);
		if (seeded.length) console.log(`  setup: ${seeded.join(', ')}`);
		if (!config.adminPassword) console.log('  note: set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account');
	});
}

main().catch((error) => {
	console.error('Failed to start:', error.message);
	process.exit(1);
});
