import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { img, navigate, price, srcSet, statusLabel, typeLabel } from '../lib.js';
import Icon from './Icon.jsx';

export function SaveButton({ listing, className = '' }) {
	const { user, toggleFavourite } = useAuth();
	const [busy, setBusy] = useState(false);
	const saved = Boolean(user?.favourites?.includes(listing.id));

	async function onClick(event) {
		event.preventDefault();
		event.stopPropagation();
		if (!user) {
			navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			return;
		}
		setBusy(true);
		try {
			await toggleFavourite(listing.id);
		} finally {
			setBusy(false);
		}
	}

	return (
		<button
			type="button"
			className={`save ${saved ? 'is-saved' : ''} ${className}`}
			onClick={onClick}
			disabled={busy}
			aria-pressed={saved}
			aria-label={saved ? `Remove ${listing.title} from saved homes` : `Save ${listing.title}`}
		>
			<Icon name="heart" size={20} />
		</button>
	);
}

export default function ListingCard({ listing, compact = false }) {
	return (
		<article className={`card ${compact ? 'card--compact' : ''}`}>
			<a className="card__link" href={`/listings/${listing.slug}`}>
				<div className="card__media">
					<img
						src={img(listing.image, compact ? 320 : 640, compact ? 220 : 440)}
						srcSet={srcSet(listing.image, compact ? 320 : 640, compact ? 220 : 440)}
						alt=""
						loading="lazy"
						width={compact ? 320 : 640}
						height={compact ? 220 : 440}
					/>
					<span className="card__tag">{listing.status === 'for-sale' ? typeLabel(listing.type) : statusLabel(listing.status)}</span>
				</div>
				<div className="card__body">
					<p className="card__price">{price(listing.price)}</p>
					<h3 className="card__title">{listing.title}</h3>
					<p className="card__place">
						<Icon name="pin" size={15} />
						{listing.neighbourhood}, {listing.city}
					</p>
					{!compact && (
						<ul className="facts" aria-label="Key facts">
							<li><Icon name="bed" size={17} />{listing.beds} bed</li>
							<li><Icon name="bath" size={17} />{listing.baths} bath</li>
							{listing.area ? <li><Icon name="area" size={17} />{listing.area.toLocaleString('en-US')} sq ft</li> : null}
						</ul>
					)}
				</div>
			</a>
			{!compact && <SaveButton listing={listing} className="card__save" />}
		</article>
	);
}
