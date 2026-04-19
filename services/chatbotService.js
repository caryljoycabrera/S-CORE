// ===== Chatbot Service =====
// Central business logic for role-based rule chatbot, settings, and flow processing

const ChatbotConfig = require('../models/ChatbotConfig');
const ChatbotFlow = require('../models/ChatbotFlow');
const { sanitizeText, sanitizeString } = require('../utils/sanitize');

const VALID_ROLES = ['public', 'user', 'unit', 'admin'];
const VALID_CATEGORIES = ['general', 'technical', 'request_process', 'account', 'workflow'];

function normalizeRole(role) {
  const value = sanitizeString(role || '').toLowerCase();
  return VALID_ROLES.includes(value) ? value : 'public';
}

function normalizeCategory(category) {
  const raw = sanitizeString(category || '').toLowerCase().replace(/\s+/g, '_');
  if (VALID_CATEGORIES.includes(raw)) return raw;
  if (raw === 'request' || raw === 'requests' || raw === 'process') return 'request_process';
  return 'general';
}

function normalizeQuestion(question) {
  return sanitizeText(question || '', 255).toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractKeywords(text) {
  const cleaned = sanitizeText(text || '', 255).toLowerCase();
  return [...new Set(
    cleaned
      .split(/[^a-z0-9]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3)
  )];
}

function normalizePage(page, role) {
  const cleaned = sanitizeString(page || '').toLowerCase();
  if (['homepage', 'user', 'unit', 'admin'].includes(cleaned)) return cleaned;
  if (cleaned === 'public') return 'public';
  if (role === 'unit') return 'unit';
  if (role === 'admin') return 'admin';
  if (role === 'user') return 'user';
  return 'public';
}

function ensureSentenceEnding(text) {
  if (!text) return text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function toFormalTone(answer, enforced = true) {
  const clean = sanitizeText(answer || '', 2000);
  if (!clean) return '';
  if (!enforced) return ensureSentenceEnding(clean);

  const formalPattern = /^(thank you|good\s(day|morning|afternoon|evening)|i appreciate|for your)/i;
  const withEnding = ensureSentenceEnding(clean);

  if (formalPattern.test(withEnding)) {
    return withEnding;
  }

  return `Thank you for your inquiry. ${withEnding}`;
}

async function ensureConfig() {
  let config = await ChatbotConfig.findOne({ singletonKey: 'default' }).lean();
  if (config) return config;

  try {
    const created = await ChatbotConfig.create({ singletonKey: 'default' });
    return created.toObject();
  } catch (error) {
    // Handle race condition when two requests create default doc.
    if (error && error.code === 11000) {
      const existing = await ChatbotConfig.findOne({ singletonKey: 'default' }).lean();
      if (existing) return existing;
    }
    throw error;
  }
}

function scoreFlowMatch(flow, tokens, normalizedMessage) {
  if (!flow || !flow.question) return 0;

  const question = flow.questionNormalized || normalizeQuestion(flow.question);
  if (!question) return 0;

  if (question === normalizedMessage) return 1000;

  let score = 0;
  if (normalizedMessage.includes(question)) score += 350;
  if (question.includes(normalizedMessage)) score += 200;

  const keywordSet = Array.isArray(flow.keywords) ? flow.keywords : [];
  keywordSet.forEach((keyword) => {
    if (tokens.includes(keyword)) score += 80;
    if (normalizedMessage.includes(keyword)) score += 50;
  });

  return score;
}

class ChatbotService {
  async getAdminConfig() {
    return ensureConfig();
  }

  async getClientConfig(page, role) {
    const config = await ensureConfig();
    const resolvedRole = normalizeRole(role);
    const resolvedPage = normalizePage(page, resolvedRole);
    const enabled = Boolean(config.enabledPages && config.enabledPages[resolvedPage]);

    const greeting =
      (config.greetings && config.greetings[resolvedRole]) ||
      (config.greetings && config.greetings.public) ||
      'Good day. How may I assist you?';

    return {
      enabled,
      page: resolvedPage,
      role: resolvedRole,
      widget: {
        position: config.widget?.position || 'bottom-right',
        primaryColor: config.widget?.primaryColor || '#10b981',
        headerTitle: config.widget?.headerTitle || 'S-CORE Assistant',
        width: config.widget?.width || 360
      },
      greeting,
      fallbackMessage:
        config.fallbackMessage ||
        'Thank you for your inquiry. I am unable to find an exact answer at this time.',
      useSocketRealtime: Boolean(config.useSocketRealtime),
      formalToneEnforced: Boolean(config.formalToneEnforced)
    };
  }

  async updateConfig(updates, userId = null) {
    const config = await ensureConfig();
    const payload = {
      enabledPages: {
        homepage: Boolean(updates?.enabledPages?.homepage),
        user: Boolean(updates?.enabledPages?.user),
        unit: Boolean(updates?.enabledPages?.unit),
        admin: Boolean(updates?.enabledPages?.admin)
      },
      widget: {
        position: 'bottom-right',
        primaryColor: sanitizeText(updates?.widget?.primaryColor || '#10b981', 20),
        headerTitle: sanitizeText(updates?.widget?.headerTitle || 'S-CORE Assistant', 80),
        width: Number(updates?.widget?.width || 360)
      },
      greetings: {
        public: sanitizeText(updates?.greetings?.public || '', 300),
        user: sanitizeText(updates?.greetings?.user || '', 300),
        unit: sanitizeText(updates?.greetings?.unit || '', 300),
        admin: sanitizeText(updates?.greetings?.admin || '', 300)
      },
      fallbackMessage: sanitizeText(
        updates?.fallbackMessage ||
          'Thank you for your inquiry. I am unable to find an exact answer at this time.',
        500
      ),
      formalToneEnforced: Boolean(updates?.formalToneEnforced),
      useSocketRealtime: Boolean(updates?.useSocketRealtime),
      updatedBy: userId || null
    };

    if (payload.widget.width < 280) payload.widget.width = 280;
    if (payload.widget.width > 480) payload.widget.width = 480;

    // Ensure non-empty formal greetings.
    payload.greetings.public = toFormalTone(payload.greetings.public || 'Good day. How may I assist you?', payload.formalToneEnforced);
    payload.greetings.user = toFormalTone(payload.greetings.user || 'Good day. How may I assist you with your request?', payload.formalToneEnforced);
    payload.greetings.unit = toFormalTone(payload.greetings.unit || 'Good day. How may I assist your unit today?', payload.formalToneEnforced);
    payload.greetings.admin = toFormalTone(payload.greetings.admin || 'Good day. How may I assist you with administrative tasks?', payload.formalToneEnforced);
    payload.fallbackMessage = toFormalTone(payload.fallbackMessage, payload.formalToneEnforced);

    const updated = await ChatbotConfig.findOneAndUpdate(
      { singletonKey: config.singletonKey || 'default' },
      { $set: payload },
      { new: true, upsert: true }
    ).lean();

    return updated;
  }

  async getQAByRole(role) {
    const resolvedRole = normalizeRole(role);
    return ChatbotFlow.find({ role: resolvedRole, isActive: true })
      .sort({ sortOrder: 1, updatedAt: -1 })
      .lean();
  }

  async getAllQAByRole(role) {
    const resolvedRole = normalizeRole(role);
    return ChatbotFlow.find({ role: resolvedRole })
      .sort({ sortOrder: 1, updatedAt: -1 })
      .lean();
  }

  async createQA(data, userId = null) {
    const role = normalizeRole(data?.role);
    const category = normalizeCategory(data?.category);
    const question = sanitizeText(data?.question || '', 255);

    if (!question) {
      throw new Error('Question is required');
    }

    const config = await ensureConfig();
    const answer = toFormalTone(data?.answer || '', Boolean(config.formalToneEnforced));
    if (!answer) {
      throw new Error('Answer is required');
    }

    const questionNormalized = normalizeQuestion(question);
    const duplicate = await ChatbotFlow.findOne({ role, questionNormalized }).lean();
    if (duplicate) {
      throw new Error('A question with the same text already exists for this role');
    }

    const keywords = Array.isArray(data?.keywords)
      ? data.keywords.map((item) => sanitizeString(item).toLowerCase()).filter(Boolean)
      : extractKeywords(question);

    const flow = await ChatbotFlow.create({
      role,
      category,
      question,
      questionNormalized,
      answer,
      keywords,
      nextFlowId: sanitizeText(data?.nextFlowId || '', 100),
      isActive: data?.isActive !== false,
      sortOrder: Number.isFinite(Number(data?.sortOrder)) ? Number(data.sortOrder) : 0,
      createdBy: userId || null,
      updatedBy: userId || null
    });

    return flow.toObject();
  }

  async updateQA(id, updates, userId = null) {
    const existing = await ChatbotFlow.findById(id);
    if (!existing) {
      throw new Error('Q&A entry not found');
    }

    if (updates.role) {
      existing.role = normalizeRole(updates.role);
    }

    if (updates.category) {
      existing.category = normalizeCategory(updates.category);
    }

    if (typeof updates.question === 'string') {
      existing.question = sanitizeText(updates.question, 255);
      existing.questionNormalized = normalizeQuestion(existing.question);
    }

    if (typeof updates.answer === 'string') {
      const config = await ensureConfig();
      existing.answer = toFormalTone(updates.answer, Boolean(config.formalToneEnforced));
    }

    if (Array.isArray(updates.keywords)) {
      existing.keywords = updates.keywords
        .map((item) => sanitizeString(item).toLowerCase())
        .filter(Boolean);
    }

    if (typeof updates.nextFlowId === 'string') {
      existing.nextFlowId = sanitizeText(updates.nextFlowId, 100);
    }

    if (typeof updates.isActive === 'boolean') {
      existing.isActive = updates.isActive;
    }

    if (updates.sortOrder !== undefined) {
      const parsedOrder = Number(updates.sortOrder);
      existing.sortOrder = Number.isFinite(parsedOrder) ? parsedOrder : existing.sortOrder;
    }

    existing.updatedBy = userId || existing.updatedBy;

    const duplicate = await ChatbotFlow.findOne({
      _id: { $ne: existing._id },
      role: existing.role,
      questionNormalized: existing.questionNormalized
    }).lean();

    if (duplicate) {
      throw new Error('A question with the same text already exists for this role');
    }

    await existing.save();
    return existing.toObject();
  }

  async deleteQA(id) {
    const deleted = await ChatbotFlow.findByIdAndDelete(id).lean();
    if (!deleted) {
      throw new Error('Q&A entry not found');
    }
    return deleted;
  }

  async getStats() {
    const grouped = await ChatbotFlow.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = {
      public: { total: 0, active: 0 },
      user: { total: 0, active: 0 },
      unit: { total: 0, active: 0 },
      admin: { total: 0, active: 0 },
      overall: { total: 0, active: 0 }
    };

    grouped.forEach((item) => {
      if (stats[item._id]) {
        stats[item._id] = { total: item.total, active: item.active };
        stats.overall.total += item.total;
        stats.overall.active += item.active;
      }
    });

    return stats;
  }

  async replaceRoleFlows(role, flows, userId = null) {
    const resolvedRole = normalizeRole(role);
    if (!Array.isArray(flows)) {
      throw new Error('Flows payload must be an array');
    }

    const config = await ensureConfig();

    const docs = flows.map((flow, index) => {
      const question = sanitizeText(flow?.question || '', 255);
      const answer = toFormalTone(flow?.answer || '', Boolean(config.formalToneEnforced));

      if (!question || !answer) {
        throw new Error(`Flow item at index ${index} must have question and answer`);
      }

      return {
        flowId: sanitizeText(flow?.flowId || '', 120) || undefined,
        role: resolvedRole,
        category: normalizeCategory(flow?.category),
        question,
        questionNormalized: normalizeQuestion(question),
        answer,
        keywords: Array.isArray(flow?.keywords)
          ? flow.keywords.map((item) => sanitizeString(item).toLowerCase()).filter(Boolean)
          : extractKeywords(question),
        nextFlowId: sanitizeText(flow?.nextFlowId || '', 120),
        isActive: flow?.isActive !== false,
        sortOrder: Number.isFinite(Number(flow?.sortOrder)) ? Number(flow.sortOrder) : index,
        createdBy: userId || null,
        updatedBy: userId || null
      };
    });

    await ChatbotFlow.deleteMany({ role: resolvedRole });

    if (docs.length === 0) {
      return [];
    }

    const created = await ChatbotFlow.insertMany(docs, { ordered: true });
    return created.map((item) => item.toObject());
  }

  async processMessage(payload) {
    const role = normalizeRole(payload?.role);
    const page = normalizePage(payload?.page, role);
    const config = await this.getClientConfig(page, role);

    if (!config.enabled) {
      return {
        enabled: false,
        matched: false,
        flowId: null,
        answer: 'Thank you for your inquiry. Chat assistant is currently unavailable on this page.',
        suggestions: []
      };
    }

    const message = sanitizeText(payload?.message || '', 500);
    if (!message) {
      return {
        enabled: true,
        matched: false,
        flowId: null,
        answer: config.greeting,
        suggestions: []
      };
    }

    const normalizedMessage = normalizeQuestion(message);

    // If current flow exists and has explicit next flow, prefer it.
    if (payload?.currentFlowId) {
      const current = await ChatbotFlow.findOne({
        flowId: sanitizeString(payload.currentFlowId),
        isActive: true
      }).lean();

      if (current && current.nextFlowId) {
        const next = await ChatbotFlow.findOne({
          flowId: current.nextFlowId,
          isActive: true
        }).lean();

        if (next) {
          return {
            enabled: true,
            matched: true,
            flowId: next.flowId,
            answer: toFormalTone(next.answer, config.formalToneEnforced),
            suggestions: []
          };
        }
      }
    }

    const candidateRoles = role === 'public' ? ['public'] : [role, 'public'];
    const candidates = await ChatbotFlow.find({
      role: { $in: candidateRoles },
      isActive: true
    }).sort({ sortOrder: 1, updatedAt: -1 }).lean();

    const tokens = extractKeywords(message);

    let best = null;
    let bestScore = -1;

    candidates.forEach((flow) => {
      const score = scoreFlowMatch(flow, tokens, normalizedMessage);
      if (score > bestScore) {
        best = flow;
        bestScore = score;
      }
    });

    if (best && bestScore >= 120) {
      const suggestions = candidates
        .filter((item) => item._id.toString() !== best._id.toString())
        .slice(0, 3)
        .map((item) => item.question);

      return {
        enabled: true,
        matched: true,
        flowId: best.flowId,
        answer: toFormalTone(best.answer, config.formalToneEnforced),
        suggestions
      };
    }

    return {
      enabled: true,
      matched: false,
      flowId: null,
      answer: config.fallbackMessage,
      suggestions: candidates.slice(0, 3).map((item) => item.question)
    };
  }
}

module.exports = new ChatbotService();
