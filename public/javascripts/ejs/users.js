// ========================================
// USERS PAGE JAVASCRIPT
// File: public/javascripts/ejs/users.js
// Purpose: JavaScript functionality for the admin users management page
// ========================================

// ========================================
// DOM ELEMENTS
// ========================================
const userModal = document.getElementById("userModal");
const closeUserModal = document.getElementById("closeUserModal");
const cancelUpdateBtn = document.getElementById("cancelUpdateBtn");
const clearFiltersBtn = document.getElementById("clearFilters");
const allRows = Array.from(document.querySelectorAll('.grid-row'));

// Confirmation Modal Elements
const confirmStatusModal = document.getElementById("confirmStatusModal");
const closeConfirmModal = document.getElementById("closeConfirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");

// ========================================
// MODAL HANDLERS
// ========================================
closeUserModal.onclick = () => {
  userModal.style.display = 'none';
  document.body.style.overflow = '';
};
cancelUpdateBtn.onclick = () => {
  userModal.style.display = 'none';
  document.body.style.overflow = '';
};

// Confirmation modal close handlers
closeConfirmModal.onclick = () => {
  confirmStatusModal.style.display = 'none';
  document.body.style.overflow = '';
};
cancelConfirmBtn.onclick = () => {
  confirmStatusModal.style.display = 'none';
  document.body.style.overflow = '';
};

window.onclick = e => {
  if (e.target === userModal) {
    userModal.style.display = 'none';
    document.body.style.overflow = '';
  }
  if (e.target === confirmStatusModal) {
    confirmStatusModal.style.display = 'none';
    document.body.style.overflow = '';
  }
  // Close trash modal when clicking outside
  const trashModal = document.getElementById('trashModal');
  if (e.target === trashModal) {
    closeTrashModal();
  }
  // Close restore confirm modal when clicking outside
  const restoreModal = document.getElementById('restoreConfirmModal');
  if (e.target === restoreModal) {
    closeRestoreConfirm();
  }
  // Close permanent delete modal when clicking outside
  const deleteModal = document.getElementById('permanentDeleteConfirmModal');
  if (e.target === deleteModal) {
    closePermanentDeleteConfirm();
  }
};

// ========================================
// TOAST NOTIFICATION FUNCTION
// ========================================
function showToast(title, message, type = 'success') {
  // Get or create toast container
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'success'
    ? '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>'
    : type === 'error'
    ? '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    : '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================
function showNotificationPersistent(message, type = 'success') {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    backdrop-filter: blur(4px);
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 20px;
    padding: 0;
    max-width: 520px;
    width: 90%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  `;

  let headerColor;
  switch(type) {
    case 'success':
      headerColor = 'linear-gradient(135deg, var(--primary-green), #20c997)';
      break;
    case 'error':
      headerColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
      break;
    case 'info':
    default:
      headerColor = 'linear-gradient(135deg, #3b82f6, #2563eb)';
      break;
  }

  modal.innerHTML = `
    <div style="background: ${headerColor}; color: white; padding: 2rem; text-align: center;">
      <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">
        ${type === 'success' ? 'Update Successful!' : type === 'error' ? 'Update Failed!' : 'Information'}
      </h3>
    </div>
    <div style="padding: 2rem; text-align: center;">
      <p style="margin: 0 0 2rem 0; font-size: 1.1rem; color: #374151; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="persistentNotificationOkBtn" style="
          background: ${headerColor};
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        ">Got it!</button>
        ${type === 'success' ? `
        <button id="persistentNotificationRefreshBtn" style="
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
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

  function closeModal() {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    document.body.style.overflow = '';
  }

  okBtn.addEventListener('click', closeModal);

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  document.body.style.overflow = 'hidden';
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
// FILTER FUNCTIONS
// ========================================
function filterUsers() {
  const userIdValue = document.getElementById('userIdFilter').value.toLowerCase();
  const nameValue = document.getElementById('nameFilter').value.toLowerCase();
  const usernameValue = document.getElementById('usernameFilter').value.toLowerCase();
  const emailValue = document.getElementById('emailFilter').value.toLowerCase();
  const cysValue = document.getElementById('cysFilter').value.toLowerCase();

  let visibleCount = 0;

  allRows.forEach(row => {
    const userId = row.dataset.id; // Get the user ID for matching action row
    const rowUserId = row.dataset.userId.toLowerCase();
    const rowFullname = `${row.dataset.fname} ${row.dataset.mname} ${row.dataset.lname}`.toLowerCase();
    const rowUsername = row.dataset.username.toLowerCase();
    const rowEmail = row.dataset.email.toLowerCase();
    const rowCys = row.dataset.cys.toLowerCase();
    const rowRole = (row.dataset.role || '').toLowerCase();
    const rowAffiliation = (row.dataset.affiliation || '').toLowerCase();
    const rowStudentOrg = (row.dataset.studentorg || '').toLowerCase();

    const userIdMatch = userIdValue === '' || rowUserId.includes(userIdValue);
    const nameMatch = nameValue === '' || rowFullname.includes(nameValue);
    const usernameMatch = usernameValue === '' || rowUsername.includes(usernameValue);
    const emailMatch = emailValue === '' || rowEmail.includes(emailValue);
    const cysMatch = cysValue === '' || rowCys.includes(cysValue);

    // Multi-select matching for roles using EnhancedMultiSelect
    let roleMatch = true;
    if (roleFilter && roleFilter.selectedValues) {
      const selectedRoles = roleFilter.getSelectedValues();
      if (!selectedRoles.includes('all')) {
        roleMatch = selectedRoles.includes(rowRole);
      }
    }

    // Multi-select matching for affiliations using EnhancedMultiSelect
    let affiliationMatch = true;
    if (affiliationFilter && affiliationFilter.selectedValues) {
      const selectedAffs = affiliationFilter.getSelectedValues();
      if (!selectedAffs.includes('all')) {
        affiliationMatch = selectedAffs.some(aff => rowAffiliation.includes(aff.toLowerCase()));
      }
    }

    // Multi-select matching for student orgs using EnhancedMultiSelect
    let studentOrgMatch = true;
    if (studentOrgFilter && studentOrgFilter.selectedValues) {
      const selectedOrgs = studentOrgFilter.getSelectedValues();
      if (!selectedOrgs.includes('all')) {
        studentOrgMatch = selectedOrgs.some(org => rowStudentOrg.includes(org.toLowerCase()));
      }
    }

    const isVisible = userIdMatch && nameMatch && usernameMatch && emailMatch && cysMatch && roleMatch && affiliationMatch && studentOrgMatch;
    
    // Update grid row visibility
    row.style.display = isVisible ? 'grid' : 'none';

    if (isVisible) visibleCount++;
  });

  const totalCount = allRows.length;
  const resultsCount = document.getElementById('resultsCount');
  if (visibleCount === totalCount) {
    resultsCount.textContent = `Showing all ${totalCount} users`;
  } else {
    resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} users`;
  }
}

// ========================================
// FILTER EVENT LISTENERS
// ========================================
document.getElementById('userIdFilter').addEventListener('input', filterUsers);
document.getElementById('nameFilter').addEventListener('input', filterUsers);
document.getElementById('usernameFilter').addEventListener('input', filterUsers);
document.getElementById('emailFilter').addEventListener('input', filterUsers);
document.getElementById('cysFilter').addEventListener('input', filterUsers);

clearFiltersBtn.addEventListener('click', () => {
  document.getElementById('userIdFilter').value = '';
  document.getElementById('nameFilter').value = '';
  document.getElementById('usernameFilter').value = '';
  document.getElementById('emailFilter').value = '';
  document.getElementById('cysFilter').value = '';

  // Reset EnhancedMultiSelect dropdowns
  if (roleFilter) {
    roleFilter.reset();
  }
  if (affiliationFilter) {
    affiliationFilter.reset();
  }
  if (studentOrgFilter) {
    studentOrgFilter.reset();
  }

  filterUsers();
});

// ========================================
// STATUS TAB FILTERING
// ========================================
document.querySelectorAll('.status-tab').forEach(tab => {
  tab.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Remove active class from all tabs
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    
    // Add active class to clicked tab
    this.classList.add('active');
    
    // Get the status to filter by
    const filterStatus = this.dataset.status;
    
    // Get all grid rows
    const gridRows = document.querySelectorAll('.grid-row');
    
    gridRows.forEach(row => {
      const userStatus = row.dataset.status;
      
      if (filterStatus === 'all' || userStatus === filterStatus) {
        row.style.display = 'grid';
      } else {
        row.style.display = 'none';
      }
    });
    
    // Update results count
    const visibleRows = Array.from(gridRows).filter(row => row.style.display !== 'none');
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `Showing ${visibleRows.length} of ${gridRows.length} users`;
    }
  });
});

// ========================================
// ROLE MANAGEMENT FUNCTIONS
// ========================================
function updateCurrentRoleDisplay(role) {
  const currentRoleDisplay = document.getElementById('currentRoleDisplay');
  if (currentRoleDisplay) {
    const roleNames = {
      'admin': 'Administrator',
      'unit': 'Unit Member',
      'user': 'Standard User'
    };
    currentRoleDisplay.textContent = roleNames[role] || 'Standard User';
  }
}

function toggleCustomDropdown() {
  const dropdown = document.getElementById('customDropdownOptions');
  const selected = document.querySelector('.dropdown-selected');

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    dropdown.style.display = 'block';
    selected.classList.add('active');
  } else {
    dropdown.style.display = 'none';
    selected.classList.remove('active');
  }
}

function selectCustomRole(value, text) {
  document.getElementById('editRole').value = value;
  document.getElementById('selectedRoleText').textContent = text;
  document.getElementById('customDropdownOptions').style.display = 'none';
  document.querySelector('.dropdown-selected').classList.remove('active');
  updateCurrentRoleDisplay(value);

  // Show/hide unit team assignment dropdown based on role
  const unitContainer = document.getElementById('unitAssignmentContainer');
  if (value === 'unit') {
    unitContainer.style.display = 'block';
  } else {
    unitContainer.style.display = 'none';
    document.getElementById('editUnitTeam').value = 'N/A'; // Reset if role is not 'unit'
  }

  const changeEvent = new Event('change');
  document.getElementById('editRole').dispatchEvent(changeEvent);
}

// ========================================
// FORM SUBMISSION
// ========================================
document.getElementById('userUpdateForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  // Get role change information
  const newRole = document.getElementById('editRole').value;
  const userName = document.getElementById('viewFullName').textContent;
  const userId = document.getElementById('editUserId').value;
  const newUnitTeam = document.getElementById('editUnitTeam').value;

  const requestData = {
    userId: userId,
    role: newRole,
    unitTeam: newUnitTeam
  };

  fetch(this.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = originalText;

      // Update custom dropdown display with the new role
      const roleTextMap = {
        'user': 'Requestor (User) - Submits requests',
        'unit': 'Unit Member - Works on tasks',
        'admin': 'Administrator - Full System Access'
      };
      const roleText = roleTextMap[newRole] || roleTextMap['user'];
      document.getElementById('selectedRoleText').textContent = roleText;
      
      // Update current role display
      const roleNames = {
        'admin': 'Administrator',
        'unit': 'Unit Member',
        'user': 'Standard User'
      };
      const currentRoleDisplay = document.getElementById('currentRoleDisplay');
      if (currentRoleDisplay) {
        currentRoleDisplay.textContent = roleNames[newRole] || 'Standard User';
      }

      // Update the row in the grid
      const currentRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
      if (currentRow) {
        currentRow.dataset.role = newRole;
        currentRow.dataset.unitteam = newUnitTeam;
        
        // Update the role badge in the grid
        const roleBadge = currentRow.querySelector('.role-badge');
        if (roleBadge) {
          // Remove old classes
          roleBadge.classList.remove('role-admin', 'role-unit', 'role-user');
          // Add new class
          roleBadge.classList.add(`role-${newRole}`);
          // Update text
          let badgeText = newRole.toUpperCase();
          if (newRole === 'unit' && newUnitTeam && newUnitTeam !== 'N/A') {
            badgeText += ` - ${newUnitTeam}`;
          }
          roleBadge.textContent = badgeText;
        }
      }

      // Show success toast
      const unitInfo = (newRole === 'unit' && newUnitTeam && newUnitTeam !== 'N/A') 
        ? ` (${newUnitTeam})` 
        : '';
      showToast('Success', `${userName}'s role updated to ${roleNames[newRole]}${unitInfo}`, 'success');

      // Scroll to top of modal to see personal information
      const modalBody = document.querySelector('.user-details-modal-body');
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      throw new Error(data.message || 'Update failed');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showToast('Error', `Failed to update ${userName}'s role`, 'error');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.innerHTML = originalText;
  });
});

// ========================================
// EVENT LISTENERS
// ========================================
// Header Dropdown Manager
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
  if (!toggle.contains(event.target)) {
    headerDropdown.close();
  }

  // Close custom dropdown when clicking outside
  const dropdown = document.getElementById('customRoleDropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    document.getElementById('customDropdownOptions').style.display = 'none';
    document.querySelector('.dropdown-selected').classList.remove('active');
  }
});

// Role field highlighting
document.addEventListener('DOMContentLoaded', function() {
  const roleField = document.getElementById('editRole');
  if (roleField) {
    roleField.addEventListener('change', function() {
      const warning = document.querySelector('.role-update-warning');
      if (this.value === 'admin') {
        warning.style.background = 'rgba(239, 68, 68, 0.1)';
        warning.style.borderLeftColor = '#ef4444';
        warning.style.color = '#991b1b';
        warning.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.5rem; vertical-align: text-top;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <strong>Critical:</strong> This user will gain FULL ADMINISTRATIVE ACCESS including the ability to manage all users, approve/reject requests, and access sensitive system functions.
        `;
      } else {
        warning.style.background = 'rgba(245, 158, 11, 0.1)';
        warning.style.borderLeftColor = '#f59e0b';
        warning.style.color = '#92400e';
        warning.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; margin-right: 0.5rem; vertical-align: text-top;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <strong>Important:</strong> This user will have standard access permissions for submitting and viewing their own requests only.
        `;
      }
    });
  }
});

// Sidebar hover effect
const sidebar = document.getElementById('adminSidebar');
if (sidebar) {
  sidebar.addEventListener('mouseenter', function() {
    this.classList.add('expanded');
  });
  sidebar.addEventListener('mouseleave', function() {
    this.classList.remove('expanded');
  });
}

// Mobile hamburger menu toggle
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Setup
  const menuToggle = document.getElementById('adminMenuToggle');
  const sidebarEl = document.getElementById('adminSidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  let touchStartX = 0;
  let touchEndX = 0;

  // Initialize Mobile Navigation
  function initMobileNavigation() {
    if (menuToggle && sidebarEl && mobileOverlay) {
      // Toggle menu on button click
      menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu(true);
      });

      // Close menu when clicking overlay
      mobileOverlay.addEventListener('click', () => {
        toggleMobileMenu(false);
      });

      // Handle touch swipe gestures
      sidebarEl.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      sidebarEl.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
      }, { passive: true });

      sidebarEl.addEventListener('touchend', () => {
        handleSwipe();
      });

      // Handle escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarEl.classList.contains('mobile-active')) {
          toggleMobileMenu(false);
        }
      });
    }
  }

  // Toggle Mobile Menu
  function toggleMobileMenu(show) {
    if (show) {
      sidebarEl.classList.add('mobile-active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Announce for screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigation menu opened';
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    } else {
      sidebarEl.classList.remove('mobile-active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Handle Swipe Gesture
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const threshold = 100; // Minimum swipe distance

    if (sidebarEl.classList.contains('mobile-active') && swipeDistance < -threshold) {
      // Swipe left - close menu
      toggleMobileMenu(false);
    }
  }

  // Adjust sidebar visibility based on screen size
  function handleResize() {
    if (window.innerWidth > 768 && sidebarEl && mobileOverlay) {
      // Reset mobile menu state on desktop
      sidebarEl.classList.remove('mobile-active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Initialize
  initMobileNavigation();
  window.addEventListener('resize', handleResize, { passive: true });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (sidebarEl && sidebarEl.classList.contains('mobile-active')) {
      if (!sidebarEl.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        toggleMobileMenu(false);
      }
    }
  });
});

// ========================================
// EVENT LISTENERS FOR STATUS BUTTONS
// ========================================

// ========================================
// GRID ROW CLICK - Open User Detail Modal
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - Initializing grid row click listeners...');
  
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
      console.log('🗑️  Trash button clicked - calling openTrashModal()');
      openTrashModal();
    });
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
  
  const roleTextMap = {
    'user': 'Requestor (User) - Submits requests',
    'unit': 'Unit Member - Works on tasks',
    'admin': 'Administrator - Full System Access'
  };
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
  userModal.style.display = 'flex';
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

  console.log('🔍 Modal element:', modal);
  console.log('🔍 Table body element:', tableBody);
  console.log('🔍 Empty state element:', emptyState);

  if (!modal) {
    console.error('❌ Trash modal not found');
    alert('Trash modal not found in DOM');
    return;
  }

  // Show loading - display modal immediately
  tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading deleted users...</td></tr>';
  emptyState.style.display = 'none';

  // Display the modal
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  console.log('✅ Modal displayed');

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
