import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import { Footer, Header } from './components/Layout.jsx';
import { onLinkClick, useLocation } from './lib.js';
import { AuthPage, Saved } from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';
import Listings from './pages/Listings.jsx';
import NotFound from './pages/NotFound.jsx';
import Property from './pages/Property.jsx';

function Page() {
	const { path } = useLocation();
	if (path === '/') return <Home />;
	if (path === '/listings') return <Listings />;
	const property = /^\/listings\/([^/]+)\/?$/.exec(path);
	if (property) return <Property slug={decodeURIComponent(property[1])} />;
	if (path === '/login') return <AuthPage mode="login" />;
	if (path === '/register') return <AuthPage mode="register" />;
	if (path === '/saved') return <Saved />;
	if (path === '/admin') return <Admin />;
	return <NotFound />;
}

function App() {
	const { path } = useLocation();
	return (
		<AuthProvider>
			<div className="app" onClick={onLinkClick}>
				<a className="skip" href="#main">Skip to content</a>
				<Header />
				<main id="main">
					<Page />
				</main>
				<Footer />
				{path !== '/admin' && <ChatWidget />}
			</div>
		</AuthProvider>
	);
}

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
