const ChatbotQA = require('../models/ChatbotQA');

/**
 * Fetch active Q&A entries for given role
 * @param {string} role - User role (user, unit, admin, public)
 * @returns {Promise<Array>} Active Q&A array
 */
async function getQAByRole(role) {
	try {
		return await ChatbotQA.find({ role, isActive: true }).sort({ category: 1, createdAt: 1 }).lean();
	} catch (error) {
		console.error(`[ChatbotService] Error fetching Q&A for role ${role}:`, error.message);
		throw error;
	}
}

/**
 * Fetch all Q&A (active + inactive) for admin
 * @param {string} role - User role to fetch Q&A for
 * @returns {Promise<Array>} All Q&A array
 */
async function getAllQAByRole(role) {
	try {
		return await ChatbotQA.find({ role }).sort({ category: 1, createdAt: -1 }).lean();
	} catch (error) {
		console.error(`[ChatbotService] Error fetching all Q&A for role ${role}:`, error.message);
		throw error;
	}
}

/**
 * Create new Q&A entry
 * @param {object} data - { role, category, question, answer }
 * @returns {Promise<object>} Created Q&A document
 */
async function createQA(data) {
	try {
		const { role, category, question, answer } = data;

		// Validate role
		if (!['user', 'unit', 'admin', 'public'].includes(role)) {
			throw new Error('Invalid role');
		}

		// Check for duplicate question in same role
		const existing = await ChatbotQA.findOne({ role, question });
		if (existing) {
			throw new Error(`Question already exists for ${role} role`);
		}

		const qa = new ChatbotQA({ role, category, question, answer, isActive: true });
		await qa.save();
		return qa;
	} catch (error) {
		console.error('[ChatbotService] Error creating Q&A:', error.message);
		throw error;
	}
}

/**
 * Update Q&A entry
 * @param {string} id - ChatbotQA document ID
 * @param {object} updates - Partial updates { category, question, answer, isActive }
 * @returns {Promise<object>} Updated Q&A document
 */
async function updateQA(id, updates) {
	try {
		// Prevent role change
		if (updates.role) {
			throw new Error('Cannot change role of existing Q&A');
		}

		// Check for duplicate question if question being changed
		if (updates.question) {
			const qa = await ChatbotQA.findById(id);
			if (!qa) throw new Error('Q&A not found');

			const duplicate = await ChatbotQA.findOne({ role: qa.role, question: updates.question, _id: { $ne: id } });
			if (duplicate) {
				throw new Error(`Question already exists for ${qa.role} role`);
			}
		}

		const updated = await ChatbotQA.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!updated) throw new Error('Q&A not found');
		return updated;
	} catch (error) {
		console.error('[ChatbotService] Error updating Q&A:', error.message);
		throw error;
	}
}

/**
 * Delete Q&A entry (hard delete)
 * @param {string} id - ChatbotQA document ID
 * @returns {Promise<object>} Deleted Q&A document
 */
async function deleteQA(id) {
	try {
		const deleted = await ChatbotQA.findByIdAndDelete(id);
		if (!deleted) throw new Error('Q&A not found');
		return deleted;
	} catch (error) {
		console.error('[ChatbotService] Error deleting Q&A:', error.message);
		throw error;
	}
}

/**
 * Search Q&A by role with optional text search
 * @param {string} role - User role
 * @param {string} query - Search query (optional)
 * @returns {Promise<Array>} Matching Q&A
 */
async function searchQA(role, query) {
	try {
		const filter = { role, isActive: true };

		if (query && query.trim()) {
			const searchRegex = new RegExp(query.trim(), 'i');
			filter.$or = [{ question: searchRegex }, { answer: searchRegex }];
		}

		return await ChatbotQA.find(filter).sort({ category: 1, createdAt: 1 }).lean();
	} catch (error) {
		console.error('[ChatbotService] Error searching Q&A:', error.message);
		throw error;
	}
}

/**
 * Get Q&A statistics
 * @returns {Promise<object>} Stats by role: { user: count, unit: count, admin: count, public: count }
 */
async function getStats() {
	try {
		const stats = await ChatbotQA.aggregate([
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 },
					active: {
						$sum: { $cond: ['$isActive', 1, 0] },
					},
				},
			},
		]);

		const result = {};
		stats.forEach(({ _id, count, active }) => {
			result[_id] = { total: count, active };
		});

		return result;
	} catch (error) {
		console.error('[ChatbotService] Error getting stats:', error.message);
		throw error;
	}
}

module.exports = {
	getQAByRole,
	getAllQAByRole,
	createQA,
	updateQA,
	deleteQA,
	searchQA,
	getStats,
};
