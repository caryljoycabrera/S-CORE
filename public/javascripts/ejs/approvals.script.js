// Global dropdown manager to ensure only one dropdown is open at a time
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

// Enhanced Multi-Select Class
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
    
    // Search functionality (only if hasSearch is true)
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

document.addEventListener('DOMContentLoaded', function() {
  console.log('📋 DOM Content Loaded - Initializing...');
  
  // Initialize enhanced multi-select dropdowns
  const statusFilter = new EnhancedMultiSelect('statusFilter', 
    ['pending', 'approved', 'for revision', 'completed', 'rejected', 'archived'], 
    'Select Status', false);
    
  const studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter', 
    studentOrganizations, 
    'Select Student Organizations', true);
    
  const officeDeptFilter = new EnhancedMultiSelect('officeDeptFilter', 
    officesDepartments, 
    'Select Offices/Departments', true);

  // Global variables
  let detailModal = document.getElementById("detailsModal");
  let updateConfirmationModal = document.getElementById("updateConfirmationModal");
  let currentRequestId = null;
  let currentRequestType = 'Approval Request';
  let originalValues = {};
  let allRequestsData = [];
  let uploadedFile = null;

  // Initialize filters functionality
  function initializeFilters() {
    console.log('🔍 Initializing filters...');
    
    // Store all original request data
    const rows = document.querySelectorAll('.request-row');
    allRequestsData = Array.from(rows).map(row => ({
      element: row,
      requestId: row.dataset.requestId,
      type: row.dataset.type,
      title: row.dataset.title.toLowerCase(),
      status: row.dataset.status.toLowerCase(),
      organization: row.dataset.organization.toLowerCase(),
      units: row.dataset.units.toLowerCase(),
      student: row.dataset.student.toLowerCase(),
      datetime: row.dataset.datetime,
      date: row.dataset.date,
      description: row.dataset.description.toLowerCase()
    }));

    // Get filter elements and add listeners
    const filters = {
      requestId: document.getElementById('requestIdFilter'),
      student: document.getElementById('studentFilter'),
      dateFrom: document.getElementById('dateFromFilter'),
      dateTo: document.getElementById('dateToFilter')
    };

    // Add event listeners
    Object.entries(filters).forEach(([key, element]) => {
      if (element) {
        if (key.startsWith('date')) {
          element.addEventListener('change', applyFilters);
        } else {
          element.addEventListener('input', debounce(applyFilters, 300));
        }
      }
    });

    // Enhanced dropdown change listeners
    document.getElementById('statusFilter').addEventListener('selectionChange', applyFilters);
    document.getElementById('studentOrgFilter').addEventListener('selectionChange', applyFilters);
    document.getElementById('officeDeptFilter').addEventListener('selectionChange', applyFilters);

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Initial count update
    updateResultsCount(allRequestsData.length);
  }

  // Apply filters function
  function applyFilters() {
    const filters = {
      requestId: document.getElementById('requestIdFilter')?.value.toLowerCase().trim() || '',
      status: statusFilter.getSelectedValues(),
      student: document.getElementById('studentFilter')?.value.toLowerCase().trim() || '',
      studentOrg: studentOrgFilter.getSelectedValues(),
      officeDept: officeDeptFilter.getSelectedValues(),
      dateFrom: document.getElementById('dateFromFilter')?.value || '',
      dateTo: document.getElementById('dateToFilter')?.value || ''
    };

    console.log('Applied filters:', filters);

    let visibleCount = 0;

    allRequestsData.forEach(request => {
      let shouldShow = true;

      // Request ID filter
      if (filters.requestId && !request.requestId.toLowerCase().includes(filters.requestId)) {
        shouldShow = false;
      }

      // Status filter (multi-select)
      if (filters.status.length > 0 && !filters.status.includes('all')) {
        if (!filters.status.includes(request.status)) {
          shouldShow = false;
        }
      }

      // Student filter
      if (filters.student && !request.student.includes(filters.student)) {
        shouldShow = false;
      }

      // Organization filter (multi-select)
      let organizationMatch = true;
      const hasStudentOrgSelection = filters.studentOrg.length > 0 && !filters.studentOrg.includes('all');
      const hasOfficeDeptSelection = filters.officeDept.length > 0 && !filters.officeDept.includes('all');
      
      if (hasStudentOrgSelection || hasOfficeDeptSelection) {
        organizationMatch = false;
        
        if (hasStudentOrgSelection) {
          organizationMatch = filters.studentOrg.some(org => 
            request.organization.includes(org.toLowerCase())
          );
        }
        
        if (!organizationMatch && hasOfficeDeptSelection) {
          organizationMatch = filters.officeDept.some(dept => 
            request.organization.includes(dept.toLowerCase())
          );
        }
      }

      if (!organizationMatch) {
        shouldShow = false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const requestDate = request.date;
        
        if (filters.dateFrom && requestDate < filters.dateFrom) {
          shouldShow = false;
        }
        
        if (filters.dateTo && requestDate > filters.dateTo) {
          shouldShow = false;
        }
      }

      // Show/hide row
      request.element.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Update results count
    updateResultsCount(visibleCount);
  }

  // Clear all filters
  function clearAllFilters() {
    console.log('🧹 Clearing all filters...');
    
    // Clear text inputs
    const requestIdFilter = document.getElementById('requestIdFilter');
    const studentFilter = document.getElementById('studentFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (requestIdFilter) requestIdFilter.value = '';
    if (studentFilter) studentFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    
    // Reset enhanced dropdowns
    statusFilter.reset();
    studentOrgFilter.reset();
    officeDeptFilter.reset();

    // Show all rows
    allRequestsData.forEach(request => {
      request.element.style.display = '';
    });

    // Update results count
    updateResultsCount(allRequestsData.length);
    
    showNotification('All filters cleared', 'info');
  }

  // Update results count
  function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      const total = allRequestsData.length;
      if (count === total) {
        resultsCount.textContent = `Showing all ${total} requests`;
      } else {
        resultsCount.textContent = `Showing ${count} of ${total} requests`;
      }
    }
  }

  // Initialize modal handlers
  function initializeModalHandlers() {
    const closeBtn = document.getElementById("closeDetailsModal");
    if (closeBtn) {
      closeBtn.onclick = () => detailModal.style.display = 'none';
    }
    
    // Admin form handlers
    const adminCancelBtn = document.getElementById('adminCancelBtn');
    const adminUpdateBtn = document.getElementById('adminUpdateBtn');
    
    if (adminCancelBtn) {
      adminCancelBtn.onclick = () => {
        resetFormToOriginalValues();
      };
    }
    
    if (adminUpdateBtn) {
      adminUpdateBtn.onclick = () => {
        showUpdateConfirmation();
      };
    }
    
    // Confirmation modal handlers
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmUpdateBtn = document.getElementById('confirmUpdateBtn');
    
    if (confirmCancelBtn) {
      confirmCancelBtn.onclick = () => {
        updateConfirmationModal.classList.remove('show');
      };
    }
    
    if (confirmUpdateBtn) {
      confirmUpdateBtn.onclick = () => {
        performUpdate();
      };
    }
    
    // Close modals when clicking outside
    window.onclick = function(event) {
      if (event.target === detailModal) detailModal.style.display = 'none';
      if (event.target === updateConfirmationModal) updateConfirmationModal.classList.remove('show');
    };
  }

  // Initialize row click handlers
  function initializeRowClickHandlers() {
    const rows = document.querySelectorAll('.request-row');
    console.log(`🖱️ Setting up click handlers for ${rows.length} rows`);
    
    rows.forEach(row => {
      row.style.cursor = 'pointer';
      
      row.addEventListener('click', function(e) {
        if (e.target.closest('.status-badge') || 
            e.target.closest('.type-badge') ||
            e.target.closest('button') ||
            e.target.closest('a')) {
          return;
        }

        const rowData = {
          id: row.dataset.id,
          requestId: row.dataset.requestId,
          type: row.dataset.type,
          title: row.dataset.title,
          status: row.dataset.status,
          organization: row.dataset.organization,
          units: row.dataset.units,
          datetime: row.dataset.datetime,
          description: row.dataset.description,
          specifictype: row.dataset.specifictype,
          file: row.dataset.file,
          files: row.dataset.files,
          formattedDeadline: row.dataset.formattedDeadline,
          allowAdditionalUpload: row.dataset.allowAdditionalUpload,
          student: row.dataset.student
        };

        currentRequestId = rowData.id;
        currentRequestType = rowData.type;

        populateModalData(rowData);
        detailModal.style.display = 'flex';

        setTimeout(() => {
          const modalBody = detailModal.querySelector('.details-modal-body');
          if (modalBody) {
            modalBody.scrollTop = 0;
          }
        }, 50);
      });
      
      // Add hover effects
      row.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f8fafc';
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      });
      
      row.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
        this.style.transform = '';
        this.style.boxShadow = '';
      });
    });
  }

  // Initialize everything
  try {
    initializeModalHandlers();
    initializeRowClickHandlers();
    initializeConversationModal();
    initializeFilters();
    console.log('🎉 All initialization complete!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
});

// Show notification function
function showNotification(message, type = 'success') {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.3s ease-out;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 0;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
  `;
  
  // Determine colors and icons based on type
  let headerColor, icon;
  switch(type) {
    case 'success':
      headerColor = 'var(--primary-green)';
      icon = '✅';
      break;
    case 'error':
      headerColor = '#ef4444';
      icon = '❌';
      break;
    case 'info':
    default:
      headerColor = '#3b82f6';
      icon = 'ℹ️';
      break;
  }
  
  modal.innerHTML = `
    <div style="background: ${headerColor}; color: white; padding: 1.5rem; text-align: center; border-radius: 12px 12px 0 0;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">
        ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information'}
      </h3>
    </div>
    <div style="padding: 2rem; text-align: center;">
      <p style="margin: 0 0 1.5rem 0; font-size: 1rem; color: #374151; line-height: 1.5;">${message}</p>
      <button id="notificationOkBtn" style="
        background: ${headerColor};
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
      ">OK</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add event listeners
  const okBtn = modal.querySelector('#notificationOkBtn');
  
  function closeModal() {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    modal.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      document.body.style.overflow = '';
    }, 300);
  }
  
  okBtn.addEventListener('click', closeModal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Auto close after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(closeModal, 5000);
  }
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize conversation modal functionality
function initializeConversationModal() {
  const openChatBtn = document.getElementById('openChatFromModal');
  const conversationModal = document.getElementById('conversationModal');
  const closeConversationBtn = document.getElementById('closeConversationModal');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const messageInput = document.getElementById('messageInput');
  const messagesContainer = document.getElementById('messagesContainer');
  
  // Formatting buttons
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const underlineBtn = document.getElementById('underlineBtn');
  
  // Formatting button handlers
  if (boldBtn) {
    boldBtn.addEventListener('click', function() {
      insertFormatting('**', '**');
    });
  }

  if (italicBtn) {
    italicBtn.addEventListener('click', function() {
      insertFormatting('*', '*');
    });
  }

  if (underlineBtn) {
    underlineBtn.addEventListener('click', function() {
      insertFormatting('<u>', '</u>');
    });
  }

  // File upload functionality
  const imageBtn = document.getElementById('imageBtn');
  const fileBtn = document.getElementById('fileBtn');
  const imageUpload = document.getElementById('imageUpload');
  const fileUpload = document.getElementById('fileUpload');
  
  if (imageBtn && imageUpload) {
    imageBtn.addEventListener('click', () => imageUpload.click());
  }
  
  if (fileBtn && fileUpload) {
    fileBtn.addEventListener('click', () => fileUpload.click());
  }
  
  if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelection(file);
    });
  }
  
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelection(file);
    });
  }
  
  // Initialize other conversation modal functionality
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      if (currentRequestId) {
        openConversation(currentRequestId);
      } else {
        showNotification('Please select a request first', 'error');
      }
    });
  }
  
  if (closeConversationBtn) {
    closeConversationBtn.addEventListener('click', () => {
      conversationModal.style.display = 'none';
    });
  }
  
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendMessage);
  }
  
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  if (conversationModal) {
    conversationModal.addEventListener('click', (e) => {
      if (e.target === conversationModal) {
        conversationModal.style.display = 'none';
      }
    });
  }
}

// File selection handler
function handleFileSelection(file) {
  uploadedFile = file;
  const attachmentPreview = document.getElementById('attachmentPreview');
  const attachmentInfo = document.getElementById('attachmentInfo');
  const attachmentIcon = document.getElementById('attachmentIcon');
  const attachmentName = document.getElementById('attachmentName');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  
  if (attachmentPreview && attachmentIcon && attachmentName) {
    if (file.type.startsWith('image/')) {
      attachmentIcon.textContent = '📷';
      const reader = new FileReader();
      reader.onload = function(e) {
        if (imagePreview && imagePreviewContainer) {
          imagePreview.src = e.target.result;
          imagePreviewContainer.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    } else {
      attachmentIcon.textContent = '📎';
      if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
      }
    }
    
    attachmentName.textContent = file.name;
    attachmentPreview.style.display = 'block';
  }
}

// Add any additional functions you need for your specific functionality
console.log('✅ Approvals Admin script loaded successfully');