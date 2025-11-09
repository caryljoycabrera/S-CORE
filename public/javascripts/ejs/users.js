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
const allRows = Array.from(document.querySelectorAll('.user-row'));

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
};

// ========================================
// TOAST NOTIFICATION FUNCTION
// ========================================
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
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
let affiliationFilter, studentOrgFilter;

function initializeSearchableDropdowns() {
  affiliationFilter = new EnhancedMultiSelect('affiliationFilter',
    affiliationsArray, 'Select Offices/Departments', true);
  studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter',
    studentOrgsArray, 'Select Student Organizations', true);

  // Listen to selection changes
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
    const rowUserId = row.dataset.userId.toLowerCase();
    const rowFullname = `${row.dataset.fname} ${row.dataset.mname} ${row.dataset.lname}`.toLowerCase();
    const rowUsername = row.dataset.username.toLowerCase();
    const rowEmail = row.dataset.email.toLowerCase();
    const rowCys = row.dataset.cys.toLowerCase();
    const rowAffiliation = (row.dataset.affiliation || '').toLowerCase();
    const rowStudentOrg = (row.dataset.studentorg || '').toLowerCase();

    const userIdMatch = userIdValue === '' || rowUserId.includes(userIdValue);
    const nameMatch = nameValue === '' || rowFullname.includes(nameValue);
    const usernameMatch = usernameValue === '' || rowUsername.includes(usernameValue);
    const emailMatch = emailValue === '' || rowEmail.includes(emailValue);
    const cysMatch = cysValue === '' || rowCys.includes(cysValue);

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

    const isVisible = userIdMatch && nameMatch && usernameMatch && emailMatch && cysMatch && affiliationMatch && studentOrgMatch;
    row.style.display = isVisible ? '' : 'none';

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
  if (affiliationFilter) {
    affiliationFilter.reset();
  }
  if (studentOrgFilter) {
    studentOrgFilter.reset();
  }

  filterUsers();
});

// ========================================
// ROLE MANAGEMENT FUNCTIONS
// ========================================
function updateCurrentRoleDisplay(role) {
  const currentRoleDisplay = document.getElementById('currentRoleDisplay');
  if (currentRoleDisplay) {
    currentRoleDisplay.textContent = role === 'admin' ? 'Administrator' : 'Standard User';
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

  const changeEvent = new Event('change');
  document.getElementById('editRole').dispatchEvent(changeEvent);
}

// ========================================
// USER ROW CLICK HANDLERS
// ========================================
document.querySelectorAll('.user-row').forEach(row => {
  row.addEventListener('click', () => {
    const userType = row.dataset.usertype;
    const viewCysRow = document.getElementById('viewCysRow');
    const viewOrgLabel = document.getElementById('viewOrgLabel');

    // Populate view information
    document.getElementById('viewUserId').textContent = row.dataset.userId;
    document.getElementById('viewFullName').textContent = row.dataset.fullname;
    document.getElementById('viewUsername').textContent = row.dataset.username;
    document.getElementById('viewEmail').textContent = row.dataset.email;
    document.getElementById('viewPhone').textContent = row.dataset.phone || 'Not provided';

    // User type badge
    const userTypeBadge = document.getElementById('viewUserType');
    userTypeBadge.textContent = userType === 'student' ? 'Student' : 'Staff/Faculty';
    userTypeBadge.className = `user-type-badge ${userType}`;

    // Role display
    const roleDisplay = document.getElementById('viewRole');
    roleDisplay.textContent = row.dataset.role;

    // Populate edit form
    document.getElementById('editUserId').value = row.dataset.id;
    document.getElementById('editRole').value = row.dataset.role;

    // Set the custom dropdown text
    const roleText = row.dataset.role === 'admin' ?
      'Administrator - Full System Access' :
      'Standard User - Submit & View Own Requests';
    document.getElementById('selectedRoleText').textContent = roleText;

    updateCurrentRoleDisplay(row.dataset.role);

    // Handle organization display
    const organizationContainer = document.getElementById('viewOrganizationContainer');
    const organizationData = row.dataset.organization;

    if (organizationData && organizationData !== 'N/A' && organizationData.trim() !== '') {
      const organizations = organizationData.split(',').map(org => org.trim()).filter(Boolean);

      if (organizations.length > 0) {
        organizationContainer.innerHTML = `
          <div class="org-tags-container">
            ${organizations.map(org => `
              <span class="org-tag" title="${org}">
                ${org}
              </span>
            `).join('')}
          </div>
        `;
      } else {
        organizationContainer.innerHTML = '<span class="no-organizations">No organizations listed</span>';
      }
    } else {
      organizationContainer.innerHTML = '<span class="no-organizations">No organizations listed</span>';
    }

    // Handle student vs non-student specific fields
    if (userType === 'student') {
      viewCysRow.style.display = '';
      viewOrgLabel.textContent = 'Student Organization:';
      document.getElementById('viewCys').textContent = row.dataset.cys || 'Not specified';
    } else {
      viewCysRow.style.display = 'none';
      viewOrgLabel.textContent = 'Office/Department:';
    }

    // Show modal - instant display
    userModal.style.display = 'flex';
  });
});

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

  const requestData = {
    userId: userId,
    role: newRole
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

      // Update displays in modal
      const roleText = newRole.charAt(0).toUpperCase() + newRole.slice(1);
      document.getElementById('viewRole').textContent = roleText;
      document.getElementById('currentRoleDisplay').textContent = roleText;

      // Update custom dropdown display
      const selectedText = newRole === 'admin'
        ? 'Administrator - Full System Access'
        : 'Standard User - Submit & View Own Requests';
      document.getElementById('selectedRoleText').textContent = selectedText;

      // Update the row in the table
      const currentRow = document.querySelector(`tr.user-row[data-id="${userId}"]`);
      if (currentRow) {
        currentRow.dataset.role = newRole;
      }

      // Show success toast
      showToast('Success', `${userName}'s role updated to ${roleText}`, 'success');

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
    if (window.innerWidth > 768) {
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
      if (!sidebarEl.contains(e.target) && !menuToggle.contains(e.target)) {
        toggleMobileMenu(false);
      }
    }
  });
});

// ========================================
// NEW USER VERIFICATION ACTIONS
// ========================================
const usersTableBody = document.getElementById('usersTableBody');

usersTableBody.addEventListener('click', function(e) {
  // Prefer button clicks first
  const btn = e.target.closest('button');
  if (btn && usersTableBody.contains(btn)) {
    const userId = btn.dataset.id;
    if (!userId) return;

    // Approve / Deny / Reset actions
    if (btn.classList.contains('approve-btn') || btn.classList.contains('deny-btn') || btn.classList.contains('reset-btn')) {
      e.stopPropagation(); // Prevent row click from triggering
      const action = btn.classList.contains('approve-btn') ? 'approve' : (btn.classList.contains('deny-btn') ? 'deny' : 'reset');

      // Show confirmation modal
      showConfirmationModal(action, userId, btn);
      return;
    }
  }

  // If not a button, treat as row click to open modal
  const row = e.target.closest('tr.user-row');
  if (row && usersTableBody.contains(row)) {
    openUserModal(row);
  }
});

// Event listeners for modal status buttons
document.getElementById('modalApproveBtn').addEventListener('click', function(e) {
  e.preventDefault();
  const userId = this.dataset.userId;
  if (!userId) return;

  showConfirmationModal('approve', userId, this);
});

document.getElementById('modalDenyBtn').addEventListener('click', function(e) {
  e.preventDefault();
  const userId = this.dataset.userId;
  if (!userId) return;

  showConfirmationModal('deny', userId, this);
});

document.getElementById('modalResetBtn').addEventListener('click', function(e) {
  e.preventDefault();
  const userId = this.dataset.userId;
  if (!userId) return;

  showConfirmationModal('reset', userId, this);
});

// Confirmation Modal Handler
function showConfirmationModal(action, userId, buttonElement) {
  const confirmModal = document.getElementById('confirmStatusModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmActionBtn = document.getElementById('confirmActionBtn');

  let message = '';
  let confirmBtnClass = '';

  if (action === 'approve') {
    message = '<strong>Approve this user?</strong><br><br>The user will gain full access to the system and can submit service requests.';
    confirmBtnClass = 'user-admin-btn-primary';
  } else if (action === 'deny') {
    message = '<strong>Deny this user?</strong><br><br>The user will be blocked from logging in and accessing the system.';
    confirmBtnClass = 'user-admin-btn-danger';
    confirmActionBtn.style.background = '#ef4444';
  } else if (action === 'reset') {
    message = '<strong>Reset to Pending?</strong><br><br>The user status will be changed to pending and will need approval again to access the system.';
    confirmBtnClass = 'user-admin-btn-secondary';
  }

  confirmMessage.innerHTML = message;
  confirmModal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Reset confirm button style
  confirmActionBtn.style.background = action === 'deny' ? '#ef4444' : '';

  // Remove previous listeners
  const newConfirmBtn = confirmActionBtn.cloneNode(true);
  confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);

  // Add new confirm listener
  newConfirmBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    document.body.style.overflow = '';
    executeStatusChange(action, userId, buttonElement);
  });
}

function executeStatusChange(action, userId, buttonElement) {
  buttonElement.disabled = true;
  fetch(`/admin/user/${action}/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updateRowState(buttonElement, action);
        const actionText = action.charAt(0).toUpperCase() + action.slice(1);
        showToast('Success', `User ${actionText === 'Reset' ? 'reset to pending' : actionText + 'd'} successfully`, 'success');
      } else {
        console.error('Action failed:', data.message || 'Unknown error');
        showToast('Error', data.message || 'Failed to update user status', 'error');
        buttonElement.disabled = false;
      }
    })
    .catch(err => {
      console.error('Action failed:', err);
      showToast('Error', 'Network error. Please try again.', 'error');
      buttonElement.disabled = false;
    });
}

function openUserModal(row) {
  // Populate modal fields from row dataset
  document.getElementById('viewUserId').textContent = row.dataset.userId || '';
  const fullName = `${row.dataset.fname || ''} ${row.dataset.mname ? row.dataset.mname + ' ' : ''}${row.dataset.lname || ''}`.trim();
  document.getElementById('viewFullName').textContent = fullName;
  document.getElementById('viewUsername').textContent = row.dataset.username || '';
  document.getElementById('viewEmail').textContent = row.dataset.email || '';
  document.getElementById('viewPhone').textContent = row.dataset.phone || '';

  const typeBadge = document.getElementById('viewUserType');
  typeBadge.textContent = row.dataset.usertype || '';
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

  // Show/hide status action buttons based on current status
  const modalApproveBtn = document.getElementById('modalApproveBtn');
  const modalDenyBtn = document.getElementById('modalDenyBtn');
  const modalResetBtn = document.getElementById('modalResetBtn');

  // Store the row reference on the buttons
  modalApproveBtn.dataset.userId = row.dataset.id;
  modalDenyBtn.dataset.userId = row.dataset.id;
  modalResetBtn.dataset.userId = row.dataset.id;

  if (status === 'pending') {
    modalApproveBtn.style.display = 'inline-flex';
    modalDenyBtn.style.display = 'inline-flex';
    modalResetBtn.style.display = 'none';
  } else if (status === 'approved') {
    modalApproveBtn.style.display = 'none';
    modalDenyBtn.style.display = 'inline-flex';
    modalResetBtn.style.display = 'inline-flex';
  } else if (status === 'denied') {
    modalApproveBtn.style.display = 'inline-flex';
    modalDenyBtn.style.display = 'none';
    modalResetBtn.style.display = 'inline-flex';
  }

  // populate admin form hidden inputs and dropdown
  document.getElementById('editUserId').value = row.dataset.id || '';
  document.getElementById('editRole').value = row.dataset.role || 'user';

  // Update the custom dropdown display
  const selectedText = row.dataset.role === 'admin'
    ? 'Administrator - Full System Access'
    : 'Standard User - Submit & View Own Requests';
  document.getElementById('selectedRoleText').textContent = selectedText;

  // Open modal and scroll to top
  userModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Scroll modal content to top (personal information section)
  const modalBody = document.querySelector('.user-details-modal-body');
  if (modalBody) {
    modalBody.scrollTop = 0;
  }
}

function updateRowState(button, action) {
  const row = button.closest('tr.user-row');
  const badge = row ? row.querySelector('.status-badge') : null;

  const approveBtn = row ? row.querySelector('.approve-btn') : null;
  const denyBtn = row ? row.querySelector('.deny-btn') : null;
  const resetBtn = row ? row.querySelector('.reset-btn') : null;

  let newStatus = '';
  if (action === 'approve') {
    newStatus = 'approved';
    if (row) row.dataset.status = newStatus;
    if (badge) { badge.className = 'status-badge status-approved'; badge.textContent = 'APPROVED'; }
  } else if (action === 'deny') {
    newStatus = 'denied';
    if (row) row.dataset.status = newStatus;
    if (badge) { badge.className = 'status-badge status-denied'; badge.textContent = 'DENIED'; }
  } else if (action === 'reset') {
    newStatus = 'pending';
    if (row) row.dataset.status = newStatus;
    if (badge) { badge.className = 'status-badge status-pending'; badge.textContent = 'PENDING'; }
  }

  // Re-enable all buttons in the row
  if (approveBtn) approveBtn.disabled = false;
  if (denyBtn) denyBtn.disabled = false;
  if (resetBtn) resetBtn.disabled = false;

  // Update modal status badge and buttons if modal is open
  const userModal = document.getElementById('userModal');
  if (userModal && userModal.style.display === 'flex') {
    const modalStatusBadge = document.getElementById('modalStatusBadge');
    const modalApproveBtn = document.getElementById('modalApproveBtn');
    const modalDenyBtn = document.getElementById('modalDenyBtn');
    const modalResetBtn = document.getElementById('modalResetBtn');

    // Update badge
    if (modalStatusBadge) {
      modalStatusBadge.textContent = newStatus.toUpperCase();
      modalStatusBadge.className = 'status-badge status-' + newStatus;
    }

    // Update button visibility based on new status
    if (newStatus === 'pending') {
      if (modalApproveBtn) { modalApproveBtn.style.display = 'inline-flex'; modalApproveBtn.disabled = false; }
      if (modalDenyBtn) { modalDenyBtn.style.display = 'inline-flex'; modalDenyBtn.disabled = false; }
      if (modalResetBtn) modalResetBtn.style.display = 'none';
    } else if (newStatus === 'approved') {
      if (modalApproveBtn) modalApproveBtn.style.display = 'none';
      if (modalDenyBtn) { modalDenyBtn.style.display = 'inline-flex'; modalDenyBtn.disabled = false; }
      if (modalResetBtn) { modalResetBtn.style.display = 'inline-flex'; modalResetBtn.disabled = false; }
    } else if (newStatus === 'denied') {
      if (modalApproveBtn) { modalApproveBtn.style.display = 'inline-flex'; modalApproveBtn.disabled = false; }
      if (modalDenyBtn) modalDenyBtn.style.display = 'none';
      if (modalResetBtn) { modalResetBtn.style.display = 'inline-flex'; modalResetBtn.disabled = false; }
    }
  }

  // Refresh visibility based on active tab
  if (row) {
    const activeTab = document.querySelector('.status-tab.active');
    if (activeTab) {
      const filterStatus = activeTab.dataset.status;
      if (filterStatus !== 'all' && row.dataset.status !== filterStatus) {
        row.style.display = 'none';
      } else {
        row.style.display = '';
      }
    }
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

    if (userId) {
      // If userId is present, switch to the specified tab
      const targetTab = document.querySelector(`.status-tab[data-status="${tab}"]`);
      if (targetTab) {
        targetTab.click();

        // Wait for tab content to load, then open the user modal
        setTimeout(() => {
          const userRow = document.querySelector(`tr.user-row[data-id="${userId}"]`);
          if (userRow) {
            openUserModal(userRow);

            // Scroll to the row
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Highlight the row briefly
            userRow.style.backgroundColor = '#fef3c7';
            setTimeout(() => {
              userRow.style.backgroundColor = '';
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
