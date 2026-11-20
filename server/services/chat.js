/**
 * Lark, the property assistant.
 *
 * 1. Work out what the visitor wants: with Gemini if a key is set, otherwise
 *    (or if Gemini fails) with the keyword parser.
 * 2. For searches, run a real database query with validated filters, so the
 *    assistant can only ever show homes that actually exist.
 * 3. Write the reply from the real results.
 */

import { AGENCY } from '../data/faq.js';
import { HttpError, cleanText, ok } from '../lib/http.js';
import { interpret, llmConfigured } from '../lib/llm.js';
import { isSearch, matchFaq, parseSearch } from '../lib/parse.js';
import { SORTS, buildQuery, describeFilters, money, normalizeFilters, toQueryString } from '../lib/search.js';
import { card } from './listings.js';

const REFINE = /^(and|also|what about|how about|instead|cheaper|bigger|smaller|only|with|without|but|any(?:thing)? (?:in|with|under|cheaper))\b/i;

const HELP =
	'I can search our homes for you. Try something like “3-bed house in Millbrook under $600k” or “apartment with a balcony in Northgate”. I can also answer questions about viewings, offers and fees.';

function cleanHistory(history) {
	if (!Array.isArray(history)) return [];
	return history
		.slice(-8)
		.map((t) => ({ role: t?.role === 'assistant' ? 'assistant' : 'user', text: cleanText(t?.text, 600) }))
		.filter((t) => t.text);
}

/** Search, and if nothing matches, relax the least important filters. */
async function runSearch(store, filters, sortKey) {
	const sort = SORTS[sortKey] || SORTS.newest;
	const attempt = async (f) => {
		const query = buildQuery(f);
		const [items, total] = await Promise.all([store.listings.find(query, { sort, limit: 3 }), store.listings.count(query)]);
		return { items, total };
	};

	const exact = await attempt(filters);
	if (exact.total > 0) return { ...exact, relaxed: null, used: filters };

	const steps = [];
	if (filters.features?.length) steps.push(['features', (f) => ({ ...f, features: undefined })]);
	if (filters.maxPrice) steps.push(['budget', (f) => ({ ...f, maxPrice: Math.round(f.maxPrice * 1.25) })]);
	if (filters.beds && filters.beds > 1) steps.push(['bedrooms', (f) => ({ ...f, beds: f.beds - 1 })]);
	if (filters.type) steps.push(['type', (f) => ({ ...f, type: undefined })]);

	let current = filters;
	const relaxed = [];
	for (const [label, change] of steps) {
		current = normalizeFilters(change(current));
		relaxed.push(label);
		const result = await attempt(current);
		if (result.total > 0) return { ...result, relaxed, used: current };
	}
	return { items: [], total: 0, relaxed: null, used: filters };
}

function searchReply(result, asked) {
	const wanted = describeFilters(asked);
	if (result.total === 0) {
		return `I couldn’t find any ${wanted} right now. Try a different town or a higher budget, or browse everything on the listings page.`;
	}
	if (result.relaxed) {
		const what = {
			features: 'without every feature you listed',
			budget: `a little over your budget (up to ${money(result.used.maxPrice)})`,
			bedrooms: `with ${result.used.beds}+ bedrooms`,
			type: 'of a different property type',
		};
		return `Nothing matches ${wanted} exactly. The closest options are ${result.relaxed.map((r) => what[r]).join(', and ')}:`;
	}
	const count = result.total === 1 ? 'one home' : `${result.total} homes`;
	const lead = result.total > result.items.length ? ` Here are the top ${result.items.length}:` : '';
	return `I found ${count} matching ${wanted}.${lead}`;
}

export async function chat({ store, config, chatLimiter }, { body, ip }) {
	const message = cleanText(body.message, 500);
	if (!message) throw new HttpError(400, 'Type a message first.');
	if (chatLimiter && !chatLimiter(ip || 'unknown')) {
		throw new HttpError(429, 'You are sending messages very quickly. Please wait a minute and try again.');
	}
	const history = cleanHistory(body.history);
	const previous = normalizeFilters(body.context || {});

	let mode = 'basic';
	let intent;
	let rawFilters = {};
	let reply = '';
	let notice = '';

	if (llmConfigured(config)) {
		try {
			const result = await interpret(config, message, history);
			({ intent, reply } = result);
			rawFilters = result.filters;
			mode = 'ai';
		} catch (error) {
			console.warn('[chat] Gemini unavailable, using keyword search:', error.message);
			notice = error.status === 429 ? 'The AI is busy right now, so I’m using basic search.' : '';
		}
	}

	let sortKey;
	if (mode === 'basic') {
		const parsed = parseSearch(message);
		sortKey = parsed.sort;
		if (isSearch(parsed)) {
			intent = 'search';
			rawFilters = REFINE.test(message) ? { ...previous, ...parsed, features: [...new Set([...(previous.features || []), ...(parsed.features || [])])] } : parsed;
		} else {
			const faq = matchFaq(message);
			if (faq) {
				intent = 'question';
				reply = faq.a;
			} else if (/^(hi|hello|hey|salam|good (morning|afternoon|evening))\b/i.test(message)) {
				intent = 'chat';
				reply = `Hello! I’m Lark, the ${AGENCY.name} assistant. ${HELP}`;
			} else if (/^(thanks|thank you|thx|great|perfect)\b/i.test(message)) {
				intent = 'chat';
				reply = 'You’re welcome. Ask me any time if you want to narrow the search.';
			} else if (/\b(show|see|list|browse|homes?|properties|houses?|listings?)\b/i.test(message)) {
				intent = 'search';
				rawFilters = previous;
			} else {
				intent = 'chat';
				reply = HELP;
			}
		}
	}

	if (intent !== 'search') {
		return ok({ reply: [notice, reply || HELP].filter(Boolean).join(' '), listings: [], filters: previous, total: 0, searchUrl: null, mode });
	}

	const filters = normalizeFilters(rawFilters);
	if (!Object.keys(filters).length) {
		const items = await store.listings.find({ status: 'for-sale', featured: true }, { sort: SORTS.newest, limit: 3 });
		return ok({
			reply: [notice, 'Here are a few of our featured homes. Tell me a town, a budget or how many bedrooms you need and I’ll narrow it down.'].filter(Boolean).join(' '),
			listings: items.map(card),
			filters: {},
			total: items.length,
			searchUrl: '/listings',
			mode,
		});
	}

	const result = await runSearch(store, filters, sortKey);
	return ok({
		reply: [notice, searchReply(result, filters)].filter(Boolean).join(' '),
		listings: result.items.map(card),
		filters: result.used,
		total: result.total,
		searchUrl: result.total ? `/listings?${toQueryString(result.used)}` : '/listings',
		mode,
	});
}

export function status({ config }) {
	return ok({ ai: llmConfigured(config), model: llmConfigured(config) ? config.geminiModel : null });
}
