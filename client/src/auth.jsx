import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './lib.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [ready, setReady] = useState(!getToken());

	useEffect(() => {
		if (!getToken()) return;
		api('/api/auth/me')
			.then((d) => setUser(d.user))
			.catch(() => setToken(''))
			.finally(() => setReady(true));
	}, []);

	const login = useCallback(async (email, password) => {
		const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
		setToken(d.token);
		setUser(d.user);
		return d.user;
	}, []);

	const register = useCallback(async (name, email, password) => {
		const d = await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
		setToken(d.token);
		setUser(d.user);
		return d.user;
	}, []);

	const logout = useCallback(() => {
		setToken('');
		setUser(null);
	}, []);

	const toggleFavourite = useCallback(
		async (listingId) => {
			if (!user) return false;
			const saved = user.favourites.includes(listingId);
			const d = await api(`/api/favourites/${listingId}`, { method: saved ? 'DELETE' : 'POST' });
			setUser((u) => ({ ...u, favourites: d.favourites }));
			return !saved;
		},
		[user],
	);

	const value = useMemo(() => ({ user, ready, login, register, logout, toggleFavourite }), [user, ready, login, register, logout, toggleFavourite]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
