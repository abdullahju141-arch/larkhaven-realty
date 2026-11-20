/**
 * Build the React app into server/public (run: npm run build:client).
 * The built files are committed, so the host only needs `npm install` + `npm start`.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'server', 'public');
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

// Use the project's node_modules, plus any extra folders given in NODE_PATH.
const nodePaths = [path.join(root, 'node_modules'), ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)];

await esbuild.build({
	entryPoints: { app: path.join(root, 'client/src/main.jsx') },
	outdir: path.join(out, 'assets'),
	bundle: true,
	minify: true,
	format: 'esm',
	target: ['es2020'],
	jsx: 'automatic',
	nodePaths,
	define: { 'process.env.NODE_ENV': '"production"' },
	legalComments: 'none',
	logLevel: 'warning',
});

await esbuild.build({
	entryPoints: { app: path.join(root, 'client/src/styles.css') },
	outdir: path.join(out, 'assets'),
	bundle: true,
	minify: true,
	logLevel: 'warning',
});

const hash = crypto
	.createHash('sha1')
	.update(fs.readFileSync(path.join(out, 'assets/app.js')))
	.update(fs.readFileSync(path.join(out, 'assets/app.css')))
	.digest('hex')
	.slice(0, 10);
const html = fs.readFileSync(path.join(root, 'client/index.html'), 'utf8').replaceAll('__VERSION__', hash);
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(root, 'client/favicon.svg'), path.join(out, 'favicon.svg'));

const size = (f) => `${(fs.statSync(path.join(out, 'assets', f)).size / 1024).toFixed(0)} KB`;
console.log(`Built client: app.js ${size('app.js')}, app.css ${size('app.css')} (version ${hash})`);
