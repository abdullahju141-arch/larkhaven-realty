import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import ListingCard, { SaveButton } from '../components/ListingCard.jsx';
import { useAuth } from '../auth.jsx';
import { api, area, askLark, img, price, srcSet, statusLabel, typeLabel, useApi, useTitle } from '../lib.js';
import NotFound from './NotFound.jsx';

function Gallery({ images, title }) {
	const [index, setIndex] = useState(0);
	useEffect(() => setIndex(0), [images]);
	if (!images.length) return null;
	return (
		<div className="gallery">
			<div className="gallery__main">
				<img src={img(images[index], 1200, 760)} srcSet={srcSet(images[index], 1200, 760)} alt={`${title}, photo ${index + 1} of ${images.length}`} width="1200" height="760" />
				<span className="gallery__count">{index + 1} / {images.length}</span>
				{images.length > 1 && (
					<>
						<button type="button" className="gallery__nav gallery__nav--prev" onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Previous photo">‹</button>
						<button type="button" className="gallery__nav gallery__nav--next" onClick={() => setIndex((index + 1) % images.length)} aria-label="Next photo">›</button>
					</>
				)}
			</div>
			<div className="gallery__thumbs">
				{images.map((src, i) => (
					<button key={src + i} type="button" className={i === index ? 'is-active' : ''} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === index}>
						<img src={img(src, 220, 150)} alt="" loading="lazy" width="220" height="150" />
					</button>
				))}
			</div>
		</div>
	);
}

function EnquiryForm({ listing }) {
	const { user } = useAuth();
	const [form, setForm] = useState({ name: '', email: '', phone: '', message: `I’d like to arrange a viewing of “${listing.title}”.`, website: '' });
	const [state, setState] = useState({ sending: false, sent: false, error: '' });
	useEffect(() => {
		if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
	}, [user]);

	const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

	async function submit(event) {
		event.preventDefault();
		setState({ sending: true, sent: false, error: '' });
		try {
			await api('/api/enquiries', { method: 'POST', body: { ...form, listingId: listing.id } });
			setState({ sending: false, sent: true, error: '' });
		} catch (error) {
			setState({ sending: false, sent: false, error: error.message });
		}
	}

	if (state.sent) {
		return (
			<div className="notice notice--ok" role="status">
				<strong>Thanks, your enquiry has been sent.</strong> {listing.agent?.name || 'An agent'} will reply within one working day.
			</div>
		);
	}

	return (
		<form className="form" onSubmit={submit}>
			<p className="form__trap" aria-hidden="true">
				<label>Leave empty <input tabIndex={-1} autoComplete="off" {...field('website')} /></label>
			</p>
			<label><span>Name</span><input required autoComplete="name" {...field('name')} /></label>
			<label><span>Email</span><input required type="email" autoComplete="email" {...field('email')} /></label>
			<label><span>Phone <em>(optional)</em></span><input type="tel" autoComplete="tel" {...field('phone')} /></label>
			<label><span>Message</span><textarea rows="4" {...field('message')} /></label>
			{state.error && <p className="notice notice--error" role="alert">{state.error}</p>}
			<button className="btn btn--dark btn--block" type="submit" disabled={state.sending}>
				{state.sending ? 'Sending…' : 'Request a viewing'}
			</button>
		</form>
	);
}

export default function Property({ slug }) {
	const { data, error, loading } = useApi(`/api/listings/${encodeURIComponent(slug)}`, slug);
	const listing = data?.listing;
	useTitle(listing?.title || 'Property');

	if (error?.status === 404) return <NotFound />;
	if (error) return <div className="wrap section"><p className="notice notice--error">{error.message}</p></div>;
	if (loading || !listing) return <div className="wrap section"><div className="card card--skeleton card--tall" /></div>;

	const featureNames = listing.features || [];

	return (
		<>
			<section className="section section--property">
				<div className="wrap">
					<nav className="crumbs" aria-label="Breadcrumb">
						<a href="/listings">Homes for sale</a>
						<span aria-hidden="true">/</span>
						<a href={`/listings?city=${encodeURIComponent(listing.city)}`}>{listing.city}</a>
					</nav>

					<div className="property">
						<div className="property__main">
							<Gallery images={listing.images || []} title={listing.title} />

							<div className="property__head">
								<div>
									<p className="eyebrow">{typeLabel(listing.type)} · {statusLabel(listing.status)}</p>
									<h1>{listing.title}</h1>
									<p className="property__place"><Icon name="pin" size={17} />{listing.address}</p>
								</div>
								<SaveButton listing={listing} className="save--big" />
							</div>

							<ul className="stats">
								<li><Icon name="bed" /><strong>{listing.beds}</strong> bedrooms</li>
								<li><Icon name="bath" /><strong>{listing.baths}</strong> bathrooms</li>
								<li><Icon name="area" /><strong>{listing.area?.toLocaleString('en-US')}</strong> sq ft</li>
								<li><Icon name="garage" /><strong>{listing.garage || 0}</strong> parking</li>
								{listing.yearBuilt ? <li><Icon name="calendar" /><strong>{listing.yearBuilt}</strong> built</li> : null}
							</ul>

							<h2>About this home</h2>
							<p className="property__desc">{listing.description}</p>

							{featureNames.length > 0 && (
								<>
									<h2>Features</h2>
									<ul className="tags">
										{featureNames.map((f) => <li key={f}><Icon name="check" size={16} />{f.replace(/-/g, ' ')}</li>)}
									</ul>
								</>
							)}

							<button type="button" className="ask-box" onClick={() => askLark(`Show me homes similar to “${listing.title}” in ${listing.city}`)}>
								<Icon name="sparkle" size={20} />
								<span><strong>Not quite right?</strong> Ask Lark to find similar homes.</span>
								<Icon name="arrow" size={18} />
							</button>
						</div>

						<aside className="property__side">
							<div className="panel">
								<p className="panel__price">{price(listing.price)}</p>
								<p className="panel__meta">{area(listing.area)} · {listing.city}</p>
								{listing.agent && (
									<div className="agent">
										<span className="agent__avatar" aria-hidden="true">{listing.agent.name.split(' ').map((n) => n[0]).join('')}</span>
										<div>
											<strong>{listing.agent.name}</strong>
											<small>{listing.agent.title}, Larkhaven Realty</small>
										</div>
									</div>
								)}
								<h2 className="panel__title">Book a viewing</h2>
								<EnquiryForm listing={listing} />
							</div>
						</aside>
					</div>
				</div>
			</section>

			{data.similar?.length > 0 && (
				<section className="section section--tint">
					<div className="wrap">
						<h2>More homes in {listing.city}</h2>
						<div className="grid">
							{data.similar.map((l) => <ListingCard key={l.id} listing={l} />)}
						</div>
					</div>
				</section>
			)}
		</>
	);
}
