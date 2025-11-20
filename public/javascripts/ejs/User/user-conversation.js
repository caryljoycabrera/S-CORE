/**
 * USER CONVERSATION MODAL HANDLER
 * Handles conversation functionality for User service requests and approval requests
 * Matches Admin and Unit functionality with message formatting, file uploads, and viewer modals
 */

console.log('[User Conversation] Script loaded');

// ==================================
// HELPER FUNCTIONS
// ==================================

// Helper function to escape HTML
window.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to format text with markdown-style syntax
window.formatText = function(text) {
  if (!text) return '';
  
  // Escape HTML first
  let formatted = window.escapeHtml(text);
  
  // Bold: **text** -> <strong>text</strong>
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* -> <em>text</em> (but not ** which is bold)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Underline: __text__ -> <u>text</u>
  formatted = formatted.replace(/__([^_]+)__/g, '<u>$1</u>');
  
  // Preserve line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// ==================================
// PDF VIEWER FUNCTIONS
// ==================================

window.viewPdf = function(pdfUrl, fileName) {
  const modal = document.getElementById('pdfViewerModal');
  const title = document.getElementById('pdfViewerTitle');
  const iframe = document.getElementById('pdfViewerFrame');
  
  if (modal && iframe) {
    title.textContent = fileName;
    iframe.src = pdfUrl;
    modal.style.display = 'flex';
  }
};

window.closePdfViewer = function() {
  const modal = document.getElementById('pdfViewerModal');
  const iframe = document.getElementById('pdfViewerFrame');
  
  if (modal) {
    modal.style.display = 'none';
    if (iframe) {
      iframe.src = '';
    }
  }
};

// ==================================
// IMAGE VIEWER FUNCTIONS
// ==================================

window.viewImage = function(imageUrl, fileName) {
  const modal = document.getElementById('imageViewerModal');
  if (!modal) {
    // Create image viewer modal if it doesn't exist
    const modalHTML = `
      <div id="imageViewerModal" class="modal" style="display: flex; z-index: 1000000;">
        <div class="modal-content" style="max-width: 90vw; width: auto; max-height: 90vh; padding: 0; background: #1f2937;">
          <div class="modal-header" style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 1.5rem;">
            <div class="modal-title-section">
              <svg class="modal-title-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: white;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <h2 id="imageViewerTitle" style="margin: 0; color: white;">Image</h2>
            </div>
            <button class="close-modal-btn" onclick="closeImageViewer()" aria-label="Close">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style="padding: 1rem; display: flex; justify-content: center; align-items: center; background: #111827;">
            <img id="imageViewerImg" style="max-width: 100%; max-height: 75vh; object-fit: contain;" />
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  const viewerModal = document.getElementById('imageViewerModal');
  const title = document.getElementById('imageViewerTitle');
  const img = document.getElementById('imageViewerImg');
  
  if (viewerModal && img) {
    title.textContent = fileName;
    img.src = imageUrl;
    viewerModal.style.display = 'flex';
  }
};

window.closeImageViewer = function() {
  const modal = document.getElementById('imageViewerModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// ==================================
// CONVERSATION MESSAGE RENDERING
// ==================================

function createMessageElement(msg) {
  console.log('[User Conversation] Creating message element:', msg);
  console.log('[User Conversation] currentUserFullName:', window.currentUserFullName);
  console.log('[User Conversation] msg.senderName:', msg.senderName);
  const div = document.createElement('div');
  
  // Determine if this is the current user's message
  const isOwnMessage = window.currentUserFullName && msg.senderName === window.currentUserFullName;
  console.log('[User Conversation] Message alignment:', { isOwnMessage, currentUserFullName: window.currentUserFullName, senderName: msg.senderName });
  
  // Role-based styling
  let roleClass = 'user-message';
  let roleColor = '#e0f2fe'; // Light blue for users
  
  if (isOwnMessage) {
    roleClass = 'own-message';
    roleColor = '#ffffff'; // White for own messages
  } else if (msg.senderRole === 'admin') {
    roleClass = 'admin-message';
    roleColor = '#fecaca'; // Light red for admin
  } else if (msg.senderRole === 'unit') {
    roleClass = 'unit-message';
    roleColor = '#bbf7d0'; // Light green for unit
  } else if (msg.senderRole === 'user') {
    roleClass = 'user-message';
    roleColor = '#e0f2fe'; // Light blue for users
  }
  
  // Add alignment class
  div.className = `unit-message-item ${isOwnMessage ? 'message-right' : 'message-left'}`;
  
  const time = new Date(msg.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let attachmentsHTML = '';
  if (msg.attachments && msg.attachments.length > 0) {
    console.log('[User Conversation] Message has attachments:', msg.attachments.length);
    attachmentsHTML = msg.attachments.map(file => {
      const ext = file.filename.split('.').pop().toLowerCase();
      const isPdf = ext === 'pdf';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      
      let iconColor = '#64748b';
      if (isImage) iconColor = '#059669';
      else if (isPdf) iconColor = '#dc2626';
      else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
      
      return `
        <div class="message-attachment">
          <div class="message-attachment-icon" style="color: ${iconColor};">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <line x1="8" y1="8" x2="16" y2="8"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="8" y1="16" x2="12" y2="16"/>
            </svg>
          </div>
          <div class="message-attachment-info">
            <div class="message-attachment-name">${window.escapeHtml(file.originalname || file.filename)}</div>
            <div class="message-attachment-size">${ext.toUpperCase()}</div>
          </div>
          <div class="message-attachment-actions">
            ${isImage ? `
              <button class="attachment-action-btn" onclick="viewImage('/uploads/${file.filename}', '${window.escapeHtml(file.originalname || file.filename)}')" title="View Image">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            ` : ''}
            ${isPdf ? `
              <button class="attachment-action-btn pdf-view" onclick="viewPdf('/uploads/${file.filename}', '${window.escapeHtml(file.originalname || file.filename)}')" title="View PDF">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <path d="M8 6h8M8 10h8M8 14h4"/>
                </svg>
              </button>
            ` : ''}
            <a href="/uploads/${file.filename}" download="${window.escapeHtml(file.originalname || file.filename)}" class="attachment-action-btn" title="Download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
  
  div.innerHTML = `
    <div class="unit-message-bubble" style="background: ${roleColor};">
      <div class="unit-message-header">
        <span class="unit-message-sender">${window.escapeHtml(msg.senderName || 'Unknown')}</span>
        <span class="unit-message-time">${time}</span>
      </div>
      <div class="unit-message-content">${window.formatText(msg.content || '')}</div>
      ${attachmentsHTML ? `<div class="unit-message-attachments">${attachmentsHTML}</div>` : ''}
    </div>
  `;
  
  return div;
}

// ==================================
// CONVERSATION MANAGEMENT
// ==================================

window.openUserConversation = function(requestId) {
  console.log('[User Conversation] Opening conversation for:', requestId);
  
  const conversationModal = document.getElementById('conversationModal');
  const messagesContainer = document.getElementById('messagesContainer');
  
  if (!conversationModal || !messagesContainer) {
    console.error('[User Conversation] Modal elements not found');
    return;
  }
  
  // Load conversation
  fetch(`/api/conversation/${requestId}`)
    .then(response => response.json())
    .then(data => {
      console.log('[User Conversation] Conversation data received:', data);
      
      let messages = data.conversation || data.messages || [];
      
      // Filter out revision feedback messages from unit (they appear in revision history)
      messages = messages.filter(msg => {
        const content = msg.content || '';
        const isRevisionMessage = content.includes('📝 **Revision Requested**') || 
                                  content.includes('✅ **Request Approved**') || 
                                  content.includes('🔄 **Approval Revoked**') ||
                                  content.includes('✅ **Revision Response**');
        return !isRevisionMessage;
      });
      
      console.log('[User Conversation] Displaying', messages.length, 'messages (after filtering revision feedback)');
      
      // Clear container
      messagesContainer.innerHTML = '';
      
      if (messages.length === 0) {
        // Show empty state
        messagesContainer.innerHTML = `
          <div class="unit-messages-empty">
            <div class="empty-icon">
              <svg width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>No discussion yet</p>
            <small>Start the conversation below</small>
          </div>
        `;
      } else {
        // Render messages
        messages.forEach(msg => {
          const messageElement = createMessageElement(msg);
          messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      // Show modal
      conversationModal.style.display = 'flex';
      
      // Mark messages as read
      fetch(`/api/conversation/${requestId}/mark-read`, { method: 'POST' });
    })
    .catch(error => {
      console.error('[User Conversation] Error loading conversation:', error);
      messagesContainer.innerHTML = '<p style="color: red; text-align: center; padding: 2rem;">Error loading conversation</p>';
    });
};

// ==================================
// CHAT FILE MANAGEMENT
// ==================================

window.initializeChatFileFeatures = function() {
  console.log('[User Conversation] Initializing chat file features...');
  
  const chatAttachBtn = document.getElementById('chatAttachBtn');
  const chatFileInput = document.getElementById('chatFileInput');
  const chatFilesPreview = document.getElementById('chatFilesPreview');
  const chatFilesContainer = document.getElementById('chatFilesContainer');
  const clearChatFiles = document.getElementById('clearChatFiles');
  
  let chatFiles = [];
  
  if (chatAttachBtn && chatFileInput) {
    console.log('[User Conversation] Attach button and file input found');
    
    chatAttachBtn.addEventListener('click', () => {
      chatFileInput.click();
    });
    
    chatFileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      chatFiles = chatFiles.concat(files);
      updateChatFilesPreview();
    });
  }
  
  if (clearChatFiles) {
    clearChatFiles.addEventListener('click', () => {
      chatFiles = [];
      chatFileInput.value = '';
      updateChatFilesPreview();
    });
  }
  
  function updateChatFilesPreview() {
    if (!chatFilesPreview || !chatFilesContainer) return;
    
    if (chatFiles.length === 0) {
      chatFilesPreview.style.display = 'none';
      return;
    }
    
    chatFilesPreview.style.display = 'block';
    
    const filesCount = chatFilesPreview.querySelector('.files-count');
    if (filesCount) {
      filesCount.textContent = `${chatFiles.length} file(s) attached`;
    }
    
    chatFilesContainer.innerHTML = chatFiles.map((file, index) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      
      return `
        <div class="file-item">
          <div class="file-icon">
            ${isImage ? '🖼️' : '📎'}
          </div>
          <div class="file-name" title="${file.name}">${file.name}</div>
          <button type="button" class="remove-file-btn" onclick="window.removeChatFile(${index})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }
  
  window.removeChatFile = function(index) {
    chatFiles.splice(index, 1);
    updateChatFilesPreview();
  };
  
  window.getChatFiles = function() {
    return chatFiles;
  };
  
  window.clearChatFiles = function() {
    chatFiles = [];
    if (chatFileInput) chatFileInput.value = '';
    updateChatFilesPreview();
  };
};

// ==================================
// TEXT FORMATTING
// ==================================

window.applyChatFormat = function(formatType) {
  const messageInput = document.getElementById('messageInput');
  if (!messageInput) return;
  
  const start = messageInput.selectionStart;
  const end = messageInput.selectionEnd;
  const selectedText = messageInput.value.substring(start, end);
  
  let formattedText = selectedText;
  let wrapper = '';
  
  switch(formatType) {
    case 'bold':
      wrapper = '**';
      formattedText = `**${selectedText}**`;
      break;
    case 'italic':
      wrapper = '*';
      formattedText = `*${selectedText}*`;
      break;
    case 'underline':
      wrapper = '__';
      formattedText = `__${selectedText}__`;
      break;
  }
  
  const newValue = messageInput.value.substring(0, start) + formattedText + messageInput.value.substring(end);
  messageInput.value = newValue;
  
  const newCursorPos = start + wrapper.length;
  messageInput.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
  messageInput.focus();
};

// ==================================
// KEYBOARD SHORTCUTS
// ==================================

document.addEventListener('DOMContentLoaded', function() {
  // Connect chat button to conversation modal
  const chatBtn = document.getElementById('openChatFromDetailsModal');
  if (chatBtn) {
    console.log('[User Conversation] Chat button found, attaching click handler');
    chatBtn.addEventListener('click', function() {
      const requestId = window.currentRequestId;
      if (requestId) {
        console.log('[User Conversation] Opening conversation for request:', requestId);
        window.openUserConversation(requestId);
      } else {
        console.error('[User Conversation] No request ID available');
      }
    });
  }

  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    console.log('[User Conversation] Message input found, attaching keyboard shortcuts');
    
    messageInput.addEventListener('keydown', function(e) {
      // Ctrl+B or Cmd+B for bold
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        console.log('[User Conversation] Keyboard shortcut: Bold (Ctrl+B)');
        applyChatFormat('bold');
        return false;
      }
      // Ctrl+I or Cmd+I for italic
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        console.log('[User Conversation] Keyboard shortcut: Italic (Ctrl+I)');
        applyChatFormat('italic');
        return false;
      }
      // Ctrl+U or Cmd+U for underline
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        console.log('[User Conversation] Keyboard shortcut: Underline (Ctrl+U)');
        applyChatFormat('underline');
        return false;
      }
    });
  }
  
  // Initialize formatting toolbar buttons
  const formatBtns = document.querySelectorAll('[data-chat-format]');
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const formatType = btn.getAttribute('data-chat-format');
      applyChatFormat(formatType);
    });
  });
  
  // Initialize chat file features
  initializeChatFileFeatures();
});

console.log('[User Conversation] Script initialization complete');
