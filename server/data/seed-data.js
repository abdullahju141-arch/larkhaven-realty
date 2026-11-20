/**
 * Demo data for Larkhaven Realty. Larkhaven Valley, its towns and every
 * listing are fictional. Photos are Unsplash photo IDs (free Unsplash License).
 */

export const TOWNS = [
	{
		name: 'Ashford Bay',
		blurb: 'Coastal homes, a working harbour and the valley’s best sunsets.',
		photo: '1600596542815-ffad4c1539a9',
	},
	{
		name: 'Millbrook',
		blurb: 'Leafy streets, good schools and big back gardens.',
		photo: '1570129477492-45c003edd2be',
	},
	{
		name: 'Northgate',
		blurb: 'City-centre apartments close to cafés, offices and the station.',
		photo: '1545324418-cc1a3fa10c00',
	},
	{
		name: 'Cedar Hollow',
		blurb: 'Cabins and timber houses tucked into the forest.',
		photo: '1475087542963-13ab5e611954',
	},
	{
		name: 'Willow Creek',
		blurb: 'Townhouses and family homes along the creek trail.',
		photo: '1430285561322-7808604715df',
	},
];

export const TYPES = ['house', 'apartment', 'townhouse', 'villa', 'cabin'];

export const FEATURES = {
	garden: 'Garden',
	pool: 'Pool',
	garage: 'Garage',
	balcony: 'Balcony',
	fireplace: 'Fireplace',
	'home-office': 'Home office',
	waterfront: 'Waterfront',
	'new-build': 'New build',
	'pet-friendly': 'Pet friendly',
	solar: 'Solar panels',
};

export const AGENTS = [
	{ name: 'Maya Lindqvist', title: 'Senior agent', email: 'maya@larkhaven.example' },
	{ name: 'Daniel Okafor', title: 'Sales agent', email: 'daniel@larkhaven.example' },
	{ name: 'Priya Raman', title: 'Sales agent', email: 'priya@larkhaven.example' },
];

const I = {
	living: ['1583847268964-b28dc8f51f92', '1618221195710-dd6b41faaea6', '1631679706909-1844bbd07221', '1618220179428-22790b461013', '1616047006789-b7af5afb8c20', '1586023492125-27b2c045efd7', '1522708323590-d24dbb6b0267', '1560448204-e02f11c3d0e2'],
	kitchen: ['1600489000022-c2086d79f9d4', '1556911220-bff31c812dba', '1617228069096-4638a7ffc906', '1484154218962-a197022b5858', '1622372738946-62e02505feb3', '1565538810643-b5bdb714032a'],
	bed: ['1616594039964-ae9021a400a0', '1615874959474-d609969a20ed', '1616486029423-aaa4789e8c9a', '1560185893-a55cbc8c57e8'],
	bath: ['1584622650111-993a426fbf0a', '1620626011761-996317b8d101', '1507652313519-d4e9174996dd'],
};

/** Pick interior photos deterministically so each listing gets a varied set. */
function interiors(n) {
	return [I.living[n % I.living.length], I.kitchen[n % I.kitchen.length], I.bed[n % I.bed.length], I.bath[n % I.bath.length]];
}

const raw = [
	{
		title: 'Glass-fronted villa with infinity pool',
		type: 'villa', city: 'Ashford Bay', neighbourhood: 'Cliff Road', price: 1850000, beds: 5, baths: 4, area: 4200, yearBuilt: 2021, garage: 2,
		features: ['pool', 'waterfront', 'garage', 'home-office', 'solar'], featured: true, cover: '1613490493576-7fde63acd811',
		description: 'A contemporary villa set above the bay, with floor-to-ceiling glass on the sea side and an infinity pool that lines up with the horizon. The open-plan ground floor runs from a chef’s kitchen to a covered terrace. Upstairs, all five bedrooms have their own bathroom or direct access to one, and the main suite has a private balcony facing west.',
	},
	{
		title: 'Harbour-view apartment with wraparound balcony',
		type: 'apartment', city: 'Ashford Bay', neighbourhood: 'Harbourside', price: 465000, beds: 2, baths: 2, area: 1080, yearBuilt: 2018, garage: 1,
		features: ['balcony', 'waterfront', 'garage'], featured: false, cover: '1612637968894-660373e23b03',
		description: 'A bright second-floor apartment overlooking the working harbour. The living room opens onto a wraparound balcony big enough for a dining table. Both bedrooms are doubles, the main one with its own shower room, and there is a secure parking space in the basement.',
	},
	{
		title: 'Modern family house near the beach path',
		type: 'house', city: 'Ashford Bay', neighbourhood: 'Dune Lane', price: 895000, beds: 4, baths: 3, area: 2600, yearBuilt: 2015, garage: 2,
		features: ['garden', 'garage', 'pet-friendly', 'fireplace'], featured: true, cover: '1580587771525-78b9dba3b914',
		description: 'A crisp, modern family home five minutes’ walk from the beach path. There is a large kitchen-diner with doors to a south-facing garden, a snug with a wood-burning fireplace, and four bedrooms upstairs. The double garage has space for bikes and boards.',
	},
	{
		title: 'Classic porch house on a quiet avenue',
		type: 'house', city: 'Millbrook', neighbourhood: 'Elm Avenue', price: 545000, beds: 4, baths: 2, area: 2300, yearBuilt: 1998, garage: 1,
		features: ['garden', 'garage', 'pet-friendly', 'fireplace'], featured: true, cover: '1598228723793-52759bba239c',
		description: 'A well-kept family house with a covered front porch on one of Millbrook’s quietest avenues. Inside there are separate living and dining rooms, a recently updated kitchen, and four bedrooms. The back garden is mostly lawn, fully fenced, and backs onto the school playing fields.',
	},
	{
		title: 'Updated colonial with home office',
		type: 'house', city: 'Millbrook', neighbourhood: 'Orchard Way', price: 615000, beds: 5, baths: 3, area: 2850, yearBuilt: 2004, garage: 2,
		features: ['garden', 'garage', 'home-office', 'solar'], featured: false, cover: '1570129477492-45c003edd2be',
		description: 'A spacious colonial-style home updated throughout in 2023. A separate home office with its own entrance makes working from home easy. Five bedrooms, a family room off the kitchen, and solar panels that cover most of the electricity bill in summer.',
	},
	{
		title: 'Starter home with big back garden',
		type: 'house', city: 'Millbrook', neighbourhood: 'Mill Street', price: 329000, beds: 3, baths: 1, area: 1350, yearBuilt: 1987, garage: 0,
		features: ['garden', 'pet-friendly'], featured: false, cover: '1572120360610-d971b9d7767c',
		description: 'A tidy three-bedroom house with a far bigger garden than you would expect at this price. Ideal for a first purchase: the roof and boiler were replaced in 2022, and the kitchen is ready for a refresh. Walking distance to Millbrook Primary and the high street.',
	},
	{
		title: 'Brick townhouse moments from the park',
		type: 'townhouse', city: 'Willow Creek', neighbourhood: 'Parkside', price: 425000, beds: 3, baths: 2, area: 1600, yearBuilt: 2010, garage: 1,
		features: ['garden', 'garage', 'pet-friendly'], featured: false, cover: '1430285561322-7808604715df',
		description: 'A handsome brick townhouse across the road from Willow Creek Park. Three floors give a clear split between living space and bedrooms, with a courtyard garden at the back and an integral garage at the front.',
	},
	{
		title: 'New-build townhouse with roof terrace',
		type: 'townhouse', city: 'Willow Creek', neighbourhood: 'Creekside Row', price: 489000, beds: 3, baths: 3, area: 1750, yearBuilt: 2025, garage: 1,
		features: ['balcony', 'new-build', 'solar', 'garage'], featured: true, cover: '1781264896328-c7ce738762fc',
		description: 'One of twelve energy-efficient townhouses finished in 2025. Solar panels and a heat pump keep running costs low, and the private roof terrace looks out over the creek trail. Every bedroom has its own bathroom.',
	},
	{
		title: 'Family home on the creek trail',
		type: 'house', city: 'Willow Creek', neighbourhood: 'Trail End', price: 575000, beds: 4, baths: 2, area: 2400, yearBuilt: 2008, garage: 2,
		features: ['garden', 'garage', 'waterfront', 'pet-friendly'], featured: false, cover: '1628624747186-a941c476b7ef',
		description: 'The garden gate opens straight onto the creek trail. A practical four-bedroom home with a large utility room, a double garage and a sunny deck. Popular with families and dog owners.',
	},
	{
		title: 'Top-floor city apartment with skyline views',
		type: 'apartment', city: 'Northgate', neighbourhood: 'Station Quarter', price: 389000, beds: 2, baths: 1, area: 920, yearBuilt: 2019, garage: 0,
		features: ['balcony', 'pet-friendly'], featured: true, cover: '1545324418-cc1a3fa10c00',
		description: 'A top-floor apartment three minutes from Northgate station. Big windows frame the skyline, and the balcony catches the evening sun. The building has a concierge, bike storage and a shared roof garden.',
	},
	{
		title: 'Compact studio-plus near the university',
		type: 'apartment', city: 'Northgate', neighbourhood: 'College Hill', price: 219000, beds: 1, baths: 1, area: 560, yearBuilt: 2016, garage: 0,
		features: ['balcony'], featured: false, cover: '1784853879843-f3c5aacf2569',
		description: 'A well-planned one-bedroom apartment a short walk from the university and the market hall. A good first home or a low-maintenance rental investment, with a small balcony and modern kitchen.',
	},
	{
		title: 'Penthouse with private terrace',
		type: 'apartment', city: 'Northgate', neighbourhood: 'Riverside Wharf', price: 1150000, beds: 3, baths: 3, area: 2100, yearBuilt: 2022, garage: 2,
		features: ['balcony', 'waterfront', 'garage', 'home-office', 'new-build'], featured: false, cover: '1721815693498-cc28507c0ba2',
		description: 'A penthouse on the river with a 900 sq ft private terrace. Inside, a double-height living room, a separate study, and three bedroom suites. Two parking spaces and a storage room are included.',
	},
	{
		title: 'Timber cabin in the pines',
		type: 'cabin', city: 'Cedar Hollow', neighbourhood: 'Pine Ridge', price: 285000, beds: 2, baths: 1, area: 980, yearBuilt: 2012, garage: 0,
		features: ['fireplace', 'pet-friendly'], featured: true, cover: '1595521624992-48a59aef95e3',
		description: 'A cosy timber cabin on a quarter-acre plot among the pines. A stone fireplace anchors the open living space, and the wraparound deck is the place for morning coffee. Works as a weekend retreat or a full-time home.',
	},
	{
		title: 'A-frame retreat with forest views',
		type: 'cabin', city: 'Cedar Hollow', neighbourhood: 'Fern Hill', price: 349000, beds: 3, baths: 2, area: 1300, yearBuilt: 2020, garage: 0,
		features: ['fireplace', 'solar', 'pet-friendly'], featured: false, cover: '1666934209851-aeecb19afb4a',
		description: 'An architect-designed A-frame with a glass gable end looking straight into the forest. A mezzanine bedroom sits above the living room, with two more bedrooms on the ground floor. Solar panels and a wood stove keep it comfortable year round.',
	},
	{
		title: 'Forest house with workshop and acreage',
		type: 'house', city: 'Cedar Hollow', neighbourhood: 'Old Mill Road', price: 525000, beds: 4, baths: 2, area: 2200, yearBuilt: 2001, garage: 2,
		features: ['garden', 'garage', 'fireplace', 'home-office', 'pet-friendly'], featured: false, cover: '1475087542963-13ab5e611954',
		description: 'A timber-clad family house on two acres, with a detached workshop that could become a studio or office. Four bedrooms, a big farmhouse kitchen, and a fenced paddock.',
	},
	{
		title: 'Minimalist new build with courtyard',
		type: 'house', city: 'Millbrook', neighbourhood: 'Hillcrest', price: 735000, beds: 4, baths: 3, area: 2500, yearBuilt: 2024, garage: 2,
		features: ['garden', 'garage', 'new-build', 'solar', 'home-office'], featured: false, cover: '1771366260867-7e07094579d7',
		description: 'A crisp new-build arranged around a private courtyard garden. Polished concrete floors with underfloor heating, a large home office, and four bedrooms. Solar panels and a battery are already installed.',
	},
];

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export function seedListings() {
	const now = Date.now();
	return raw.map((item, index) => {
		const { cover, ...rest } = item;
		return {
			...rest,
			slug: slugify(`${item.title} ${item.city}`),
			status: 'for-sale',
			address: `${12 + index * 7} ${item.neighbourhood}, ${item.city}`,
			images: [cover, ...interiors(index)],
			agent: AGENTS[index % AGENTS.length],
			// Spread the "listed" dates over the last two months.
			createdAt: new Date(now - index * 3.5 * 24 * 3600 * 1000),
		};
	});
}

export { slugify };
