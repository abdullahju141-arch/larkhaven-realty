/**
 * Settings from environment variables (and a local .env file, if present).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
	process.loadEnvFile(envFile);
}

const env = process.env;
const production = env.NODE_ENV === 'production';

export const config = {
	root,
	production,
	port: Number(env.PORT) || 3000,
	mongoUri: (env.MONGODB_URI || '').trim(),
	jwtSecret: env.JWT_SECRET || '',
	adminEmail: (env.ADMIN_EMAIL || '').trim(),
	adminPassword: env.ADMIN_PASSWORD || '',
	geminiApiKey: (env.GEMINI_API_KEY || '').trim(),
	geminiModel: (env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
};

if (!config.jwtSecret) {
	if (production) {
		throw new Error('JWT_SECRET must be set in production.');
	}
	// Development only: tokens stop working when the server restarts.
	config.jwtSecret = crypto.randomBytes(32).toString('hex');
}
