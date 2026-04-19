// ===== Chatbot Widget Client =====
// Lightweight role-based chatbot widget for homepage, user, and unit pages.

(function bootstrapChatbotWidget() {
  if (window.__SCORE_CHATBOT_WIDGET_LOADED__) {
    return;
  }
  window.__SCORE_CHATBOT_WIDGET_LOADED__ = true;

  class ChatbotWidget {
    constructor(root) {
      this.root = root;
      this.page = (root.dataset.page || 'homepage').toLowerCase();
      this.role = (root.dataset.role || 'public').toLowerCase();
      this.userId = root.dataset.userId || '';
      this.unitTeam = root.dataset.unitTeam || '';
      this.config = null;
      this.socket = null;
      this.currentFlowId = '';
      this.pendingSocket = new Map();
      this.messagesEl = null;
      this.statusEl = null;
      this.inputEl = null;
    }

    async init() {
      this.config = await this.fetchConfig();
      if (!this.config || !this.config.enabled) {
        this.root.innerHTML = '';
        return;
      }

      this.render();
      this.bindEvents();
      this.initSocket();
      this.addBotMessage(this.config.greeting || 'Good day. How may I assist you?');
    }

    async fetchConfig() {
      try {
        const qs = new URLSearchParams({
          page: this.page,
          role: this.role
        });
        const response = await fetch(`/api/chatbot/config?${qs.toString()}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load chatbot config');
        }
        return data.data;
      } catch (error) {
        console.error('[Chatbot Widget] Failed to fetch config:', error);
        return null;
      }
    }

    render() {
      const color = this.config.widget?.primaryColor || '#10b981';
      const width = Number(this.config.widget?.width || 360);
      const title = this.config.widget?.headerTitle || 'S-CORE Assistant';

      this.root.innerHTML = `
        <div class="chatbot-widget" style="--chatbot-primary:${this.escapeHtml(color)};--chatbot-width:${width}px;">
          <button type="button" class="chatbot-trigger" aria-label="Open chat assistant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <div class="chatbot-panel" role="dialog" aria-label="Chat assistant panel" aria-modal="false">
            <div class="chatbot-header">
              <div class="chatbot-title-wrap">
                <p class="chatbot-title">${this.escapeHtml(title)}</p>
                <p class="chatbot-subtitle">Formal support assistant</p>
              </div>
              <div class="chatbot-header-actions">
                <button type="button" class="chatbot-icon-btn chatbot-minimize" aria-label="Minimize">-</button>
                <button type="button" class="chatbot-icon-btn chatbot-close" aria-label="Close">x</button>
              </div>
            </div>

            <div class="chatbot-body">
              <div class="chatbot-messages"></div>
              <div class="chatbot-footer">
                <form class="chatbot-form">
                  <div class="chatbot-input-row">
                    <input type="text" class="chatbot-input" placeholder="Type your question" maxlength="500" autocomplete="off" />
                    <button type="submit" class="chatbot-send">Send</button>
                  </div>
                </form>
                <div class="chatbot-status" aria-live="polite"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.messagesEl = this.root.querySelector('.chatbot-messages');
      this.statusEl = this.root.querySelector('.chatbot-status');
      this.inputEl = this.root.querySelector('.chatbot-input');
    }

    bindEvents() {
      const wrapper = this.root.querySelector('.chatbot-widget');
      const trigger = this.root.querySelector('.chatbot-trigger');
      const closeBtn = this.root.querySelector('.chatbot-close');
      const minBtn = this.root.querySelector('.chatbot-minimize');
      const form = this.root.querySelector('.chatbot-form');

      if (trigger) {
        trigger.addEventListener('click', () => {
          wrapper.classList.add('open');
          if (this.inputEl) this.inputEl.focus();
        });
      }

      if (minBtn) {
        minBtn.addEventListener('click', () => {
          wrapper.classList.remove('open');
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          wrapper.classList.remove('open');
          if (this.messagesEl) this.messagesEl.innerHTML = '';
          this.currentFlowId = '';
          this.addBotMessage(this.config.greeting || 'Good day. How may I assist you?');
        });
      }

      if (form) {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const text = (this.inputEl?.value || '').trim();
          if (!text) return;

          this.inputEl.value = '';
          this.addUserMessage(text);
          this.setStatus('Assistant is preparing a response...');

          try {
            const result = await this.sendMessage(text);
            this.setStatus('');
            this.handleResponse(result);
          } catch (error) {
            console.error('[Chatbot Widget] Message failed:', error);
            this.setStatus('Request failed. Please try again.');
            this.addBotMessage('Thank you for your inquiry. The assistant is currently unavailable. Please try again shortly.');
          }
        });
      }
    }

    initSocket() {
      if (!this.config.useSocketRealtime || typeof io !== 'function') {
        return;
      }

      try {
        this.socket = io();

        this.socket.on('connect', () => {
          if (this.userId) {
            this.socket.emit('authenticate', {
              userId: this.userId,
              userRole: this.role,
              unitTeam: this.unitTeam
            });
          }
        });

        this.socket.on('chatbot:response', (payload) => {
          if (!payload || !payload.requestId) return;

          const pending = this.pendingSocket.get(payload.requestId);
          if (!pending) return;

          this.pendingSocket.delete(payload.requestId);
          if (payload.success) {
            pending.resolve(payload.data || {});
          } else {
            pending.reject(new Error(payload.message || 'Socket response failed'));
          }
        });
      } catch (error) {
        console.error('[Chatbot Widget] Socket initialization failed:', error);
      }
    }

    sendMessage(text) {
      if (this.socket && this.socket.connected && this.config.useSocketRealtime) {
        return this.sendMessageViaSocket(text).catch(() => this.sendMessageViaHttp(text));
      }
      return this.sendMessageViaHttp(text);
    }

    sendMessageViaSocket(text) {
      return new Promise((resolve, reject) => {
        const requestId = `chatbot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const timeoutId = setTimeout(() => {
          this.pendingSocket.delete(requestId);
          reject(new Error('Socket response timeout'));
        }, 4000);

        this.pendingSocket.set(requestId, {
          resolve: (data) => {
            clearTimeout(timeoutId);
            resolve(data);
          },
          reject: (error) => {
            clearTimeout(timeoutId);
            reject(error);
          }
        });

        this.socket.emit('chatbot:message', {
          requestId,
          role: this.role,
          page: this.page,
          currentFlowId: this.currentFlowId,
          message: text
        });
      });
    }

    async sendMessageViaHttp(text) {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: this.role,
          page: this.page,
          currentFlowId: this.currentFlowId,
          message: text
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'HTTP response failed');
      }

      return data.data || {};
    }

    handleResponse(data) {
      if (!data) return;
      if (data.flowId) {
        this.currentFlowId = data.flowId;
      }

      this.addBotMessage(data.answer || 'Thank you for your inquiry. Please try again with additional details.', data.suggestions || []);
    }

    addUserMessage(text) {
      this.appendMessage('user', text);
    }

    addBotMessage(text, suggestions) {
      this.appendMessage('bot', text, suggestions);
    }

    appendMessage(kind, text, suggestions) {
      if (!this.messagesEl) return;

      const wrapper = document.createElement('div');
      wrapper.className = `chatbot-msg ${kind}`;
      wrapper.textContent = text || '';

      if (kind === 'bot' && Array.isArray(suggestions) && suggestions.length > 0) {
        const list = document.createElement('div');
        list.className = 'chatbot-suggestions';

        suggestions.slice(0, 3).forEach((label) => {
          const cleanLabel = String(label || '').trim();
          if (!cleanLabel) return;

          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'chatbot-suggestion-btn';
          button.textContent = cleanLabel;
          button.addEventListener('click', () => {
            if (!this.inputEl) return;
            this.inputEl.value = cleanLabel;
            this.inputEl.focus();
          });
          list.appendChild(button);
        });

        if (list.childElementCount > 0) {
          wrapper.appendChild(list);
        }
      }

      this.messagesEl.appendChild(wrapper);
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    setStatus(message) {
      if (this.statusEl) {
        this.statusEl.textContent = message || '';
      }
    }

    escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('chatbot-widget-root');
    if (!root) return;

    const widget = new ChatbotWidget(root);
    widget.init();
  });
})();
