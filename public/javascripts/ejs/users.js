// ========================================
// USERS PAGE JAVASCRIPT
// File: public/javascripts/ejs/users.js
// Purpose: JavaScript functionality for the admin users management page
// ========================================

// ========================================
// DOM CACHE OBJECT - Centralized DOM references
// ========================================
const DOMCache = {
  // User Modal
  userModal: null,
  closeUserModal: null,
  cancelUpdateBtn: null,
  
  // Confirmation Modal
  confirmStatusModal: null,
  closeConfirmModal: null,
  cancelConfirmBtn: null,
  
  // Filter Elements
  clearFiltersBtn: null,
  
  // Grid Elements
  gridBody: null,
  
  // Initialize all DOM references
  init() {
    this.userModal = document.getElementById("userModal");
    this.closeUserModal = document.getElementById("closeUserModal");
    this.cancelUpdateBtn = document.getElementById("cancelUpdateBtn");
    this.confirmStatusModal = document.getElementById("confirmStatusModal");
    this.closeConfirmModal = document.getElementById("closeConfirmModal");
    this.cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
    this.clearFiltersBtn = document.getElementById("clearFilters");
    this.gridBody = document.getElementById("gridBody");
  },

  // Get all grid rows
  getAllRows() {
    return Array.from(document.querySelectorAll('.grid-row'));
  }
};

// Backward compatibility - Legacy references
const userModal = () => DOMCache.userModal;
const closeUserModal = () => DOMCache.closeUserModal;
const cancelUpdateBtn = () => DOMCache.cancelUpdateBtn;
const clearFiltersBtn = () => DOMCache.clearFiltersBtn;
const allRows = () => DOMCache.getAllRows();

// Confirmation Modal Elements
const confirmStatusModal = () => DOMCache.confirmStatusModal;
const closeConfirmModal = () => DOMCache.closeConfirmModal;
const cancelConfirmBtn = () => DOMCache.cancelConfirmBtn;

// ========================================
// MODAL UTILITY OBJECT
// ========================================
const ModalUtility = {
  // Close modal helper
  closeModal(modal) {
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  },

  // Open modal helper
  openModal(modal) {
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  },

  // Setup close button handlers
  setupCloseHandlers(modal, closeBtn, cancelBtn) {
    if (closeBtn) closeBtn.onclick = () => this.closeModal(modal);
    if (cancelBtn) cancelBtn.onclick = () => this.closeModal(modal);
  }
};

// ========================================
// MODAL HANDLERS
// ========================================
function setupModalHandlers() {
  const { userModal, closeUserModal, cancelUpdateBtn, confirmStatusModal, closeConfirmModal, cancelConfirmBtn } = DOMCache;
  
  // User modal handlers
  ModalUtility.setupCloseHandlers(userModal, closeUserModal, cancelUpdateBtn);
  
  // Confirm status modal handlers
  ModalUtility.setupCloseHandlers(confirmStatusModal, closeConfirmModal, cancelConfirmBtn);
}

// ========================================
// GLOBAL EVENT LISTENERS - Modal Backdrop & ESC Key
// ========================================
window.addEventListener('click', function(e) {
  const { userModal, confirmStatusModal } = DOMCache;
  
  // User Modal
  if (e.target === userModal) {
    ModalUtility.closeModal(userModal);
  }
  // Confirm Status Modal
  if (e.target === confirmStatusModal) {
    ModalUtility.closeModal(confirmStatusModal);
  }
  // Trash Modal (independent)
  const trashModal = document.getElementById('trashModal');
  if (trashModal && e.target === trashModal) {
    closeTrashModal();
  }
  // Restore Confirm Modal
  const restoreModal = document.getElementById('restoreConfirmModal');
  if (restoreModal && e.target === restoreModal) {
    closeRestoreConfirm();
  }
  // Permanent Delete Modal
  const deleteModal = document.getElementById('permanentDeleteConfirmModal');
  if (deleteModal && e.target === deleteModal) {
    closePermanentDeleteConfirm();
  }
});

// ESC key closes modals
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const { userModal, confirmStatusModal } = DOMCache;
    
    const trashModal = document.getElementById('trashModal');
    if (trashModal && trashModal.classList.contains('show')) {
      closeTrashModal();
    }
    if (userModal && userModal.style.display === 'flex') {
      ModalUtility.closeModal(userModal);
    }
    if (confirmStatusModal && confirmStatusModal.style.display === 'flex') {
      ModalUtility.closeModal(confirmStatusModal);
    }
    
    const restoreModal = document.getElementById('restoreConfirmModal');
    if (restoreModal && restoreModal.classList.contains('show')) {
      closeRestoreConfirm();
    }
    
    const deleteModal = document.getElementById('permanentDeleteConfirmModal');
    if (deleteModal && deleteModal.classList.contains('show')) {
      closePermanentDeleteConfirm();
    }
  }
});

// ========================================
// NOTIFICATION UTILITY
// ========================================
const NotificationManager = {
  ICONS: {
    success: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
    error: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  },

  CLOSE_ICON: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',

  // Get or create toast container
  getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = `
        position: fixed; top: 1rem; right: 1rem; z-index: 9999;
        display: flex; flex-direction: column; gap: 0.5rem;
      `;
      document.body.appendChild(container);
    }
    return container;
  },

  // Show toast notification
  showToast(title, message, type = 'success') {
    const container = this.getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.ICONS[type] || this.ICONS.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        ${this.CLOSE_ICON}
      </button>
    `;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Show persistent notification modal
  showNotificationPersistent(message, type = 'success') {
    const headerColorMap = {
      'success': 'linear-gradient(135deg, var(--primary-green), #20c997)',
      'error': 'linear-gradient(135deg, #ef4444, #dc2626)',
      'info': 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };

    const titleMap = {
      'success': 'Update Successful!',
      'error': 'Update Failed!',
      'info': 'Information'
    };

    const headerColor = headerColorMap[type] || headerColorMap.info;
    const title = titleMap[type] || titleMap.info;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.6); display: flex; align-items: center;
      justify-content: center; z-index: 99999; backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; border-radius: 20px; padding: 0; max-width: 520px;
      width: 90%; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); overflow: hidden;
    `;

    modal.innerHTML = `
      <div style="background: ${headerColor}; color: white; padding: 2rem; text-align: center;">
        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">${title}</h3>
      </div>
      <div style="padding: 2rem; text-align: center;">
        <p style="margin: 0 0 2rem 0; font-size: 1.1rem; color: #374151; line-height: 1.6;">${message}</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="persistentNotificationOkBtn" style="
            background: ${headerColor}; color: white; border: none;
            padding: 1rem 2.5rem; border-radius: 12px; font-weight: 600;
            font-size: 1rem; cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          ">Got it!</button>
          ${type === 'success' ? `
          <button id="persistentNotificationRefreshBtn" style="
            background: linear-gradient(135deg, #6b7280, #4b5563); color: white;
            border: none; padding: 1rem 2.5rem; border-radius: 12px; font-weight: 600;
            font-size: 1rem; cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          ">Refresh Page</button>
          ` : ''}
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const okBtn = modal.querySelector('#persistentNotificationOkBtn');
    const refreshBtn = modal.querySelector('#persistentNotificationRefreshBtn');

    const closeModal = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      document.body.style.overflow = '';
    };

    okBtn.addEventListener('click', closeModal);
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }

    document.body.style.overflow = 'hidden';
  }
};

// Backward compatible functions
function showToast(title, message, type = 'success') {
  NotificationManager.showToast(title, message, type);
}

function showNotificationPersistent(message, type = 'success') {
  NotificationManager.showNotificationPersistent(message, type);
}

// ========================================
// SEARCHABLE DROPDOWN FUNCTIONS
// ========================================
let selectedAffiliations = [];
let selectedStudentOrgs = [];

// Dropdown Manager
const DropdownManager = {
  activeDropdown: null,

  registerOpen(dropdown) {
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
    this.display.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    if (this.hasSearch && this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterOptions(e.target.value);
      });
    }

    this.optionsContainer.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.handleOptionChange(e.target);
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

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

// Initialize dropdowns
let affiliationFilter, studentOrgFilter, roleFilter;

function initializeSearchableDropdowns() {
  // Initialize role filter (simple dropdown without search)
  roleFilter = new EnhancedMultiSelect('roleFilter',
    ['admin', 'user'], 'Select Roles', false);
    
  affiliationFilter = new EnhancedMultiSelect('affiliationFilter',
    affiliationsArray, 'Select Offices/Departments', true);
  studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter',
    studentOrgsArray, 'Select Student Organizations', true);

  // Listen to selection changes
  document.getElementById('roleFilter').addEventListener('selectionChange', () => {
    filterUsers();
  });
  
  document.getElementById('affiliationFilter').addEventListener('selectionChange', () => {
    filterUsers();
  });

  document.getElementById('studentOrgFilter').addEventListener('selectionChange', () => {
    filterUsers();
  });
}

// Call this on load
document.addEventListener('DOMContentLoaded', initializeSearchableDropdowns);

// ========================================
// FILTER MANAGER
// ========================================
const FilterManager = {
  filters: {
    userId: '',
    name: '',
    username: '',
    email: '',
    cys: ''
  },

  updateFilterValue(filterName, value) {
    if (this.filters.hasOwnProperty(filterName)) {
      this.filters[filterName] = value.toLowerCase();
      this.applyFilters();
    }
  },

  checkTextMatch(text, filterValue) {
    return filterValue === '' || text.toLowerCase().includes(filterValue);
  },

  checkSelectMatch(selectedValues, rowValue) {
    if (!selectedValues.includes('all')) {
      return selectedValues.includes(rowValue.toLowerCase());
    }
    return true;
  },

  checkArrayMatch(selectedValues, rowValue) {
    if (!selectedValues.includes('all')) {
      return selectedValues.some(val => rowValue.includes(val.toLowerCase()));
    }
    return true;
  },

  applyFilters() {
    const allRows = DOMCache.getAllRows();
    let visibleCount = 0;

    allRows.forEach(row => {
      const rowUserId = row.dataset.userId.toLowerCase();
      const rowFullname = `${row.dataset.fname} ${row.dataset.mname} ${row.dataset.lname}`.toLowerCase();
      const rowUsername = row.dataset.username.toLowerCase();
      const rowEmail = row.dataset.email.toLowerCase();
      const rowCys = row.dataset.cys.toLowerCase();
      const rowRole = (row.dataset.role || '').toLowerCase();
      const rowAffiliation = (row.dataset.affiliation || '').toLowerCase();
      const rowStudentOrg = (row.dataset.studentorg || '').toLowerCase();

      // Text filters
      const userIdMatch = this.checkTextMatch(rowUserId, this.filters.userId);
      const nameMatch = this.checkTextMatch(rowFullname, this.filters.name);
      const usernameMatch = this.checkTextMatch(rowUsername, this.filters.username);
      const emailMatch = this.checkTextMatch(rowEmail, this.filters.email);
      const cysMatch = this.checkTextMatch(rowCys, this.filters.cys);

      // Dropdown filters
      const roleMatch = this.checkSelectMatch(roleFilter.getSelectedValues(), rowRole);
      const affiliationMatch = this.checkArrayMatch(affiliationFilter.getSelectedValues(), rowAffiliation);
      const studentOrgMatch = this.checkArrayMatch(studentOrgFilter.getSelectedValues(), rowStudentOrg);

      const isVisible = userIdMatch && nameMatch && usernameMatch && emailMatch && cysMatch && 
                       roleMatch && affiliationMatch && studentOrgMatch;

      row.style.display = isVisible ? 'grid' : 'none';
      if (isVisible) visibleCount++;
    });

    this.updateResultsCount(visibleCount, allRows.length);
  },

  updateResultsCount(visibleCount, totalCount) {
    const resultsCount = document.getElementById('resultsCount');
    if (visibleCount === totalCount) {
      resultsCount.textContent = `Showing all ${totalCount} users`;
    } else {
      resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} users`;
    }
  },

  clearFilters() {
    // Clear text filters
    document.getElementById('userIdFilter').value = '';
    document.getElementById('nameFilter').value = '';
    document.getElementById('usernameFilter').value = '';
    document.getElementById('emailFilter').value = '';
    document.getElementById('cysFilter').value = '';

    // Reset to defaults
    this.filters = { userId: '', name: '', username: '', email: '', cys: '' };

    // Reset dropdowns
    if (roleFilter) roleFilter.reset();
    if (affiliationFilter) affiliationFilter.reset();
    if (studentOrgFilter) studentOrgFilter.reset();

    this.applyFilters();
  }
};

// Backward compatible filterUsers function
function filterUsers() {
  FilterManager.applyFilters();
}

// ========================================
// FILTER EVENT LISTENERS SETUP
// ========================================
function setupFilterEventListeners() {
  const filterInputs = {
    'userIdFilter': 'userId',
    'nameFilter': 'name',
    'usernameFilter': 'username',
    'emailFilter': 'email',
    'cysFilter': 'cys'
  };

  Object.entries(filterInputs).forEach(([elementId, filterName]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('input', (e) => {
        FilterManager.updateFilterValue(filterName, e.target.value);
      });
    }
  });

  // Clear filters button
  const { clearFiltersBtn } = DOMCache;
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      FilterManager.clearFilters();
    });
  }
}

// ========================================
// MAIN INITIALIZATION
// ========================================
function initializeApplication() {
  console.log('🚀 Initializing Users Management Application');

  // Initialize DOM cache
  DOMCache.init();
  console.log('✅ DOM Cache initialized');

  // Setup all event listeners and managers
  setupModalHandlers();
  setupFilterEventListeners();
  StatusTabManager.setup();
  UserFormHandler.setup();
  RoleManager.setupRoleFieldHighlighting();
  HeaderDropdown.init();
  NavigationManager.init();

  console.log('✅ All components initialized successfully');
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApplication);

// ========================================
// STATUS TAB MANAGER
// ========================================
const StatusTabManager = {
  setup() {
    document.querySelectorAll('.status-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.handleTabClick(e));
    });
  },

  handleTabClick(e) {
    e.preventDefault();

    // Update active tab
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');

    // Filter rows by status
    const filterStatus = e.target.dataset.status;
    this.filterByStatus(filterStatus);
  },

  filterByStatus(filterStatus) {
    const gridRows = document.querySelectorAll('.grid-row');
    let visibleCount = 0;

    gridRows.forEach(row => {
      const userStatus = row.dataset.status;
      const isVisible = filterStatus === 'all' || userStatus === filterStatus;
      row.style.display = isVisible ? 'grid' : 'none';
      if (isVisible) visibleCount++;
    });

    this.updateResultsCount(visibleCount, gridRows.length);
  },

  updateResultsCount(visibleCount, totalCount) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} users`;
    }
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  StatusTabManager.setup();
});

// ========================================
// ROLE MANAGEMENT UTILITY
// ========================================
const RoleManager = {
  ROLE_NAMES: {
    'admin': 'Administrator',
    'unit': 'Unit Member',
    'user': 'Standard User'
  },

  ROLE_DESCRIPTIONS: {
    'user': 'Requestor (User) - Submits requests',
    'unit': 'Unit Member - Works on tasks',
    'admin': 'Administrator - Full System Access'
  },

  updateCurrentRoleDisplay(role) {
    const currentRoleDisplay = document.getElementById('currentRoleDisplay');
    if (currentRoleDisplay) {
      currentRoleDisplay.textContent = this.ROLE_NAMES[role] || this.ROLE_NAMES.user;
    }
  },

  updateRoleDropdownDisplay(value) {
    document.getElementById('editRole').value = value;
    document.getElementById('selectedRoleText').textContent = this.ROLE_DESCRIPTIONS[value] || this.ROLE_DESCRIPTIONS.user;
    this.updateCurrentRoleDisplay(value);
    this.toggleUnitAssignmentDropdown(value);
  },

  toggleUnitAssignmentDropdown(role) {
    const unitContainer = document.getElementById('unitAssignmentContainer');
    if (unitContainer) {
      unitContainer.style.display = role === 'unit' ? 'block' : 'none';
      if (role !== 'unit') {
        document.getElementById('editUnitTeam').value = 'N/A';
      }
    }
  },

  setupRoleFieldHighlighting() {
    const roleField = document.getElementById('editRole');
    if (roleField) {
      roleField.addEventListener('change', () => this.updateRoleWarning(roleField.value));
    }
  },

  updateRoleWarning(role) {
    const warning = document.querySelector('.role-update-warning');
    if (!warning) return;

    const isAdmin = role === 'admin';
    const backgroundColor = isAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';
    const borderColor = isAdmin ? '#ef4444' : '#f59e0b';
    const textColor = isAdmin ? '#991b1b' : '#92400e';
    const warningIcon = isAdmin ? 
      '<svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.5rem; vertical-align: text-top;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      : '<svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.5rem; vertical-align: text-top;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    const warningText = isAdmin ?
      '<strong>Critical:</strong> This user will gain FULL ADMINISTRATIVE ACCESS including the ability to manage all users, approve/reject requests, and access sensitive system functions.'
      : '<strong>Important:</strong> This user will have standard access permissions for submitting and viewing their own requests only.';

    warning.style.background = backgroundColor;
    warning.style.borderLeftColor = borderColor;
    warning.style.color = textColor;
    warning.innerHTML = `${warningIcon}${warningText}`;
  }
};

// Backward compatible functions
function updateCurrentRoleDisplay(role) {
  RoleManager.updateCurrentRoleDisplay(role);
}

function selectCustomRole(value, text) {
  RoleManager.updateRoleDropdownDisplay(value);
  document.getElementById('customDropdownOptions').style.display = 'none';
  document.querySelector('.dropdown-selected').classList.remove('active');

  const changeEvent = new Event('change');
  document.getElementById('editRole').dispatchEvent(changeEvent);
}

// ========================================
// USER UPDATE FORM HANDLER
// ========================================
const UserFormHandler = {
  setup() {
    const form = document.getElementById('userUpdateForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  },

  async handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Get form data
    const newRole = document.getElementById('editRole').value;
    const userName = document.getElementById('viewFullName').textContent;
    const userId = document.getElementById('editUserId').value;
    const newUnitTeam = document.getElementById('editUnitTeam').value;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    const requestData = { userId, role: newRole, unitTeam: newUnitTeam };

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.handleSuccess(userId, newRole, newUnitTeam, userName, submitBtn, originalText);
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      this.handleError(error, userName, submitBtn, originalText);
    }
  },

  handleSuccess(userId, newRole, newUnitTeam, userName, submitBtn, originalText) {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.innerHTML = originalText;

    // Update UI
    document.getElementById('selectedRoleText').textContent = RoleManager.ROLE_DESCRIPTIONS[newRole];
    RoleManager.updateCurrentRoleDisplay(newRole);

    // Update grid row
    const currentRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
    if (currentRow) {
      currentRow.dataset.role = newRole;
      currentRow.dataset.unitteam = newUnitTeam;

      const roleBadge = currentRow.querySelector('.role-badge');
      if (roleBadge) {
        roleBadge.classList.remove('role-admin', 'role-unit', 'role-user');
        roleBadge.classList.add(`role-${newRole}`);
        let badgeText = newRole.toUpperCase();
        if (newRole === 'unit' && newUnitTeam && newUnitTeam !== 'N/A') {
          badgeText += ` - ${newUnitTeam}`;
        }
        roleBadge.textContent = badgeText;
      }
    }

    // Show success toast
    const unitInfo = (newRole === 'unit' && newUnitTeam && newUnitTeam !== 'N/A') ? ` (${newUnitTeam})` : '';
    showToast('Success', `${userName}'s role updated to ${RoleManager.ROLE_NAMES[newRole]}${unitInfo}`, 'success');

    // Scroll to top
    const modalBody = document.querySelector('.user-details-modal-body');
    if (modalBody) {
      modalBody.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  handleError(error, userName, submitBtn, originalText) {
    console.error('Error:', error);
    showToast('Error', `Failed to update ${userName}'s role`, 'error');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.innerHTML = originalText;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  UserFormHandler.setup();
  RoleManager.setupRoleFieldHighlighting();
});

// ========================================
// HEADER DROPDOWN MANAGER
// ========================================
const HeaderDropdown = {
  menu: null,
  isOpen: false,

  init() {
    this.menu = document.getElementById("dropdownMenu");
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const toggle = document.querySelector(".dropdown-toggle");
      if (!toggle?.contains(e.target)) {
        this.close();
      }

      // Close custom role dropdown when clicking outside
      const dropdown = document.getElementById('customRoleDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        document.getElementById('customDropdownOptions').style.display = 'none';
        document.querySelector('.dropdown-selected').classList.remove('active');
      }
    });
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
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
  }
};

// Backward compatible function
function toggleDropdown() {
  HeaderDropdown.init();
  HeaderDropdown.toggle();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  HeaderDropdown.init();
});

// ========================================
// SIDEBAR & MOBILE NAVIGATION MANAGER
// ========================================
const NavigationManager = {
  sidebar: null,
  menuToggle: null,
  mobileOverlay: null,
  touchStartX: 0,
  touchEndX: 0,
  SWIPE_THRESHOLD: 100,

  init() {
    this.sidebar = document.getElementById('adminSidebar');
    this.menuToggle = document.getElementById('adminMenuToggle');
    this.mobileOverlay = document.getElementById('mobileOverlay');

    if (this.sidebar) {
      // Sidebar hover effect
      this.sidebar.addEventListener('mouseenter', () => this.sidebar.classList.add('expanded'));
      this.sidebar.addEventListener('mouseleave', () => this.sidebar.classList.remove('expanded'));
    }

    this.setupMobileNavigation();
    window.addEventListener('resize', () => this.handleResize(), { passive: true });
    document.addEventListener('click', (e) => this.handleClickOutside(e));
  },

  setupMobileNavigation() {
    if (this.menuToggle && this.sidebar && this.mobileOverlay) {
      this.menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMobileMenu(true);
      });

      this.mobileOverlay.addEventListener('click', () => {
        this.toggleMobileMenu(false);
      });

      // Touch gestures
      this.sidebar.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
      }, { passive: true });

      this.sidebar.addEventListener('touchmove', (e) => {
        this.touchEndX = e.touches[0].clientX;
      }, { passive: true });

      this.sidebar.addEventListener('touchend', () => {
        this.handleSwipe();
      });

      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.sidebar.classList.contains('mobile-active')) {
          this.toggleMobileMenu(false);
        }
      });
    }
  },

  toggleMobileMenu(show) {
    if (show) {
      this.sidebar.classList.add('mobile-active');
      this.mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.announceMenuState('Navigation menu opened');
    } else {
      this.sidebar.classList.remove('mobile-active');
      this.mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  announceMenuState(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  },

  handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (this.sidebar.classList.contains('mobile-active') && swipeDistance < -this.SWIPE_THRESHOLD) {
      this.toggleMobileMenu(false);
    }
  },

  handleResize() {
    if (this.sidebar && this.mobileOverlay) {
      if (window.innerWidth > 768) {
        this.sidebar.classList.remove('mobile-active');
        this.mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  },

  handleClickOutside(e) {
    if (this.sidebar && this.sidebar.classList.contains('mobile-active')) {
      if (!this.sidebar.contains(e.target) && this.menuToggle && !this.menuToggle.contains(e.target)) {
        this.toggleMobileMenu(false);
      }
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  NavigationManager.init();
});

// ========================================
// EVENT LISTENERS FOR STATUS BUTTONS
// ========================================

// ========================================
// GRID ROW CLICK - Open User Detail Modal
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - Initializing grid row click listeners...');
  
  // Initialize DOM cache
  DOMCache.init();
  
  const gridBody = document.getElementById('gridBody');
  console.log('📋 Grid Body Element:', gridBody ? 'FOUND ✓' : 'NOT FOUND ✗');
  
  if (gridBody) {
    // Single event listener for clicking on user rows
    gridBody.addEventListener('click', function(e) {
      console.log('🖱️ Click detected in grid body', e.target);
      
      // Find the grid row
      const gridRow = e.target.closest('.grid-row');
      if (gridRow) {
        console.log('📄 Opening user modal for row');
        // Always scroll to actions when clicking on the row (especially "Click to Manage")
        openUserModal(gridRow, 'actions');
      }
    });
    
    console.log('✅ Grid row click listener attached successfully');
  }
  
  // ========================================
  // TRASH BUTTON EVENT LISTENER
  // ========================================
  const trashBtn = document.getElementById('trashBtn');
  console.log('🗑️  Trash Button:', trashBtn ? 'FOUND ✓' : 'NOT FOUND ✗');
  
  if (trashBtn) {
    console.log('🗑️  Found trash button, attaching click listener');
    trashBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('🗑️  Trash button clicked - calling openTrashModal()');
      openTrashModal();
    }, true); // Use capture phase to ensure this fires before other handlers
  } else {
    console.warn('⚠️  Trash button not found in DOM');
  }
  
  console.log('🎉 Grid event listeners initialized successfully!');
});

// ========================================
// MODAL ACTION BUTTONS - Separate Event Listeners
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - Initializing MODAL action button listeners...');
  
  // Attach listeners to modal action buttons by ID - DIFFERENT FUNCTION
  const modalApproveBtn = document.getElementById('modalApproveBtn');
  const modalDenyBtn = document.getElementById('modalDenyBtn');
  const modalResetBtn = document.getElementById('modalResetBtn');
  
  console.log('🔘 Modal Approve Button:', modalApproveBtn ? 'FOUND ✓' : 'NOT FOUND ✗');
  console.log('🔘 Modal Deny Button:', modalDenyBtn ? 'FOUND ✓' : 'NOT FOUND ✗');
  console.log('🔘 Modal Reset Button:', modalResetBtn ? 'FOUND ✓' : 'NOT FOUND ✗');
  
  if (modalApproveBtn) {
    modalApproveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const userId = this.dataset.userid;
      console.log('✅ MODAL Approve clicked for userId:', userId);
      if (!userId) {
        console.warn('⚠️ No userId found on modal approve button');
        return;
      }
      handleModalAction('approve', userId, this);
    });
  }
  
  if (modalDenyBtn) {
    modalDenyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const userId = this.dataset.userid;
      console.log('❌ MODAL Deny clicked for userId:', userId);
      if (!userId) {
        console.warn('⚠️ No userId found on modal deny button');
        return;
      }
      handleModalAction('deny', userId, this);
    });
  }
  
  if (modalResetBtn) {
    modalResetBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const userId = this.dataset.userid;
      console.log('🔄 MODAL Reset clicked for userId:', userId);
      if (!userId) {
        console.warn('⚠️ No userId found on modal reset button');
        return;
      }
      handleModalAction('reset', userId, this);
    });
  }
  
  console.log('🎉 MODAL event listeners initialized successfully!');
});

// ========================================
// GRID ACTION HANDLER - Quick confirmation and execution
// ========================================
// MODAL ACTION HANDLER - Confirmation dialog
// ========================================
function handleModalAction(action, userId, buttonElement) {
  console.log('📋 handleModalAction called (MODAL BUTTONS):', { action, userId, buttonElement });
  
  const confirmStatusModal = document.getElementById('confirmStatusModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmStatusBtn = document.getElementById('confirmStatusBtn');
  const closeConfirmModal = document.getElementById('closeConfirmModal');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  
  if (!confirmStatusModal) {
    console.error('❌ Confirm status modal not found');
    return;
  }
  
  // Set modal content based on action
  let actionText = '';
  let actionColor = '';
  
  if (action === 'approve') {
    actionText = 'Approve User';
    actionColor = '#10b981';
    confirmMessage.innerHTML = `<strong>Approve this user?</strong><br>The user will be granted access to the system.`;
  } else if (action === 'deny') {
    actionText = 'Deny User';
    actionColor = '#ef4444';
    confirmMessage.innerHTML = `<strong>Deny this user?</strong><br>The user will not be able to access the system.`;
  } else if (action === 'reset') {
    actionText = 'Reset to Pending';
    actionColor = '#f59e0b';
    confirmMessage.innerHTML = `<strong>Reset user status to Pending?</strong><br>The user status will be changed back to pending review.`;
  }
  
  // Update confirm button
  confirmStatusBtn.textContent = actionText;
  confirmStatusBtn.style.background = actionColor;
  
  // Remove old event listeners by cloning and replacing
  const newConfirmBtn = confirmStatusBtn.cloneNode(true);
  const newCancelBtn = cancelConfirmBtn.cloneNode(true);
  const newCloseBtn = closeConfirmModal.cloneNode(true);
  
  confirmStatusBtn.parentNode.replaceChild(newConfirmBtn, confirmStatusBtn);
  cancelConfirmBtn.parentNode.replaceChild(newCancelBtn, cancelConfirmBtn);
  closeConfirmModal.parentNode.replaceChild(newCloseBtn, closeConfirmModal);
  
  // Close modal function
  function closeModal() {
    confirmStatusModal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Confirm button - execute action
  newConfirmBtn.onclick = function() {
    console.log('✅ Modal confirm clicked - executing status change');
    closeModal();
    executeModalStatusChange(action, userId, buttonElement);
  };
  
  // Cancel and close buttons
  newCancelBtn.onclick = closeModal;
  newCloseBtn.onclick = closeModal;
  
  // Show modal
  confirmStatusModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  console.log('✅ Modal confirmation dialog displayed');
}

// ========================================
// UPDATE MODAL ACTION BUTTONS
// ========================================
function updateModalActionButtons(action) {
  console.log('🔄 updateModalActionButtons called with action:', action);
  
  const approveBtn = document.getElementById('modalApproveBtn');
  const denyBtn = document.getElementById('modalDenyBtn');
  const resetBtn = document.getElementById('modalResetBtn');
  
  if (!approveBtn || !denyBtn || !resetBtn) {
    console.error('❌ Modal action buttons not found!', {
      approveBtn: !!approveBtn,
      denyBtn: !!denyBtn,
      resetBtn: !!resetBtn
    });
    return;
  }
  
  console.log('📋 Buttons found:', {
    approve: approveBtn.textContent,
    deny: denyBtn.textContent,
    reset: resetBtn.textContent
  });
  
  // Determine new status based on action
  let newStatus = '';
  if (action === 'approve') newStatus = 'approved';
  else if (action === 'deny') newStatus = 'denied';
  else if (action === 'reset') newStatus = 'pending';
  
  console.log(`🎯 New status will be: ${newStatus}`);
  
  // Reset all buttons to default state and text
  approveBtn.disabled = false;
  approveBtn.style.opacity = '1';
  approveBtn.style.cursor = 'pointer';
  approveBtn.textContent = 'Approve';
  
  denyBtn.disabled = false;
  denyBtn.style.opacity = '1';
  denyBtn.style.cursor = 'pointer';
  denyBtn.textContent = 'Deny';
  
  resetBtn.disabled = false;
  resetBtn.style.opacity = '1';
  resetBtn.style.cursor = 'pointer';
  resetBtn.textContent = 'Reset to Pending';
  
  console.log('🔄 All buttons reset to default state');
  
  // Show only relevant buttons based on NEW status
  if (newStatus === 'approved') {
    // User is now approved - can only deny or reset
    approveBtn.style.display = 'none';
    denyBtn.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    console.log('✅ Status: APPROVED - Showing: Deny, Reset');
  } else if (newStatus === 'denied') {
    // User is now denied - can only approve or reset
    approveBtn.style.display = 'inline-block';
    denyBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';
    console.log('✅ Status: DENIED - Showing: Approve, Reset');
  } else if (newStatus === 'pending') {
    // User is now pending - can only approve or deny
    approveBtn.style.display = 'inline-block';
    denyBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
    console.log('✅ Status: PENDING - Showing: Approve, Deny');
  }
  
  console.log(`✅ Modal action buttons updated successfully for new status: ${newStatus}`);
}

// ========================================
// EXECUTE MODAL STATUS CHANGE
// ========================================
async function executeModalStatusChange(action, userId, buttonElement) {
  console.log('🚀 executeModalStatusChange called:', { action, userId });
  
  try {
    const response = await fetch('/admin/user/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Status update successful:', result.message);
      
      // Determine new status
      let newStatus = '';
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'deny') newStatus = 'denied';
      else if (action === 'reset') newStatus = 'pending';
      
      // Update the modal status badge with smooth transition
      const modalStatusBadge = document.getElementById('modalStatusBadge');
      if (modalStatusBadge) {
        modalStatusBadge.style.transition = 'all 0.3s ease';
        modalStatusBadge.style.transform = 'scale(1.1)';
        modalStatusBadge.className = `status-badge status-${newStatus}`;
        modalStatusBadge.textContent = newStatus.toUpperCase();
        
        setTimeout(() => {
          modalStatusBadge.style.transform = 'scale(1)';
        }, 300);
      }
      
      // Update the corresponding grid row
      const gridRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
      if (gridRow) {
        const statusBadge = gridRow.querySelector('.grid-col-status .status-badge');
        if (statusBadge) {
          statusBadge.className = `status-badge status-${newStatus}`;
          statusBadge.textContent = newStatus.toUpperCase();
          gridRow.dataset.status = newStatus;
        }
      }
      
      // Update modal action buttons to reflect new status
      updateModalActionButtons(action);
      
      // Show brief visual feedback in console only (no toasts/pop-ups)
      logSuccess(`User status updated to ${newStatus.toUpperCase()}`);
      console.log('✅ Modal status change completed seamlessly');
    } else {
      console.error('❌ Status update failed:', result.message || 'Failed to update user status');
      logError('Failed to update user status: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    logError('Network error while updating user status');
  }
}

// ========================================
// ========================================
// OPEN USER MODAL
// ========================================
function openUserModal(row, scrollTo = null) {
  // Populate modal fields from row dataset
  document.getElementById('viewUserId').textContent = row.dataset.userId || '';
  const fullName = `${row.dataset.fname || ''} ${row.dataset.mname ? row.dataset.mname + ' ' : ''}${row.dataset.lname || ''}`.trim();
  document.getElementById('viewFullName').textContent = fullName;
  document.getElementById('viewUsername').textContent = row.dataset.username || '';
  document.getElementById('viewEmail').textContent = row.dataset.email || '';
  document.getElementById('viewPhone').textContent = row.dataset.phone || '';

  const typeBadge = document.getElementById('viewUserType');
  typeBadge.textContent = row.dataset.usertype === 'student' ? 'Student' : 'Non-Student';
  typeBadge.className = 'user-type-badge ' + (row.dataset.usertype === 'student' ? 'student' : 'nonstudent');

  if (row.dataset.usertype === 'student') {
    document.getElementById('viewCysRow').style.display = '';
    document.getElementById('viewCys').textContent = row.dataset.cys || '';
    document.getElementById('viewOrgLabel').textContent = 'Student Organizations:';
    const orgs = (row.dataset.studentorg || '').split('||').filter(Boolean);
    if (orgs.length > 0) {
      const orgContainer = document.getElementById('viewOrganizationContainer');
      orgContainer.innerHTML = '<div class="org-tags-container">' +
        orgs.map(org => `<span class="org-tag">${org}</span>`).join('') +
        '</div>';
    } else {
      document.getElementById('viewOrganizationContainer').innerHTML = '<span class="no-organizations">No organizations</span>';
    }
  } else {
    document.getElementById('viewCysRow').style.display = 'none';
    document.getElementById('viewOrgLabel').textContent = 'Affiliation:';
    const affs = (row.dataset.affiliation || '').split('||').filter(Boolean);
    if (affs.length > 0) {
      const orgContainer = document.getElementById('viewOrganizationContainer');
      orgContainer.innerHTML = '<div class="org-tags-container">' +
        affs.map(aff => `<span class="org-tag">${aff}</span>`).join('') +
        '</div>';
    } else {
      document.getElementById('viewOrganizationContainer').innerHTML = '<span class="no-organizations">No affiliation</span>';
    }
  }


  // Populate status section
  const status = row.dataset.status || 'pending';
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  modalStatusBadge.textContent = status.toUpperCase();
  modalStatusBadge.className = 'status-badge status-' + status;

  // Show/hide status action buttons based on current status (select by ID)
  const modalApproveBtn = document.getElementById('modalApproveBtn');
  const modalDenyBtn = document.getElementById('modalDenyBtn');
  const modalResetBtn = document.getElementById('modalResetBtn');

  // Set userId for modal buttons
  [modalApproveBtn, modalDenyBtn, modalResetBtn].forEach(btn => {
    if (btn) btn.dataset.userid = row.dataset.id;
  });

  console.log('🔍 openUserModal - Current user status:', status);
  console.log('📋 Modal buttons before update:', {
    approve: modalApproveBtn ? 'Found' : 'Not found',
    deny: modalDenyBtn ? 'Found' : 'Not found',
    reset: modalResetBtn ? 'Found' : 'Not found'
  });

  // Reset all buttons to default text first
  if (modalApproveBtn) modalApproveBtn.textContent = 'Approve';
  if (modalDenyBtn) modalDenyBtn.textContent = 'Deny';
  if (modalResetBtn) modalResetBtn.textContent = 'Reset to Pending';

  // Show/hide based on status
  if (status === 'pending') {
    console.log('🟡 User is PENDING - Showing: Approve, Deny | Hiding: Reset');
    if (modalApproveBtn) modalApproveBtn.style.display = 'inline-block';
    if (modalDenyBtn) modalDenyBtn.style.display = 'inline-block';
    if (modalResetBtn) modalResetBtn.style.display = 'none';
  } else if (status === 'approved') {
    console.log('🟢 User is APPROVED - Showing: Deny, Reset | Hiding: Approve');
    if (modalApproveBtn) modalApproveBtn.style.display = 'none';
    if (modalDenyBtn) modalDenyBtn.style.display = 'inline-block';
    if (modalResetBtn) modalResetBtn.style.display = 'inline-block';
  } else if (status === 'denied') {
    console.log('🔴 User is DENIED - Showing: Approve, Reset | Hiding: Deny');
    if (modalApproveBtn) modalApproveBtn.style.display = 'inline-block';
    if (modalDenyBtn) modalDenyBtn.style.display = 'none';
    if (modalResetBtn) modalResetBtn.style.display = 'inline-block';
  } else {
    console.log('⚪ User has unknown status - Hiding all buttons');
    if (modalApproveBtn) modalApproveBtn.style.display = 'none';
    if (modalDenyBtn) modalDenyBtn.style.display = 'none';
    if (modalResetBtn) modalResetBtn.style.display = 'none';
  }

  console.log('✅ Modal buttons configured for status:', status);

  // Show/hide Administrative Controls section based on user status
  const adminControlsSection = document.getElementById('adminControlsSection');
  if (adminControlsSection) {
    if (status === 'approved') {
      adminControlsSection.style.display = 'block';
      console.log('✅ Administrative Controls section shown (user is approved)');
    } else {
      adminControlsSection.style.display = 'none';
      console.log('🔒 Administrative Controls section hidden (user is not approved)');
    }
  }

  // CRITICAL: Set the user ID for the role update form
  document.getElementById('editUserId').value = row.dataset.id;
  console.log('🆔 Set editUserId to:', row.dataset.id);

  // Update the custom dropdown display
  const userRole = row.dataset.role || 'user';
  document.getElementById('editRole').value = userRole;
  
  // Build role text map from userRolesData
  const roleTextMap = {};
  if (typeof userRolesData !== 'undefined' && userRolesData.length > 0) {
    userRolesData.forEach(role => {
      const roleName = typeof role === 'string' ? role : role.name;
      const rolePerms = typeof role === 'string' ? [] : (role.permissions || []);
      const value = rolePerms.includes('admin') ? 'admin' : (rolePerms.includes('unit') ? 'unit' : 'user');
      roleTextMap[value] = roleName;
    });
  } else {
    // Fallback
    roleTextMap['user'] = 'Requestor (User) - Submits requests';
    roleTextMap['unit'] = 'Unit Member - Works on tasks';
    roleTextMap['admin'] = 'Administrator - Full System Access';
  }
  document.getElementById('selectedRoleText').textContent = roleTextMap[userRole] || roleTextMap['user'];
  updateCurrentRoleDisplay(userRole);

  // Handle unit team dropdown visibility and value
  const unitContainer = document.getElementById('unitAssignmentContainer');
  const unitDropdown = document.getElementById('editUnitTeam');
  const userUnit = row.dataset.unitteam || 'N/A';

  if (userRole === 'unit') {
    unitContainer.style.display = 'block';
    unitDropdown.value = userUnit;
  } else {
    unitContainer.style.display = 'none';
    unitDropdown.value = 'N/A';
  }

  // Open modal and handle scrolling
  userModal().style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Scroll modal content based on scrollTo parameter
  const modalBody = document.querySelector('.user-details-modal-body');
  if (modalBody) {
    if (scrollTo === 'actions') {
      // Scroll to the User Status section (first user-admin-form-section)
      setTimeout(() => {
        const actionsSection = modalBody.querySelector('.user-admin-form-section');
        if (actionsSection) {
          actionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Highlight the section briefly
          actionsSection.style.backgroundColor = '#fef3c7';
          actionsSection.style.transition = 'background-color 0.3s ease';
          
          setTimeout(() => {
            actionsSection.style.backgroundColor = '';
          }, 2000);
          
          console.log('✅ Scrolled to user actions section');
        }
      }, 300);
    } else {
      // Default: scroll to top (personal information section)
      modalBody.scrollTop = 0;
    }
  }
}

// Make openUserModal available globally for notification system
window.openUserModal = openUserModal;

// ========================================
// TRASH MODAL FUNCTIONS
// ========================================
async function openTrashModal() {
  console.log('🗑️ openTrashModal called');

  const modal = document.getElementById('trashModal');
  const tableBody = document.getElementById('trashTableBody');
  const emptyState = document.getElementById('trashEmptyState');
  const modalContent = modal ? modal.querySelector('.modal-content') : null;

  console.log('🔍 Modal element:', modal ? 'FOUND ✓' : 'NOT FOUND ✗');
  console.log('🔍 Table body element:', tableBody ? 'FOUND ✓' : 'NOT FOUND ✗');
  console.log('🔍 Empty state element:', emptyState ? 'FOUND ✓' : 'NOT FOUND ✗');
  console.log('🔍 Modal content:', modalContent ? 'FOUND ✓' : 'NOT FOUND ✗');

  if (!modal) {
    console.error('❌ Trash modal not found');
    alert('Trash modal not found in DOM');
    return;
  }

  // Force remove inline display none style
  modal.removeAttribute('style');
  
  // Show loading - display modal immediately
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading deleted users...</td></tr>';
  }
  if (emptyState) {
    emptyState.style.display = 'none';
  }

  // Ensure modal content is visible
  if (modalContent) {
    modalContent.style.display = 'flex';
    modalContent.style.visibility = 'visible';
    modalContent.style.opacity = '1';
    modalContent.style.zIndex = '10001';
  }

  // Display the modal with explicit z-index and flex - use !important to override any CSS
  modal.classList.add('show');
  modal.style.cssText = `
    display: flex !important;
    z-index: 10000 !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    align-items: center !important;
    justify-content: center !important;
  `;
  document.body.style.overflow = 'hidden';

  console.log('✅ Modal displayed with explicit CSS and z-index 10000');
  console.log('📊 Modal styles applied:', {
    display: modal.style.display,
    zIndex: modal.style.zIndex,
    visibility: modal.style.visibility
  });

  try {
    const response = await fetch('/api/admin/deleted-users', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.deletedUsers) {
      if (data.deletedUsers.length > 0) {
        tableBody.innerHTML = data.deletedUsers.map(user => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 1rem;">${String(user._id).slice(-6)}</td>
            <td style="padding: 1rem;">${user.fName} ${user.lName}</td>
            <td style="padding: 1rem;">${user.email}</td>
            <td style="padding: 1rem;">
              <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;"
                    class="role-badge ${user.role === 'admin' ? 'role-admin' : (user.role === 'unit' ? 'role-unit' : 'role-user')}">
                ${user.role.toUpperCase()}
              </span>
            </td>
            <td style="padding: 1rem;">${user.deletedByName || 'N/A'}</td>
            <td style="padding: 1rem;">${new Date(user.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="padding: 1rem; text-align: center;">
              <button class="action-btn restore-btn" onclick="openRestoreConfirm('${user._id}', '${user.fName} ${user.lName}')" title="Restore" style="background: #d1fae5; color: #065f46; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; margin-right: 0.5rem;">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.25rem; vertical-align: text-bottom;">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                Restore
              </button>
              <button class="action-btn delete-btn-permanent" onclick="openPermanentDeleteConfirm('${user._id}', '${user.fName} ${user.lName}')" title="Permanent Delete" style="background: #fee2e2; color: #991b1b; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.25rem; vertical-align: text-bottom;">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Forever
              </button>
            </td>
          </tr>
        `).join('');
        emptyState.style.display = 'none';
      } else {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
      }
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #dc2626;">Failed to load deleted users</td></tr>';
      emptyState.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading deleted users:', error);
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #dc2626;">Error: ' + error.message + '</td></tr>';
    emptyState.style.display = 'none';
  }
}

// Close trash modal
function closeTrashModal() {
  const modal = document.getElementById('trashModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Open restore confirmation
function openRestoreConfirm(userId, userName) {
  const modal = document.getElementById('restoreConfirmModal');
  currentRestoreUserId = userId;
  document.getElementById('restoreConfirmMessage').innerHTML = `Are you sure you want to restore <strong>${userName}</strong>?`;
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close restore confirmation
function closeRestoreConfirm() {
  const modal = document.getElementById('restoreConfirmModal');
  modal.classList.remove('show');
  modal.style.display = 'none';
  currentRestoreUserId = null;
  document.body.style.overflow = '';
}

// Confirm restore
async function confirmRestore() {
  if (!currentRestoreUserId) return;

  try {
    const response = await fetch(`/api/admin/restore-user/${currentRestoreUserId}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (data.success) {
      alert('User restored successfully');
      closeRestoreConfirm();
      openTrashModal(); // Refresh the trash modal
    } else {
      alert('Failed to restore user: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error restoring user:', error);
    alert('Error restoring user');
  }
}

// Open permanent delete confirmation
function openPermanentDeleteConfirm(userId, userName) {
  const modal = document.getElementById('permanentDeleteConfirmModal');
  currentPermanentDeleteUserId = userId;
  document.getElementById('permanentDeleteMessage').innerHTML = `Are you sure you want to permanently delete <strong>${userName}</strong>? This action cannot be undone.`;
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close permanent delete confirmation
function closePermanentDeleteConfirm() {
  const modal = document.getElementById('permanentDeleteConfirmModal');
  modal.classList.remove('show');
  modal.style.display = 'none';
  currentPermanentDeleteUserId = null;
  document.body.style.overflow = '';
}

// Confirm permanent delete
async function confirmPermanentDelete() {
  if (!currentPermanentDeleteUserId) return;

  try {
    const response = await fetch(`/api/admin/delete-user-permanently/${currentPermanentDeleteUserId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (data.success) {
      alert('User permanently deleted');
      closePermanentDeleteConfirm();
      openTrashModal(); // Refresh the trash modal
    } else {
      alert('Failed to delete user: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user');
  }
}

// ========================================
// ACTIVATE 'ALL USERS' TAB ON LOAD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a userId parameter in the URL (from notification)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const tab = urlParams.get('tab') || 'all';
    const scrollTo = urlParams.get('scrollTo') || null;

    if (userId) {
      // If userId is present, switch to the specified tab
      const targetTab = document.querySelector(`.status-tab[data-status="${tab}"]`);
      if (targetTab) {
        targetTab.click();

        // Wait for tab content to load, then open the user modal
        setTimeout(() => {
          const gridRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
          if (gridRow) {
            openUserModal(gridRow, scrollTo);

            // Scroll to the row
            gridRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Highlight the row briefly
            gridRow.style.backgroundColor = '#fef3c7';
            setTimeout(() => {
              gridRow.style.backgroundColor = '';
            }, 2000);

            // Clean up URL parameters
            const cleanUrl = window.location.pathname + '?tab=' + tab;
            window.history.replaceState({}, '', cleanUrl);
          } else {
            console.warn('User row not found for ID:', userId);
          }
        }, 300);
      }
    } else {
      // Default behavior: click the all users tab
      const allUsersTab = document.querySelector('.status-tab[data-status="all"]');
      if (allUsersTab) {
        allUsersTab.click();
      }
    }
  });

// ========================================
// CUSTOM DROPDOWN FUNCTIONS
// ========================================
function toggleCustomDropdown() {
  const options = document.getElementById('customDropdownOptions');
  if (options) {
    options.style.display = options.style.display === 'none' || options.style.display === '' ? 'block' : 'none';
  }
}

function selectCustomRole(value, text) {
  document.getElementById('editRole').value = value;
  document.getElementById('selectedRoleText').textContent = text;
  toggleCustomDropdown(); // Close the dropdown
  
  // Update unit assignment visibility
  const unitContainer = document.getElementById('unitAssignmentContainer');
  const unitDropdown = document.getElementById('editUnitTeam');
  if (unitContainer && unitDropdown) {
    if (value === 'unit') {
      unitContainer.style.display = 'block';
      // Set default unit if not already set or if it's 'N/A'
      if (!unitDropdown.value || unitDropdown.value === 'N/A') {
        if (typeof unitsData !== 'undefined' && unitsData.length > 0) {
          unitDropdown.value = unitsData[0];
        }
      }
    } else {
      unitContainer.style.display = 'none';
      unitDropdown.value = 'N/A';
    }
  }
  
  // Update current role display
  updateCurrentRoleDisplay(value);
}
