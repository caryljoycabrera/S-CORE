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
      // Also restore admin-main-content scrolling
      const adminMainContent = document.querySelector('.admin-main-content');
      if (adminMainContent) {
        adminMainContent.style.overflow = '';
      }
    }
  },

  // Open modal helper
  openModal(modal) {
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      // Also prevent admin-main-content from scrolling
      const adminMainContent = document.querySelector('.admin-main-content');
      if (adminMainContent) {
        adminMainContent.style.overflow = 'hidden';
      }
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
// CLOSE USER DETAILS MODAL FUNCTION
// ========================================
function closeUserDetailsModal() {
  const userModal = document.getElementById('userModal');
  if (userModal) {
    ModalUtility.closeModal(userModal);
  }
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
        position: fixed; top: 1rem; right: 1rem; z-index: 150000;
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
      justify-content: center; z-index: 100001; backdrop-filter: blur(4px);
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
    this.labels = new Map();

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
    const allLabel = `All ${this.placeholder.replace('Select ', '')}`;
    const allOption = this.createOption('all', allLabel);
    this.optionsContainer.appendChild(allOption);
    this.labels.set('all', allLabel);

    // Add other options. Support option as string or { value, label }
    this.options.forEach(option => {
      if (option && typeof option === 'object') {
        const val = option.value;
        const text = option.label || option.text || String(val);
        const optionElement = this.createOption(val, text);
        this.optionsContainer.appendChild(optionElement);
        this.labels.set(val, text);
      } else {
        const optionElement = this.createOption(option, option);
        this.optionsContainer.appendChild(optionElement);
        this.labels.set(option, option);
      }
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
      const val = selectedArray[0];
      this.selectedText.textContent = this.labels.get(val) || val;
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
    // Make dropdown a floating fixed element to avoid stacking-context issues
    try {
      const rect = this.display.getBoundingClientRect();
      // move dropdown to body to avoid any ancestor stacking/overflow/transform issues
      this._originalParent = this.dropdown.parentNode;
      this._originalNextSibling = this.dropdown.nextSibling;
      document.body.appendChild(this.dropdown);

      // apply fixed positioning so the dropdown is above sticky headers
      this.dropdown.style.position = 'fixed';
      this.dropdown.style.top = (rect.bottom + 4) + 'px';
      this.dropdown.style.left = rect.left + 'px';
      this.dropdown.style.width = rect.width + 'px';
      this.dropdown.style.zIndex = '2147483647';
      this._isFloating = true;

      // Add reposition handler to handle scroll/resize while open
      this._repositionHandler = () => {
        const r = this.display.getBoundingClientRect();
        this.dropdown.style.top = (r.bottom + 4) + 'px';
        this.dropdown.style.left = r.left + 'px';
        this.dropdown.style.width = r.width + 'px';
      };
      window.addEventListener('scroll', this._repositionHandler, true);
      window.addEventListener('resize', this._repositionHandler);
    } catch (err) {
      this._isFloating = false;
    }
    if (this.hasSearch && this.searchInput) {
      this.searchInput.focus();
    }
  }

  close() {
    this.isOpen = false;
    this.display.classList.remove('active');
    this.dropdown.classList.remove('show');

    // If we floated the dropdown to the body via fixed positioning, clear inline styles
    if (this._isFloating) {
      this.dropdown.style.position = '';
      this.dropdown.style.top = '';
      this.dropdown.style.left = '';
      this.dropdown.style.width = '';
      this.dropdown.style.zIndex = '';
      // restore to original parent
      if (this._originalParent) {
        if (this._originalNextSibling) {
          this._originalParent.insertBefore(this.dropdown, this._originalNextSibling);
        } else {
          this._originalParent.appendChild(this.dropdown);
        }
      }
      this._originalParent = null;
      this._originalNextSibling = null;
      this._isFloating = false;
      if (this._repositionHandler) {
        window.removeEventListener('scroll', this._repositionHandler, true);
        window.removeEventListener('resize', this._repositionHandler);
        this._repositionHandler = null;
      }
    }

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
  // Get data from global variables (provided by server)
  const affiliationsArray = typeof officesData !== 'undefined' ? officesData : [];
  const studentOrgsArray = typeof organizationsData !== 'undefined' ? organizationsData : [];
  
  // Initialize role filter (simple dropdown without search)
  roleFilter = new EnhancedMultiSelect('roleFilter',
    [
      { value: 'admin', label: 'Admin' },
      { value: 'unit', label: 'Unit' },
      { value: 'user', label: 'User' }
    ], 'Select Roles', false);
    
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
    const visibleRows = [];

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

      if (isVisible) {
        visibleRows.push(row);
      }
    });

    // Update pagination with filtered rows
    PaginationManager.currentPage = 1; // Reset to first page when filters change
    PaginationManager.updatePagination(visibleRows);
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
  PaginationManager.init();

  // Initialize pagination with all rows on page load
  const allRows = DOMCache.getAllRows();
  if (allRows.length > 0) {
    PaginationManager.updatePagination(allRows);
  }

  console.log('✅ All components initialized successfully');
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApplication);

// ========================================
// PAGINATION MANAGER
// ========================================
const PaginationManager = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  filteredRows: [],

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
  },

  updatePagination(rows) {
    this.filteredRows = rows;
    this.totalItems = rows.length;
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Show/hide pagination controls
    const paginationControls = document.getElementById('paginationControls');
    if (paginationControls) {
      paginationControls.style.display = this.totalItems > this.itemsPerPage ? 'flex' : 'none';
    }

    // Reset to page 1 if current page exceeds total pages
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    this.renderPage();
    this.renderPageNumbers(totalPages);
    this.updateButtons(totalPages);
  },

  renderPage() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    // Ensure all rows are hidden first (so previously-visible rows
    // that are not part of the current filtered set get hidden).
    const allRows = document.querySelectorAll('.grid-row');
    allRows.forEach(r => { r.style.display = 'none'; });

    // Show only rows for current page from the filtered set
    this.filteredRows.slice(startIndex, endIndex).forEach(row => {
      row.style.display = 'grid';
    });

    // Update results count and show/hide no-results client message
    const resultsCount = document.getElementById('resultsCount');
    const noResultsEl = document.getElementById('noResultsClient');
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.totalItems === 0) {
      if (noResultsEl) noResultsEl.style.display = 'block';
      if (resultsCount) resultsCount.textContent = `Showing 0 of 0 users`;
    } else {
      if (noResultsEl) noResultsEl.style.display = 'none';
      const displayedCount = Math.min(endIndex, this.totalItems) - startIndex;
      if (resultsCount) {
        if (totalPages > 0) {
          resultsCount.textContent = `Showing ${displayedCount} of ${this.totalItems} users (Page ${this.currentPage} of ${totalPages})`;
        } else {
          resultsCount.textContent = `Showing ${displayedCount} of ${this.totalItems} users`;
        }
      }
    }
  },

  renderPageNumbers(totalPages) {
    const paginationNumbers = document.getElementById('paginationNumbers');
    if (!paginationNumbers) return;

    paginationNumbers.innerHTML = '';

    // Always show first page
    if (totalPages > 0) {
      this.addPageButton(paginationNumbers, 1, totalPages);
    }

    // Show ellipsis and middle pages
    if (totalPages > 7) {
      if (this.currentPage > 3) {
        this.addEllipsis(paginationNumbers);
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        this.addPageButton(paginationNumbers, i, totalPages);
      }

      if (this.currentPage < totalPages - 2) {
        this.addEllipsis(paginationNumbers);
      }
    } else {
      // Show all pages if total is 7 or less
      for (let i = 2; i < totalPages; i++) {
        this.addPageButton(paginationNumbers, i, totalPages);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      this.addPageButton(paginationNumbers, totalPages, totalPages);
    }
  },

  addPageButton(container, pageNum, totalPages) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${pageNum === this.currentPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.addEventListener('click', () => this.goToPage(pageNum));
    container.appendChild(btn);
  },

  addEllipsis(container) {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'pagination-ellipsis';
    ellipsis.textContent = '...';
    container.appendChild(ellipsis);
  },

  updateButtons(totalPages) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
  },

  goToPage(pageNum) {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (pageNum < 1 || pageNum > totalPages) return;

    this.currentPage = pageNum;
    this.renderPage();
    this.renderPageNumbers(totalPages);
    this.updateButtons(totalPages);

    // Scroll to top of table
    const tableSection = document.querySelector('.table-section-wrapper');
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

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
    const visibleRows = [];

    gridRows.forEach(row => {
      const userStatus = row.dataset.status;
      const isVisible = filterStatus === 'all' || userStatus === filterStatus;
      if (isVisible) {
        visibleRows.push(row);
      }
    });

    // Update pagination with filtered rows
    PaginationManager.currentPage = 1; // Reset to first page
    PaginationManager.updatePagination(visibleRows);
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

// Toggle custom dropdown visibility
function toggleCustomDropdown() {
  const dropdown = document.getElementById('customDropdownOptions');
  const selectedDiv = document.querySelector('.dropdown-selected');
  
  if (!dropdown || !selectedDiv) return;
  
  const isVisible = dropdown.style.display === 'block';
  
  if (isVisible) {
    dropdown.style.display = 'none';
    selectedDiv.classList.remove('active');
  } else {
    dropdown.style.display = 'block';
    selectedDiv.classList.add('active');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.custom-role-dropdown');
  const dropdownOptions = document.getElementById('customDropdownOptions');
  const selectedDiv = document.querySelector('.dropdown-selected');
  
  if (dropdown && !dropdown.contains(event.target) && dropdownOptions) {
    dropdownOptions.style.display = 'none';
    if (selectedDiv) selectedDiv.classList.remove('active');
  }
});

// Make functions globally available
window.toggleCustomDropdown = toggleCustomDropdown;
window.selectCustomRole = selectCustomRole;

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
        let badgeText = newRole.charAt(0).toUpperCase() + newRole.slice(1).toLowerCase();
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
  
  // Prevent duplicate modals - check if already open
  if (confirmStatusModal.style.display === 'flex') {
    console.log('⚠️ Confirmation modal already open, ignoring duplicate call');
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
    ModalUtility.closeModal(confirmStatusModal);
  }
  
  // Confirm button - execute action
  newConfirmBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('✅ Modal confirm clicked - executing status change');
    closeModal();
    executeModalStatusChange(action, userId, buttonElement);
  };
  
  // Cancel and close buttons
  newCancelBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  };
  newCloseBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  };
  
  // Show modal
  ModalUtility.openModal(confirmStatusModal);
  
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
      
      // Show/Hide Administrative Controls based on approval status
      const adminControlsSection = document.getElementById('adminControlsSection');
      if (adminControlsSection) {
        if (newStatus === 'approved') {
          // Show Administrative Controls with smooth animation
          adminControlsSection.style.display = 'block';
          adminControlsSection.style.opacity = '0';
          adminControlsSection.style.transform = 'translateY(-10px)';
          
          setTimeout(() => {
            adminControlsSection.style.transition = 'all 0.4s ease';
            adminControlsSection.style.opacity = '1';
            adminControlsSection.style.transform = 'translateY(0)';
          }, 50);
          
          console.log('✅ Administrative Controls revealed');
        } else {
          // Hide Administrative Controls if not approved
          adminControlsSection.style.display = 'none';
          console.log('ℹ️ Administrative Controls hidden');
        }
      }
      
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
  ModalUtility.openModal(userModal());

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
// TRASH MODAL FUNCTIONS - Using Shared Module
// ========================================
// NOTE: Trash modal functionality is now handled by admin-trash-modal.js
// The shared module provides:
// - window.openTrashModal()
// - window.closeTrashModal()
// - window.openRestoreConfirm()
// - window.closeRestoreModal()
// - window.confirmRestore()
// - window.openPermanentDeleteConfirm()
// - window.closePermanentDeleteModal()
// - window.confirmPermanentDelete()

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
// USER EDIT AND DELETE FUNCTIONS
// ========================================

// ========================================
// OPEN EDIT MODE FOR USER MODAL
// ========================================
function openEditMode() {
  console.log('🔄 openEditMode called for user modal');
  
  // Get the user modal
  const userModal = document.getElementById('userModal');
  if (!userModal) {
    console.error('❌ User modal not found');
    return;
  }
  
  // Switch to edit mode by showing/hiding sections
  const viewSections = document.querySelectorAll('.user-info-section, .user-admin-form-section');
  const editSections = document.querySelectorAll('.user-admin-form-section');
  
  // Show edit controls and hide view-only sections
  viewSections.forEach(section => {
    if (!section.classList.contains('user-admin-form-section')) {
      section.style.display = 'none';
    }
  });
  
  // Make sure admin controls are visible
  const adminControls = document.getElementById('adminControlsSection');
  if (adminControls) {
    adminControls.style.display = 'block';
  }
  
  // Update modal title to indicate edit mode
  const modalTitle = document.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Edit User Profile
    `;
  }
  
  // Update action buttons
  const cancelBtn = document.getElementById('cancelUpdateBtn');
  const saveBtn = document.querySelector('.user-admin-btn.user-admin-btn-primary');
  
  if (cancelBtn) {
    cancelBtn.textContent = 'Cancel Edit';
    cancelBtn.onclick = closeEditMode;
  }
  
  if (saveBtn) {
    saveBtn.textContent = 'Save Changes';
  }
  
  // Scroll to the edit form
  const modalBody = document.querySelector('.user-details-modal-body');
  if (modalBody) {
    setTimeout(() => {
      modalBody.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
  
  console.log('✅ User modal switched to edit mode');
}

// ========================================
// CLOSE EDIT MODE FOR USER MODAL
// ========================================
function closeEditMode() {
  console.log('🔄 closeEditMode called for user modal');
  
  // Reset modal title
  const modalTitle = document.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      User Profile Management
    `;
  }
  
  // Reset action buttons
  const cancelBtn = document.getElementById('cancelUpdateBtn');
  const saveBtn = document.querySelector('.user-admin-btn.user-admin-btn-primary');
  
  if (cancelBtn) {
    cancelBtn.textContent = 'Cancel Changes';
    cancelBtn.onclick = () => {
      document.getElementById('userModal').style.display = 'none';
    };
  }
  
  if (saveBtn) {
    saveBtn.textContent = 'Save Changes';
  }
  
  console.log('✅ User modal edit mode closed');
}

// ========================================
// OPEN DELETE CONFIRMATION FOR USER
// ========================================
function openDeleteConfirm() {
  console.log('🗑️ openDeleteConfirm called for user');
  
  // Get current user ID from the modal
  const userId = document.getElementById('editUserId')?.value;
  const userName = document.getElementById('viewFullName')?.textContent;
  
  if (!userId) {
    console.error('❌ No user ID found for deletion');
    showToast('Error', 'No user selected for deletion', 'error');
    return;
  }
  
  // Create or show delete confirmation modal
  let deleteModal = document.getElementById('userDeleteConfirmModal');
  
  if (!deleteModal) {
    // Create the modal if it doesn't exist
    deleteModal = document.createElement('div');
    deleteModal.id = 'userDeleteConfirmModal';
    deleteModal.className = 'confirmation-modal';
    deleteModal.innerHTML = `
      <div class="confirmation-modal-content">
        <div class="confirmation-header" style="background-color: #dc2626; color: white;">
          <h3>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Delete User
          </h3>
          <button class="modal-close" onclick="closeUserDeleteConfirm()">✕</button>
        </div>
        <div class="confirmation-body">
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-size: 0.95rem;">
              <strong>Warning:</strong> This action will move the user to trash. The user will be hidden from active views but can be restored later.
            </p>
          </div>
          <p>Are you sure you want to delete this user?</p>
          <div class="confirmation-actions" style="margin-top: 24px;">
            <button class="btn-cancel" onclick="closeUserDeleteConfirm()">Cancel</button>
            <button class="btn-danger" onclick="confirmUserDelete()">Delete User</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(deleteModal);
    
    // Add event listeners for backdrop click
    deleteModal.addEventListener('click', function(e) {
      if (e.target === deleteModal) {
        closeUserDeleteConfirm();
      }
    });
  }
  
  // Update modal content (no dynamic content needed)
  
  // Store user ID for deletion
  deleteModal.dataset.userId = userId;
  
  // Show modal
  ModalUtility.openModal(deleteModal);
  
  console.log('✅ User delete confirmation modal shown');
}

// ========================================
// CLOSE DELETE CONFIRMATION MODAL
// ========================================
function closeUserDeleteConfirm() {
  const deleteModal = document.getElementById('userDeleteConfirmModal');
  if (deleteModal) {
    ModalUtility.closeModal(deleteModal);
  }
}

// ========================================
// CONFIRM USER DELETION
// ========================================
async function confirmUserDelete() {
  const deleteModal = document.getElementById('userDeleteConfirmModal');
  const userId = deleteModal?.dataset.userId;
  
  if (!userId) {
    console.error('❌ No user ID found for deletion');
    showToast('Error', 'No user selected', 'error');
    return;
  }
  
  try {
    console.log('🗑️ Deleting user:', userId);
    
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ User deleted successfully');
      
      // Close modals
      closeUserDeleteConfirm();
      document.getElementById('userModal').style.display = 'none';
      
      // Remove user from grid
      const userRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
      if (userRow) {
        userRow.remove();
        
        // Update results count
        const remainingRows = document.querySelectorAll('.grid-row');
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
          const totalRows = remainingRows.length;
          resultsCount.textContent = `Showing ${totalRows} users`;
        }
      }
      
      showToast('Success', 'User moved to trash successfully', 'success');
    } else {
      console.error('❌ Failed to delete user:', result.message);
      showToast('Error', result.message || 'Failed to delete user', 'error');
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    showToast('Error', 'Network error while deleting user', 'error');
  }
}

// ========================================
// DELETE SELECTED USERS FUNCTION
// ========================================
async function deleteSelectedUsers() {
  // Get all selected checkboxes
  const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    showToast('No Selection', 'Please select at least one user to delete.', 'info');
    return;
  }

  // Collect user IDs
  const userIds = Array.from(selectedCheckboxes).map(cb => cb.value);
  
  // Show confirmation dialog
  const confirmed = confirm(`Are you sure you want to delete ${userIds.length} selected user(s)? This action cannot be undone.`);
  
  if (!confirmed) {
    return;
  }

  try {
    // Show loading state
    const trashBtn = document.getElementById('trashBtn');
    const originalText = trashBtn.innerHTML;
    trashBtn.disabled = true;
    trashBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Deleting...';

    const response = await fetch('/api/admin/delete-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds })
    });

    const result = await response.json();

    if (result.success) {
      // Remove deleted users from the grid
      userIds.forEach(userId => {
        const row = document.querySelector(`.grid-row[data-id="${userId}"]`);
        if (row) {
          row.remove();
        }
      });

      // Update results count
      const remainingRows = document.querySelectorAll('.grid-row');
      const resultsCount = document.getElementById('resultsCount');
      if (resultsCount) {
        resultsCount.textContent = `Showing ${remainingRows.length} users`;
      }

      // Reset select all checkbox
      const selectAllCheckbox = document.getElementById('selectAllUsers');
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
      }

      showToast('Success', `Successfully deleted ${userIds.length} user(s).`, 'success');
    } else {
      throw new Error(result.message || 'Failed to delete users');
    }

  } catch (error) {
    console.error('Error deleting users:', error);
    showToast('Error', 'Failed to delete selected users. Please try again.', 'error');
  } finally {
    // Reset button state
    const trashBtn = document.getElementById('trashBtn');
    trashBtn.disabled = false;
    trashBtn.innerHTML = originalText;
  }
}

// ========================================
// SELECT ALL USERS FUNCTION
// ========================================
function selectAllUsers() {
  const selectAllCheckbox = document.getElementById('selectAllUsers');
  const userCheckboxes = document.querySelectorAll('.user-checkbox');
  
  userCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });
}

// ========================================
// SETUP SELECT ALL EVENT LISTENER
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  const selectAllCheckbox = document.getElementById('selectAllUsers');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', selectAllUsers);
  }
});

// ========================================
// EDIT USER MODAL FUNCTIONS
// ========================================

// Global variable to store current user data
let currentEditingUser = null;

/**
 * Opens the edit user modal and populates it with current user data
 */
function openEditUserModal() {
  const editModal = document.getElementById('editUserModal');
  if (!editModal) {
    console.error('Edit user modal not found');
    return;
  }

  // Get current user data from the user details modal
  const userId = document.getElementById('viewUserId')?.textContent;
  const fullName = document.getElementById('viewFullName')?.textContent || '';
  const username = document.getElementById('viewUsername')?.textContent;
  const email = document.getElementById('viewEmail')?.textContent;
  const phone = document.getElementById('viewPhone')?.textContent || '';
  const userType = document.getElementById('viewUserType')?.textContent?.toLowerCase() || '';
  const cys = document.getElementById('viewCys')?.textContent || '';
  
  // Get organization data from the original grid row (not from modal display)
  const currentRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
  let organizationArray = [];
  
  if (currentRow) {
    if (userType === 'student') {
      // For students, get from studentorg data attribute
      const studentOrg = currentRow.dataset.studentorg || '';
      organizationArray = studentOrg.split('||').filter(Boolean);
    } else {
      // For non-students, get from affiliation data attribute
      const affiliation = currentRow.dataset.affiliation || '';
      organizationArray = affiliation.split('||').filter(Boolean);
    }
  }

  // Parse full name
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

  // Store current user data
  currentEditingUser = {
    userId,
    fName: firstName,
    mName: middleName,
    lName: lastName,
    username,
    email,
    phoneNumber: phone,
    userType,
    cys,
    organizationArray
  };
  
  console.log('📋 Opening edit modal with organizations:', organizationArray);

  // Populate form fields
  document.getElementById('editUserFormId').value = userId;
  document.getElementById('editFirstName').value = firstName;
  document.getElementById('editMiddleName').value = middleName;
  document.getElementById('editLastName').value = lastName;
  document.getElementById('editUsername').value = username;
  document.getElementById('editEmail').value = email;
  document.getElementById('editPhone').value = phone;

  // Handle student-specific fields
  const cysGroup = document.getElementById('editCysGroup');
  if (userType === 'student') {
    if (cysGroup) cysGroup.style.display = 'block';
    document.getElementById('editCys').value = cys;
  } else {
    if (cysGroup) cysGroup.style.display = 'none';
  }

  // Handle organization field
  const editOrgSelect = document.getElementById('editOrganization');
  if (editOrgSelect && window.jQuery && jQuery.fn.select2) {
    // Destroy existing Select2 instance if it exists
    if (jQuery(editOrgSelect).hasClass('select2-hidden-accessible')) {
      jQuery(editOrgSelect).select2('destroy');
    }

    // Determine which data source to use based on user type
    let dataSource = [];
    if (userType === 'student') {
      // Use organizationsData for students (student organizations)
      dataSource = organizationsData || [];
    } else {
      // Use officesData for non-students (offices/departments)
      dataSource = officesData || [];
    }

    console.log('🔧 Initializing Select2 with data source:', dataSource);
    console.log('📝 Current user organizations to select:', organizationArray);

    // Initialize Select2 with appropriate data
    jQuery(editOrgSelect).select2({
      placeholder: userType === 'student' ? 'Select organization(s)' : 'Select office(s)/department(s)',
      allowClear: true,
      width: '100%',
      data: dataSource,
      tags: false
    });

    // Set selected values using the array from data attributes
    if (organizationArray && organizationArray.length > 0) {
      console.log('✅ Setting Select2 values:', organizationArray);
      jQuery(editOrgSelect).val(organizationArray).trigger('change');
    } else {
      console.log('ℹ️ No organizations to pre-select');
      jQuery(editOrgSelect).val(null).trigger('change');
    }
  }

  // Update organization label based on user type
  const editOrgLabel = document.getElementById('editOrgLabel');
  if (editOrgLabel) {
    if (userType === 'student') {
      editOrgLabel.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Student Organization
      `;
    } else {
      editOrgLabel.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
        </svg>
        Office/Department
      `;
    }
  }

  // Open the modal
  ModalUtility.openModal(editModal);
}

/**
 * Closes the edit user modal
 */
function closeEditUserModal() {
  const editModal = document.getElementById('editUserModal');
  if (editModal) {
    ModalUtility.closeModal(editModal);
    currentEditingUser = null;
  }
}

/**
 * Saves the changes made to user information
 */
async function saveUserChanges() {
  const form = document.getElementById('editUserForm');
  if (!form) {
    console.error('Edit user form not found');
    return;
  }

  // Validate required fields
  const firstName = document.getElementById('editFirstName').value.trim();
  const lastName = document.getElementById('editLastName').value.trim();
  const username = document.getElementById('editUsername').value.trim();
  const email = document.getElementById('editEmail').value.trim();

  if (!firstName || !lastName || !username || !email) {
    showToast('Validation Error', 'Please fill in all required fields.', 'error');
    return;
  }

  // Get form data
  const userId = document.getElementById('editUserFormId').value;
  const middleName = document.getElementById('editMiddleName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const cys = document.getElementById('editCys')?.value.trim() || '';
  
  // Get organization values
  const editOrgSelect = document.getElementById('editOrganization');
  let organizations = [];
  if (editOrgSelect && window.jQuery && jQuery.fn.select2) {
    organizations = jQuery(editOrgSelect).val() || [];
  }

  const updateData = {
    userId,
    fName: firstName,
    mName: middleName,
    lName: lastName,
    username,
    email,
    phoneNumber: phone,
    cys,
    organization: organizations
  };

  // Show loading state
  const saveBtn = document.querySelector('#editUserModal .modal-btn-primary');
  const originalBtnText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    Saving...
  `;

  try {
    const response = await fetch('/admin/user/update-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Update the user details modal
      document.getElementById('viewFullName').textContent = `${firstName} ${middleName} ${lastName}`.trim().replace(/\s+/g, ' ');
      document.getElementById('viewUsername').textContent = username;
      document.getElementById('viewEmail').textContent = email;
      document.getElementById('viewPhone').textContent = phone || 'Not provided';
      
      if (cys) {
        document.getElementById('viewCys').textContent = cys;
      }
      
      // Update organization display in view modal
      const orgContainer = document.getElementById('viewOrganizationContainer');
      if (organizations.length > 0) {
        orgContainer.innerHTML = '<div class="org-tags-container">' +
          organizations.map(org => `<span class="org-tag">${org}</span>`).join('') +
          '</div>';
      } else {
        orgContainer.innerHTML = `<span class="no-organizations">${currentEditingUser.userType === 'student' ? 'No organizations' : 'No affiliation'}</span>`;
      }

      // Update the grid row
      const gridRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
      if (gridRow) {
        gridRow.dataset.fname = firstName;
        gridRow.dataset.mname = middleName;
        gridRow.dataset.lname = lastName;
        gridRow.dataset.username = username;
        gridRow.dataset.email = email;
        gridRow.dataset.cys = cys;
        
        // Update organizations with || separator for proper data storage
        const userType = currentEditingUser.userType;
        if (userType === 'student') {
          gridRow.dataset.studentorg = organizations.join('||');
        } else {
          gridRow.dataset.affiliation = organizations.join('||');
        }

        // Update visible text in grid
        const nameCell = gridRow.querySelector('.cell-name');
        if (nameCell) {
          nameCell.textContent = `${firstName} ${middleName} ${lastName}`.trim().replace(/\s+/g, ' ');
        }

        const usernameCell = gridRow.querySelector('.cell-username');
        if (usernameCell) {
          usernameCell.textContent = username;
        }

        const emailCell = gridRow.querySelector('.cell-email');
        if (emailCell) {
          emailCell.textContent = email;
        }
      }

      showToast('Success', 'User information updated successfully!', 'success');
      closeEditUserModal();
    } else {
      throw new Error(result.message || 'Update failed');
    }
  } catch (error) {
    console.error('Error updating user info:', error);
    showToast('Error', `Failed to update user information: ${error.message}`, 'error');
  } finally {
    // Reset button
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalBtnText;
  }
}

// Make functions globally available
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveUserChanges = saveUserChanges;

// ========================================
// CREATE USER MODAL FUNCTIONALITY
// ========================================
const CreateUserModal = {
  modal: null,
  openBtn: null,
  closeBtn: null,
  cancelBtn: null,
  form: null,
  userTypeSelect: null,
  studentFields: null,
  nonStudentFields: null,

  init() {
    this.modal = document.getElementById('createUserModal');
    this.openBtn = document.getElementById('openCreateUserModalBtn');
    this.closeBtn = document.getElementById('closeCreateUserModal');
    this.cancelBtn = document.getElementById('cancelCreateUser');
    this.form = document.getElementById('createUserForm');
    this.userTypeSelect = document.getElementById('createUserType');
    this.studentFields = document.getElementById('createStudentFields');
    this.nonStudentFields = document.getElementById('createNonStudentFields');

    if (!this.modal || !this.openBtn || !this.form) {
      console.error('❌ Required elements not found for Create User Modal');
      return;
    }

    this.setupEventListeners();
  },

  initializeSelect2() {
    // Initialize Select2 only when modal is opened and DOM is ready
    if (typeof $ !== 'undefined') {
      try {
        // Check if Select2 is already initialized and destroy if so
        const $studentOrg = $('#createStudentOrg');
        const $affiliation = $('#createAffiliation');
        
        if ($studentOrg.hasClass('select2-hidden-accessible')) {
          $studentOrg.select2('destroy');
        }
        if ($affiliation.hasClass('select2-hidden-accessible')) {
          $affiliation.select2('destroy');
        }
        
        // Initialize fresh Select2 instances
        $studentOrg.select2({
          placeholder: 'Select student organizations...',
          dropdownParent: $('#createUserModal'),
          width: '100%',
          allowClear: true
        });
        
        $affiliation.select2({
          placeholder: 'Select offices/departments...',
          dropdownParent: $('#createUserModal'),
          width: '100%',
          allowClear: true
        });
      } catch (error) {
        console.error('Select2 initialization error:', error);
      }
    }
  },

  setupEventListeners() {
    // Open modal
    if (this.openBtn) {
      this.openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    }

    // Close modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.closeModal());
    }

    // Close on background click
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Toggle user type specific fields
    if (this.userTypeSelect) {
      this.userTypeSelect.addEventListener('change', () => this.toggleUserTypeFields());
    }

    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  },

  openModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      
      // Initialize Select2 after modal is visible and DOM is ready
      setTimeout(() => {
        this.initializeSelect2();
      }, 100);
    }
  },

  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.form.reset();
      
      // Destroy Select2 instances on close (only if they exist)
      if (typeof $ !== 'undefined') {
        try {
          const $studentOrg = $('#createStudentOrg');
          const $affiliation = $('#createAffiliation');
          
          if ($studentOrg.hasClass('select2-hidden-accessible')) {
            $studentOrg.select2('destroy');
          }
          if ($affiliation.hasClass('select2-hidden-accessible')) {
            $affiliation.select2('destroy');
          }
        } catch (e) {
          console.log('Select2 cleanup skipped:', e.message);
        }
      }
      
      this.studentFields.style.display = 'none';
      this.nonStudentFields.style.display = 'none';
    }
  },

  toggleUserTypeFields() {
    const userType = this.userTypeSelect.value;
    
    if (userType === 'student') {
      this.studentFields.style.display = 'block';
      this.nonStudentFields.style.display = 'none';
    } else if (userType === 'nonstudent') {
      this.studentFields.style.display = 'none';
      this.nonStudentFields.style.display = 'block';
    } else {
      this.studentFields.style.display = 'none';
      this.nonStudentFields.style.display = 'none';
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitCreateUser');
    const originalText = submitBtn.innerHTML;
    
    // Validate email
    const email = document.getElementById('userEmail').value.trim();
    if (!email || !email.endsWith('@dlsud.edu.ph')) {
      NotificationManager.showNotificationPersistent('Email must be a valid @dlsud.edu.ph address', 'error');
      return;
    }
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>Sending...';
    
    try {
      // Prepare form data
      const formData = {
        email: email,
        firstName: document.getElementById('userFirstName').value.trim(),
        lastName: document.getElementById('userLastName').value.trim(),
        middleName: document.getElementById('userMiddleName').value.trim(),
        phoneNumber: document.getElementById('userPhoneNumber').value.trim(),
        userType: this.userTypeSelect.value
      };
      
      // Add student-specific fields
      if (this.userTypeSelect.value === 'student') {
        formData.studentId = document.getElementById('createStudentId').value.trim();
        formData.cys = document.getElementById('createCYS').value.trim().toUpperCase();
        formData.studentOrganization = $('#createStudentOrg').val() || [];
      }
      
      // Add non-student fields
      if (this.userTypeSelect.value === 'nonstudent') {
        formData.affiliation = $('#createAffiliation').val() || [];
      }
      
      // Send request
      const response = await fetch('/admin/user/create-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show different messages based on whether email was actually sent
        if (result.emailError) {
          // Email failed to send - show error with link
          console.error('Email failed to send:', result.emailError);
          console.log('Invitation link:', result.invitationLink);
          
          NotificationManager.showNotificationPersistent(
            `<strong>⚠️ Invitation Created - Email Failed</strong><br><br>` +
            `User invitation was created successfully, but the email could not be sent.<br><br>` +
            `<strong>Error:</strong> ${result.emailError}<br><br>` +
            `<strong>Possible reasons:</strong><br>` +
            `• Gmail blocking emails to @dlsud.edu.ph domain<br>` +
            `• Recipient's spam filters blocking the email<br>` +
            `• Domain restrictions on external emails<br><br>` +
            `<strong>Share this registration link with the user:</strong><br>` +
            `<input type="text" value="${result.invitationLink}" readonly onclick="this.select()" style="width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; background: #f9fafb;"><br>` +
            `<a href="${result.invitationLink}" target="_blank" style="color: #1a5d1a; font-weight: 600; text-decoration: underline;">📧 Open Registration Link</a><br><br>` +
            `<small style="color: #6b7280;">Link also logged in console. Valid for 7 days.</small>`,
            'error'
          );
        } else if (result.devMode) {
          // Development mode - email not sent
          console.log('Invitation link (DEV MODE):', result.invitationLink);
          
          NotificationManager.showNotificationPersistent(
            `<strong>⚠️ Invitation Created (DEV MODE - Email Not Sent)</strong><br><br>` +
            `The SMTP email service is not configured or not working.<br><br>` +
            `<strong>Share this registration link with the user:</strong><br>` +
            `<input type="text" value="${result.invitationLink}" readonly onclick="this.select()" style="width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; background: #f9fafb;"><br>` +
            `<a href="${result.invitationLink}" target="_blank" style="color: #1a5d1a; font-weight: 600; text-decoration: underline;">📧 Open Registration Link</a><br><br>` +
            `<small style="color: #6b7280;">Link also logged in browser & server console</small>`,
            'info'
          );
        } else if (result.emailSent) {
          // Production mode - email sent successfully
          NotificationManager.showToast('Success', result.message || 'Invitation email sent successfully!', 'success');
        }
        
        this.closeModal();
        
        // Reload page after delay (longer for error/dev mode messages)
        setTimeout(() => {
          window.location.reload();
        }, (result.emailError || result.devMode) ? 8000 : 1500);
      } else {
        NotificationManager.showNotificationPersistent(result.message || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      NotificationManager.showNotificationPersistent('An error occurred. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
};

// Initialize Create User Modal on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  CreateUserModal.init();
});
