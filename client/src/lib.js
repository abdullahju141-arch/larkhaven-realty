/**
 * Small shared helpers: API calls, router, formatting, images.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';

/* ---------- API ---------- */

const TOKEN_KEY = 'larkhaven.token';

export function getToken() {
	try {
		return localStorage.getItem(TOKEN_KEY) || '';
	} catch {
		return '';
	}
}

export function setToken(token) {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token);
		else localStorage.removeItem(TOKEN_KEY);
	} catch {
		// Private mode: the session simply does not persist.
	}
}

export async function api(path, { method = 'GET', body } = {}) {
	const headers = { Accept: 'application/json' };
	const token = getToken();
	if (token) headers.Authorization = `Bearer ${token}`;
	if (body !== undefined) headers['Content-Type'] = 'application/json';

	let response;
	try {
		response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
	} catch {
		throw new Error('Could not reach the server. Check your connection and try again.');
	}
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(data.error || `Request failed (${response.status}).`);
		error.status = response.status;
		throw error;
	}
	return data;
}

/** Fetch data for a component; re-runs when `key` changes. */
export function useApi(path, key = path) {
	const [state, setState] = useState({ data: null, error: null, loading: true });
	useEffect(() => {
		if (!path) return undefined;
		let alive = true;
		setState((s) => ({ ...s, loading: true, error: null }));
		api(path)
			.then((data) => alive && setState({ data, error: null, loading: false }))
			.catch((error) => alive && setState({ data: null, error, loading: false }));
		return () => {
			alive = false;
		};
	}, [key]);
	return state;
}

/* ---------- Router (pushState) ---------- */

const listeners = new Set();
function emit() {
	listeners.forEach((fn) => fn());
}
window.addEventListener('popstate', emit);

function snapshot() {
	return window.location.pathname + window.location.search;
}

export function navigate(to, { replace = false } = {}) {
	if (to === snapshot()) return;
	if (replace) window.history.replaceState(null, '', to);
	else window.history.pushState(null, '', to);
	emit();
	if (!replace) window.scrollTo(0, 0);
}

export function useLocation() {
	const href = useSyncExternalStore(
		(fn) => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		snapshot,
	);
	const url = new URL(href, window.location.origin);
	return { path: url.pathname, query: Object.fromEntries(url.searchParams), search: url.search };
}

/** Intercept clicks on internal links so the app does not reload. */
export function onLinkClick(event) {
	const a = event.target.closest('a[href]');
	if (!a || a.target === '_blank' || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
	const href = a.getAttribute('href');
	if (!href.startsWith('/') || href.startsWith('//') || a.hasAttribute('download')) return;
	event.preventDefault();
	const [target, hash] = href.split('#');
	if (target !== window.location.pathname + window.location.search || !hash) {
		navigate(target || '/');
	}
	if (hash) {
		// Wait for the new page to render, then scroll to the section.
		setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
	}
}

/* ---------- Formatting ---------- */

export const price = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;
export const area = (n) => (n ? `${Number(n).toLocaleString('en-US')} sq ft` : '');
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export function typeLabel(type) {
	return { house: 'House', apartment: 'Apartment', townhouse: 'Townhouse', villa: 'Villa', cabin: 'Cabin' }[type] || cap(type);
}

export function statusLabel(status) {
	return { 'for-sale': 'For sale', 'under-offer': 'Under offer', sold: 'Sold' }[status] || status;
}

/* ---------- Images ---------- */

/** Unsplash photo ID or full URL → sized image URL. */
export function img(source, width, height) {
	if (!source) return '';
	if (/^https?:\/\//.test(source)) return source;
	const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(width), q: '70' });
	if (height) params.set('h', String(height));
	return `https://images.unsplash.com/photo-${source}?${params}`;
}

export function srcSet(source, width, height) {
	if (!source || /^https?:\/\//.test(source)) return undefined;
	return `${img(source, width, height)} 1x, ${img(source, width * 2, height ? height * 2 : 0)} 2x`;
}

/* ---------- Page title ---------- */

export function useTitle(title) {
	useEffect(() => {
		document.title = title ? `${title} · Larkhaven Realty` : 'Larkhaven Realty · Homes in Larkhaven Valley';
	}, [title]);
}

/* ---------- Chat bridge ---------- */

/** Open the assistant from anywhere, optionally sending a message. */
export function askLark(message) {
	window.dispatchEvent(new CustomEvent('lark:open', { detail: { message } }));
}
