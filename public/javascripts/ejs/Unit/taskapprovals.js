  // Global registry for all dropdown instances
  const DropdownManager = {
    activeDropdown: null,
    
    registerOpen(dropdown) {
      // Close the currently active dropdown if it exists and is different
      if (this.activeDropdown && this.activeDropdown !== dropdown) {
        this.activeDropdown.close();
      }
      this.activeDropdown = dropdown;
    },
    
    clearActive(dropdown) {
      if (this.activeDropdown === dropdown) {
        this.activeDropdown = null;
      }
    }
  };

  // Enhanced Multi-Select Class for Organizations
  class EnhancedMultiSelect {
    constructor(containerId, options, placeholder = 'Select options', hasSearch = true) {
      this.container = document.getElementById(containerId);
      this.options = options;
      this.placeholder = placeholder;
      this.selectedValues = new Set(['all']);
      this.isOpen = false;
      this.filteredOptions = [...options];
      this.hasSearch = hasSearch;
      
      this.init();
    }
    
    init() {
      this.setupElements();
      this.populateOptions();
      this.attachEventListeners();
      this.updateDisplay();
    }
    
    setupElements() {
      this.display = this.container.querySelector('.select-display');
      this.dropdown = this.container.querySelector('.select-dropdown');
      this.searchInput = this.dropdown.querySelector('.search-input');
      this.optionsContainer = this.dropdown.querySelector('.options-container');
      this.selectedText = this.display.querySelector('.selected-text');
    }
    
    populateOptions() {
      // Add "All" option
      const allOption = this.createOption('all', `All ${this.placeholder.replace('Select ', '')}`);
      this.optionsContainer.appendChild(allOption);
      
      // Add other options
      this.options.forEach(option => {
        const optionElement = this.createOption(option, option);
        this.optionsContainer.appendChild(optionElement);
      });
    }
    
    createOption(value, text) {
      const label = document.createElement('label');
      label.className = 'dropdown-option';
      label.innerHTML = `
        <input type="checkbox" value="${value}" ${this.selectedValues.has(value) ? 'checked' : ''}>
        <span class="checkbox-custom"></span>
        ${text}
      `;
      return label;
    }
    
    attachEventListeners() {
      // Toggle dropdown
      this.display.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
      
      // Search functionality
      if (this.hasSearch && this.searchInput) {
        this.searchInput.addEventListener('input', (e) => {
          this.filterOptions(e.target.value);
        });
      }
      
      // Option selection
      this.optionsContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          this.handleOptionChange(e.target);
        }
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });
      
      // Prevent dropdown close when clicking inside
      this.dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    filterOptions(searchTerm) {
      if (!this.hasSearch) return;
      
      const options = this.optionsContainer.querySelectorAll('.dropdown-option');
      let visibleCount = 0;
      
      options.forEach(option => {
        const text = option.textContent.toLowerCase();
        const matches = text.includes(searchTerm.toLowerCase());
        option.style.display = matches ? 'flex' : 'none';
        if (matches) visibleCount++;
      });
      
      this.toggleNoResults(visibleCount === 0 && searchTerm.length > 0);
    }
    
    toggleNoResults(show) {
      if (!this.hasSearch) return;
      
      let noResultsEl = this.optionsContainer.querySelector('.no-results');
      
      if (show && !noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'no-results';
        noResultsEl.textContent = 'No results found';
        this.optionsContainer.appendChild(noResultsEl);
      } else if (!show && noResultsEl) {
        noResultsEl.remove();
      }
    }
    
    handleOptionChange(checkbox) {
      const value = checkbox.value;
      
      if (value === 'all') {
        if (checkbox.checked) {
          this.selectedValues.clear();
          this.selectedValues.add('all');
          this.updateCheckboxes();
        } else if (this.selectedValues.size === 1 && this.selectedValues.has('all')) {
          checkbox.checked = true;
          return;
        }
      } else {
        if (checkbox.checked) {
          this.selectedValues.delete('all');
          this.selectedValues.add(value);
        } else {
          this.selectedValues.delete(value);
          if (this.selectedValues.size === 0) {
            this.selectedValues.add('all');
          }
        }
        this.updateCheckboxes();
      }
      
      this.updateDisplay();
      this.triggerChange();
    }
    
    updateCheckboxes() {
      const checkboxes = this.optionsContainer.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.checked = this.selectedValues.has(cb.value);
      });
    }
    
    updateDisplay() {
      const selectedArray = Array.from(this.selectedValues);
      
      if (selectedArray.includes('all') || selectedArray.length === 0) {
        this.selectedText.textContent = `All ${this.placeholder.replace('Select ', '')}`;
      } else if (selectedArray.length === 1) {
        this.selectedText.textContent = selectedArray[0];
      } else {
        this.selectedText.textContent = `${selectedArray.length} selected`;
      }
    }
    
    getSelectedValues() {
      return Array.from(this.selectedValues);
    }
    
    reset() {
      this.selectedValues.clear();
      this.selectedValues.add('all');
      this.updateCheckboxes();
      this.updateDisplay();
      if (this.hasSearch && this.searchInput) {
        this.searchInput.value = '';
        this.filterOptions('');
      }
      this.triggerChange();
    }
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
    
    open() {
      // Register this dropdown with the manager (will close others)
      DropdownManager.registerOpen(this);
      
      this.isOpen = true;
      this.display.classList.add('active');
      this.dropdown.classList.add('show');
      if (this.hasSearch && this.searchInput) {
        this.searchInput.focus();
      }
    }
    
    close() {
      this.isOpen = false;
      this.display.classList.remove('active');
      this.dropdown.classList.remove('show');
      
      // Clear this dropdown from the manager
      DropdownManager.clearActive(this);
      
      if (this.hasSearch && this.searchInput) {
        this.searchInput.value = '';
        this.filterOptions('');
      }
    }
    
    triggerChange() {
      const event = new CustomEvent('selectionChange', {
        detail: { values: this.getSelectedValues() }
      });
      this.container.dispatchEvent(event);
    }
  }

  // Get user organizations data from the JSON script tag
  const userOrgData = JSON.parse(document.getElementById('userOrgData').textContent);
  const userType = userOrgData.userType;
  const userOrganizations = userOrgData.organizations || [];

  // Fix organization data parsing for both students and non-students
  let parsedOrganizations = [];
  if (userOrganizations.length > 0) {
    // Handle different data formats
    userOrganizations.forEach(org => {
      if (typeof org === 'string') {
        if (org.includes(',')) {
          // Split comma-separated values
          parsedOrganizations = parsedOrganizations.concat(
            org.split(',').map(o => o.trim()).filter(Boolean)
          );
        } else {
          parsedOrganizations.push(org.trim());
        }
      } else {
        parsedOrganizations.push(String(org).trim());
      }
    });
  }

  // Remove duplicates
  parsedOrganizations = [...new Set(parsedOrganizations)];

  // DOM Elements
  const openModalBtn = document.getElementById('openModalBtn');
  const requestModal = document.getElementById('requestModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const detailModal = document.getElementById("detailsModal");
  const closeDetailsModal = document.getElementById("closeDetailsModal");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const tableBody = document.getElementById("requestsTableBody");
  const allRows = Array.from(document.querySelectorAll('.request-row'));
  const submissionModal = document.getElementById('submissionConfirmationModal');
  const closeSubmissionBtn = document.getElementById('closeSubmissionConfirmation');
  const conversationModal = document.getElementById("conversationModal");
  const closeConversationModal = document.getElementById("closeConversationModal");
  const messagesContainer = document.getElementById("messagesContainer");
  const messageInput = document.getElementById("messageInput");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const openChatFromDetailsModal = document.getElementById("openChatFromDetailsModal");

  // Status filter elements
  const statusFilterElement = document.getElementById('statusFilter');
  const statusDropdown = document.getElementById('statusDropdown');
  const statusDisplay = statusFilterElement ? statusFilterElement.querySelector('.select-display') : null;
  const statusCheckboxes = statusDropdown ? statusDropdown.querySelectorAll('input[type="checkbox"]') : [];
  const allStatusCheckbox = statusDropdown ? statusDropdown.querySelector('input[value="all"]') : null;

  // Multiple file upload variables
  let selectedApprovalFiles = [];
  let selectedAdditionalFiles = []; // Additional files for revision requests
  const maxFileSize = 10 * 1024 * 1024; // 10MB per file
  let currentConversationId = null;

  // Filter variables
  let organizationFilter;

  // Initialize when DOM loads
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize organization filter based on user's organizations
    if (parsedOrganizations.length > 0) {
      const placeholderText = userType === 'student' ? 'My Organizations' : 'My Departments';
      organizationFilter = new EnhancedMultiSelect('organizationFilter', 
        parsedOrganizations, 
        placeholderText, 
        true);
      
      // Add event listener for organization filter changes
      document.getElementById('organizationFilter').addEventListener('selectionChange', filterRequests);
    } else {
      // Hide the organization filter if user has no organizations
      const orgFilterItem = document.querySelector('.filter-item:has(#organizationFilter)');
      if (orgFilterItem) {
        orgFilterItem.style.display = 'none';
      }
    }

    // Removed old modal form submit handler to avoid conflicts with direct submission
  });

  // Enhanced submission modal controls
  if (closeSubmissionBtn) {
    closeSubmissionBtn.onclick = () => {
      if (submissionModal) submissionModal.style.display = 'none';
    };
  }

  // Update the Proceed button to actually submit
  const proceedSubmissionBtn = document.getElementById('proceedSubmissionBtn');
  if (proceedSubmissionBtn) {
    proceedSubmissionBtn.onclick = () => {
      if (submissionModal) submissionModal.style.display = 'none';
      console.log('User confirmed submission. Proceeding with fetch...');
      submitFormDataDirect(); // Use the new direct submission function
    };
  }
// Function to handle form submission via Fetch
async function submitFormData() {
  if (!approvalForm) {
    console.error("Cannot submit, form not found.");
    alert("An error occurred. Could not find the form.");
    return;
  }

  // Add a loading indicator
  const submitButton = approvalForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit Request';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '⏳ Submitting...';
  }

  try {
    const formData = new FormData();

    // Add all form fields
    const fields = approvalForm.elements;
    for (let field of fields) {
      if (field.name && field.name !== 'upload') { // Skip file input, we'll handle it separately
        formData.append(field.name, field.value);
      }
    }

    // Explicitly add selected files (don't rely on the input field being updated)
    if (selectedApprovalFiles && selectedApprovalFiles.length > 0) {
      console.log('selectedApprovalFiles before FormData:', selectedApprovalFiles);
      selectedApprovalFiles.forEach((file, index) => {
        console.log('File details:', file, typeof file, file instanceof File, file.name, file.size, file.type);
      });
      console.log('Adding', selectedApprovalFiles.length, 'files to FormData:');
      selectedApprovalFiles.forEach((file, index) => {
        console.log(`File ${index}: ${file.name} (${file.size} bytes, ${file.type})`);
        formData.append('upload', file);
      });
      console.log('FormData after adding files:', formData);
    } else {
      console.log('No files in selectedApprovalFiles array');
    }

    const response = await fetch('/submit-request-approval', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Submission successful:', result.message);
      
      // Redirect immediately without notification
      window.location.href = result.redirectUrl || '/request-approvals?submitted=true';
    } else {
      console.error('Submission failed on server:', result.message);
      alert(result.message || 'Submission failed. Please check your input and try again.');
      
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  } catch (error) {
    console.error('Submission error (fetch failed):', error);
    alert('Submission failed due to a network error. Please try again.');
    
    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

  // Enhanced cancel submission button
  const cancelSubmissionBtn = document.getElementById('cancelSubmissionBtn');
  if (cancelSubmissionBtn) {
    cancelSubmissionBtn.onclick = () => {
      if (submissionModal) submissionModal.style.display = 'none';
      // Keep the form modal open for user to review and edit
    };
  }

  // Modal close handlers
  if (openModalBtn) openModalBtn.onclick = () => requestModal.style.display = 'flex';
  if (closeModalBtn) closeModalBtn.onclick = () => requestModal.style.display = 'none';
  if (cancelModalBtn) cancelModalBtn.onclick = () => requestModal.style.display = 'none';
  if (closeDetailsModal) closeDetailsModal.onclick = () => detailModal.style.display = 'none';
  if (closeConversationModal) closeConversationModal.onclick = () => conversationModal.style.display = 'none';

  // Combined window click handler
  window.onclick = function(event) {
    if (event.target === requestModal && requestModal) requestModal.style.display = 'none';
    if (event.target === detailModal && detailModal) detailModal.style.display = 'none';
    if (event.target === conversationModal && conversationModal) conversationModal.style.display = 'none';
    if (event.target === submissionModal && submissionModal) submissionModal.style.display = 'none';
  };

  // Chat functionality
  if (openChatFromDetailsModal) {
    openChatFromDetailsModal.onclick = function() {
      detailModal.style.display = 'none';
      openChat(currentConversationId);
    };
  }

  function openChat(requestId) {
    currentConversationId = requestId;
    loadConversation(requestId);
    if (conversationModal) conversationModal.style.display = 'flex';
  }

  async function loadConversation(requestId) {
    try {
      const response = await fetch(`/api/conversation/${requestId}`);
      const conversation = await response.json();
      
      if (messagesContainer) messagesContainer.innerHTML = '';
      
      if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages.forEach(message => {
          addMessageToUI(message);
        });
        
        await fetch(`/api/conversation/${requestId}/mark-read`, {
          method: 'POST'
        });
      } else {
        if (messagesContainer) messagesContainer.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #64748b;">
            <div style="text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 1rem;">💭</div>
              <p>No messages yet</p>
              <small>Start the conversation by sending a message below</small>
            </div>
          </div>
        `;
      }
      
      if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error('Error loading conversation:', error);
      if (messagesContainer) messagesContainer.innerHTML = '<p style="color: red;">Error loading conversation</p>';
    }
  }

  function addMessageToUI(message) {
    if (!messagesContainer) return;
    
    // Clear empty state message if it exists
    const emptyStateMessage = messagesContainer.querySelector('p');
    if (emptyStateMessage && (emptyStateMessage.textContent.includes('No messages yet') || emptyStateMessage.textContent.includes('No messages yet. Start the conversation!'))) {
      messagesContainer.innerHTML = '';
    }
    
    const messageDiv = document.createElement('div');
    const isUser = message.senderRole === 'user';
    const senderName = message.senderId ? `${message.senderId.fName} ${message.senderId.lName}` : 'Unknown';
    
    // Create user avatar (profile picture or default icon)
    const userAvatar = `
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 0.75rem; overflow: hidden; border: 2px solid ${isUser ? 'var(--primary-green)' : '#d1d5db'};">
        ${message.senderId && message.senderId.profilePicture ? 
          `<img src="/uploads/${message.senderId.profilePicture}" alt="${senderName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <svg width="20" height="20" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>` :
          `<svg width="20" height="20" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>`
        }
      </div>
    `;
    
    messageDiv.className = `message ${isUser ? 'user-message' : 'admin-message'}`;
    messageDiv.style.marginBottom = '1.5rem';
    messageDiv.style.maxWidth = '80%';
    // User messages align to the left, admin messages align to the right
    if (isUser) {
      messageDiv.style.marginRight = 'auto';
    } else {
      messageDiv.style.marginLeft = 'auto';
    }
    
    messageDiv.innerHTML = `
      <div class="message-content" style="padding: 0.75rem; border-radius: 0.5rem; background: ${isUser ? 'var(--primary-green)' : 'white'}; color: ${isUser ? 'white' : 'inherit'}; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; align-items: flex-start;">
          ${userAvatar}
          <div style="flex: 1; min-width: 0; overflow-wrap: break-word;">
            <div class="message-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.875rem;">
              <strong>${senderName}</strong>
              <span class="message-time" style="opacity: 0.7; font-size: 0.75rem;">${new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <div class="message-text" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; white-space: pre-wrap;"></div>
            <div class="message-attachment" style="margin-top: 0.5rem;"></div>
          </div>
        </div>
      </div>
    `;
    
    // Set the message content as HTML to support formatting
    const messageTextDiv = messageDiv.querySelector('.message-text');
    if (messageTextDiv && message.content) {
      // Convert markdown-style formatting to HTML
      let formattedContent = message.content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold** -> <strong>bold</strong>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic* -> <em>italic</em>
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');           // <u>underline</u> stays the same
      
      messageTextDiv.innerHTML = formattedContent;
    }
    
    // Handle attachments
  const attachmentDiv = messageDiv.querySelector('.message-attachment');
  if (attachmentDiv && message.file_path) {
    const isImage = message.file_type && message.file_type.startsWith('image/');
    
    if (isImage) {
      attachmentDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <img src="${message.file_path}" 
               style="max-width: 200px; max-height: 150px; border-radius: 0.375rem; cursor: pointer; border: 1px solid #e5e7eb;" 
               onclick="openImageModal('${message.file_path}')"
               alt="${message.original_filename || 'Attached image'}">
        </div>
      `;
    } else {
      const fileName = message.original_filename || 'File';
      attachmentDiv.innerHTML = `
        <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f3f4f6; border-radius: 0.375rem; border: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">📎</span>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.875rem; font-weight: 500; color: #374151; truncate;">${fileName}</div>
              <div style="font-size: 0.75rem; color: #6b7280;">File attachment</div>
            </div>
            <a href="${message.file_path}" download="${fileName}" 
               style="padding: 0.25rem 0.5rem; background: var(--primary-green); color: white; text-decoration: none; border-radius: 0.25rem; font-size: 0.75rem;">
              Download
            </a>
          </div>
        </div>
      `;
    }
  }    messagesContainer.appendChild(messageDiv);
  }

  if (sendMessageBtn) {
    sendMessageBtn.onclick = async function() {
      const content = messageInput ? messageInput.value.trim() : '';
      if (!content && !currentAttachment) return;
      if (!currentConversationId) return;

      try {
        let response;
        
        if (currentAttachment) {
          // Send with file attachment using FormData
          const formData = new FormData();
          formData.append('content', content || ''); // Always include content field
          formData.append('file', currentAttachment.file);
          
          response = await fetch(`/api/conversation/${currentConversationId}/message`, {
            method: 'POST',
            body: formData
          });
        } else {
          // Send text only using JSON
          response = await fetch(`/api/conversation/${currentConversationId}/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
          });
        }

        const result = await response.json();
        
        if (result.success) {
          addMessageToUI(result.message);
          if (messageInput) messageInput.value = '';
          
          // Clear attachment
          if (currentAttachment) {
            currentAttachment = null;
            if (attachmentPreview) attachmentPreview.style.display = 'none';
            if (imageUpload) imageUpload.value = '';
            if (fileUpload) fileUpload.value = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
          }
          
          if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
          throw new Error(result.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
      }
    };
  }

  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        if (sendMessageBtn) sendMessageBtn.click();
      }
    });
  }

  // Custom Status Filter Logic with DropdownManager integration
  const statusFilterDropdown = {
    isOpen: false,
    
    open() {
      // Register with DropdownManager to close other dropdowns
      DropdownManager.registerOpen(this);
      
      this.isOpen = true;
      if (statusFilterElement) statusFilterElement.classList.add('active');
      if (statusDropdown) statusDropdown.classList.add('show');
    },
    
    close() {
      this.isOpen = false;
      if (statusFilterElement) statusFilterElement.classList.remove('active');
      if (statusDropdown) statusDropdown.classList.remove('show');
      
      // Clear from DropdownManager
      DropdownManager.clearActive(this);
    },
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  };

  if (statusFilterElement) {
    statusFilterElement.addEventListener('click', function(e) {
      e.stopPropagation();
      statusFilterDropdown.toggle();
    });
  }

  // Prevent dropdown from closing when clicking inside
  if (statusDropdown) {
    statusDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (statusFilterElement && !statusFilterElement.contains(e.target)) {
      statusFilterDropdown.close();
    }
  });

  // Handle checkbox changes
  statusCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.value === 'all') {
        if (this.checked) {
          statusCheckboxes.forEach(cb => {
            if (cb.value !== 'all') cb.checked = false;
          });
        }
      } else {
        if (this.checked) {
          allStatusCheckbox.checked = false;
        }
        
        const specificChecked = Array.from(statusCheckboxes).some(cb => 
          cb.value !== 'all' && cb.checked
        );
        if (!specificChecked) {
          allStatusCheckbox.checked = true;
        }
      }
      
      updateStatusDisplay();
      filterRequests();
    });
  });

  function updateStatusDisplay() {
    if (!statusDisplay) return;
    
    const checkedBoxes = Array.from(statusCheckboxes).filter(cb => cb.checked);
    
    if ((allStatusCheckbox && allStatusCheckbox.checked) || checkedBoxes.length === 0) {
      statusDisplay.textContent = 'All Status';
    } else if (checkedBoxes.length === 1) {
      statusDisplay.textContent = checkedBoxes[0].value.charAt(0).toUpperCase() + 
                                checkedBoxes[0].value.slice(1);
    } else {
      statusDisplay.textContent = `${checkedBoxes.length} Selected`;
    }
  }

  function getSelectedStatuses() {
    const checkedBoxes = Array.from(statusCheckboxes).filter(cb => 
      cb.checked && cb.value !== 'all'
    );
    
    if ((allStatusCheckbox && allStatusCheckbox.checked) || checkedBoxes.length === 0) {
      return [];
    }
    
    return checkedBoxes.map(cb => cb.value.toLowerCase());
  }

  // Filter functionality
  function filterRequests() {
    const selectedStatuses = getSelectedStatuses();
    const titleValue = document.getElementById('titleFilter') ? document.getElementById('titleFilter').value.toLowerCase() : '';
    const organizationValue = organizationFilter ? organizationFilter.getSelectedValues() : ['all'];
    const dateFromValue = document.getElementById('dateFromFilter') ? document.getElementById('dateFromFilter').value : '';
    const dateToValue = document.getElementById('dateToFilter') ? document.getElementById('dateToFilter').value : '';

    let visibleCount = 0;

    allRows.forEach(row => {
      const rowStatus = row.dataset.status ? row.dataset.status.toLowerCase() : '';
      const rowTitle = row.dataset.title ? row.dataset.title.toLowerCase() : '';
      const rowOrganization = row.dataset.organization ? row.dataset.organization.toLowerCase() : '';
      const rowDate = row.dataset.date || '';

      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes('all') || selectedStatuses.includes(rowStatus);
      const titleMatch = (titleValue === '' || rowTitle.includes(titleValue));
      
      // Organization filter logic
      let organizationMatch = true;
      if (organizationFilter && organizationValue.length > 0 && !organizationValue.includes('all')) {
        organizationMatch = organizationValue.some(org => 
          rowOrganization.includes(org.toLowerCase())
        );
      }

      let dateMatch = true;
      if (dateFromValue) {
        const fromDate = new Date(dateFromValue);
        const rowDateObj = new Date(rowDate);
        dateMatch = dateMatch && (rowDateObj >= fromDate);
      }
      if (dateToValue) {
        const toDate = new Date(dateToValue);
        const rowDateObj = new Date(rowDate);
        dateMatch = dateMatch && (rowDateObj <= toDate);
      }

      const isVisible = statusMatch && titleMatch && organizationMatch && dateMatch;
      row.style.display = isVisible ? '' : 'none';

      if (isVisible) visibleCount++;
    });

    const totalCount = allRows.length;
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      if (visibleCount === totalCount) {
        resultsCount.textContent = `Showing all ${totalCount} requests`;
      } else {
        resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} requests`;
      }
    }

    toggleNoResultsMessage(visibleCount === 0);
  }

  function toggleNoResultsMessage(show) {
    let noResultsRow = document.getElementById('noResultsRow');
    
    if (show && !noResultsRow) {
      const tbody = document.getElementById('requestsTableBody');
      if (tbody) {
        noResultsRow = document.createElement('tr');
        noResultsRow.id = 'noResultsRow';
        noResultsRow.innerHTML = `
          <td colspan="6" style="text-align: center; padding: 3rem; color: #6b7280;">
            <svg width="48" height="48" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 1rem; display: block;">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3 style="margin-bottom: 0.5rem; color: var(--primary-green);">No requests found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </td>
        `;
        tbody.appendChild(noResultsRow);
      }
    } else if (!show && noResultsRow) {
      noResultsRow.remove();
    }
  }

  // Form submission handler with confirmation modal
  function handleFormSubmit(event) {
    event.preventDefault(); // Always prevent default
    console.log('Form submit intercepted for validation and confirmation.');

    // Validate files
    if (selectedApprovalFiles.length === 0) {
      alert('Please upload at least one file. Files are required for approval requests.');
      return false;
    }

    console.log('Validation passed. Showing confirmation modal.');

    // Show confirmation modal
    const modal = document.getElementById('submissionConfirmationModal');
    if (modal) {
      modal.style.display = 'flex';
    } else {
      console.error('Submission confirmation modal not found!');
      alert('Modal error. Please refresh and try again.');
    }

    return false;
  }

  // Direct submission function without modal
  function submitFormDataDirect() {
    const form = document.getElementById('requestForm');
    if (!form) {
      console.error("Cannot submit, form not found.");
      alert("An error occurred. Could not find the form.");
      return;
    }

    // Add a loading indicator
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'Submit Request';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '⏳ Submitting...';
    }

    try {
      const formData = new FormData();

      // Add all form fields
      const fields = form.elements;
      for (let field of fields) {
        if (field.name && field.type !== 'file') { // Skip file inputs, we'll handle them separately
          formData.append(field.name, field.value);
        }
      }

      console.log('selectedApprovalFiles before FormData:', selectedApprovalFiles);
      selectedApprovalFiles.forEach((file, index) => {
        console.log('File details:', file, typeof file, file instanceof File, file.name, file.size, file.type);
      });

      // Explicitly add selected files (don't rely on file input being updated)
      if (selectedApprovalFiles && selectedApprovalFiles.length > 0) {
        console.log('Adding', selectedApprovalFiles.length, 'files to FormData:');
        selectedApprovalFiles.forEach((file, index) => {
          console.log(`File ${index}: ${file.name} (${file.size} bytes, ${file.type})`);
          formData.append('upload', file);
        });
        console.log('FormData after adding files:', formData);
      }

      console.log('Submitting to server...');

      fetch('/submit-request-approval', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('Server response:', result);

        if (result.success) {
          console.log('Submission successful:', result.message);
          window.location.href = result.redirectUrl || '/request-approvals?submitted=true';
        } else {
          console.error('Submission failed on server:', result.message);
          alert(result.message || 'Submission failed. Please try again.');

          // Re-enable submit button
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
          }
        }
      })
      .catch(error => {
        console.error('Submission error (fetch failed):', error);
        alert('Submission failed due to a network error. Please try again.');

        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        }
      });
    } catch (error) {
      console.error('Error preparing FormData:', error);
      alert('Error preparing submission data. Please try again.');

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  }

  // Filter event listeners
  const titleFilter = document.getElementById('titleFilter');
  if (titleFilter) titleFilter.addEventListener('input', filterRequests);

  const dateFromFilter = document.getElementById('dateFromFilter');
  if (dateFromFilter) dateFromFilter.addEventListener('change', filterRequests);

  const dateToFilter = document.getElementById('dateToFilter');
  if (dateToFilter) dateToFilter.addEventListener('change', filterRequests);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (titleFilter) titleFilter.value = '';
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';
      
      // Clear status filter
      statusCheckboxes.forEach(cb => cb.checked = false);
      if (allStatusCheckbox) allStatusCheckbox.checked = true;
      updateStatusDisplay();
      
      // Clear organization filter
      if (organizationFilter) {
        organizationFilter.reset();
      }
      
      filterRequests();
    });
  }

  // Enhanced row click handler with improved modal population
document.querySelectorAll('.request-row').forEach(row => {
  row.addEventListener('click', (e) => {
    // Mark related notifications as read when opening request
    const requestId = row.dataset.id;
    const requestType = 'Request Approval';
    if (requestId && window.markNotificationReadForRequest) {
      window.markNotificationReadForRequest(requestId, requestType);
    }
    
    // Reset additional files when opening a new request
    selectedAdditionalFiles = [];
    updateAdditionalFileDisplay();

    // Get all detail elements
    const detailTitle = document.getElementById("detailTitle");
    const detailOrganization = document.getElementById("detailOrganization");
    const detailDescription = document.getElementById("detailDescription");
    const detailStatus = document.getElementById("detailStatus");
    const detailStatusBadge = document.getElementById("detailStatusBadge");
    const detailUnits = document.getElementById("detailUnits");
    const detailDatetime = document.getElementById("detailDatetime");
    const detailSpecificType = document.getElementById("detailSpecificType");

    // Populate fields
    if (detailTitle) detailTitle.innerText = row.dataset.title || '';
    if (detailOrganization) detailOrganization.innerText = row.dataset.organization || '';
    if (detailDescription) detailDescription.innerText = row.dataset.description || 'No description provided';
    if (detailUnits) detailUnits.innerText = row.dataset.units || 'Not yet assigned';
    if (detailDatetime) detailDatetime.innerText = row.dataset.datetime || '';
    if (detailSpecificType) detailSpecificType.innerText = row.dataset.specifictype || 'Not specified';

      // Enhanced status badge
      if (detailStatus && detailStatusBadge) {
        const status = row.dataset.status || '';
        detailStatus.innerText = status;
        detailStatusBadge.className = `status-badge-large ${status.toLowerCase()}`;

        // Show additional files section only for "for revision" status where additional file upload is allowed
        const additionalFilesSection = document.getElementById('additional-files-section');
        const allowAdditionalFileUpload = row.dataset.allowadditionalfileupload === 'true';

        if (additionalFilesSection) {
          if (status.toLowerCase() === 'for revision' && allowAdditionalFileUpload) {
            additionalFilesSection.style.display = 'block';
          } else {
            additionalFilesSection.style.display = 'none';
          }
        }
      }

      // Enhanced file preview
      const file = row.dataset.file;
      const filesData = row.dataset.files;
      const previewContainer = document.getElementById('file-preview');

      if (previewContainer) {
        previewContainer.innerHTML = '';

        let allFiles = [];
        if (filesData && filesData.trim() !== '') {
          allFiles = filesData.split(',').map(f => f.trim()).filter(Boolean);
        } else if (file && file.trim() !== '') {
          allFiles = [file.trim()];
        }

        createEnhancedFilePreview(allFiles, previewContainer);
      }

      // Chat functionality
      currentConversationId = row.dataset.id;
      const chatButtonSection = document.getElementById("chatButtonSection");
      if (chatButtonSection) {
        const requestType = row.dataset.type;
        if (requestType === "Service Request" || requestType === "Request Approval") {
          chatButtonSection.style.display = 'block';
        } else {
          chatButtonSection.style.display = 'none';
        }
      }

      if (detailModal) detailModal.style.display = 'flex';
    });
  });

  // Header Dropdown Manager - Integrates with DropdownManager
  const headerDropdown = {
    menu: null,
    isOpen: false,
    
    init() {
      this.menu = document.getElementById("dropdownMenu");
    },
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open() {
      // Register with DropdownManager to close other dropdowns
      DropdownManager.registerOpen(this);
      
      if (this.menu) {
        this.menu.style.display = "block";
        this.isOpen = true;
      }
    },
    
    close() {
      if (this.menu) {
        this.menu.style.display = "none";
        this.isOpen = false;
      }
      
      // Clear from DropdownManager
      DropdownManager.clearActive(this);
    }
  };

  // Dropdown functionality
  function toggleDropdown() {
    if (!headerDropdown.menu) {
      headerDropdown.init();
    }
    headerDropdown.toggle();
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    headerDropdown.init();
  });

  document.addEventListener("click", function (event) {
    const toggle = document.querySelector(".dropdown-toggle");
    const menu = document.getElementById("dropdownMenu");
    if (toggle && menu && !toggle.contains(event.target)) {
      headerDropdown.close();
    }
  });

  // Enhanced form submission with confirmation modal
// Enhanced form submission with confirmation modal
const approvalForm = document.querySelector('#requestModal form');

if (approvalForm) {
  approvalForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    console.log('Form submit intercepted for validation and confirmation.');

    // Validation
    const fileInput = document.getElementById('upload');
    const specificRequestType = document.getElementById('specificRequestType');
    const projectTitle = document.getElementById('projectTitle');
    const description = document.getElementById('description');

    // Validate required fields
    if (!projectTitle || !projectTitle.value.trim()) {
      alert('Please enter a project title.');
      projectTitle.focus();
      return;
    }

    if (!description || !description.value.trim()) {
      alert('Please enter a description.');
      description.focus();
      return;
    }

    // Validate required files
    if (selectedApprovalFiles.length === 0) {
      alert('Please upload at least one file. Files are required for approval requests.');
      console.log('Validation failed: No files selected');
      return;
    }

    // Validate specific request type
    if (!specificRequestType || !specificRequestType.value) {
      alert('Please select a specific request type.');
      specificRequestType.focus();
      return;
    }

    console.log('Validation passed. Showing confirmation modal.');

    // Show confirmation modal
    if (submissionModal) {
      submissionModal.style.display = 'flex';
    } else {
      console.error('Submission confirmation modal not found!');
      alert('Modal error. Please refresh and try again.');
    }
  });
} else {
  console.error('Request form (#requestForm) not found!');
}
  // ===== APPROVAL FILE UPLOAD FUNCTIONS =====
  
  // Handle file selection
  function handleApprovalFileSelection(files) {
    console.log('handleApprovalFileSelection called with:', files.length, 'files');
    let validFiles = [];
    let errors = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      // Check for duplicates
      if (selectedApprovalFiles.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: File already selected`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      alert('Some files could not be added:\n' + errors.join('\n'));
    }

    // Add valid files with progress simulation
    if (validFiles.length > 0) {
      simulateApprovalUploadProgress(validFiles);
    }
  }

  // Simulate upload progress
  function simulateApprovalUploadProgress(files) {
    const progressContainer = document.getElementById('approvalUploadProgress');
    const progressFill = document.getElementById('approvalProgressFill');
    
    if (progressContainer && progressFill) {
      progressContainer.style.display = 'block';
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Add files after progress complete
          selectedApprovalFiles = selectedApprovalFiles.concat(files);
          updateApprovalFileDisplay();
          updateApprovalFormData();
          
          // Hide progress after delay
          setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
          }, 500);
        }
        progressFill.style.width = progress + '%';
      }, 100);
    } else {
      // Fallback if no progress bar
      selectedApprovalFiles = selectedApprovalFiles.concat(files);
      updateApprovalFileDisplay();
      updateApprovalFormData();
    }
  }

  // Update file display
  function updateApprovalFileDisplay() {
    const fileManagement = document.getElementById('approvalFileManagement');
    const filesContainer = document.getElementById('approvalSelectedFiles');
    const filesCount = document.getElementById('approvalFilesCount');
    const filesSummary = document.getElementById('approvalFilesSummary');
    const uploadGroup = document.getElementById('approvalFileUploadGroup');
    const clearAllBtn = document.getElementById('approvalClearAllBtn');

    if (selectedApprovalFiles.length === 0) {
      fileManagement.style.display = 'none';
      uploadGroup.classList.remove('has-file');
      return;
    }

    fileManagement.style.display = 'block';
    uploadGroup.classList.add('has-file');

    // Update files count
    filesCount.textContent = `${selectedApprovalFiles.length} file(s) selected`;

    // Clear container
    filesContainer.innerHTML = '';

    // Add each file
    selectedApprovalFiles.forEach((file, index) => {
      const fileItem = createApprovalFileItem(file, index);
      filesContainer.appendChild(fileItem);
    });

    // Update summary
    const totalSize = selectedApprovalFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    filesSummary.textContent = `Total size: ${totalSizeMB} MB`;

    // Enable/disable clear all button
    if (clearAllBtn) clearAllBtn.disabled = selectedApprovalFiles.length === 0;
  }

  // Create file item element
  function createApprovalFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.setAttribute('data-index', index);
    
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    fileItem.innerHTML = `
      <div class="file-item-info">
        <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <div class="file-item-details">
          <div class="file-item-name">${file.name}</div>
          <div class="file-item-size">${sizeInMB} MB • ${file.type || 'Unknown type'}</div>
        </div>
      </div>
      <button type="button" class="file-delete-btn" onclick="removeApprovalFile(${index})" title="Remove file">
        ✕
      </button>
    `;
    
    return fileItem;
  }

  // Remove individual file
  function removeApprovalFile(index) {
    if (index >= 0 && index < selectedApprovalFiles.length) {
      const fileName = selectedApprovalFiles[index].name;
      if (confirm(`Remove "${fileName}" from upload list?`)) {
        selectedApprovalFiles.splice(index, 1);
        updateApprovalFileDisplay();
        updateApprovalFormData();
      }
    }
  }

  // Clear all files
  function clearAllApprovalFiles() {
    if (selectedApprovalFiles.length === 0) return;
    
    if (confirm(`Are you sure you want to remove all ${selectedApprovalFiles.length} selected files?`)) {
      selectedApprovalFiles = [];
      updateApprovalFileDisplay();
      updateApprovalFormData();
    }
  }

  // Update form data with proper validation
  function updateApprovalFormData() {
    const fileInput = document.getElementById('upload');
    if (fileInput) {
      const dt = new DataTransfer();
      selectedApprovalFiles.forEach(file => dt.items.add(file));
      fileInput.files = dt.files;
      
      console.log('Form updated with files:', selectedApprovalFiles.map(f => f.name)); // Debug log
      console.log('FileList length:', fileInput.files.length); // Debug log
    }
  }

  // Enhanced file preview function
  function createEnhancedFilePreview(allFiles, previewContainer) {
    if (!previewContainer) return;
    
    if (allFiles.length > 0) {
      const enhancedPreview = document.createElement('div');
      enhancedPreview.className = 'enhanced-file-preview';
      
      let fileGridHTML = `
        <h3>
          <svg width="20" height="20" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17.5 6.5l-7.5 7.5a3 3 0 1 0 4.2 4.2l7.5-7.5a5 5 0 1 0-7.1-7.1l-9.2 9.2"/>
          </svg>
          Attached Files (${allFiles.length})
        </h3>
        <div class="file-grid">
      `;
      
      allFiles.forEach((file, index) => {
        if (file && file.trim()) {
          const fileUrl = `/uploads/${file.trim()}`;
          const ext = file.split('.').pop().toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
          const isPDF = ext === 'pdf';
          const isDoc = ['doc', 'docx'].includes(ext);
          const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext);
          const isText = ['txt', 'rtf'].includes(ext);
          
          // Determine file icon and preview
          let fileIcon = `
            <svg width="20" height="20" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <line x1="8" y1="8" x2="16" y2="8"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="8" y1="16" x2="12" y2="16"/>
            </svg>
          `;

          if (isImage) {
            fileIcon = `
              <svg width="20" height="20" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8" cy="8" r="2"/>
                <path d="M21 21l-6-6a2 2 0 0 0-2.83 0L3 21"/>
              </svg>
            `;
          } else if (isPDF) {
            fileIcon = `
              <svg width="20" height="20" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <path d="M8 6h8M8 10h8M8 14h4"/>
              </svg>
            `;
          } else if (isDoc) {
            fileIcon = `
              <svg width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <text x="8" y="16" font-size="6" fill="#2563eb" font-family="Arial" font-weight="bold">W</text>
              </svg>
            `;
          } else if (isSpreadsheet) {
            fileIcon = `
              <svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <rect x="7" y="10" width="2" height="7"/>
                <rect x="11" y="7" width="2" height="10"/>
                <rect x="15" y="13" width="2" height="4"/>
              </svg>
            `;
          } else if (isText) {
            fileIcon = `
              <svg width="20" height="20" fill="none" stroke="#7c3aed" stroke-width="2" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="8" x2="16" y2="8"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            `;
          }
          
          fileGridHTML += `
            <div class="enhanced-file-item">
              <div class="file-header-enhanced">
                <div style="color: #059669;">${fileIcon}</div>
                <div class="file-info-enhanced">
                  <div class="file-name-enhanced" title="${file}">${file}</div>
                  <div class="file-type-enhanced">${ext.toUpperCase()} File</div>
                </div>
              </div>
              
              <div class="file-preview-container">
          `;
          
          if (isImage) {
            fileGridHTML += `
              <img src="${fileUrl}" 
                   alt="Preview of ${file}" 
                   style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px; cursor: pointer;"
                   onclick="openImagePreview('${fileUrl}', '${file}')"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div style="display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; height: 200px;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                  <svg width="32" height="32" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8" cy="8" r="2"/>
                    <path d="M21 21l-6-6a2 2 0 0 0-2.83 0L3 21"/>
                  </svg>
                </div>
                <p>Image Preview Not Available</p>
                <small>Click download to view</small>
              </div>
            `;
          } else if (isPDF) {
            fileGridHTML += `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #dc2626; height: 200px;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                  <svg width="48" height="48" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2"/>
                    <path d="M8 6h8M8 10h8M8 14h4"/>
                  </svg>
                </div>
                <p><strong>PDF Document</strong></p>
                <small>Click download to view</small>
              </div>
            `;
          } else if (isDoc) {
            fileGridHTML += `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #2563eb; height: 200px;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                  <svg width="48" height="48" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2"/>
                    <text x="8" y="16" font-size="6" fill="#2563eb" font-family="Arial" font-weight="bold">W</text>
                  </svg>
                </div>
                <p><strong>Word Document</strong></p>
                <small>Click download to view</small>
              </div>
            `;
          } else if (isSpreadsheet) {
            fileGridHTML += `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #16a34a; height: 200px;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                  <svg width="48" height="48" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <rect x="7" y="10" width="2" height="7"/>
                    <rect x="11" y="7" width="2" height="10"/>
                    <rect x="15" y="13" width="2" height="4"/>
                  </svg>
                </div>
                <p><strong>Spreadsheet</strong></p>
                <small>Click download to view</small>
              </div>
            `;
          } else {
            fileGridHTML += `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; height: 200px;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${fileIcon}</div>
                <p><strong>Document File</strong></p>
                <small>Click download to view</small>
              </div>
            `;
          }
          
          fileGridHTML += `
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: center; align-items: stretch; width: 100%;">
              <a href="${fileUrl}" target="_blank" download="${file}" class="download-btn-enhanced">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
              </a>
              ${isImage ? `<button onclick="openImagePreview('${fileUrl}', '${file}')" class="download-btn-enhanced" style="background: #3b82f6;">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="12" rx="9" ry="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                View
              </button>` : ''}
            </div>
          </div>
          `;
        }
      });
      
      fileGridHTML += `</div>`;
      enhancedPreview.innerHTML = fileGridHTML;
      previewContainer.appendChild(enhancedPreview);
    } else {
      previewContainer.innerHTML = `
        <div class="enhanced-file-preview">
          <h3>
            <svg width="20" height="20" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24">
              <path d="M17.5 6.5l-7.5 7.5a3 3 0 1 0 4.2 4.2l7.5-7.5a5 5 0 1 0-7.1-7.1l-9.2 9.2"/>
            </svg>
            Attached Files
          </h3>
          <div class="no-files-message" style="text-align: center; padding: 3rem 2rem; color: #64748b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 2px dashed #cbd5e1;">
            <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.6;">
              <svg width="64" height="64" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="11" rx="2"/>
                <path d="M3 7l9 6 9-6"/>
              </svg>
            </div>
            <div class="no-files-title" style="font-size: 1.25rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem;">
              No Files Attached
            </div>
            <div class="no-files-subtitle" style="font-size: 0.95rem; color: #64748b; line-height: 1.5;">
              This request was submitted without any file attachments.<br>
              <small>Files may have been uploaded but are not accessible.</small>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Enhanced Auto-open modal if openModalId is in URL
  document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const openModalId = urlParams.get('openModalId');
    
    if (openModalId) {
      console.log(`Auto-opening modal for request: ${openModalId}`);
      
      // Wait for page to fully load
      setTimeout(() => {
        // Find the row with the matching ID
        const targetRow = document.querySelector(`[data-id="${openModalId}"]`);
        if (targetRow) {
          console.log(`Found target row for ID: ${openModalId}`);
          
          // Scroll the row into view if it's filtered out
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a visual highlight
          targetRow.style.backgroundColor = '#e8f5e9';
          targetRow.style.transition = 'background-color 0.3s ease';
          
          // Wait a bit for scroll, then click
          setTimeout(() => {
            targetRow.click();
            
            // Remove highlight after modal opens
            setTimeout(() => {
              targetRow.style.backgroundColor = '';
            }, 500);
            
            // Clean up URL after opening modal
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 500);
        } else {
          console.warn(`No row found with ID: ${openModalId}`);
          
          // If row not found, it might be filtered out - clear filters and try again
          const clearFiltersBtn = document.getElementById('clearFilters');
          if (clearFiltersBtn) {
            console.log('Clearing filters to find the request...');
            clearFiltersBtn.click();
            
            // Try again after filters are cleared
            setTimeout(() => {
              const targetRowRetry = document.querySelector(`[data-id="${openModalId}"]`);
              if (targetRowRetry) {
                console.log(`Found target row after clearing filters: ${openModalId}`);
                targetRowRetry.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRowRetry.style.backgroundColor = '#e8f5e9';
                targetRowRetry.style.transition = 'background-color 0.3s ease';
                
                setTimeout(() => {
                  targetRowRetry.click();
                  setTimeout(() => {
                    targetRowRetry.style.backgroundColor = '';
                  }, 500);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }, 500);
              }
            }, 1000);
          }
        }
      }, 1000);
    }

    // File upload setup
    const fileInput = document.getElementById('upload');
    const uploadGroup = document.getElementById('approvalFileUploadGroup');

    if (fileInput && uploadGroup) {
      uploadGroup.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadGroup.classList.add('dragover');
      });

      uploadGroup.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadGroup.classList.remove('dragover');
      });

      uploadGroup.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadGroup.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        handleApprovalFileSelection(files);
      });

      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleApprovalFileSelection(files);
      });
    }

    // Additional file upload setup (for revision requests)
    const additionalFileInput = document.getElementById('additional-files-upload');
    const additionalUploadGroup = document.getElementById('additional-file-upload-group');

    if (additionalFileInput && additionalUploadGroup) {
      additionalUploadGroup.addEventListener('dragover', (e) => {
        e.preventDefault();
        additionalUploadGroup.classList.add('dragover');
      });

      additionalUploadGroup.addEventListener('dragleave', (e) => {
        e.preventDefault();
        additionalUploadGroup.classList.remove('dragover');
      });

      additionalUploadGroup.addEventListener('drop', (e) => {
        e.preventDefault();
        additionalUploadGroup.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        handleAdditionalFileSelection(files);
      });

      additionalFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleAdditionalFileSelection(files);
      });
    }
  });

  // Add image preview modal function
  window.openImagePreview = function(imageUrl, fileName) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      cursor: pointer;
    `;
    
    // Create image container
    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
    `;
    
    // Create image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = fileName;
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: -40px;
      right: 0;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    `;
    
    // Assemble modal
    container.appendChild(img);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }
    });
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  // ===== ADDITIONAL FILES FOR REVISION FUNCTIONS =====

  // Handle additional file selection for revisions
  function handleAdditionalFileSelection(files) {
    console.log('handleAdditionalFileSelection called with:', files.length, 'files');
    let validFiles = [];
    let errors = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      // Check for duplicates
      if (selectedAdditionalFiles.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: File already selected`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      alert('Some files could not be added:\n' + errors.join('\n'));
    }

    // Add valid files with progress simulation
    if (validFiles.length > 0) {
      simulateAdditionalUploadProgress(validFiles);
    }
  }

  // Simulate upload progress for additional files
  function simulateAdditionalUploadProgress(files) {
    const progressContainer = document.getElementById('additional-uploadProgress');
    const progressFill = document.getElementById('additional-progressFill');

    // Create progress elements if they don't exist
    if (!progressContainer) {
      const uploadGroup = document.getElementById('additional-file-upload-group');
      if (uploadGroup) {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'additional-uploadProgress';
        progressDiv.style.cssText = 'margin-top: 0.5rem; display: block;';
        progressDiv.innerHTML = `
          <div id='additional-progressFill' style='width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;'>
            <div style='height: 100%; background: var(--primary-green); transition: width 0.3s ease; width: 0%;'></div>
          </div>
        `;
        uploadGroup.appendChild(progressDiv);
      }
    }

    const fillEl = document.getElementById('additional-progressFill');
    if (fillEl) {
      document.getElementById('additional-uploadProgress').style.display = 'block';

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Add files after progress complete
          selectedAdditionalFiles = selectedAdditionalFiles.concat(files);
          updateAdditionalFileDisplay();

          // Hide progress after delay
          setTimeout(() => {
            const container = document.getElementById('additional-uploadProgress');
            if (container) container.style.display = 'none';
            const fill = document.getElementById('additional-progressFill');
            if (fill) fill.style.width = '0%';
          }, 500);
        }
        const fill = document.getElementById('additional-progressFill');
        if (fill) fill.style.width = progress + '%';
      }, 100);
    } else {
      // Fallback if no progress bar
      selectedAdditionalFiles = selectedAdditionalFiles.concat(files);
      updateAdditionalFileDisplay();
    }
  }

  // Update additional file display
  function updateAdditionalFileDisplay() {
    const fileManagement = document.getElementById('additional-file-management');
    const filesContainer = document.getElementById('additional-selected-files');
    const filesCount = document.getElementById('additional-files-count');
    const filesSummary = document.getElementById('additional-files-summary');
    const uploadGroup = document.getElementById('additional-file-upload-group');
    const clearAllBtn = document.getElementById('additional-clear-all-btn');

    if (selectedAdditionalFiles.length === 0) {
      if (fileManagement) fileManagement.style.display = 'none';
      if (uploadGroup) uploadGroup.classList.remove('has-file');
      return;
    }

    if (fileManagement) fileManagement.style.display = 'block';
    if (uploadGroup) uploadGroup.classList.add('has-file');

    // Update files count
    if (filesCount) filesCount.textContent = `${selectedAdditionalFiles.length} additional file(s) selected`;

    // Clear container
    if (filesContainer) filesContainer.innerHTML = '';

    // Add each file
    selectedAdditionalFiles.forEach((file, index) => {
      const fileItem = createAdditionalFileItem(file, index);
      if (filesContainer) filesContainer.appendChild(fileItem);
    });

    // Update summary
    if (filesSummary) {
      const totalSize = selectedAdditionalFiles.reduce((sum, file) => sum + file.size, 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      filesSummary.textContent = `Total additional size: ${totalSizeMB} MB`;
    }

    // Enable/disable clear all button
    if (clearAllBtn) clearAllBtn.disabled = selectedAdditionalFiles.length === 0;
  }

  // Create additional file item element
  function createAdditionalFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.setAttribute('data-index', index);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    fileItem.innerHTML = `
      <div class="file-item-info">
        <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <div class="file-item-details">
          <div class="file-item-name">${file.name}</div>
          <div class="file-item-size">${sizeInMB} MB • ${file.type || 'Unknown type'}</div>
        </div>
      </div>
      <button type="button" class="file-delete-btn" onclick="removeAdditionalFile(${index})" title="Remove additional file">
        ✕
      </button>
    `;

    return fileItem;
  }

  // Remove individual additional file
  function removeAdditionalFile(index) {
    if (index >= 0 && index < selectedAdditionalFiles.length) {
      const fileName = selectedAdditionalFiles[index].name;
      if (confirm(`Remove "${fileName}" from additional files?`)) {
        selectedAdditionalFiles.splice(index, 1);
        updateAdditionalFileDisplay();
      }
    }
  }

  // Clear all additional files
  function clearAllAdditionalFiles() {
    if (selectedAdditionalFiles.length === 0) return;

    if (confirm(`Are you sure you want to remove all ${selectedAdditionalFiles.length} additional files?`)) {
      selectedAdditionalFiles = [];
      updateAdditionalFileDisplay();
    }
  }

  // Submit additional files function
  function submitAdditionalFiles() {
    if (!currentConversationId) {
      alert('Unable to determine which request to update. Please try again.');
      return;
    }

    if (selectedAdditionalFiles.length === 0) {
      alert('Please select at least one additional file to upload.');
      return;
    }

    // Add loading indicator to button
    const submitBtn = document.querySelector('#additional-files-section button[onclick="submitAdditionalFiles()"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Upload Additional Files';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Uploading...';
    }

    try {
      const formData = new FormData();

      // Add selected additional files
      selectedAdditionalFiles.forEach((file, index) => {
        console.log('Adding additional file:', file.name, '(' + (file.size / 1024).toFixed(1) + ' KB)');
        formData.append('additionalFiles', file);
      });

      console.log('Submitting additional files to:', `/add-files/${currentConversationId}`);

      fetch(`/add-files/${currentConversationId}`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(result => {
        console.log('Additional files submission result:', result);

        if (result.success) {
          console.log('Additional files uploaded successfully:', result.message);

          // Show success feedback overlay
          const successOverlay = document.createElement('div');
          successOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            @keyframes successFadeIn {
              from { opacity: 0; transform: scale(0.9) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `;

          successOverlay.innerHTML = `
            <div style="
              background: white;
              padding: 2rem 3rem;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
              text-align: center;
              animation: successFadeIn 0.5s ease-out;
            ">
              <div style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;">
                ✓
              </div>
              <h3 style="color: #059669; margin: 0 0 0.5rem 0; font-size: 1.5rem;">Upload Successful!</h3>
              <p style="color: #64748b; margin: 0; font-size: 1rem;">
                ${result.newFiles ? result.newFiles.length : 'Additional'} file(s) uploaded successfully.
              </p>
              <div style="margin-top: 1.5rem; color: #9ca3af; font-size: 0.9rem;">
                Refreshing page...
              </div>
            </div>
          `;

          document.body.appendChild(successOverlay);

          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = `/request-approvals?openModalId=${currentConversationId}`;
          }, 3000);

        } else {
          console.error('Additional files submission failed:', result.message);
          alert(result.message || 'Failed to upload additional files. Please try again.');
        }

        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      })
      .catch(error => {
        console.error('Additional files submission error:', error);
        alert('Network error while uploading files. Please try again.');

        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    } catch (error) {
      console.error('Error preparing additional files FormData:', error);
      alert('Error preparing files for upload. Please try again.');

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }

  // Make additional functions global for onclick handlers
  window.toggleDropdown = toggleDropdown;
  window.removeApprovalFile = removeApprovalFile;
  window.clearAllApprovalFiles = clearAllApprovalFiles;
  window.removeAdditionalFile = removeAdditionalFile;
  window.clearAllAdditionalFiles = clearAllAdditionalFiles;

  // Initialize status display on page load
  updateStatusDisplay();
  
  // Set initial filter state
  filterRequests();
  
  // Reset file upload state on page load
  selectedApprovalFiles = [];
  
  // Clear any existing file displays
  const fileManagement = document.getElementById('approvalFileManagement');
  const uploadGroup = document.getElementById('approvalFileUploadGroup');
  
  if (fileManagement) fileManagement.style.display = 'none';
  if (uploadGroup) uploadGroup.classList.remove('has-file');
  
  console.log('Requestapproval.ejs initialization complete');
  console.log('Current user: carebear1919');
  console.log('User type:', userType);
  console.log('User organizations:', parsedOrganizations);
  console.log('Page loaded at:', new Date().toISOString());

  // Formatting toolbar functionality
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const underlineBtn = document.getElementById('underlineBtn');
  
  // Style format buttons on hover
  const formatBtns = document.querySelectorAll('.format-btn');
  formatBtns.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.background = '#f3f4f6';
      this.style.borderColor = 'var(--primary-green)';
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.background = 'white';
      this.style.borderColor = '#d1d5db';
    });
  });
  
  // Format text function
  function formatText(startTag, endTag) {
    if (!messageInput) return;
    
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const selectedText = messageInput.value.substring(start, end);
    
    if (selectedText) {
      const formattedText = `${startTag}${selectedText}${endTag}`;
      const beforeText = messageInput.value.substring(0, start);
      const afterText = messageInput.value.substring(end);
      
      messageInput.value = beforeText + formattedText + afterText;
      
      // Set cursor position after formatted text
      const newPosition = start + formattedText.length;
      messageInput.setSelectionRange(newPosition, newPosition);
    } else {
      // If no text selected, insert tags where cursor is
      const cursorPos = messageInput.selectionStart;
      const beforeText = messageInput.value.substring(0, cursorPos);
      const afterText = messageInput.value.substring(cursorPos);
      
      messageInput.value = beforeText + startTag + endTag + afterText;
      
      // Position cursor between tags
      const newPosition = cursorPos + startTag.length;
      messageInput.setSelectionRange(newPosition, newPosition);
    }
    
    messageInput.focus();
  }
  
  // Format button event listeners
  if (boldBtn) {
    boldBtn.addEventListener('click', function(e) {
      e.preventDefault();
      formatText('**', '**');
    });
  }
  
  if (italicBtn) {
    italicBtn.addEventListener('click', function(e) {
      e.preventDefault();
      formatText('*', '*');
    });
  }
  
  if (underlineBtn) {
    underlineBtn.addEventListener('click', function(e) {
      e.preventDefault();
      formatText('<u>', '</u>');
    });
  }
  
  // Upload functionality
  const imageBtn = document.getElementById('imageBtn');
  const fileBtn = document.getElementById('fileBtn');
  const imageUpload = document.getElementById('imageUpload');
  const fileUpload = document.getElementById('fileUpload');
  const attachmentPreview = document.getElementById('attachmentPreview');
  const attachmentInfo = document.getElementById('attachmentInfo');
  const attachmentIcon = document.getElementById('attachmentIcon');
  const attachmentName = document.getElementById('attachmentName');
  const removeAttachment = document.getElementById('removeAttachment');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  
  let currentAttachment = null;
  
  // Image upload button click
  if (imageBtn && imageUpload) {
    imageBtn.addEventListener('click', function(e) {
      e.preventDefault();
      imageUpload.click();
    });
  }
  
  // File upload button click
  if (fileBtn && fileUpload) {
    fileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      fileUpload.click();
    });
  }
  
  // Handle image upload
  if (imageUpload) {
    imageUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        currentAttachment = { type: 'image', file: file };
        showAttachmentPreview(file, 'image');
      }
    });
  }
  
  // Handle file upload
  if (fileUpload) {
    fileUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        currentAttachment = { type: 'file', file: file };
        showAttachmentPreview(file, 'file');
      }
    });
  }
  
  // Show attachment preview
  function showAttachmentPreview(file, type) {
    if (attachmentPreview && attachmentIcon && attachmentName) {
      attachmentPreview.style.display = 'block';
      attachmentIcon.textContent = type === 'image' ? '📷' : '📎';
      attachmentName.textContent = file.name;
      
      if (type === 'image' && imagePreviewContainer && imagePreview) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
          imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
      }
    }
  }
  
  // Remove attachment
  if (removeAttachment) {
    removeAttachment.addEventListener('click', function(e) {
      e.preventDefault();
      currentAttachment = null;
      if (attachmentPreview) {
        attachmentPreview.style.display = 'none';
      }
      if (imageUpload) imageUpload.value = '';
      if (fileUpload) fileUpload.value = '';
      if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
      }
    });
  }
  
  // Image modal function for message previews
  window.openImageModal = function(imageSrc) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Create modal container
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      max-width: 90%;
      max-height: 90%;
      background: white;
      border-radius: 8px;
      padding: 1rem;
    `;
    
    // Create image
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 4px;
    `;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 30px;
      height: 30px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    `;
    
    // Assemble modal
    container.appendChild(img);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }
    });
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });
    
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
};

// Global function to open request modal by ID (for notification clicks)
window.openRequestModal = function(requestId, requestType) {
  console.log('Opening request modal for:', requestId, requestType);
  
  // Ensure we're dealing with approval requests on this page
  if (requestType !== 'approval') {
    console.warn('Request type mismatch on approval page:', requestType);
    return;
  }
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // Trigger the existing click handler
    targetRow.click();
  } else {
    console.warn('Request not found on current page:', requestId);
    // Optionally navigate to the page with that request
    window.location.href = `/request-approvals?highlight=${requestId}`;
  }
};

// Global function alternative name for backward compatibility
window.showApprovalDetails = function(requestId) {
  window.openRequestModal(requestId, 'approval');
};

// Global function to open conversation modal by ID (for message notifications)
window.openConversationModal = function(requestId, requestType) {
  console.log('Opening user conversation modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // Simulate row click to open the details modal
    console.log('Found target row, simulating click...');
    targetRow.click();
    
    // Then trigger the conversation modal after a short delay
    setTimeout(() => {
      const chatButton = document.getElementById('openChatFromDetailsModal');
      if (chatButton) {
        console.log('Found chat button, clicking it');
        chatButton.click();
      } else {
        console.warn('Chat button #openChatFromDetailsModal not found in modal');
      }
    }, 300);
  } else {
    console.warn('Request not found for conversation:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Auto-open modal if URL contains modal parameters
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle regular modal opening
  if (urlParams.has('modal') && urlParams.has('requestId') && urlParams.get('type') === 'approval') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening modal for request:', requestId);
    
    // Wait for page to fully load
    setTimeout(() => {
      window.openRequestModal(requestId, 'approval');
    }, 500);
  }
  
  // Handle conversation modal opening (for message notifications)
  if (urlParams.has('conversation') && urlParams.has('requestId') && urlParams.get('type') === 'approval') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening conversation modal for request:', requestId);
    
    // Wait for page to fully load
    setTimeout(() => {
      window.openConversationModal(requestId, 'approval');
    }, 500);
  }
  
  // DEBUG: Test conversation modal button
  const testButton = document.getElementById('testConversationModal');
  if (testButton) {
    testButton.addEventListener('click', function() {
      console.log('🧪 Testing conversation modal...');
      console.log('Available global functions:', Object.keys(window).filter(key => key.includes('open') || key.includes('modal')));
      
      // Test with a sample request ID
      if (typeof window.openConversationModal === 'function') {
        console.log('✅ Global openConversationModal function found');
        window.openConversationModal('test123', 'approval');
      } else {
        console.error('❌ Global openConversationModal function not found');
        console.log('Available window functions:', Object.getOwnPropertyNames(window).filter(name => typeof window[name] === 'function').slice(0, 20));
      }
    });
  }
});

// Unit Member Action Handlers
// Approve Button
const approveBtn = document.getElementById('approveBtn');
if (approveBtn) {
  approveBtn.addEventListener('click', async function() {
    if (!currentConversationId) return;
    
    if (confirm('Are you sure you want to approve this request?')) {
      try {
        const response = await fetch(`/unit/task/approve/${currentConversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          alert('Request approved successfully!');
          location.reload();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.message || 'Failed to approve request'));
        }
      } catch (error) {
        console.error('Error approving request:', error);
        alert('An error occurred while approving the request');
      }
    }
  });
}

// Revise Button
const reviseBtn = document.getElementById('reviseBtn');
const revisionCommentSection = document.getElementById('revisionCommentSection');
const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
const submitRevisionBtn = document.getElementById('submitRevisionBtn');
const revisionComment = document.getElementById('revisionComment');

if (reviseBtn) {
  reviseBtn.addEventListener('click', function() {
    if (revisionCommentSection) {
      revisionCommentSection.style.display = 'block';
    }
  });
}

if (cancelRevisionBtn) {
  cancelRevisionBtn.addEventListener('click', function() {
    if (revisionCommentSection) {
      revisionCommentSection.style.display = 'none';
      if (revisionComment) revisionComment.value = '';
    }
  });
}

if (submitRevisionBtn) {
  submitRevisionBtn.addEventListener('click', async function() {
    if (!currentConversationId) return;
    
    const comment = revisionComment ? revisionComment.value.trim() : '';
    if (!comment) {
      alert('Please provide a comment explaining what needs to be fixed');
      return;
    }
    
    try {
      const response = await fetch(`/unit/task/revise/${currentConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionNotes: comment })
      });
      
      if (response.ok) {
        alert('Revision request sent successfully!');
        location.reload();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.message || 'Failed to request revision'));
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('An error occurred while requesting revision');
    }
  });
}

// Sidebar hover effect for desktop
const sidebar = document.getElementById('userSidebar');
if (sidebar) {
  sidebar.addEventListener('mouseenter', function() {
    this.classList.add('expanded');
  });
  sidebar.addEventListener('mouseleave', function() {
    this.classList.remove('expanded');
  });
}

// Mobile Navigation Setup
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('userMenuToggle');
  const sidebarEl = document.getElementById('userSidebar');
  let touchStartX = 0;
  let touchEndX = 0;

  function initMobileNavigation() {
    if (menuToggle && sidebarEl) {
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebarEl.classList.toggle('mobile-active');
      });

      sidebarEl.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      sidebarEl.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
      }, { passive: true });

      sidebarEl.addEventListener('touchend', () => {
        handleSwipe();
      });

      document.addEventListener('click', (e) => {
        if (sidebarEl.classList.contains('mobile-active') &&
            !sidebarEl.contains(e.target) &&
            !menuToggle.contains(e.target)) {
          sidebarEl.classList.remove('mobile-active');
        }
      });
    }
  }

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (swipeDistance < -50 && sidebarEl.classList.contains('mobile-active')) {
      sidebarEl.classList.remove('mobile-active');
    }
    if (swipeDistance > 50 && !sidebarEl.classList.contains('mobile-active') && touchStartX < 50) {
      sidebarEl.classList.add('mobile-active');
    }
  }

  initMobileNavigation();
});