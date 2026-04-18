/**
 * ChatbotWidget - Predefined Q&A Chatbot Widget
 * Displays on all pages for unauthenticated and authenticated users
 * Role-based Q&A fetch (public, user, unit, admin)
 */

class ChatbotWidget {
	constructor(options = {}) {
		this.role = options.role || 'public';
		this.containerId = options.containerId || 'chatbot-widget-container';
		this.qaData = [];
		this.isMinimized = true;
		this.searchQuery = '';
		this.storageKey = 'chatbot_widget_state';
		this.apiEndpoint = '/api/chatbot/qa';
		this.init();
	}

	/**
	 * Initialize widget
	 */
	async init() {
		try {
			// Load widget minimize state from localStorage
			await this.loadState();

			// Insert widget HTML into page
			this.createHTML();

			// Fetch Q&A data
			await this.fetchQA();

			// Render Q&A list
			this.renderQAList();

			// Attach event listeners
			this.attachEventListeners();

			console.log(`[ChatbotWidget] Initialized for role: ${this.role}`);
		} catch (error) {
			console.error('[ChatbotWidget] Initialization error:', error);
		}
	}

	/**
	 * Create HTML structure for widget
	 */
	createHTML() {
		const container = document.getElementById(this.containerId);
		if (!container) {
			console.warn(`[ChatbotWidget] Container ${this.containerId} not found`);
			return;
		}

		const chatIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
		</svg>`;

		const html = `
			<div id="chatbot-widget" class="chatbot-widget ${this.isMinimized ? 'minimized' : ''}">
				<!-- Floating Button -->
				<div id="chatbot-toggle-btn" class="chatbot-toggle-btn" title="Help & Questions">
					<span class="chatbot-icon">${chatIcon}</span>
				</div>

				<!-- Chat Window -->
				<div id="chatbot-window" class="chatbot-window ${this.isMinimized ? 'hidden' : ''}">
					<!-- Header -->
					<div class="chatbot-header">
						<h3>Frequently Asked Questions</h3>
						<div class="chatbot-controls">
							<button id="chatbot-minimize-btn" class="chatbot-minimize-btn" title="Minimize">−</button>
							<button id="chatbot-close-btn" class="chatbot-close-btn" title="Close">×</button>
						</div>
					</div>

					<!-- Search -->
					<div class="chatbot-search">
						<input
							type="text"
							id="chatbot-search-input"
							class="chatbot-search-input"
							placeholder="Search questions..."
							autocomplete="off"
						/>
					</div>

					<!-- QA List -->
					<div class="chatbot-qa-list-wrapper">
						<div class="chatbot-qa-list" id="chatbot-qa-list">
							<p class="chatbot-loading">Loading questions...</p>
						</div>
					</div>

					<!-- Answer Panel -->
					<div id="chatbot-answer-panel" class="chatbot-answer-panel hidden">
						<button id="chatbot-back-btn" class="chatbot-back-btn">← Back to Questions</button>
						<div id="chatbot-answer-content" class="chatbot-answer-content"></div>
					</div>
				</div>
			</div>
		`;

		container.innerHTML += html;
	}

	/**
	 * Fetch Q&A data from API
	 */
	async fetchQA() {
		try {
			const response = await fetch(`${this.apiEndpoint}/${this.role}`);
			if (!response.ok) {
				throw new Error(`API responded with ${response.status}`);
			}

			const result = await response.json();
			this.qaData = result.data || [];
			console.log(`[ChatbotWidget] Fetched ${this.qaData.length} Q&A for role: ${this.role}`);
		} catch (error) {
			console.error('[ChatbotWidget] Error fetching Q&A:', error);
			this.qaData = [];
		}
	}

	/**
	 * Render Q&A list
	 */
	renderQAList(items = this.qaData) {
		const listContainer = document.getElementById('chatbot-qa-list');
		if (!listContainer) return;

		if (items.length === 0) {
			listContainer.innerHTML = '<p class="chatbot-empty">No questions available.</p>';
			return;
		}

		let html = '';
		items.forEach((qa) => {
			const safeQuestion = this.escapeHTML(qa.question);
			const safeId = this.escapeHTML(qa._id);
			html += `
				<div class="chatbot-qa-item" data-qa-id="${safeId}">
					<div class="chatbot-qa-question">${safeQuestion}</div>
					<div class="chatbot-qa-category">${qa.category || 'General'}</div>
				</div>
			`;
		});

		listContainer.innerHTML = html;
	}

	/**
	 * Display answer for selected Q&A
	 */
	displayAnswer(qaId) {
		const qa = this.qaData.find((item) => item._id === qaId);
		if (!qa) return;

		const answerPanel = document.getElementById('chatbot-answer-panel');
		const answerContent = document.getElementById('chatbot-answer-content');
		const qaListWrapper = document.querySelector('.chatbot-qa-list-wrapper');

		if (answerPanel && answerContent) {
			const formattedAnswer = this.formatAnswer(qa.answer);
			answerContent.innerHTML = `
				<div class="chatbot-answer">
					<div class="chatbot-answer-question">${this.escapeHTML(qa.question)}</div>
					<div class="chatbot-answer-body">${formattedAnswer}</div>
					<div class="chatbot-answer-category">Category: ${qa.category || 'General'}</div>
				</div>
			`;
			answerPanel.classList.remove('hidden');
			if (qaListWrapper) {
				qaListWrapper.classList.add('hidden');
			}
		}
	}

	/**
	 * Format answer text (escape HTML for security)
	 */
	formatAnswer(text) {
		// Escape HTML to prevent injection
		let safe = this.escapeHTML(text);

		// Convert URLs to links (simple regex, doesn't capture all cases but safe)
		safe = safe.replace(
			/https?:\/\/[^\s<>]+/g,
			(url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
		);

		// Convert line breaks to <br> tags
		safe = safe.replace(/\n/g, '<br/>');

		return safe;
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	escapeHTML(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Search Q&A locally
	 */
	searchQuestions(query) {
		this.searchQuery = query.toLowerCase().trim();

		if (!this.searchQuery) {
			this.renderQAList();
			return;
		}

		const filtered = this.qaData.filter((qa) => {
			const question = qa.question.toLowerCase();
			const answer = qa.answer.toLowerCase();
			return question.includes(this.searchQuery) || answer.includes(this.searchQuery);
		});

		this.renderQAList(filtered);
	}

	/**
	 * Toggle minimize state
	 */
	toggleMinimize() {
		this.isMinimized = !this.isMinimized;
		const widget = document.getElementById('chatbot-widget');
		const window_ = document.getElementById('chatbot-window');

		if (this.isMinimized) {
			widget.classList.add('minimized');
			window_.classList.add('hidden');
		} else {
			widget.classList.remove('minimized');
			window_.classList.remove('hidden');
		}

		this.saveState();
	}

	/**
	 * Close widget
	 */
	closeWidget() {
		const widget = document.getElementById('chatbot-widget');
		if (widget) {
			widget.style.display = 'none';
		}
	}

	/**
	 * Show Q&A list (from answer view)
	 */
	showQAList() {
		const answerPanel = document.getElementById('chatbot-answer-panel');
		const qaListWrapper = document.querySelector('.chatbot-qa-list-wrapper');

		if (answerPanel) {
			answerPanel.classList.add('hidden');
		}
		if (qaListWrapper) {
			qaListWrapper.classList.remove('hidden');
		}

		// Clear search
		const searchInput = document.getElementById('chatbot-search-input');
		if (searchInput) {
			searchInput.value = '';
			this.searchQuery = '';
		}
	}

	/**
	 * Save widget state to localStorage
	 */
	saveState() {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify({ isMinimized: this.isMinimized }));
		} catch (error) {
			console.warn('[ChatbotWidget] Failed to save state:', error);
		}
	}

	/**
	 * Load widget state from localStorage
	 */
	async loadState() {
		try {
			const state = localStorage.getItem(this.storageKey);
			if (state) {
				const parsed = JSON.parse(state);
				this.isMinimized = parsed.isMinimized !== false; // Default to minimized
			}
		} catch (error) {
			console.warn('[ChatbotWidget] Failed to load state:', error);
		}
	}

	/**
	 * Attach event listeners
	 */
	attachEventListeners() {
		// Toggle button
		const toggleBtn = document.getElementById('chatbot-toggle-btn');
		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => this.toggleMinimize());
		}

		// Minimize button
		const minimizeBtn = document.getElementById('chatbot-minimize-btn');
		if (minimizeBtn) {
			minimizeBtn.addEventListener('click', () => this.toggleMinimize());
		}

		// Close button
		const closeBtn = document.getElementById('chatbot-close-btn');
		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.closeWidget());
		}

		// Search input
		const searchInput = document.getElementById('chatbot-search-input');
		if (searchInput) {
			searchInput.addEventListener('input', (e) => this.searchQuestions(e.target.value));
		}

		// Q&A items click
		document.addEventListener('click', (e) => {
			const qaItem = e.target.closest('.chatbot-qa-item');
			if (qaItem) {
				const qaId = qaItem.getAttribute('data-qa-id');
				if (qaId) {
					this.displayAnswer(qaId);
				}
			}

			const backBtn = e.target.closest('#chatbot-back-btn');
			if (backBtn) {
				this.showQAList();
			}
		});
	}
}

// Auto-initialize widget on page load if container exists
document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('chatbot-widget-container');
	if (container) {
		const role = container.getAttribute('data-user-role') || 'public';
		window.chatbotWidget = new ChatbotWidget({ role });
	}
});
