import { useTitle } from '../lib.js';

export default function NotFound() {
	useTitle('Page not found');
	return (
		<section className="section auth">
			<div className="auth__box">
				<h1>We couldn’t find that page</h1>
				<p className="auth__lead">The home may have been sold, or the link may be out of date.</p>
				<a className="btn btn--dark" href="/listings">Browse homes for sale</a>
			</div>
		</section>
	);
}
