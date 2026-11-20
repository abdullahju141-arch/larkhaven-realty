/**
 * MongoDB store (Mongoose). Same interface as the in-memory store, so the
 * services do not care which one they are using.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const agentSchema = new Schema({ name: String, title: String, email: String }, { _id: false });

const listingSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, index: true },
		status: { type: String, enum: ['for-sale', 'under-offer', 'sold'], default: 'for-sale', index: true },
		type: { type: String, required: true, index: true },
		city: { type: String, required: true, index: true },
		neighbourhood: String,
		address: String,
		price: { type: Number, required: true, index: true },
		beds: { type: Number, default: 0 },
		baths: { type: Number, default: 0 },
		area: Number,
		yearBuilt: Number,
		garage: { type: Number, default: 0 },
		features: { type: [String], default: [] },
		description: String,
		images: { type: [String], default: [] },
		featured: { type: Boolean, default: false },
		agent: agentSchema,
	},
	{ timestamps: true },
);

const userSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['user', 'admin'], default: 'user' },
		favourites: { type: [String], default: [] },
	},
	{ timestamps: true },
);

const enquirySchema = new Schema(
	{
		listingId: String,
		listingTitle: String,
		name: { type: String, required: true },
		email: { type: String, required: true },
		phone: String,
		message: String,
		status: { type: String, enum: ['new', 'handled'], default: 'new', index: true },
	},
	{ timestamps: true },
);

/** Plain object with a string `id` instead of `_id`. */
function plain(doc) {
	if (!doc) return null;
	const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
	const { _id, __v, ...rest } = obj;
	return { id: String(_id), ...rest };
}

function wrap(Model) {
	const validId = (id) => mongoose.isValidObjectId(id);
	return {
		async find(query = {}, { sort, skip = 0, limit = 0 } = {}) {
			let q = Model.find(query).lean();
			if (sort) q = q.sort(sort);
			if (skip) q = q.skip(skip);
			if (limit) q = q.limit(limit);
			return (await q).map(plain);
		},
		async count(query = {}) {
			return Model.countDocuments(query);
		},
		async findOne(query) {
			return plain(await Model.findOne(query).lean());
		},
		async findById(id) {
			return validId(id) ? plain(await Model.findById(id).lean()) : null;
		},
		async create(data) {
			return plain(await Model.create(data));
		},
		async update(id, data) {
			if (!validId(id)) return null;
			return plain(await Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean());
		},
		async remove(id) {
			if (!validId(id)) return false;
			const result = await Model.deleteOne({ _id: id });
			return result.deletedCount > 0;
		},
		async insertMany(list) {
			await Model.insertMany(list);
		},
		async clear() {
			await Model.deleteMany({});
		},
	};
}

export async function createMongoStore(uri) {
	mongoose.set('strictQuery', true);
	await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });

	const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
	const User = mongoose.models.User || mongoose.model('User', userSchema);
	const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);

	return {
		kind: 'mongo',
		listings: wrap(Listing),
		users: wrap(User),
		enquiries: wrap(Enquiry),
		async close() {
			await mongoose.disconnect();
		},
	};
}
