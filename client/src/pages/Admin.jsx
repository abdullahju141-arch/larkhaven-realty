import { useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { api, img, price, statusLabel, typeLabel, useApi, useTitle } from '../lib.js';

const EMPTY = {
	title: '', city: '', type: 'house', status: 'for-sale', price: '', beds: 3, baths: 2, area: '', yearBuilt: '', garage: 1,
	neighbourhood: '', address: '', description: '', images: '', features: [], featured: false, agentEmail: '',
};

function ListingForm({ id, meta, agents, onClose, onSaved }) {
	const [form, setForm] = useState(EMPTY);
	const [loading, setLoading] = useState(Boolean(id));
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!id) return;
		api(`/api/admin/listings/${id}`)
			.then(({ listing }) => setForm({ ...EMPTY, ...listing, images: (listing.images || []).join('\n'), agentEmail: listing.agent?.email || '' }))
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, [id]);

	const field = (key) => ({ value: form[key] ?? '', onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

	async function submit(event) {
		event.preventDefault();
		setSaving(true);
		setError('');
		try {
			await api(id ? `/api/admin/listings/${id}` : '/api/admin/listings', { method: id ? 'PUT' : 'POST', body: form });
			onSaved(id ? 'Listing updated.' : 'Listing added.');
		} catch (e) {
			setError(e.message);
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <p className="muted">Loading…</p>;

	return (
		<form className="form admin-form" onSubmit={submit}>
			<div className="admin-form__head">
				<h2>{id ? 'Edit listing' : 'Add a listing'}</h2>
				<button type="button" className="btn btn--plain btn--sm" onClick={onClose}>Cancel</button>
			</div>
			<label className="span-2"><span>Title</span><input required {...field('title')} /></label>
			<label>
				<span>Town</span>
				<select required {...field('city')}>
					<option value="">Choose…</option>
					{meta?.towns.map((t) => <option key={t.name}>{t.name}</option>)}
				</select>
			</label>
			<label><span>Neighbourhood</span><input {...field('neighbourhood')} /></label>
			<label className="span-2"><span>Address</span><input {...field('address')} /></label>
			<label>
				<span>Type</span>
				<select {...field('type')}>{meta?.types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}</select>
			</label>
			<label>
				<span>Status</span>
				<select {...field('status')}>{['for-sale', 'under-offer', 'sold'].map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
			</label>
			<label><span>Price ($)</span><input required type="number" min="0" {...field('price')} /></label>
			<label><span>Area (sq ft)</span><input type="number" min="0" {...field('area')} /></label>
			<label><span>Bedrooms</span><input type="number" min="0" {...field('beds')} /></label>
			<label><span>Bathrooms</span><input type="number" min="0" {...field('baths')} /></label>
			<label><span>Parking spaces</span><input type="number" min="0" {...field('garage')} /></label>
			<label><span>Year built</span><input type="number" min="1700" max="2100" {...field('yearBuilt')} /></label>
			<label>
				<span>Agent</span>
				<select {...field('agentEmail')}>{agents?.map((a) => <option key={a.email} value={a.email}>{a.name}</option>)}</select>
			</label>
			<label className="check">
				<input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
				Show on the home page
			</label>
			<fieldset className="span-2">
				<legend>Features</legend>
				<div className="chips">
					{meta &&
						Object.entries(meta.features).map(([key, label]) => {
							const on = form.features.includes(key);
							return (
								<label key={key} className={`chip ${on ? 'is-on' : ''}`}>
									<input type="checkbox" checked={on} onChange={() => setForm({ ...form, features: on ? form.features.filter((f) => f !== key) : [...form.features, key] })} />
									{label}
								</label>
							);
						})}
				</div>
			</fieldset>
			<label className="span-2">
				<span>Photos</span>
				<textarea rows="4" required placeholder="One per line: an Unsplash photo ID (e.g. 1570129477492-45c003edd2be) or an https image link" {...field('images')} />
				<small>The first photo is the cover image.</small>
			</label>
			<label className="span-2"><span>Description</span><textarea rows="6" {...field('description')} /></label>
			{error && <p className="notice notice--error span-2" role="alert">{error}</p>}
			<div className="span-2 btn-row">
				<button className="btn btn--dark" type="submit" disabled={saving}>{saving ? 'Saving…' : id ? 'Save changes' : 'Add listing'}</button>
			</div>
		</form>
	);
}

export default function Admin() {
	useTitle('Admin');
	const { user, ready } = useAuth();
	const isAdmin = user?.role === 'admin';
	const [tab, setTab] = useState('listings');
	const [editing, setEditing] = useState(null);
	const [version, setVersion] = useState(0);
	const [flash, setFlash] = useState('');
	const meta = useApi('/api/meta').data;
	const stats = useApi(isAdmin ? '/api/admin/stats' : null, `stats${version}${isAdmin}`);
	const listings = useApi(isAdmin && tab === 'listings' ? '/api/admin/listings' : null, `l${version}${tab}${isAdmin}`);
	const enquiries = useApi(isAdmin && tab === 'enquiries' ? '/api/admin/enquiries' : null, `e${version}${tab}${isAdmin}`);

	if (!ready) return null;
	if (!isAdmin) {
		return (
			<section className="section auth">
				<div className="auth__box">
					<h1>Admins only</h1>
					<p className="auth__lead">Log in with the admin account to manage listings and enquiries.</p>
					<a className="btn btn--dark" href="/login?next=/admin">Log in</a>
				</div>
			</section>
		);
	}

	const refresh = (message) => {
		setEditing(null);
		setFlash(message || '');
		setVersion((v) => v + 1);
	};

	async function remove(l) {
		if (!window.confirm(`Delete “${l.title}”? This cannot be undone.`)) return;
		try {
			await api(`/api/admin/listings/${l.id}`, { method: 'DELETE' });
			refresh('Listing deleted.');
		} catch (e) {
			setFlash(e.message);
		}
	}

	async function toggleEnquiry(e) {
		await api(`/api/admin/enquiries/${e.id}`, { method: 'PATCH', body: { status: e.status === 'new' ? 'handled' : 'new' } });
		refresh();
	}

	const s = stats.data;

	return (
		<section className="section admin">
			<div className="wrap">
				<div className="admin__head">
					<div>
						<p className="eyebrow">Dashboard</p>
						<h1>Larkhaven admin</h1>
					</div>
					<button type="button" className="btn btn--dark" onClick={() => { setTab('listings'); setEditing('new'); }}>Add listing</button>
				</div>

				<ul className="kpis">
					<li><strong>{s?.forSale ?? '–'}</strong>for sale</li>
					<li><strong>{s?.listings ?? '–'}</strong>listings in total</li>
					<li><strong>{s?.newEnquiries ?? '–'}</strong>new enquiries</li>
					<li><strong>{s?.users ?? '–'}</strong>registered users</li>
				</ul>

				{flash && <p className="notice notice--ok" role="status">{flash}</p>}

				<div className="tabs" role="tablist">
					<button type="button" role="tab" aria-selected={tab === 'listings'} onClick={() => { setTab('listings'); setEditing(null); }}>Listings</button>
					<button type="button" role="tab" aria-selected={tab === 'enquiries'} onClick={() => { setTab('enquiries'); setEditing(null); }}>
						Enquiries{s?.newEnquiries ? <span className="badge">{s.newEnquiries}</span> : null}
					</button>
				</div>

				{tab === 'listings' && editing && (
					<ListingForm key={editing} id={editing === 'new' ? null : editing} meta={meta} agents={s?.agents} onClose={() => setEditing(null)} onSaved={refresh} />
				)}

				{tab === 'listings' && !editing && (
					<div className="table-wrap">
						<table className="table">
							<thead>
								<tr><th scope="col">Home</th><th scope="col">Town</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
							</thead>
							<tbody>
								{listings.data?.items.map((l) => (
									<tr key={l.id}>
										<td>
											<div className="table__home">
												<img src={img(l.image, 96, 72)} alt="" width="48" height="36" loading="lazy" />
												<a href={`/listings/${l.slug}`}>{l.title}</a>
												{l.featured && <span className="badge badge--soft">Featured</span>}
											</div>
										</td>
										<td>{l.city}</td>
										<td>{price(l.price)}</td>
										<td><span className={`status status--${l.status}`}>{statusLabel(l.status)}</span></td>
										<td className="table__actions">
											<button type="button" className="icon-btn" onClick={() => setEditing(l.id)} aria-label={`Edit ${l.title}`}><Icon name="edit" size={18} /></button>
											<button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(l)} aria-label={`Delete ${l.title}`}><Icon name="trash" size={18} /></button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{tab === 'enquiries' && (
					<div className="enquiries">
						{enquiries.data?.items.length === 0 && <p className="muted">No enquiries yet. They appear here when visitors use the form on a property page.</p>}
						{enquiries.data?.items.map((e) => (
							<article key={e.id} className={`enquiry ${e.status === 'new' ? 'is-new' : ''}`}>
								<header>
									<strong>{e.name}</strong>
									<a href={`mailto:${e.email}`}>{e.email}</a>
									{e.phone && <span>{e.phone}</span>}
									<time dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleString()}</time>
								</header>
								{e.listingTitle && <p className="enquiry__about">About: {e.listingTitle}</p>}
								{e.message && <p>{e.message}</p>}
								<button type="button" className="btn btn--plain btn--sm" onClick={() => toggleEnquiry(e)}>
									{e.status === 'new' ? 'Mark as handled' : 'Mark as new'}
								</button>
							</article>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
