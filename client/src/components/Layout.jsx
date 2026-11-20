import { useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { askLark, useLocation } from '../lib.js';
import Icon from './Icon.jsx';

function Logo() {
	return (
		<a className="logo" href="/" aria-label="Larkhaven Realty home">
			<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
				<rect width="32" height="32" rx="9" fill="currentColor" />
				<path d="M8 22V14l8-6 8 6v8" fill="none" stroke="#f7f3ec" strokeWidth="2" strokeLinejoin="round" />
				<path d="M13 22v-5h6v5" fill="none" stroke="#e9a27f" strokeWidth="2" strokeLinejoin="round" />
			</svg>
			<span>Larkhaven<em>Realty</em></span>
		</a>
	);
}

export function Header() {
	const { user, logout } = useAuth();
	const { path } = useLocation();
	const [open, setOpen] = useState(false);
	useEffect(() => setOpen(false), [path]);

	const nav = [
		['/listings', 'Buy'],
		['/#towns', 'Areas'],
		['/saved', 'Saved'],
	];
	if (user?.role === 'admin') nav.push(['/admin', 'Admin']);

	return (
		<header className="header">
			<div className="wrap header__inner">
				<Logo />
				<button className="menu-btn" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
					<span aria-hidden="true" />
					<span className="sr-only">Menu</span>
				</button>
				<nav id="site-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
					<ul>
						{nav.map(([href, label]) => (
							<li key={href}>
								<a href={href} aria-current={path === href ? 'page' : undefined}>{label}</a>
							</li>
						))}
					</ul>
					<div className="nav__actions">
						{path !== '/admin' && (
							<button type="button" className="btn btn--ghost btn--sm" onClick={() => askLark()}>
								<Icon name="sparkle" size={18} />Ask Lark
							</button>
						)}
						{user ? (
							<button type="button" className="btn btn--sm btn--plain" onClick={logout}>
								Log out
							</button>
						) : (
							<a className="btn btn--sm btn--dark" href="/login">Log in</a>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
}

export function Footer() {
	return (
		<footer className="footer">
			<div className="wrap footer__grid">
				<div>
					<p className="footer__brand">Larkhaven Realty</p>
					<p>Homes for sale across Larkhaven Valley, with an AI assistant that searches real listings for you.</p>
				</div>
				<div>
					<h2>Browse</h2>
					<ul>
						<li><a href="/listings">All homes</a></li>
						<li><a href="/listings?type=house">Houses</a></li>
						<li><a href="/listings?type=apartment">Apartments</a></li>
						<li><a href="/listings?features=waterfront">Waterfront</a></li>
					</ul>
				</div>
				<div>
					<h2>Your account</h2>
					<ul>
						<li><a href="/saved">Saved homes</a></li>
						<li><a href="/login">Log in</a></li>
						<li><a href="/register">Create an account</a></li>
					</ul>
				</div>
				<div>
					<h2>Office</h2>
					<ul>
						<li>hello@larkhaven.example</li>
						<li>Monday to Saturday, 9am to 6pm</li>
					</ul>
				</div>
			</div>
			<div className="wrap footer__bottom">
				<p>Larkhaven Realty, Larkhaven Valley and all listings are fictional. Built as a MERN demo project by Muhammad Abdullah.</p>
				<p>Photos from Unsplash.</p>
			</div>
		</footer>
	);
}
