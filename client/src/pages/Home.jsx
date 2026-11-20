import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { askLark, img, navigate, srcSet, typeLabel, useApi, useTitle } from '../lib.js';

const HERO = '1721149122657-7b5440f39160';
const PROMPTS = ['A family home with a garden under $600k', 'Waterfront villa with a pool', 'A cosy cabin with a fireplace', 'What fees do buyers pay?'];

function HeroSearch({ meta }) {
	const [city, setCity] = useState('');
	const [type, setType] = useState('');
	const [maxPrice, setMaxPrice] = useState('');

	function submit(event) {
		event.preventDefault();
		const params = new URLSearchParams();
		if (city) params.set('city', city);
		if (type) params.set('type', type);
		if (maxPrice) params.set('maxPrice', maxPrice);
		navigate(`/listings${params.toString() ? `?${params}` : ''}`);
	}

	return (
		<form className="hero-search" onSubmit={submit} aria-label="Search homes">
			<label>
				<span>Town</span>
				<select value={city} onChange={(e) => setCity(e.target.value)}>
					<option value="">Anywhere</option>
					{meta?.towns.map((t) => <option key={t.name}>{t.name}</option>)}
				</select>
			</label>
			<label>
				<span>Type</span>
				<select value={type} onChange={(e) => setType(e.target.value)}>
					<option value="">Any type</option>
					{meta?.types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
				</select>
			</label>
			<label>
				<span>Max price</span>
				<select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
					<option value="">No limit</option>
					{[300000, 400000, 500000, 600000, 800000, 1000000, 1500000, 2000000].map((p) => (
						<option key={p} value={p}>${p.toLocaleString('en-US')}</option>
					))}
				</select>
			</label>
			<button className="btn btn--accent" type="submit">
				<Icon name="search" size={18} />Search
			</button>
		</form>
	);
}

export default function Home() {
	useTitle('');
	const meta = useApi('/api/meta').data;
	const featured = useApi('/api/listings?featured=1&limit=6');

	return (
		<>
			<section className="hero">
				<img className="hero__img" src={img(HERO, 1600, 900)} srcSet={srcSet(HERO, 1600, 900)} alt="" fetchPriority="high" />
				<div className="wrap hero__inner">
					<p className="eyebrow eyebrow--light">Homes for sale in Larkhaven Valley</p>
					<h1>Find the home that fits your life</h1>
					<p className="hero__lead">Search by town, type and budget, or just describe what you want and let Lark, our AI assistant, find it.</p>
					<HeroSearch meta={meta} />
					<button type="button" className="hero__ask" onClick={() => askLark()}>
						<Icon name="sparkle" size={18} />
						Or describe your ideal home to Lark
					</button>
				</div>
			</section>

			<section className="section">
				<div className="wrap">
					<div className="section__head">
						<div>
							<p className="eyebrow">Featured</p>
							<h2>Homes we love this month</h2>
						</div>
						<a className="link-arrow" href="/listings">View all homes <Icon name="arrow" size={18} /></a>
					</div>
					{featured.error && <p className="notice notice--error">{featured.error.message}</p>}
					<div className="grid">
						{featured.loading && !featured.data
							? Array.from({ length: 6 }, (_, i) => <div key={i} className="card card--skeleton" />)
							: featured.data?.items.map((l) => <ListingCard key={l.id} listing={l} />)}
					</div>
				</div>
			</section>

			<section className="section section--tint ai-band">
				<div className="wrap ai-band__inner">
					<div>
						<p className="eyebrow">Meet Lark</p>
						<h2>Search the way you talk</h2>
						<p>Lark understands requests like “3 bedrooms near the beach, under $900k” and searches our real listings. If nothing matches exactly, it shows the closest homes and tells you what it changed.</p>
						<ul className="ticks">
							<li><Icon name="check" size={18} />Only shows homes that are actually listed</li>
							<li><Icon name="check" size={18} />Remembers what you asked, so you can refine</li>
							<li><Icon name="check" size={18} />Answers questions about viewings, offers and fees</li>
						</ul>
					</div>
					<div className="prompt-list">
						<p className="prompt-list__label">Try asking</p>
						{PROMPTS.map((p) => (
							<button key={p} type="button" onClick={() => askLark(p)}>
								<span>“{p}”</span>
								<Icon name="arrow" size={18} />
							</button>
						))}
					</div>
				</div>
			</section>

			<section className="section" id="towns">
				<div className="wrap">
					<div className="section__head">
						<div>
							<p className="eyebrow">Areas</p>
							<h2>Five towns, one valley</h2>
						</div>
					</div>
					<div className="towns">
						{meta?.towns.map((t) => (
							<a key={t.name} className="town" href={`/listings?city=${encodeURIComponent(t.name)}`}>
								<img src={img(t.photo, 520, 640)} srcSet={srcSet(t.photo, 520, 640)} alt="" loading="lazy" />
								<span className="town__body">
									<strong>{t.name}</strong>
									<small>{t.blurb}</small>
									<em>{t.count} {t.count === 1 ? 'home' : 'homes'} for sale</em>
								</span>
							</a>
						))}
					</div>
				</div>
			</section>

			<section className="section section--flush">
				<div className="wrap cta">
					<div>
						<h2>Thinking of selling?</h2>
						<p>Get a free valuation from an agent who knows your street.</p>
					</div>
					<a className="btn btn--light" href="mailto:hello@larkhaven.example">Book a valuation</a>
				</div>
			</section>
		</>
	);
}
