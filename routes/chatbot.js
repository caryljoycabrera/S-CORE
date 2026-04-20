// ===== Chatbot Routes =====
// Handles chatbot configuration, flow CRUD, and public messaging endpoints

const express = require('express');
const router = express.Router();

const { apiLimiter } = require('../middleware/rateLimiter');
const { requireAdminAPI } = require('../middleware/auth');
const chatbotService = require('../services/chatbotService');
const { sanitizeMongoId, sanitizeString } = require('../utils/sanitize');

const VALID_ROLES = ['public', 'user', 'unit', 'admin'];

function normalizeRole(role) {
  const value = sanitizeString(role || '').toLowerCase();
  return VALID_ROLES.includes(value) ? value : 'public';
}

router.get('/api/chatbot/config', apiLimiter, async (req, res) => {
  try {
    const role = normalizeRole(req.query.role);
    const page = sanitizeString(req.query.page || 'homepage').toLowerCase();
    const config = await chatbotService.getClientConfig(page, role);
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('[Chatbot API] Failed to load chatbot config:', error);
    return res.status(500).json({ success: false, message: 'Failed to load chatbot configuration' });
  }
});

router.post('/api/chatbot/message', apiLimiter, async (req, res) => {
  try {
    const payload = {
      role: normalizeRole(req.body.role),
      page: sanitizeString(req.body.page || ''),
      message: req.body.message,
      currentFlowId: sanitizeString(req.body.currentFlowId || '')
    };

    const response = await chatbotService.processMessage(payload);
    return res.json({ success: true, data: response });
  } catch (error) {
    console.error('[Chatbot API] Failed to process chatbot message:', error);
    return res.status(500).json({ success: false, message: 'Unable to process chatbot message' });
  }
});

router.get('/api/chatbot/qa/:role', apiLimiter, async (req, res) => {
  try {
    const role = normalizeRole(req.params.role);
    const list = await chatbotService.getQAByRole(role);
    return res.json({ success: true, data: list, count: list.length });
  } catch (error) {
    console.error('[Chatbot API] Failed to fetch public chatbot Q&A:', error);
    return res.status(500).json({ success: false, message: 'Unable to load chatbot entries' });
  }
});

router.get('/api/admin/chatbot/config', requireAdminAPI, async (req, res) => {
  try {
    const config = await chatbotService.getAdminConfig();
    return res.json({ success: true, data: config });
  } catch (error) {
    console.error('[Chatbot API] Failed to fetch admin config:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chatbot admin configuration' });
  }
});

router.put('/api/admin/chatbot/config', requireAdminAPI, async (req, res) => {
  try {
    const updated = await chatbotService.updateConfig(req.body, req.user?._id || null);
    return res.json({ success: true, message: 'Chatbot settings updated successfully', data: updated });
  } catch (error) {
    console.error('[Chatbot API] Failed to update config:', error);
    return res.status(500).json({ success: false, message: 'Failed to update chatbot settings' });
  }
});

router.get('/api/admin/chatbot/qa/all/:role', requireAdminAPI, async (req, res) => {
  try {
    const role = normalizeRole(req.params.role);
    const list = await chatbotService.getAllQAByRole(role);
    return res.json({ success: true, data: list, count: list.length });
  } catch (error) {
    console.error('[Chatbot API] Failed to fetch role Q&A list:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chatbot Q&A list' });
  }
});

router.post('/api/admin/chatbot/qa', requireAdminAPI, async (req, res) => {
  try {
    const created = await chatbotService.createQA(req.body, req.user?._id || null);
    return res.status(201).json({ success: true, message: 'Chatbot question created successfully', data: created });
  } catch (error) {
    console.error('[Chatbot API] Failed to create flow:', error);

    if (String(error.message || '').includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (String(error.message || '').includes('required')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to create chatbot question' });
  }
});

router.put('/api/admin/chatbot/qa/:id', requireAdminAPI, async (req, res) => {
  try {
    const id = sanitizeMongoId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid chatbot question ID' });
    }

    const updated = await chatbotService.updateQA(id, req.body, req.user?._id || null);
    return res.json({ success: true, message: 'Chatbot question updated successfully', data: updated });
  } catch (error) {
    console.error('[Chatbot API] Failed to update flow:', error);

    if (String(error.message || '').includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (String(error.message || '').includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to update chatbot question' });
  }
});

router.delete('/api/admin/chatbot/qa/:id', requireAdminAPI, async (req, res) => {
  try {
    const id = sanitizeMongoId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid chatbot question ID' });
    }

    await chatbotService.deleteQA(id);
    return res.json({ success: true, message: 'Chatbot question deleted successfully' });
  } catch (error) {
    console.error('[Chatbot API] Failed to delete flow:', error);

    if (String(error.message || '').includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to delete chatbot question' });
  }
});

router.get('/api/admin/chatbot/stats', requireAdminAPI, async (req, res) => {
  try {
    const stats = await chatbotService.getStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Chatbot API] Failed to fetch stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chatbot statistics' });
  }
});

router.get('/api/admin/chatbot/flows/:role', requireAdminAPI, async (req, res) => {
  try {
    const role = normalizeRole(req.params.role);
    const flows = await chatbotService.getAllQAByRole(role);
    return res.json({ success: true, data: flows, count: flows.length });
  } catch (error) {
    console.error('[Chatbot API] Failed to load JSON editor flows:', error);
    return res.status(500).json({ success: false, message: 'Failed to load chatbot flows' });
  }
});

router.put('/api/admin/chatbot/flows/:role', requireAdminAPI, async (req, res) => {
  try {
    const role = normalizeRole(req.params.role);
    const replaced = await chatbotService.replaceRoleFlows(role, req.body.flows, req.user?._id || null);
    return res.json({ success: true, message: 'Chatbot flow JSON saved successfully', data: replaced, count: replaced.length });
  } catch (error) {
    console.error('[Chatbot API] Failed to save JSON editor flows:', error);

    if (String(error.message || '').includes('must have question and answer')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (String(error.message || '').includes('array')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to save chatbot flow JSON' });
  }
});

router.get('/api/admin/chatbot/template', requireAdminAPI, async (req, res) => {
  try {
    const template = chatbotService.getImportTemplate();
    return res.json({ success: true, data: template });
  } catch (error) {
    console.error('[Chatbot API] Failed to generate import template:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate chatbot import template' });
  }
});

router.get('/api/admin/chatbot/export', requireAdminAPI, async (req, res) => {
  try {
    const bundle = await chatbotService.exportImportBundle();
    return res.json({ success: true, data: bundle });
  } catch (error) {
    console.error('[Chatbot API] Failed to export chatbot settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to export chatbot settings' });
  }
});

router.post('/api/admin/chatbot/import', requireAdminAPI, async (req, res) => {
  try {
    const imported = await chatbotService.importBundle(req.body, req.user?._id || null);
    return res.json({ success: true, message: 'Chatbot settings imported successfully', data: imported });
  } catch (error) {
    console.error('[Chatbot API] Failed to import chatbot settings:', error);

    if (
      String(error.message || '').includes('must be an array') ||
      String(error.message || '').includes('must have question and answer') ||
      String(error.message || '').includes('Import payload must be JSON object')
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to import chatbot settings' });
  }
});

module.exports = router;
