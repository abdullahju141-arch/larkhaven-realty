import assert from 'node:assert/strict';
import test from 'node:test';
import { isSearch, matchFaq, parseSearch } from '../lib/parse.js';
import { buildQuery, describeFilters, normalizeFilters } from '../lib/search.js';
import { matches } from '../store/memory.js';
import { hashPassword, signToken, verifyPassword, verifyToken } from '../lib/auth.js';
import { parseModelJson } from '../lib/llm.js';

test('parses a typical search', () => {
	const f = normalizeFilters(parseSearch('3 bed house in Millbrook under $600k with a garden'));
	assert.deepEqual(f, { city: 'Millbrook', type: 'house', maxPrice: 600000, beds: 3, features: ['garden'] });
});

test('understands millions, plain numbers and ranges', () => {
	assert.equal(normalizeFilters(parseSearch('villa below 2m')).maxPrice, 2000000);
	assert.equal(normalizeFilters(parseSearch('anything under 1.2m')).maxPrice, 1200000);
	assert.equal(normalizeFilters(parseSearch('house under 450')).maxPrice, 450000);
	const r = normalizeFilters(parseSearch('apartment between 200k and 400k'));
	assert.equal(r.minPrice, 200000);
	assert.equal(r.maxPrice, 400000);
});

test('maps synonyms to types and features', () => {
	const f = normalizeFilters(parseSearch('a flat with parking in northgate, dog friendly'));
	assert.equal(f.type, 'apartment');
	assert.equal(f.city, 'Northgate');
	assert.deepEqual(f.features.sort(), ['garage', 'pet-friendly']);
});

test('non-searches are not treated as searches', () => {
	assert.equal(isSearch(parseSearch('how do I book a viewing?')), false);
	assert.equal(matchFaq('how do I book a viewing?').q, 'How do I book a viewing?');
	assert.equal(matchFaq('what is the weather'), null);
});

test('normalizeFilters rejects junk and swaps reversed prices', () => {
	const f = normalizeFilters({ city: 'Atlantis', type: 'castle', minPrice: '900000', maxPrice: '100000', features: ['pool', 'moat'], beds: '$where' });
	assert.deepEqual(f, { minPrice: 100000, maxPrice: 900000, features: ['pool'] });
});

test('buildQuery produces a Mongo filter the memory store understands', () => {
	const q = buildQuery({ city: 'Millbrook', maxPrice: 600000, beds: 3, features: ['garden'] });
	assert.deepEqual(q, { status: 'for-sale', city: 'Millbrook', price: { $lte: 600000 }, beds: { $gte: 3 }, features: { $all: ['garden'] } });
	assert.ok(matches({ status: 'for-sale', city: 'Millbrook', price: 545000, beds: 4, features: ['garden', 'garage'] }, q));
	assert.ok(!matches({ status: 'for-sale', city: 'Millbrook', price: 615000, beds: 5, features: ['garden'] }, q));
});

test('text search is escaped', () => {
	const q = buildQuery({ q: 'a.b(c' });
	assert.equal(q.$or[0].title.$regex, 'a\\.b\\(c');
});

test('describes filters in plain English', () => {
	assert.equal(describeFilters({ city: 'Millbrook', type: 'house', beds: 3, maxPrice: 600000 }), '3+ bed houses in Millbrook under $600k');
	assert.equal(describeFilters({ maxPrice: 1250000 }), 'homes under $1.25m');
	assert.equal(describeFilters({ features: ['garden', 'pool', 'solar'] }), 'homes with a garden, a pool and solar panels');
});

test('passwords and tokens', () => {
	const h = hashPassword('correct horse');
	assert.ok(verifyPassword('correct horse', h));
	assert.ok(!verifyPassword('wrong', h));
	const t = signToken({ sub: 'abc' }, 's');
	assert.equal(verifyToken(t, 's').sub, 'abc');
	assert.equal(verifyToken(t, 'other'), null);
	assert.equal(verifyToken(signToken({ sub: 'abc' }, 's', -10), 's'), null);
});

test('model JSON is validated', () => {
	assert.deepEqual(parseModelJson('```json\n{"intent":"search","filters":{"city":"Millbrook"},"reply":""}\n```'), { intent: 'search', filters: { city: 'Millbrook' }, reply: '' });
	assert.equal(parseModelJson('{"intent":"hack"}').intent, 'chat');
	assert.throws(() => parseModelJson('not json'));
});
