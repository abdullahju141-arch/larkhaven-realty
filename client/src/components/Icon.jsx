const PATHS = {
	bed: <><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" /><path d="M3 15h18M3 18v2M21 18v2M7 9V6h4v3" /></>,
	bath: <><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M6 12V6a2 2 0 0 1 3.500-1.300M7 19l-1 2M17 19l1 2" /></>,
	area: <><path d="M4 4h6M4 4v6M20 20h-6M20 20v-6M4 4l6 6M20 20l-6-6" /></>,
	pin: <><path d="M12 21s-6.500-5.800-6.500-11a6.500 6.500 0 0 1 13 0c0 5.200-6.500 11-6.500 11z" /><circle cx="12" cy="10" r="2.300" /></>,
	heart: <path d="M12 20s-7.500-4.500-7.500-10.200A4.300 4.300 0 0 1 12 7.400a4.300 4.300 0 0 1 7.500 2.400C19.500 15.500 12 20 12 20z" />,
	search: <><circle cx="11" cy="11" r="6.500" /><path d="M20 20l-4.300-4.300" /></>,
	chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
	close: <path d="M6 6l12 12M18 6L6 18" />,
	send: <path d="M4 12l16-8-6 16-2.500-6.500z" />,
	sparkle: <><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z" /><path d="M19 16l.7 1.800 1.800.7-1.800.7L19 21l-.7-1.800-1.800-.7 1.800-.7z" /></>,
	user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7" /></>,
	arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
	garage: <><path d="M3 10l9-6 9 6v10H3z" /><path d="M7 20v-7h10v7M7 16h10" /></>,
	calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
	filter: <path d="M4 6h16M7 12h10M10 18h4" />,
	check: <path d="M5 12.500l4.500 4.500L19 7.500" />,
	edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>,
	trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
	home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
};

export default function Icon({ name, size = 20, className = '', label }) {
	return (
		<svg
			className={`icon ${className}`}
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={label ? undefined : 'true'}
			role={label ? 'img' : undefined}
			aria-label={label}
		>
			{PATHS[name]}
		</svg>
	);
}
