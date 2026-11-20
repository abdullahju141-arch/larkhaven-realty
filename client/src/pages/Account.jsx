import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { navigate, useApi, useLocation, useTitle } from '../lib.js';

function safeNext(next) {
	return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export function AuthPage({ mode }) {
	const isLogin = mode === 'login';
	useTitle(isLogin ? 'Log in' : 'Create an account');
	const { login, register } = useAuth();
	const { query } = useLocation();
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

	async function submit(event) {
		event.preventDefault();
		setBusy(true);
		setError('');
		try {
			const user = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
			navigate(query.next ? safeNext(query.next) : user.role === 'admin' ? '/admin' : '/saved');
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
		}
	}

	const switchHref = `${isLogin ? '/register' : '/login'}${query.next ? `?next=${encodeURIComponent(query.next)}` : ''}`;

	return (
		<section className="section auth">
			<div className="auth__box">
				<h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
				<p className="auth__lead">{isLogin ? 'Log in to see your saved homes.' : 'Save homes you like and come back to them any time.'}</p>
				<form className="form" onSubmit={submit}>
					{!isLogin && <label><span>Name</span><input required autoComplete="name" {...field('name')} /></label>}
					<label><span>Email</span><input required type="email" autoComplete="email" {...field('email')} /></label>
					<label>
						<span>Password</span>
						<input required type="password" minLength={isLogin ? undefined : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} {...field('password')} />
						{!isLogin && <small>At least 8 characters.</small>}
					</label>
					{error && <p className="notice notice--error" role="alert">{error}</p>}
					<button className="btn btn--dark btn--block" type="submit" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
				</form>
				<p className="auth__switch">
					{isLogin ? 'New here?' : 'Already have an account?'} <a href={switchHref}>{isLogin ? 'Create an account' : 'Log in'}</a>
				</p>
			</div>
		</section>
	);
}

export function Saved() {
	useTitle('Saved homes');
	const { user, ready } = useAuth();
	const favourites = user?.favourites?.join(',') || '';
	const { data, error } = useApi(user ? '/api/favourites' : null, favourites);

	if (!ready) return null;
	if (!user) {
		return (
			<section className="section auth">
				<div className="auth__box">
					<h1>Saved homes</h1>
					<p className="auth__lead">Log in or create a free account to save homes and compare them later.</p>
					<div className="btn-row">
						<a className="btn btn--dark" href="/login?next=/saved">Log in</a>
						<a className="btn btn--ghost" href="/register?next=/saved">Create an account</a>
					</div>
				</div>
			</section>
		);
	}

	return (
		<>
			<section className="banner">
				<div className="wrap">
					<p className="eyebrow">Hi {user.name.split(' ')[0]}</p>
					<h1>Your saved homes</h1>
				</div>
			</section>
			<section className="section">
				<div className="wrap">
					{error && <p className="notice notice--error">{error.message}</p>}
					{data && data.items.length === 0 && (
						<div className="empty">
							<h2>Nothing saved yet</h2>
							<p>Tap the heart on any home to keep it here.</p>
							<a className="btn btn--dark" href="/listings">Browse homes</a>
						</div>
					)}
					<div className="grid">{data?.items.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
				</div>
			</section>
		</>
	);
}
