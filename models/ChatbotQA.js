const mongoose = require('mongoose');

const chatbotQASchema = new mongoose.Schema(
	{
		role: {
			type: String,
			enum: ['user', 'unit', 'admin', 'public'],
			required: true,
		},
		category: {
			type: String,
			enum: ['Technical', 'Request Process', 'Account', 'General'],
			default: 'General',
		},
		question: {
			type: String,
			required: [true, 'Question is required'],
			trim: true,
			minlength: [5, 'Question must be at least 5 characters'],
			maxlength: [255, 'Question must not exceed 255 characters'],
		},
		answer: {
			type: String,
			required: [true, 'Answer is required'],
			trim: true,
			minlength: [10, 'Answer must be at least 10 characters'],
			maxlength: [2000, 'Answer must not exceed 2000 characters'],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		collection: 'chatbot_qa',
	}
);

// Compound unique index: role + question (case-insensitive) for uniqueness per role
chatbotQASchema.index({ role: 1, question: 1 }, { unique: true, sparse: true });

// Index for fast role-based queries with active filter
chatbotQASchema.index({ role: 1, isActive: 1 });

// Index for category filtering
chatbotQASchema.index({ role: 1, category: 1, isActive: 1 });

// Middleware to update updatedAt on save
chatbotQASchema.pre('findOneAndUpdate', function () {
	this.set({ updatedAt: Date.now() });
});

chatbotQASchema.pre('save', function () {
	this.updatedAt = Date.now();
});

module.exports = mongoose.model('ChatbotQA', chatbotQASchema);
