// ===== Admin Chatbot Configuration =====
// Handles Q&A CRUD, role switching, widget settings, and JSON flow editor.

(function adminChatbotConfigModule() {
  let currentRole = 'user';
  let selectedTargetRoles = new Set(['user']);
  let currentEntries = [];
  let editingEntryId = null;
  const paginationState = { public: 1, user: 1, unit: 1, admin: 1 };
  const ITEMS_PER_PAGE = 10;

  const VALID_ROLES = ['public', 'user', 'unit', 'admin'];

  const roleLabels = {
    public: 'Public',
    user: 'User',
    unit: 'Unit',
    admin: 'Admin'
  };

  const categoryLabelMap = {
    general: 'General',
    technical: 'Technical',
    request_process: 'Request Process',
    account: 'Account',
    workflow: 'Workflow'
  };

  function sanitizeText(value, fallback = '') {
    if (typeof value !== 'string') return fallback;
    return value.trim();
  }

  function normalizeCategory(category) {
    const normalized = sanitizeText(category, 'general').toLowerCase().replace(/\s+/g, '_');
    if (['general', 'technical', 'request_process', 'account', 'workflow'].includes(normalized)) {
      return normalized;
    }
    if (normalized === 'request' || normalized === 'requests' || normalized === 'process') {
      return 'request_process';
    }
    return 'general';
  }

  function showMessage(targetId, message, isSuccess) {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.style.display = 'block';
    el.style.background = isSuccess ? '#dcfce7' : '#fee2e2';
    el.style.color = isSuccess ? '#166534' : '#991b1b';
    el.style.border = isSuccess ? '1px solid #86efac' : '1px solid #fca5a5';
    el.textContent = message;

    setTimeout(() => {
      el.style.display = 'none';
    }, 3200);
  }

  function updateCounter(inputId, counterId, limit) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;

    const len = (input.value || '').length;
    counter.textContent = `${len}/${limit}`;
  }

  function renderRoleButtons() {
    const buttons = document.querySelectorAll('.chatbot-role-btn');
    buttons.forEach((button) => {
      const onclickText = button.getAttribute('onclick') || '';
      const roleMatch = onclickText.match(/'([a-z]+)'/i);
      const role = roleMatch ? roleMatch[1].toLowerCase() : '';
      
      const isSelected = selectedTargetRoles.has(role);
      const isCurrentPreview = role === currentRole;

      button.style.borderColor = isSelected ? '#10b981' : (isCurrentPreview ? '#9ca3af' : '#d1d5db');
      button.style.color = isSelected ? '#047857' : (isCurrentPreview ? '#374151' : '#6b7280');
      button.style.background = isSelected ? '#ecfdf5' : (isCurrentPreview ? '#f3f4f6' : '#ffffff');
      
      if (isCurrentPreview) {
        button.style.boxShadow = isSelected 
          ? '0 0 0 2px rgba(16, 185, 129, 0.4)' 
          : '0 0 0 2px rgba(156, 163, 175, 0.4)';
      } else {
        button.style.boxShadow = 'none';
      }
    });

    const roleDisplay = document.getElementById('currentRoleDisplay');
    if (roleDisplay) {
      roleDisplay.textContent = roleLabels[currentRole] || 'User';
    }
  }

  function setTargetRoles(roles) {
    selectedTargetRoles = new Set(Array.isArray(roles) ? roles.filter((role) => VALID_ROLES.includes(role)) : []);
    renderRoleButtons();
  }

  function getSelectedTargetRoles() {
    return Array.from(selectedTargetRoles);
  }

  function ensureTargetRoleSelection(fallbackRole = 'user') {
    const selected = getSelectedTargetRoles();
    if (selected.length > 0) return;
    setTargetRoles([VALID_ROLES.includes(fallbackRole) ? fallbackRole : 'user']);
  }

  function resetQuestionForm() {
    const questionInput = document.getElementById('chatbotQuestion');
    const answerInput = document.getElementById('chatbotAnswer');
    const categoryInput = document.getElementById('chatbotCategory');
    const activeInput = document.getElementById('chatbotIsActive');

    if (questionInput) questionInput.value = '';
    if (answerInput) answerInput.value = '';
    if (categoryInput) categoryInput.value = 'general';
    if (activeInput) activeInput.checked = true;

    updateCounter('chatbotQuestion', 'chatbotQuestionCount', 255);
    updateCounter('chatbotAnswer', 'chatbotAnswerCount', 2000);
  }

  function setEditMode(entry) {
    if (!entry || !entry._id) return;

    editingEntryId = entry._id;

    const formTitle = document.getElementById('chatbotFormTitle');
    const submitBtn = document.getElementById('chatbotSubmitBtn');
    const cancelBtn = document.getElementById('chatbotCancelEditBtn');

    if (formTitle) formTitle.textContent = `Edit Question (${roleLabels[entry.role] || 'Role'})`;
    if (submitBtn) submitBtn.textContent = '💾 Save Changes';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';

    const categoryInput = document.getElementById('chatbotCategory');
    const questionInput = document.getElementById('chatbotQuestion');
    const answerInput = document.getElementById('chatbotAnswer');
    const activeInput = document.getElementById('chatbotIsActive');

    if (categoryInput) categoryInput.value = normalizeCategory(entry.category || 'general');
    if (questionInput) questionInput.value = entry.question || '';
    if (answerInput) answerInput.value = entry.answer || '';
    if (activeInput) activeInput.checked = entry.isActive !== false;

    setTargetRoles([entry.role || currentRole]);
    updateCounter('chatbotQuestion', 'chatbotQuestionCount', 255);
    updateCounter('chatbotAnswer', 'chatbotAnswerCount', 2000);

    questionInput?.focus();
  }

  function clearEditMode() {
    editingEntryId = null;

    const formTitle = document.getElementById('chatbotFormTitle');
    const submitBtn = document.getElementById('chatbotSubmitBtn');
    const cancelBtn = document.getElementById('chatbotCancelEditBtn');

    if (formTitle) formTitle.textContent = 'Add New Question';
    if (submitBtn) submitBtn.textContent = '➕ Add Question';
    if (cancelBtn) cancelBtn.style.display = 'none';

    resetQuestionForm();
    ensureTargetRoleSelection(currentRole);
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  }

  async function loadSettings() {
    try {
      const result = await fetchJson('/api/admin/chatbot/config');
      const cfg = result.data || {};

      const enableHomepage = document.getElementById('chatbotEnableHomepage');
      const enableUser = document.getElementById('chatbotEnableUser');
      const enableUnit = document.getElementById('chatbotEnableUnit');
      const enableAdmin = document.getElementById('chatbotEnableAdmin');
      const primaryColor = document.getElementById('chatbotPrimaryColor');
      const headerTitle = document.getElementById('chatbotHeaderTitle');
      const widgetWidth = document.getElementById('chatbotWidgetWidth');
      const widthLabel = document.getElementById('chatbotWidgetWidthValue');
      const greetingPublic = document.getElementById('chatbotGreetingPublic');
      const greetingUser = document.getElementById('chatbotGreetingUser');
      const greetingUnit = document.getElementById('chatbotGreetingUnit');
      const greetingAdmin = document.getElementById('chatbotGreetingAdmin');
      const fallback = document.getElementById('chatbotFallbackMessage');

      if (enableHomepage) enableHomepage.checked = Boolean(cfg.enabledPages?.homepage);
      if (enableUser) enableUser.checked = Boolean(cfg.enabledPages?.user);
      if (enableUnit) enableUnit.checked = Boolean(cfg.enabledPages?.unit);
      if (enableAdmin) enableAdmin.checked = Boolean(cfg.enabledPages?.admin);
      if (primaryColor) primaryColor.value = cfg.widget?.primaryColor || '#10b981';
      if (headerTitle) headerTitle.value = cfg.widget?.headerTitle || 'S-CORE Assistant';
      if (widgetWidth) widgetWidth.value = Number(cfg.widget?.width || 360);
      if (widthLabel) widthLabel.textContent = `${Number(cfg.widget?.width || 360)}px`;
      if (greetingPublic) greetingPublic.value = cfg.greetings?.public || '';
      if (greetingUser) greetingUser.value = cfg.greetings?.user || '';
      if (greetingUnit) greetingUnit.value = cfg.greetings?.unit || '';
      if (greetingAdmin) greetingAdmin.value = cfg.greetings?.admin || '';
      if (fallback) fallback.value = cfg.fallbackMessage || '';
    } catch (error) {
      console.error('[Chatbot Config] Failed loading settings:', error);
      showMessage('chatbotSettingsMsg', `Failed to load settings: ${error.message}`, false);
    }
  }

  async function saveSettings() {
    const payload = {
      enabledPages: {
        homepage: Boolean(document.getElementById('chatbotEnableHomepage')?.checked),
        user: Boolean(document.getElementById('chatbotEnableUser')?.checked),
        unit: Boolean(document.getElementById('chatbotEnableUnit')?.checked),
        admin: Boolean(document.getElementById('chatbotEnableAdmin')?.checked)
      },
      widget: {
        primaryColor: sanitizeText(document.getElementById('chatbotPrimaryColor')?.value, '#10b981'),
        headerTitle: sanitizeText(document.getElementById('chatbotHeaderTitle')?.value, 'S-CORE Assistant'),
        width: Number(document.getElementById('chatbotWidgetWidth')?.value || 360)
      },
      greetings: {
        public: sanitizeText(document.getElementById('chatbotGreetingPublic')?.value),
        user: sanitizeText(document.getElementById('chatbotGreetingUser')?.value),
        unit: sanitizeText(document.getElementById('chatbotGreetingUnit')?.value),
        admin: sanitizeText(document.getElementById('chatbotGreetingAdmin')?.value)
      },
      fallbackMessage: sanitizeText(document.getElementById('chatbotFallbackMessage')?.value)
    };

    try {
      await fetchJson('/api/admin/chatbot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showMessage('chatbotSettingsMsg', 'Chatbot settings saved successfully.', true);
      await loadSettings();
    } catch (error) {
      console.error('[Chatbot Config] Failed saving settings:', error);
      showMessage('chatbotSettingsMsg', `Failed to save settings: ${error.message}`, false);
    }
  }

  async function loadQAList() {
    try {
      const allResults = await Promise.all(
        VALID_ROLES.map(role => fetchJson(`/api/admin/chatbot/qa/all/${encodeURIComponent(role)}`))
      );
      
      let allEntries = [];
      const entriesByRole = { public: [], user: [], unit: [], admin: [] };

      allResults.forEach((res, i) => {
        const role = VALID_ROLES[i];
        if (res.success && Array.isArray(res.data)) {
          entriesByRole[role] = res.data;
          allEntries.push(...res.data);
        }
      });
      
      // Update global context for Edit/Delete functions
      currentEntries = allEntries;
      
      VALID_ROLES.forEach(role => renderRoleColumn(role, entriesByRole[role]));
    } catch (error) {
      console.error('[Chatbot Config] Failed loading lists:', error);
      VALID_ROLES.forEach(role => {
        const list = document.getElementById(`qaList_${role}`);
        if (list) {
          list.innerHTML = `<p style="color: #991b1b; text-align: center; padding: 20px;">Failed to load: ${escapeHtml(error.message)}</p>`;
        }
      });
    }
  }

  function renderRoleColumn(role, entries) {
    const list = document.getElementById(`qaList_${role}`);
    const paginationContainer = document.getElementById(`qaPage_${role}`);
    if (!list) return;

    if (!entries || entries.length === 0) {
      list.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No questions configured.</p>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
    // Ensure current page is valid
    if (paginationState[role] > totalPages) paginationState[role] = totalPages;
    if (paginationState[role] < 1) paginationState[role] = 1;

    const startIndex = (paginationState[role] - 1) * ITEMS_PER_PAGE;
    const paginatedEntries = entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    list.innerHTML = paginatedEntries.map((entry) => {
      const categoryLabel = categoryLabelMap[entry.category] || 'General';
      const statusLabel = entry.isActive ? 'Active' : 'Inact';
      const statusColor = entry.isActive ? '#166534' : '#6b7280';
      const statusBg = entry.isActive ? '#dcfce7' : '#f3f4f6';

      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-bottom: 6px;">
            <span style="font-size: 0.70rem; font-weight: 700; color: #1f2937; background: #e5e7eb; border-radius: 4px; padding: 2px 6px;">${categoryLabel}</span>
            <span style="font-size: 0.65rem; font-weight: 700; color: ${statusColor}; background: ${statusBg}; border-radius: 4px; padding: 2px 6px;">${statusLabel}</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 0.82rem; font-weight: 700; color: #1f2937;">${escapeHtml(entry.question || '')}</p>
          <p style="margin: 0 0 10px 0; font-size: 0.75rem; color: #4b5563; white-space: pre-wrap; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${escapeHtml(entry.answer || '')}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <button type="button" onclick="editChatbotQA('${entry._id}')" style="padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; background: #ffffff; cursor: pointer; font-size:0.7rem;">Edit</button>
            <button type="button" onclick="toggleChatbotQA('${entry._id}', ${entry.isActive ? 'false' : 'true'})" style="padding: 4px; border: 1px solid #d1d5db; border-radius: 4px; background: #ffffff; cursor: pointer; font-size:0.7rem;">${entry.isActive ? 'Disable' : 'Enable'}</button>
            <button type="button" onclick="deleteChatbotQA('${entry._id}')" style="padding: 4px; border: 1px solid #dc2626; border-radius: 4px; background: #ffffff; color: #dc2626; cursor: pointer; font-size:0.7rem;">Del</button>
          </div>
        </div>
      `;
    }).join('');

    renderPagination(role, totalPages, paginationContainer);
  }

  function renderPagination(role, totalPages, container) {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const cur = paginationState[role];
    container.innerHTML = `
      <button type="button" onclick="goToQaPage('${role}', ${cur - 1})" ${cur === 1 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #d1d5db; background: ${cur === 1 ? '#f3f4f6' : '#fff'}; cursor: ${cur === 1 ? 'not-allowed' : 'pointer'};"><</button>
      <span style="font-size: 0.75rem; font-weight: 600; color: #4b5563;">${cur} / ${totalPages}</span>
      <button type="button" onclick="goToQaPage('${role}', ${cur + 1})" ${cur === totalPages ? 'disabled' : ''} style="padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #d1d5db; background: ${cur === totalPages ? '#f3f4f6' : '#fff'}; cursor: ${cur === totalPages ? 'not-allowed' : 'pointer'};">></button>
    `;
  }

  function goToQaPage(role, page) {
    paginationState[role] = page;
    const entries = currentEntries.filter(e => e.role === role);
    renderRoleColumn(role, entries);
  }

  async function loadRoleJsonEditor() {
    const textarea = document.getElementById('chatbotFlowJson');
    if (!textarea) return;

    try {
      const result = await fetchJson(`/api/admin/chatbot/flows/${encodeURIComponent(currentRole)}`);
      const data = (result.data || []).map((item) => ({
        flowId: item.flowId,
        category: item.category,
        question: item.question,
        answer: item.answer,
        keywords: item.keywords || [],
        nextFlowId: item.nextFlowId || '',
        isActive: item.isActive !== false,
        sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0
      }));
      textarea.value = JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('[Chatbot Config] Failed loading flow JSON:', error);
      showMessage('chatbotJsonMsg', `Failed to load flow JSON: ${error.message}`, false);
    }
  }

  async function saveRoleJsonEditor() {
    const textarea = document.getElementById('chatbotFlowJson');
    if (!textarea) return;

    let parsed;
    try {
      parsed = JSON.parse(textarea.value || '[]');
    } catch (error) {
      showMessage('chatbotJsonMsg', 'Invalid JSON format. Please fix syntax before saving.', false);
      return;
    }

    try {
      await fetchJson(`/api/admin/chatbot/flows/${encodeURIComponent(currentRole)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flows: parsed })
      });
      showMessage('chatbotJsonMsg', 'Flow JSON saved successfully.', true);
      await loadQAList();
      await loadRoleJsonEditor();
    } catch (error) {
      console.error('[Chatbot Config] Failed saving flow JSON:', error);
      showMessage('chatbotJsonMsg', `Failed to save flow JSON: ${error.message}`, false);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function addQA() {
    const questionInput = document.getElementById('chatbotQuestion');
    const answerInput = document.getElementById('chatbotAnswer');
    const categoryInput = document.getElementById('chatbotCategory');
    const isActiveInput = document.getElementById('chatbotIsActive');

    const question = sanitizeText(questionInput?.value);
    const answer = sanitizeText(answerInput?.value);

    if (!question || !answer) {
      showMessage('chatbotAddMsg', 'Question and answer are required.', false);
      return;
    }

    const targetRoles = getSelectedTargetRoles();
    if (targetRoles.length === 0) {
      showMessage('chatbotAddMsg', 'Select at least one target role.', false);
      return;
    }

    if (editingEntryId) {
      if (targetRoles.length !== 1) {
        showMessage('chatbotAddMsg', 'Editing requires exactly one target role.', false);
        return;
      }

      const updatePayload = {
        role: targetRoles[0],
        category: normalizeCategory(categoryInput?.value || 'general'),
        question,
        answer,
        isActive: Boolean(isActiveInput?.checked)
      };

      try {
        await fetchJson(`/api/admin/chatbot/qa/${encodeURIComponent(editingEntryId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        showMessage('chatbotAddMsg', 'Question updated successfully.', true);
        clearEditMode();
        await loadQAList();
        await loadRoleJsonEditor();
      } catch (error) {
        console.error('[Chatbot Config] Failed updating question:', error);
        showMessage('chatbotAddMsg', `Failed to update question: ${error.message}`, false);
      }

      return;
    }

    const basePayload = {
      category: normalizeCategory(categoryInput?.value || 'general'),
      question,
      answer,
      isActive: Boolean(isActiveInput?.checked)
    };

    let successCount = 0;
    const errors = [];

    for (const role of targetRoles) {
      try {
        await fetchJson('/api/admin/chatbot/qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, role })
        });
        successCount += 1;
      } catch (error) {
        errors.push(`${roleLabels[role] || role}: ${error.message}`);
      }
    }

    if (successCount > 0) {
      resetQuestionForm();
      const summary = errors.length > 0
        ? `Added to ${successCount} role(s). ${errors.length} role(s) failed.`
        : `Question added to ${successCount} role(s).`;
      showMessage('chatbotAddMsg', summary, true);
    } else {
      showMessage('chatbotAddMsg', `Failed to add question: ${errors.join(' | ') || 'Unknown error'}`, false);
      return;
    }

    if (errors.length > 0) {
      console.error('[Chatbot Config] Partial add failures:', errors);
    }

    try {
      await loadQAList();
      await loadRoleJsonEditor();
    } catch (refreshError) {
      console.error('[Chatbot Config] Refresh after add failed:', refreshError);
    }
  }

  async function editQA(id) {
    const entry = currentEntries.find((item) => item._id === id);
    if (!entry) {
      showMessage('chatbotAddMsg', 'Entry not found for editing.', false);
      return;
    }

    setEditMode(entry);
    showMessage('chatbotAddMsg', 'Edit mode enabled. Update form then save changes.', true);
  }

  function cancelEditQA() {
    if (!editingEntryId) return;
    clearEditMode();
    showMessage('chatbotAddMsg', 'Edit canceled.', true);
  }

  async function toggleQA(id, isActive) {
    try {
      await fetchJson(`/api/admin/chatbot/qa/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: Boolean(isActive) })
      });
      await loadQAList();
      await loadRoleJsonEditor();
    } catch (error) {
      console.error('[Chatbot Config] Failed toggling question:', error);
      showMessage('chatbotAddMsg', `Failed to change status: ${error.message}`, false);
    }
  }

  async function deleteQA(id) {
    const confirmDelete = window.confirm('Delete this chatbot question?');
    if (!confirmDelete) return;

    try {
      await fetchJson(`/api/admin/chatbot/qa/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      showMessage('chatbotAddMsg', 'Question deleted successfully.', true);
      await loadQAList();
      await loadRoleJsonEditor();
    } catch (error) {
      console.error('[Chatbot Config] Failed deleting question:', error);
      showMessage('chatbotAddMsg', `Failed to delete question: ${error.message}`, false);
    }
  }

  async function onRoleChange(role) {
    const validRole = VALID_ROLES.includes(role) ? role : 'user';

    if (selectedTargetRoles.has(validRole)) {
      if (selectedTargetRoles.size > 1 && currentRole === validRole) {
        selectedTargetRoles.delete(validRole);
        currentRole = Array.from(selectedTargetRoles)[0];
      } else {
        currentRole = validRole;
      }
    } else {
      selectedTargetRoles.add(validRole);
      currentRole = validRole;
    }

    renderRoleButtons();
    if (!editingEntryId) {
      ensureTargetRoleSelection(currentRole);
    }
    await loadQAList();
    await loadRoleJsonEditor();
  }

  function bindSettingsEvents() {
    const widthRange = document.getElementById('chatbotWidgetWidth');
    const widthValue = document.getElementById('chatbotWidgetWidthValue');
    if (widthRange && widthValue) {
      widthRange.addEventListener('input', () => {
        widthValue.textContent = `${Number(widthRange.value || 360)}px`;
      });
    }

    const saveBtn = document.getElementById('chatbotSaveSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveSettings);
    }

    const loadJsonBtn = document.getElementById('chatbotLoadJsonBtn');
    if (loadJsonBtn) {
      loadJsonBtn.addEventListener('click', loadRoleJsonEditor);
    }

    const saveJsonBtn = document.getElementById('chatbotSaveJsonBtn');
    if (saveJsonBtn) {
      saveJsonBtn.addEventListener('click', saveRoleJsonEditor);
    }

    const selectCurrentRoleBtn = document.getElementById('chatbotSelectCurrentRoleBtn');
    if (selectCurrentRoleBtn) {
      selectCurrentRoleBtn.addEventListener('click', () => {
        setTargetRoles([currentRole]);
      });
    }

    const selectAllUserRolesBtn = document.getElementById('chatbotSelectAllUserRolesBtn');
    if (selectAllUserRolesBtn) {
      selectAllUserRolesBtn.addEventListener('click', () => {
        setTargetRoles(['user', 'unit', 'admin']);
      });
    }

    const cancelEditBtn = document.getElementById('chatbotCancelEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', cancelEditQA);
    }

    const questionInput = document.getElementById('chatbotQuestion');
    if (questionInput) {
      questionInput.addEventListener('input', () => updateCounter('chatbotQuestion', 'chatbotQuestionCount', 255));
    }

    const answerInput = document.getElementById('chatbotAnswer');
    if (answerInput) {
      answerInput.addEventListener('input', () => updateCounter('chatbotAnswer', 'chatbotAnswerCount', 2000));
    }

    updateCounter('chatbotQuestion', 'chatbotQuestionCount', 255);
    updateCounter('chatbotAnswer', 'chatbotAnswerCount', 2000);
  }

  function initialize() {
    // Export legacy function names used in inline onclick handlers.
    window.switchChatbotRole = onRoleChange;
    window.addChatbotQA = addQA;
    window.editChatbotQA = editQA;
    window.cancelChatbotEdit = cancelEditQA;
    window.toggleChatbotQA = toggleQA;
    window.deleteChatbotQA = deleteQA;
    window.goToQaPage = goToQaPage;

    bindSettingsEvents();
    renderRoleButtons();
    ensureTargetRoleSelection(currentRole);

    Promise.all([
      loadSettings(),
      loadQAList(),
      loadRoleJsonEditor()
    ]).catch((error) => {
      console.error('[Chatbot Config] Initialization warning:', error);
    });
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
