/**
 * In-memory data store with the same interface as the MongoDB store.
 * Used when MONGODB_URI is empty (local trying-out) and by the tests.
 * Data is lost when the server restarts.
 */

import crypto from 'node:crypto';

function getPath(doc, path) {
	return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), doc);
}

/** Supports the subset of MongoDB query syntax the app uses. */
export function matches(doc, query) {
	for (const [key, condition] of Object.entries(query)) {
		if (key === '$or') {
			if (!condition.some((sub) => matches(doc, sub))) return false;
			continue;
		}
		const value = getPath(doc, key);
		if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
			for (const [op, arg] of Object.entries(condition)) {
				if (op === '$gte' && !(value >= arg)) return false;
				if (op === '$lte' && !(value <= arg)) return false;
				if (op === '$gt' && !(value > arg)) return false;
				if (op === '$lt' && !(value < arg)) return false;
				if (op === '$ne' && value === arg) return false;
				if (op === '$in' && !(Array.isArray(value) ? value.some((v) => arg.includes(v)) : arg.includes(value))) return false;
				if (op === '$all' && !(Array.isArray(value) && arg.every((v) => value.includes(v)))) return false;
				if (op === '$regex' && !new RegExp(arg, condition.$options || '').test(String(value ?? ''))) return false;
			}
		} else if (Array.isArray(value)) {
			if (!value.includes(condition)) return false;
		} else if (value !== condition) {
			return false;
		}
	}
	return true;
}

function sortDocs(docs, sort = {}) {
	const keys = Object.entries(sort);
	return docs.sort((a, b) => {
		for (const [key, dir] of keys) {
			const av = a[key] instanceof Date ? a[key].getTime() : a[key];
			const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
			if (av < bv) return -1 * dir;
			if (av > bv) return 1 * dir;
		}
		return 0;
	});
}

const clone = (doc) => (doc ? structuredClone(doc) : null);

function collection() {
	const rows = new Map();
	return {
		async find(query = {}, { sort, skip = 0, limit = 0 } = {}) {
			let docs = [...rows.values()].filter((d) => matches(d, query));
			docs = sortDocs(docs, sort);
			docs = docs.slice(skip, limit ? skip + limit : undefined);
			return docs.map(clone);
		},
		async count(query = {}) {
			return [...rows.values()].filter((d) => matches(d, query)).length;
		},
		async findOne(query) {
			return clone([...rows.values()].find((d) => matches(d, query)));
		},
		async findById(id) {
			return clone(rows.get(String(id)));
		},
		async create(data) {
			const id = crypto.randomBytes(12).toString('hex');
			const now = new Date();
			const doc = { createdAt: now, ...structuredClone(data), id, updatedAt: now };
			rows.set(id, doc);
			return clone(doc);
		},
		async update(id, data) {
			const doc = rows.get(String(id));
			if (!doc) return null;
			Object.assign(doc, structuredClone(data), { updatedAt: new Date() });
			return clone(doc);
		},
		async remove(id) {
			return rows.delete(String(id));
		},
		async insertMany(list) {
			for (const item of list) {
				await this.create(item);
			}
		},
		async clear() {
			rows.clear();
		},
	};
}

export async function createMemoryStore() {
	return {
		kind: 'memory',
		listings: collection(),
		users: collection(),
		enquiries: collection(),
		async close() {},
	};
}
