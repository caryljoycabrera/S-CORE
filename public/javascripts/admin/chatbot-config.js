/**
 * Admin Chatbot Q&A Configuration Handler
 * Manages CRUD operations for Q&A entries in the admin panel
 */

let currentChatbotRole = 'user';
const chatbotApiBase = '/api';

/**
 * Switch to different role's Q&A
 */
async function switchChatbotRole(role) {
	currentChatbotRole = role;

	// Update button states
	document.querySelectorAll('.chatbot-role-btn').forEach((btn) => {
		btn.style.borderColor = '#d1d5db';
		btn.style.color = '#6b7280';
		btn.style.background = 'white';
	});

	const activeBtn = document.querySelector(`[onclick="switchChatbotRole('${role}')"]`);
	if (activeBtn) {
		activeBtn.style.borderColor = '#10b981';
		activeBtn.style.color = '#10b981';
		activeBtn.style.background = 'white';
	}

	// Update display
	const roleNames = { user: 'User', unit: 'Unit', admin: 'Admin', public: 'Public' };
	document.getElementById('currentRoleDisplay').textContent = roleNames[role] || 'User';

	// Clear form
	clearChatbotForm();

	// Load Q&A for role
	await loadChatbotQA(role);
}

/**
 * Load Q&A for current role
 */
async function loadChatbotQA(role) {
	try {
		const response = await fetch(`${chatbotApiBase}/admin/chatbot/qa/all/${role}`);
		if (!response.ok) {
			throw new Error(`API responded with ${response.status}`);
		}

		const result = await response.json();
		renderChatbotQAList(result.data || []);
	} catch (error) {
		console.error('[ChatbotAdmin] Error loading Q&A:', error);
		showChatbotMessage('Failed to load Q&A', 'error');
		renderChatbotQAList([]);
	}
}

/**
 * Render Q&A list
 */
function renderChatbotQAList(qaList) {
	const container = document.getElementById('chatbotQAList');
	if (!container) return;

	if (qaList.length === 0) {
		container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No questions yet. Add one to get started!</p>';
		return;
	}

	let html = '';
	qaList.forEach((qa) => {
		const isActive = qa.isActive ? '✅' : '⏸️';
		const safeId = escapeAttr(qa._id);
		html += `
			<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: start; gap: 12px;">
				<div style="flex: 1; min-width: 0;">
					<div style="display: flex; gap: 8px; margin-bottom: 6px; align-items: center;">
						<span style="font-weight: 700; color: #1f2937; word-break: break-word;">${escapeHTML(qa.question)}</span>
						<span style="font-size: 0.75rem; color: #6b7280; background: #e5e7eb; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">${qa.category || 'General'}</span>
					</div>
					<p style="margin: 0; color: #6b7280; font-size: 0.85rem; word-break: break-word;">${escapeHTML(qa.answer.substring(0, 100))}${qa.answer.length > 100 ? '...' : ''}</p>
					<p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 0.75rem;">${isActive} ${qa.isActive ? 'Active' : 'Inactive'}</p>
				</div>
				<div style="display: flex; gap: 8px; white-space: nowrap;">
					<button type="button" onclick="editChatbotQA('${safeId}')" 
						style="padding: 6px 12px; background: #dbeafe; color: #1e40af; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
						✏️ Edit
					</button>
					<button type="button" onclick="deleteChatbotQA('${safeId}')"
						style="padding: 6px 12px; background: #fee2e2; color: #991b1b; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
						🗑️ Delete
					</button>
				</div>
			</div>
		`;
	});

	container.innerHTML = html;
}

/**
 * Add/Update Q&A
 */
async function addChatbotQA() {
	const question = document.getElementById('chatbotQuestion').value.trim();
	const answer = document.getElementById('chatbotAnswer').value.trim();
	const category = document.getElementById('chatbotCategory').value;
	const isActive = document.getElementById('chatbotIsActive').checked;

	// Validation
	if (!question || question.length < 5) {
		showChatbotMessage('Question must be at least 5 characters', 'error');
		return;
	}

	if (!answer || answer.length < 10) {
		showChatbotMessage('Answer must be at least 10 characters', 'error');
		return;
	}

	try {
		const response = await fetch(`${chatbotApiBase}/admin/chatbot/qa`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				role: currentChatbotRole,
				question,
				answer,
				category,
				isActive,
			}),
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.message || 'Failed to add Q&A');
		}

		showChatbotMessage('✅ Question added successfully', 'success');
		clearChatbotForm();
		await loadChatbotQA(currentChatbotRole);
	} catch (error) {
		console.error('[ChatbotAdmin] Error adding Q&A:', error);
		showChatbotMessage(error.message, 'error');
	}
}

/**
 * Edit Q&A (placeholder - would show modal)
 */
function editChatbotQA(id) {
	showChatbotMessage('Edit feature coming soon', 'info');
}

/**
 * Delete Q&A
 */
async function deleteChatbotQA(id) {
	if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
		return;
	}

	try {
		const response = await fetch(`${chatbotApiBase}/admin/chatbot/qa/${id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.message || 'Failed to delete Q&A');
		}

		showChatbotMessage('✅ Question deleted successfully', 'success');
		await loadChatbotQA(currentChatbotRole);
	} catch (error) {
		console.error('[ChatbotAdmin] Error deleting Q&A:', error);
		showChatbotMessage(error.message, 'error');
	}
}

/**
 * Clear form
 */
function clearChatbotForm() {
	document.getElementById('chatbotQuestion').value = '';
	document.getElementById('chatbotAnswer').value = '';
	document.getElementById('chatbotCategory').value = 'General';
	document.getElementById('chatbotIsActive').checked = true;
	document.getElementById('chatbotQuestionCount').textContent = '0/255';
	document.getElementById('chatbotAnswerCount').textContent = '0/2000';
	document.getElementById('chatbotAddMsg').style.display = 'none';
}

/**
 * Show message
 */
function showChatbotMessage(text, type) {
	const msgDiv = document.getElementById('chatbotAddMsg');
	if (!msgDiv) return;

	msgDiv.textContent = text;
	msgDiv.style.display = 'block';

	if (type === 'success') {
		msgDiv.style.background = '#dcfce7';
		msgDiv.style.color = '#166534';
		msgDiv.style.border = '1px solid #86efac';
	} else if (type === 'error') {
		msgDiv.style.background = '#fee2e2';
		msgDiv.style.color = '#991b1b';
		msgDiv.style.border = '1px solid #fca5a5';
	} else {
		msgDiv.style.background = '#dbeafe';
		msgDiv.style.color = '#1e40af';
		msgDiv.style.border = '1px solid #93c5fd';
	}

	// Auto-clear after 5 seconds
	setTimeout(() => {
		msgDiv.style.display = 'none';
	}, 5000);
}

/**
 * Escape HTML
 */
function escapeHTML(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Escape attribute
 */
function escapeAttr(text) {
	return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Initialize chatbot tab on page load
 */
document.addEventListener('DOMContentLoaded', () => {
	// Add character counters
	const questionInput = document.getElementById('chatbotQuestion');
	const answerInput = document.getElementById('chatbotAnswer');

	if (questionInput) {
		questionInput.addEventListener('input', (e) => {
			document.getElementById('chatbotQuestionCount').textContent = `${e.target.value.length}/255`;
		});
	}

	if (answerInput) {
		answerInput.addEventListener('input', (e) => {
			document.getElementById('chatbotAnswerCount').textContent = `${e.target.value.length}/2000`;
		});
	}

	// Load initial Q&A
	loadChatbotQA(currentChatbotRole);
});
