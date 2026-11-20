import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';
import Icon from './Icon.jsx';
import ListingCard from './ListingCard.jsx';

const STORE_KEY = 'larkhaven.chat';
const SUGGESTIONS = ['3-bed house in Millbrook under $600k', 'Apartment with a balcony in Northgate', 'Something by the water with a pool', 'How do I book a viewing?'];

const WELCOME = {
	role: 'assistant',
	text: 'Hi, I’m Lark. Tell me what you’re looking for and I’ll search our homes for you. You can mention a town, a budget, bedrooms or features.',
};

function load() {
	try {
		const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
		if (saved && Array.isArray(saved.messages)) return saved;
	} catch {
		// Ignore unreadable storage.
	}
	return { messages: [WELCOME], context: {} };
}

function save(state) {
	try {
		sessionStorage.setItem(STORE_KEY, JSON.stringify({ messages: state.messages.slice(-30), context: state.context }));
	} catch {
		// Storage can be unavailable; the chat still works for this page view.
	}
}

export default function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [state, setState] = useState(load);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [aiOn, setAiOn] = useState(null);
	const listRef = useRef(null);
	const inputRef = useRef(null);
	const buttonRef = useRef(null);

	useEffect(() => save(state), [state]);

	useEffect(() => {
		api('/api/chat/status')
			.then((d) => setAiOn(d.ai))
			.catch(() => setAiOn(false));
	}, []);

	useEffect(() => {
		if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
	}, [state.messages, busy, open]);

	const send = useCallback(
		async (text) => {
			const message = String(text || '').trim();
			if (!message || busy) return;
			setInput('');
			const history = state.messages.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, text: m.text }));
			setState((s) => ({ ...s, messages: [...s.messages, { role: 'user', text: message }] }));
			setBusy(true);
			try {
				const d = await api('/api/chat', { method: 'POST', body: { message, history, context: state.context } });
				setState((s) => ({
					messages: [...s.messages, { role: 'assistant', text: d.reply, listings: d.listings, total: d.total, searchUrl: d.searchUrl }],
					context: d.filters || s.context,
				}));
			} catch (error) {
				setState((s) => ({ ...s, messages: [...s.messages, { role: 'assistant', text: error.message, error: true }] }));
			} finally {
				setBusy(false);
				inputRef.current?.focus();
			}
		},
		[busy, state],
	);

	// Other parts of the site can open the chat (and send a message) with askLark().
	useEffect(() => {
		function onOpen(event) {
			setOpen(true);
			const message = event.detail?.message;
			if (message) send(message);
			else setTimeout(() => inputRef.current?.focus(), 50);
		}
		window.addEventListener('lark:open', onOpen);
		return () => window.removeEventListener('lark:open', onOpen);
	}, [send]);

	useEffect(() => {
		if (!open) return undefined;
		const onKey = (e) => {
			if (e.key === 'Escape') {
				setOpen(false);
				buttonRef.current?.focus();
			}
		};
		document.addEventListener('keydown', onKey);
		setTimeout(() => inputRef.current?.focus(), 50);
		return () => document.removeEventListener('keydown', onKey);
	}, [open]);

	function reset() {
		setState({ messages: [WELCOME], context: {} });
	}

	const onlyWelcome = state.messages.length === 1;

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				className={`chat-fab ${open ? 'is-hidden' : ''}`}
				onClick={() => setOpen(true)}
				aria-label="Open the property assistant"
			>
				<Icon name="sparkle" size={22} />
				<span>Ask Lark</span>
			</button>

			{open && (
				<section className="chat" role="dialog" aria-label="Property assistant">
					<header className="chat__head">
						<span className="chat__avatar" aria-hidden="true"><Icon name="sparkle" size={20} /></span>
						<div>
							<p className="chat__name">Lark</p>
							<p className="chat__sub">
								{aiOn === null ? 'Property assistant' : aiOn ? 'AI property assistant' : 'Basic mode'}
							</p>
						</div>
						<button type="button" className="chat__reset" onClick={reset}>New chat</button>
						<button type="button" className="chat__close" onClick={() => { setOpen(false); buttonRef.current?.focus(); }} aria-label="Close the assistant">
							<Icon name="close" size={20} />
						</button>
					</header>

					<div className="chat__list" ref={listRef} aria-live="polite">
						{state.messages.map((m, i) => (
							<div key={i} className={`msg msg--${m.role} ${m.error ? 'msg--error' : ''}`}>
								<p className="msg__text">{m.text}</p>
								{m.listings?.length > 0 && (
									<div className="msg__cards">
										{m.listings.map((l) => <ListingCard key={l.id} listing={l} compact />)}
									</div>
								)}
								{m.searchUrl && m.total > (m.listings?.length || 0) && (
									<a className="msg__more" href={m.searchUrl}>
										See all {m.total} results <Icon name="arrow" size={16} />
									</a>
								)}
							</div>
						))}
						{busy && (
							<div className="msg msg--assistant msg--typing" aria-label="Lark is typing">
								<span /><span /><span />
							</div>
						)}
						{onlyWelcome && (
							<div className="chat__chips">
								{SUGGESTIONS.map((s) => (
									<button key={s} type="button" onClick={() => send(s)}>{s}</button>
								))}
							</div>
						)}
					</div>

					<form
						className="chat__form"
						onSubmit={(e) => {
							e.preventDefault();
							send(input);
						}}
					>
						<label className="sr-only" htmlFor="chat-input">Message</label>
						<input
							id="chat-input"
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="e.g. 2-bed apartment under $400k"
							maxLength={500}
							autoComplete="off"
						/>
						<button type="submit" disabled={busy || !input.trim()} aria-label="Send">
							<Icon name="send" size={20} />
						</button>
					</form>
					<p className="chat__note">Lark only shows homes listed on this site. Answers are general information, not financial or legal advice.</p>
				</section>
			)}
		</>
	);
}
