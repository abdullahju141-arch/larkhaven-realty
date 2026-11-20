import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { askLark, navigate, typeLabel, useApi, useLocation, useTitle } from '../lib.js';

const SORT_LABELS = { newest: 'Newest first', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', 'beds-desc': 'Most bedrooms' };
const PRICES = [200000, 300000, 400000, 500000, 600000, 800000, 1000000, 1500000, 2000000];

function setParams(current, changes) {
	const params = new URLSearchParams(current);
	for (const [key, value] of Object.entries(changes)) {
		if (value === '' || value === undefined || value === null || (Array.isArray(value) && !value.length)) params.delete(key);
		else params.set(key, Array.isArray(value) ? value.join(',') : String(value));
	}
	if (!('page' in changes)) params.delete('page');
	const qs = params.toString();
	navigate(`/listings${qs ? `?${qs}` : ''}`, { replace: true });
}

function Filters({ query, meta, onDone }) {
	const features = query.features ? query.features.split(',') : [];
	const set = (changes) => setParams(query, changes);

	return (
		<form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Filter homes">
			<label>
				<span>Town</span>
				<select value={query.city || ''} onChange={(e) => set({ city: e.target.value })}>
					<option value="">Anywhere</option>
					{meta?.towns.map((t) => <option key={t.name}>{t.name}</option>)}
				</select>
			</label>
			<label>
				<span>Property type</span>
				<select value={query.type || ''} onChange={(e) => set({ type: e.target.value })}>
					<option value="">Any type</option>
					{meta?.types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
				</select>
			</label>
			<div className="filters__row">
				<label>
					<span>Min price</span>
					<select value={query.minPrice || ''} onChange={(e) => set({ minPrice: e.target.value })}>
						<option value="">No min</option>
						{PRICES.map((p) => <option key={p} value={p}>${p.toLocaleString('en-US')}</option>)}
					</select>
				</label>
				<label>
					<span>Max price</span>
					<select value={query.maxPrice || ''} onChange={(e) => set({ maxPrice: e.target.value })}>
						<option value="">No max</option>
						{PRICES.map((p) => <option key={p} value={p}>${p.toLocaleString('en-US')}</option>)}
					</select>
				</label>
			</div>
			<div className="filters__row">
				<label>
					<span>Bedrooms</span>
					<select value={query.beds || ''} onChange={(e) => set({ beds: e.target.value })}>
						<option value="">Any</option>
						{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
					</select>
				</label>
				<label>
					<span>Bathrooms</span>
					<select value={query.baths || ''} onChange={(e) => set({ baths: e.target.value })}>
						<option value="">Any</option>
						{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
					</select>
				</label>
			</div>
			<fieldset>
				<legend>Features</legend>
				<div className="chips">
					{meta &&
						Object.entries(meta.features).map(([key, label]) => {
							const on = features.includes(key);
							return (
								<label key={key} className={`chip ${on ? 'is-on' : ''}`}>
									<input
										type="checkbox"
										checked={on}
										onChange={() => set({ features: on ? features.filter((f) => f !== key) : [...features, key] })}
									/>
									{label}
								</label>
							);
						})}
				</div>
			</fieldset>
			<div className="filters__actions">
				<button type="button" className="btn btn--plain btn--sm" onClick={() => navigate('/listings', { replace: true })}>Clear all</button>
				{onDone && <button type="button" className="btn btn--dark btn--sm" onClick={onDone}>Show homes</button>}
			</div>
		</form>
	);
}

export default function Listings() {
	useTitle('Homes for sale');
	const { query, search } = useLocation();
	const meta = useApi('/api/meta').data;
	const { data, error, loading } = useApi(`/api/listings${search}`, search);
	const [showFilters, setShowFilters] = useState(false);
	useEffect(() => setShowFilters(false), [search]);

	const page = data?.page || 1;
	const active = Object.keys(data?.filters || {}).length;

	return (
		<>
			<section className="banner">
				<div className="wrap">
					<p className="eyebrow">Buy</p>
					<h1>Homes for sale in Larkhaven Valley</h1>
					<p className="banner__lead">
						Use the filters, or{' '}
						<button type="button" className="inline-link" onClick={() => askLark()}>describe what you want to Lark</button>.
					</p>
				</div>
			</section>

			<section className="section section--shop">
				<div className="wrap shop">
					<aside className={`shop__filters ${showFilters ? 'is-open' : ''}`}>
						<Filters query={query} meta={meta} onDone={showFilters ? () => setShowFilters(false) : null} />
					</aside>

					<div className="shop__results">
						<div className="toolbar">
							<p className="toolbar__count" aria-live="polite">
								{loading && !data ? 'Loading homes…' : `${data?.total ?? 0} ${data?.total === 1 ? 'home' : 'homes'} found`}
							</p>
							<button type="button" className="btn btn--plain btn--sm toolbar__filters" onClick={() => setShowFilters(true)}>
								<Icon name="filter" size={18} />Filters{active ? ` (${active})` : ''}
							</button>
							<label className="toolbar__sort">
								<span className="sr-only">Sort</span>
								<select value={query.sort || 'newest'} onChange={(e) => setParams(query, { sort: e.target.value === 'newest' ? '' : e.target.value })}>
									{Object.entries(SORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
								</select>
							</label>
						</div>

						{error && <p className="notice notice--error">{error.message}</p>}

						{data && data.total === 0 && (
							<div className="empty">
								<h2>No homes match those filters</h2>
								<p>Try widening your budget or choosing another town. Lark can suggest the closest matches.</p>
								<div className="btn-row">
									<button type="button" className="btn btn--dark" onClick={() => navigate('/listings', { replace: true })}>Clear filters</button>
									<button type="button" className="btn btn--ghost" onClick={() => askLark()}><Icon name="sparkle" size={18} />Ask Lark</button>
								</div>
							</div>
						)}

						<div className={`grid grid--results ${loading ? 'is-loading' : ''}`}>
							{data?.items.map((l) => <ListingCard key={l.id} listing={l} />)}
						</div>

						{data && data.pages > 1 && (
							<nav className="pager" aria-label="Pages">
								<button type="button" disabled={page <= 1} onClick={() => setParams(query, { page: page - 1 })}>Previous</button>
								<span>Page {page} of {data.pages}</span>
								<button type="button" disabled={page >= data.pages} onClick={() => setParams(query, { page: page + 1 })}>Next</button>
							</nav>
						)}
					</div>
				</div>
			</section>
		</>
	);
}
