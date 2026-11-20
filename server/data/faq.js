/**
 * What the assistant knows about the (fictional) agency. The AI is only allowed
 * to answer general questions from this text, so it cannot invent policies.
 */

export const AGENCY = {
	name: 'Larkhaven Realty',
	region: 'Larkhaven Valley',
	email: 'hello@larkhaven.example',
	hours: 'Monday to Saturday, 9am to 6pm',
};

export const FAQ = [
	{
		q: 'How do I book a viewing?',
		a: 'Open the property page and send an enquiry with the form. The listing agent replies within one working day to arrange a time. Viewings run Monday to Saturday.',
		keywords: ['viewing', 'visit', 'tour', 'see the house', 'book', 'appointment'],
	},
	{
		q: 'What fees do buyers pay?',
		a: 'Larkhaven Realty does not charge buyers a fee. You will still have your own costs, such as a survey, legal fees and any taxes, which depend on the property and your situation.',
		keywords: ['fee', 'fees', 'commission', 'cost', 'charge'],
	},
	{
		q: 'Can you help me get a mortgage?',
		a: 'We do not give mortgage or financial advice. We can introduce you to independent mortgage advisers in the valley, and you should speak to one before making an offer.',
		keywords: ['mortgage', 'loan', 'finance', 'bank', 'deposit', 'afford'],
	},
	{
		q: 'How do I make an offer?',
		a: 'Tell the listing agent the price you want to offer, how you are paying, and your timescale. We pass every offer to the seller in writing and come back to you with their answer.',
		keywords: ['offer', 'bid', 'negotiate'],
	},
	{
		q: 'Which areas do you cover?',
		a: 'We cover the whole of Larkhaven Valley: Ashford Bay on the coast, Millbrook, Northgate city centre, Cedar Hollow in the forest, and Willow Creek.',
		keywords: ['area', 'areas', 'towns', 'where', 'cover', 'location', 'neighbourhood'],
	},
	{
		q: 'Can I sell my home with you?',
		a: 'Yes. Send us a message through any property page or email hello@larkhaven.example and an agent will arrange a free valuation.',
		keywords: ['sell', 'selling', 'valuation', 'list my'],
	},
	{
		q: 'What are your opening hours?',
		a: 'Our office is open Monday to Saturday, 9am to 6pm. You can send an enquiry through the website at any time.',
		keywords: ['hours', 'open', 'opening', 'office', 'contact', 'phone', 'email'],
	},
];

export function faqText() {
	return FAQ.map((item) => `Q: ${item.q}\nA: ${item.a}`).join('\n\n');
}
