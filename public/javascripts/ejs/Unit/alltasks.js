// Global Variables
let currentRequestId = null;
let currentRequestType = null;
let selectedFiles = [];
let revisionFiles = [];

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
    if (!this.container) {
      console.error(`EnhancedMultiSelect: Container with id '${containerId}' not found`);
      return;
    }
    this.options = options || [];
    this.placeholder = placeholder;
    this.selectedValues = new Set(['all']);
    this.isOpen = false;
    this.filteredOptions = [...this.options];
    this.hasSearch = hasSearch;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.setupElements();
    this.populateOptions();
    this.attachEventListeners();
    this.updateDisplay();
  }

  setupElements() {
    this.display = this.container.querySelector('.select-display');
    this.dropdown = this.container.querySelector('.select-dropdown');
    this.searchInput = this.dropdown?.querySelector('.search-input');
    this.optionsContainer = this.dropdown?.querySelector('.options-container');
    this.selectedText = this.display?.querySelector('.selected-text');
  }

  populateOptions() {
    if (!this.optionsContainer) {
      console.error('EnhancedMultiSelect: Options container not found');
      return;
    }
    
    // Clear existing options first
    this.optionsContainer.innerHTML = '';
    
    // Add "All" option
    const allOption = this.createOption('all', `All ${this.placeholder.replace('Select ', '')}`);
    this.optionsContainer.appendChild(allOption);

    // Add other options from data
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
    if (!this.display || !this.optionsContainer || !this.dropdown) {
      console.error('EnhancedMultiSelect: Required elements not found for event listeners');
      return;
    }

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
    if (!this.selectedText) return;
    
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

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all event listeners
    initializeEventListeners();
    initializeTableFilters();
    initializeRevisionFeatures();
    
    // Apply default sorting (pending with nearest deadlines first)
    applySorting();
    
    // Check URL parameters for auto-opening modals (from notifications)
    checkURLParameters();
});

// ==========================================
// DROPDOWN PROFILE MENU
// ==========================================
window.toggleDropdown = function() {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdownWrapper = document.querySelector('.dropdown-wrapper');
    const dropdown = document.getElementById('dropdownMenu');
    
    if (dropdown && dropdownWrapper) {
        if (!dropdownWrapper.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});

function initializeEventListeners() {
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Sort select dropdown
    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) {
        sortByFilter.addEventListener('change', applySorting);
    }

    // Table row click events - use event delegation
    const tableBody = document.getElementById('requestsTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', function(e) {
            // Find the closest tr element
            const row = e.target.closest('tr.request-row');
            if (row) {
                const requestId = row.getAttribute('data-request-id');
                const requestType = row.getAttribute('data-request-type');
                if (requestId && requestType) {
                    openRequestDetails(requestId, requestType);
                }
            }
        });
    }

    // Modal close events
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeRequestModal);
    }

    const modal = document.getElementById('requestDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeRequestModal();
            }
        });
    }

    // Approval actions
    // Use event delegation for approve button (button may be recreated)
    document.addEventListener('click', function(e) {
        if (e.target.closest('#approveBtn')) {
            console.log('[DEBUG] Approve button clicked');
            approveRequest();
        }
    });

    const requestRevisionBtn = document.getElementById('requestRevisionBtn');
    if (requestRevisionBtn) {
        requestRevisionBtn.addEventListener('click', showRevisionForm);
    }

    const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
    if (cancelRevisionBtn) {
        cancelRevisionBtn.addEventListener('click', hideRevisionForm);
    }

    const submitRevisionBtn = document.getElementById('submitRevisionBtn');
    if (submitRevisionBtn) {
        submitRevisionBtn.addEventListener('click', submitRevision);
    }

    const revokeApprovalBtn = document.getElementById('revokeApprovalBtn');
    if (revokeApprovalBtn) {
        revokeApprovalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[DEBUG] Revoke button clicked');
            revokeApproval();
        });
    }

    const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
    if (confirmRevokeBtn) {
        confirmRevokeBtn.addEventListener('click', submitRevokeApproval);
    }

    const cancelRevokeBtn = document.getElementById('cancelRevokeBtn');
    if (cancelRevokeBtn) {
        cancelRevokeBtn.addEventListener('click', hideRevokeForm);
    }

    // Revision history integrated action buttons
    const approveAfterRevisionBtn = document.getElementById('approveAfterRevisionBtn');
    if (approveAfterRevisionBtn) {
        approveAfterRevisionBtn.addEventListener('click', approveRequest);
    }

    const requestAnotherRevisionBtn = document.getElementById('requestAnotherRevisionBtn');
    if (requestAnotherRevisionBtn) {
        requestAnotherRevisionBtn.addEventListener('click', showRevisionForm);
    }

    // Service actions
    const deliverablesFileInput = document.getElementById('deliverablesFileInput');
    if (deliverablesFileInput) {
        deliverablesFileInput.addEventListener('change', handleFileInputChange);
    }

    const uploadDeliverablesBtn = document.getElementById('uploadDeliverablesBtn');
    if (uploadDeliverablesBtn) {
        uploadDeliverablesBtn.addEventListener('click', uploadDeliverables);
    }

    // Complete task modal
    const openCompleteTaskModalBtn = document.getElementById('openCompleteTaskModalBtn');
    if (openCompleteTaskModalBtn) {
        openCompleteTaskModalBtn.addEventListener('click', openCompleteTaskModal);
    }

    const submitCompleteTaskBtn = document.getElementById('submitCompleteTaskBtn');
    if (submitCompleteTaskBtn) {
        submitCompleteTaskBtn.addEventListener('click', submitCompleteTask);
    }

    // Message sending event listeners are handled in DOMContentLoaded section below
}

function initializeTableFilters() {
    // Initialize custom dropdown filters
    initializeCustomDropdowns();
    
    // Add event listeners for EnhancedMultiSelect filters
    const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
    if (studentOrgFilterContainer) {
        studentOrgFilterContainer.addEventListener('selectionChange', applyTableFilters);
    }
    
    const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
    if (officeDeptFilterContainer) {
        officeDeptFilterContainer.addEventListener('selectionChange', applyTableFilters);
    }
    
    // Add event listeners for text inputs
    const requestIdFilter = document.getElementById('requestIdFilter');
    const studentFilter = document.getElementById('studentFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (requestIdFilter) requestIdFilter.addEventListener('input', applyTableFilters);
    if (studentFilter) studentFilter.addEventListener('input', applyTableFilters);
    
    // Date filter event listeners with validation
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', handleDateFromChange);
        dateFromFilter.addEventListener('change', applyTableFilters);
    }
    if (dateToFilter) {
        dateToFilter.addEventListener('change', handleDateToChange);
        dateToFilter.addEventListener('change', applyTableFilters);
    }
}

function initializeCustomDropdowns() {
    // Get data from the global database object
    const dbData = window.filterDataFromDatabase || {};
    
    // Initialize Status filter dropdown
    const statusFilterDropdown = document.getElementById('statusFilter');
    if (statusFilterDropdown) {
        populateDropdownOptions('statusDropdown', dbData.requestStatuses || []);
        initializeCustomDropdown(statusFilterDropdown, 'statusDropdown', applyTableFilters);
    }

    // Initialize Student Organization filter
    const studentOrgFilter = document.getElementById('studentOrgFilter');
    if (studentOrgFilter) {
        const studentOrgSelect = new EnhancedMultiSelect('studentOrgFilter',
            dbData.organizations || [],
            'Select Student Organizations', true);
        
        const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
        if (studentOrgFilterContainer) {
            studentOrgFilterContainer.__instance = studentOrgSelect;
        }
    }

    // Initialize Office/Department filter
    const officeDeptFilter = document.getElementById('officeDeptFilter');
    if (officeDeptFilter) {
        const officeDeptSelect = new EnhancedMultiSelect('officeDeptFilter',
            dbData.offices || [],
            'Select Offices/Departments', true);
        
        const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
        if (officeDeptFilterContainer) {
            officeDeptFilterContainer.__instance = officeDeptSelect;
        }
    }
}

function populateDropdownOptions(dropdownId, options) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const optionsContainer = dropdown.querySelector('.options-container');
    if (!optionsContainer) return;

    // Create "All" option
    const allLabel = document.createElement('label');
    allLabel.className = 'option-item';
    allLabel.innerHTML = `
        <input type="checkbox" value="all" checked>
        <span class="checkmark"></span>
        <span class="option-text">All Statuses</span>
    `;
    optionsContainer.appendChild(allLabel);

    // Create individual options
    options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option-item';
        label.innerHTML = `
            <input type="checkbox" value="${option.toLowerCase()}" name="${dropdownId}">
            <span class="checkmark"></span>
            <span class="option-text">${option}</span>
        `;
        optionsContainer.appendChild(label);
    });
}

function initializeCustomDropdown(customSelectElement, dropdownId, onChangeCallback) {
    const selectDisplay = customSelectElement.querySelector('.select-display');
    const dropdown = document.getElementById(dropdownId);
    
    if (!selectDisplay || !dropdown) return;
    
    // Toggle dropdown on click
    selectDisplay.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');
        
        // Close all other dropdowns and remove active class
        document.querySelectorAll('.select-dropdown.show').forEach(dd => {
            if (dd !== dropdown) {
                dd.classList.remove('show');
                const otherDisplay = dd.parentElement.querySelector('.select-display');
                if (otherDisplay) otherDisplay.classList.remove('active');
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('show', !isOpen);
        selectDisplay.classList.toggle('active', !isOpen);
    });
    
    // Handle checkbox changes
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleCheckboxChange(customSelectElement, dropdown, checkboxes, onChangeCallback);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!customSelectElement.contains(e.target)) {
            dropdown.classList.remove('show');
            selectDisplay.classList.remove('active');
        }
    });
}

function handleCheckboxChange(customSelectElement, dropdown, checkboxes, onChangeCallback) {
    const selectDisplay = customSelectElement.querySelector('.select-display');
    const allCheckbox = dropdown.querySelector('input[value="all"]');
    const otherCheckboxes = Array.from(checkboxes).filter(cb => cb.value !== 'all');
    
    // If "All" checkbox was clicked
    if (event.target.value === 'all') {
        if (event.target.checked) {
            // Uncheck all other checkboxes
            otherCheckboxes.forEach(cb => cb.checked = false);
            selectDisplay.textContent = getDefaultText(dropdown.id);
        }
    } else {
        // If any other checkbox was clicked, uncheck "All"
        if (allCheckbox) allCheckbox.checked = false;
        
        // Update display text
        const checkedBoxes = otherCheckboxes.filter(cb => cb.checked);
        if (checkedBoxes.length === 0) {
            // If nothing selected, check "All" again
            if (allCheckbox) allCheckbox.checked = true;
            selectDisplay.textContent = getDefaultText(dropdown.id);
        } else if (checkedBoxes.length === 1) {
            selectDisplay.textContent = checkedBoxes[0].parentElement.textContent.trim();
        } else {
            selectDisplay.textContent = `${checkedBoxes.length} selected`;
        }
    }
    
    // Apply filters
    if (onChangeCallback) onChangeCallback();
}

function getDefaultText(dropdownId) {
    if (dropdownId === 'statusDropdown') return 'All Status';
    return 'All';
}

function applyTableFilters() {
    // Get filter values
    const requestIdFilter = document.getElementById('requestIdFilter')?.value.toLowerCase() || '';
    const studentFilter = document.getElementById('studentFilter')?.value.toLowerCase() || '';
    const dateFromFilter = document.getElementById('dateFromFilter')?.value || '';
    const dateToFilter = document.getElementById('dateToFilter')?.value || '';
    
    // Get selected statuses from custom dropdown
    const selectedStatuses = getSelectedDropdownValues('statusDropdown');
    
    // Get selected organizations from EnhancedMultiSelect
    const selectedOrganizations = getEnhancedMultiSelectValues('studentOrgFilter');
    
    // Get selected offices/departments from EnhancedMultiSelect
    const selectedOffices = getEnhancedMultiSelectValues('officeDeptFilter');
    
    const tableRows = document.querySelectorAll('.requests-table tbody tr.request-row');
    
    tableRows.forEach(row => {
        const requestId = row.getAttribute('data-request-id')?.toLowerCase() || '';
        const status = row.getAttribute('data-status')?.toLowerCase().replace(/\s+/g, '-') || '';
        const student = row.getAttribute('data-requestor')?.toLowerCase() || '';
        const studentOrg = row.getAttribute('data-student')?.toLowerCase() || '';
        const officeDept = row.getAttribute('data-office')?.toLowerCase() || '';
        const dateSubmitted = row.getAttribute('data-date-submitted') || '';

        let showRow = true;

        // Apply request ID filter
        if (requestIdFilter && !requestId.includes(requestIdFilter)) {
            showRow = false;
        }
        
        // Apply student filter
        if (studentFilter && !student.includes(studentFilter)) {
            showRow = false;
        }
        
        // Apply status filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes('all')) {
            if (!selectedStatuses.includes(status)) {
                showRow = false;
            }
        }
        
        // Apply organization filter
        if (selectedOrganizations.length > 0 && !selectedOrganizations.includes('all')) {
            if (!selectedOrganizations.some(org => studentOrg.includes(org.toLowerCase()))) {
                showRow = false;
            }
        }
        
        // Apply office/department filter
        if (selectedOffices.length > 0 && !selectedOffices.includes('all')) {
            if (!selectedOffices.some(off => officeDept.includes(off.toLowerCase()))) {
                showRow = false;
            }
        }
        
        // Apply date range filters
        if (dateFromFilter && dateSubmitted < dateFromFilter) {
            showRow = false;
        }
        if (dateToFilter && dateSubmitted > dateToFilter) {
            showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    });
    
    // Update results count
    const visibleRows = Array.from(tableRows).filter(row => row.style.display !== 'none');
    updateResultsCount(visibleRows.length, tableRows.length);
}

function updateResultsCount(visibleCount, totalCount) {
    const resultsCountElement = document.getElementById('resultsCount');
    if (resultsCountElement) {
        if (visibleCount === totalCount) {
            resultsCountElement.textContent = `Showing all ${totalCount} requests`;
        } else {
            resultsCountElement.textContent = `Showing ${visibleCount} of ${totalCount} requests`;
        }
    }
}

// ==========================================
// DATE FILTER VALIDATION FUNCTIONS
// ==========================================

function handleDateFromChange() {
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (!dateFromFilter || !dateToFilter) return;
    
    const dateFromValue = dateFromFilter.value;
    const dateToValue = dateToFilter.value;
    
    // Set the minimum date for dateTo to be the selected dateFrom
    if (dateFromValue) {
        dateToFilter.min = dateFromValue;
        
        // If dateTo is set and is before dateFrom, clear it
        if (dateToValue && dateToValue < dateFromValue) {
            dateToFilter.value = '';
        }
    } else {
        // If dateFrom is cleared, remove the min constraint
        dateToFilter.removeAttribute('min');
    }
}

function handleDateToChange() {
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (!dateFromFilter || !dateToFilter) return;
    
    const dateFromValue = dateFromFilter.value;
    const dateToValue = dateToFilter.value;
    
    // If dateTo is set and dateFrom is also set, ensure dateTo is not before dateFrom
    if (dateToValue && dateFromValue && dateToValue < dateFromValue) {
        // Show a brief error message and clear the invalid date
        showDateValidationError('Date To cannot be before Date From');
        dateToFilter.value = '';
        return;
    }
}

function showDateValidationError(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(errorDiv);
    
    // Remove the error message after 3 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideIn 0.3s ease-in reverse';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}

function getSelectedDropdownValues(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return [];
    
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getEnhancedMultiSelectValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !container.__instance) return [];
    
    return container.__instance.getSelectedValues();
}

function clearAllFilters() {
    // Clear text inputs
    const requestIdFilter = document.getElementById('requestIdFilter');
    const studentFilter = document.getElementById('studentFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (requestIdFilter) requestIdFilter.value = '';
    if (studentFilter) studentFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) {
        dateToFilter.value = '';
        dateToFilter.removeAttribute('min'); // Remove date validation constraint
    }
    
    // Reset status dropdown
    resetCustomDropdown('statusFilter', 'statusDropdown', 'All Status');
    
    // Reset student organization filter
    const studentOrgContainer = document.getElementById('studentOrgFilter');
    if (studentOrgContainer && studentOrgContainer.__instance) {
        studentOrgContainer.__instance.reset();
    }
    
    // Reset office/department filter
    const officeDeptContainer = document.getElementById('officeDeptFilter');
    if (officeDeptContainer && officeDeptContainer.__instance) {
        officeDeptContainer.__instance.reset();
    }
    
    // Reset sort select
    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) {
        sortByFilter.value = 'deadline-asc';
    }
    
    applyTableFilters();
    applySorting();
    
    // Update results count after clearing filters
    const tableRows = document.querySelectorAll('.requests-table tbody tr.request-row');
    updateResultsCount(tableRows.length, tableRows.length);
}

function resetCustomDropdown(filterId, dropdownId, defaultText) {
    const filterElement = document.getElementById(filterId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!filterElement || !dropdown) return;
    
    // Reset display text
    const selectDisplay = filterElement.querySelector('.select-display');
    if (selectDisplay) {
        selectDisplay.textContent = defaultText;
    }
    
    // Uncheck all checkboxes
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Check "All" checkbox
    const allCheckbox = dropdown.querySelector('input[value="all"]');
    if (allCheckbox) allCheckbox.checked = true;
}

function applySorting() {
    const sortByFilter = document.getElementById('sortByFilter');
    if (!sortByFilter) return;

    const sortValue = sortByFilter.value;
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;

    // Get all visible rows
    const allRows = Array.from(tableBody.querySelectorAll('tr.request-row'));
    
    // Define completed/archived statuses and their priority order
    const completedStatuses = ['completed', 'approved', 'rejected', 'archived'];
    const statusPriority = {
        'completed': 1,
        'approved': 2,
        'rejected': 3,
        'archived': 4
    };
    
    // Separate active and completed/archived rows
    const activeRows = [];
    const completedRows = [];
    
    allRows.forEach(row => {
        const status = row.getAttribute('data-status')?.toLowerCase().replace(/\s+/g, '-') || '';
        if (completedStatuses.includes(status)) {
            completedRows.push(row);
        } else {
            activeRows.push(row);
        }
    });
    
    // Sort active rows based on selected option
    activeRows.sort((a, b) => {
        let aValue, bValue;
        
        switch(sortValue) {
            case 'deadline-asc':
                // Soonest deadline first
                aValue = a.getAttribute('data-deadline');
                bValue = b.getAttribute('data-deadline');
                
                if (!aValue && !bValue) return 0;
                if (!aValue) return 1;
                if (!bValue) return -1;
                
                return new Date(aValue) - new Date(bValue);
                
            case 'deadline-desc':
                // Latest deadline first
                aValue = a.getAttribute('data-deadline');
                bValue = b.getAttribute('data-deadline');
                
                if (!aValue && !bValue) return 0;
                if (!aValue) return 1;
                if (!bValue) return -1;
                
                return new Date(bValue) - new Date(aValue);
                
            case 'date-desc':
                // Newest submitted first
                aValue = new Date(a.getAttribute('data-date-submitted') || 0);
                bValue = new Date(b.getAttribute('data-date-submitted') || 0);
                return bValue - aValue;
                
            case 'date-asc':
                // Oldest submitted first
                aValue = new Date(a.getAttribute('data-date-submitted') || 0);
                bValue = new Date(b.getAttribute('data-date-submitted') || 0);
                return aValue - bValue;
                
            default:
                return 0;
        }
    });
    
    // Sort completed/archived rows by status priority then by date (newest first)
    completedRows.sort((a, b) => {
        const aStatus = a.getAttribute('data-status')?.toLowerCase().replace(/\s+/g, '-') || '';
        const bStatus = b.getAttribute('data-status')?.toLowerCase().replace(/\s+/g, '-') || '';
        
        const aPriority = statusPriority[aStatus] || 999;
        const bPriority = statusPriority[bStatus] || 999;
        
        // First sort by status priority
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then sort by date (newest first)
        const aDate = new Date(a.getAttribute('data-date-submitted') || 0);
        const bDate = new Date(b.getAttribute('data-date-submitted') || 0);
        return bDate - aDate;
    });
    
    // Combine active rows first, then completed/archived rows
    const sortedRows = [...activeRows, ...completedRows];
    
    // Re-append rows in sorted order
    sortedRows.forEach(row => tableBody.appendChild(row));
}

// Function: openRequestDetails
function openRequestDetails(requestId, requestType) {
    currentRequestId = requestId;
    currentRequestType = requestType;

    // Find the row by request ID
    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
    if (!row) {
        showErrorMessage('Request not found');
        return;
    }

    // Get all data attributes from row
    const title = row.getAttribute('data-title') || 'Untitled';
    const requestor = row.getAttribute('data-requestor') || 'Unknown';
    const requestorEmail = row.getAttribute('data-requestor-email') || 'N/A';
    const organization = row.getAttribute('data-organization') || 'N/A';
    const dateSubmitted = row.getAttribute('data-date-submitted') || '';
    const status = row.getAttribute('data-status') || 'Pending';
    const description = row.getAttribute('data-description') || 'No description provided';
    const deadline = row.getAttribute('data-deadline') || '';
    const serviceType = row.getAttribute('data-service-type') || '';
    const specificRequestType = row.getAttribute('data-specific-request-type') || '';
    const filesJson = row.getAttribute('data-files') || '[]';
    const deliverablesJson = row.getAttribute('data-deliverables') || '[]';

    // Populate modal with data
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalRequestor').textContent = requestor;
    document.getElementById('modalRequestorEmail').textContent = requestorEmail;
    document.getElementById('modalOrganization').textContent = organization;
    document.getElementById('modalDate').textContent = dateSubmitted;
    
    // Update status badge with proper styling
    const modalStatus = document.getElementById('modalStatus');
    if (modalStatus) {
        const statusLower = status.toLowerCase().replace(/\s+/g, '-');
        modalStatus.textContent = status;
        modalStatus.className = 'status-badge ' + statusLower;
    }
    
    document.getElementById('modalDescription').innerHTML = description;

    // Update type badge
    const typeBadge = document.getElementById('modalTypeBadge');
    if (typeBadge) {
        typeBadge.textContent = requestType === 'approval' ? 'APPROVAL' : 'SERVICE';
        typeBadge.className = `type-badge ${requestType}`;
    }

    // Show/hide deadline and service type based on type
    const deadlineField = document.getElementById('deadlineField');
    const serviceTypeField = document.getElementById('serviceTypeField');
    
    if (requestType === 'approval') {
        if (deadlineField) deadlineField.style.display = 'block';
        if (serviceTypeField) serviceTypeField.style.display = 'none';
        if (deadline) {
            document.getElementById('modalDeadline').textContent = new Date(deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            document.getElementById('modalDeadline').textContent = '—';
        }
    } else if (requestType === 'service') {
        if (deadlineField) deadlineField.style.display = 'none';
        if (serviceTypeField) serviceTypeField.style.display = 'block';
        if (serviceType || specificRequestType) {
            document.getElementById('modalServiceType').textContent = serviceType || specificRequestType;
        } else {
            document.getElementById('modalServiceType').textContent = '—';
        }
    }

    // Show files if they exist
    try {
        const files = JSON.parse(filesJson);
        const filesSection = document.getElementById('filesSection');
        const filesContainer = document.getElementById('modalFiles');
        if (files && files.length > 0) {
            filesContainer.innerHTML = '';
            createEnhancedFilePreview(files, filesContainer, dateSubmitted);
            if (filesSection) filesSection.style.display = 'block';
        } else {
            if (filesSection) filesSection.style.display = 'none';
        }
    } catch (e) {
        console.error('Error parsing files:', e);
        const filesSection = document.getElementById('filesSection');
        if (filesSection) filesSection.style.display = 'none';
    }

    // Show deliverables if they exist
    try {
        const deliverables = JSON.parse(deliverablesJson);
        const deliverablesSection = document.getElementById('deliverablesSection');
        const deliverablesContainer = document.getElementById('modalDeliverables');
        if (deliverables && deliverables.length > 0) {
            deliverablesContainer.innerHTML = '';
            createEnhancedFilePreview(deliverables, deliverablesContainer, dateSubmitted);
            if (deliverablesSection) deliverablesSection.style.display = 'block';
        } else {
            if (deliverablesSection) deliverablesSection.style.display = 'none';
        }
    } catch (e) {
        console.error('Error parsing deliverables:', e);
        const deliverablesSection = document.getElementById('deliverablesSection');
        if (deliverablesSection) deliverablesSection.style.display = 'none';
    }

    // Update modal header color based on request type
    const modalHeader = document.querySelector('.unit-modal-header');
    if (modalHeader) {
        modalHeader.classList.remove('approval-header-color', 'service-header-color');
        if (requestType === 'approval') {
            modalHeader.classList.add('approval-header-color');
        } else if (requestType === 'service') {
            modalHeader.classList.add('service-header-color');
        }
    }
    
    // Load service revision history for service requests
    if (requestType === 'service') {
        const serviceActionsPanel = document.getElementById('serviceActionsPanel');
        const completeTaskPanel = document.getElementById('completeTaskPanel');
        
        console.log('Service request status:', status); // Debug log
        
        // Load revision history first to determine the actual state
        // The revision history will handle showing/hiding panels based on approval status
        loadServiceRevisionHistory(requestId);
        
        // Initially hide both panels - loadServiceRevisionHistory will show the appropriate one
        if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';
        if (completeTaskPanel) completeTaskPanel.style.display = 'none';
        
        // Only apply status-based logic if status is explicitly "Completed"
        const normalizedStatus = status.toLowerCase().trim();
        if (normalizedStatus === 'completed') {
            console.log('Status is Completed - hiding both panels permanently');
            // Task is fully completed, keep both panels hidden
        }
        
        // Hide admin form section (Unit Actions) for service requests
        const adminFormSection = document.querySelector('.admin-form-section');
        if (adminFormSection) adminFormSection.style.display = 'none';
        
        // Hide approve button for service requests
        const adminApproveBtn = document.getElementById('adminApproveBtn');
        if (adminApproveBtn) adminApproveBtn.style.display = 'none';
    } else if (requestType === 'approval') {
        // Hide service actions panel for approval requests
        const serviceActionsPanel = document.getElementById('serviceActionsPanel');
        if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';
        
        // Hide complete task panel for approval requests
        const completeTaskPanel = document.getElementById('completeTaskPanel');
        if (completeTaskPanel) completeTaskPanel.style.display = 'none';
        
        // Show admin form section (Unit Actions) for approval requests
        const adminFormSection = document.querySelector('.admin-form-section');
        if (adminFormSection) adminFormSection.style.display = 'block';
        
        // Show approve button for approval requests
        const adminApproveBtn = document.getElementById('adminApproveBtn');
        if (adminApproveBtn) adminApproveBtn.style.display = 'inline-block';
    }

    // Populate admin form with current status and units
    const rowData = {
        status: status,
        units: ''  // Will be populated from the server or set as 'Not yet assigned'
    };
    populateAdminForm(rowData);

    // Handle approved status - for approval requests, "Approved" is the final state
    if (status.toLowerCase() === 'approved' && requestType === 'approval') {
        const adminFormSection = document.querySelector('.admin-form-section');
        if (adminFormSection) {
            // Hide the approve/revision buttons since request is already approved
            const adminActionButtons = document.querySelector('.admin-action-buttons');
            if (adminActionButtons) {
                adminActionButtons.style.display = 'none';
            }
            adminFormSection.style.display = 'none';
        }
    } else if (status.toLowerCase() === 'completed') {
        // Hide all action panels when already completed (for service requests)
        const adminFormSection = document.querySelector('.admin-form-section');
        if (adminFormSection) {
            adminFormSection.style.display = 'none';
        }
    }

    // Handle Queued status - show Start Task button
    handleQueuedStatus(status, requestId, requestType);

    // Load conversation messages
    loadConversation(requestId);

    // Load revision history (for approval requests)
    if (requestType === 'approval') {
        loadRevisionHistory(requestId);
    }

    // Display modal
    const modal = document.getElementById('requestDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Function: loadRevisionHistory
async function loadRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    console.log('[Revision History] Loading for request:', requestId);
    console.log('[Revision History] Section element:', historySection);
    console.log('[Revision History] Container element:', historyContainer);
    
    if (!historyContainer) {
        console.warn('[Revision History] Container not found!');
        return;
    }
    
    try {
        const response = await fetch(`/api/revision-history/${requestId}`);
        console.log('[Revision History] Response status:', response.status);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Revision History] API returned non-JSON response');
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available</p>';
            return;
        }
        
        const result = await response.json();
        console.log('[Revision History] API Response:', result);
        console.log('[Revision History] Revisions count:', result.revisions?.length || 0);
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            console.log('[Revision History] Showing section with', result.revisions.length, 'revisions');
            
            // Show the revision history section
            if (historySection) {
                historySection.style.display = 'block';
                console.log('[Revision History] Section display set to block');
            }
            
            // Clear container
            historyContainer.innerHTML = '';
            
            // Filter out initial submission and duplicates
            const revisionsToShow = result.revisions.filter(revision => revision.type !== 'initial');
            
            // Remove duplicates based on content and author (not timestamp, as they can vary by milliseconds)
            const uniqueRevisions = [];
            const seenKeys = new Set();
            
            for (const revision of revisionsToShow) {
                // Create a unique key based on type, author, and content
                const author = revision.requestedBy?._id || revision.respondedBy?._id || '';
                const content = (revision.revisionNotes || revision.responseNotes || '').substring(0, 100); // First 100 chars
                const filesCount = (revision.revisionFiles || revision.responseFiles || revision.files || []).length;
                const key = `${revision.type}-${author}-${content}-${filesCount}`;
                
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueRevisions.push(revision);
                } else {
                    console.log('[Revision History] Skipping duplicate revision with key:', key);
                }
            }
            
            console.log('[Revision History] Unique revisions count:', uniqueRevisions.length, 'out of', revisionsToShow.length);
            
            // Render each revision entry with enumeration
            uniqueRevisions.forEach((revision, index) => {
                console.log('[Revision History] Rendering revision', index, ':', revision.type);
                const entry = createRevisionEntry(revision, index, uniqueRevisions.length);
                historyContainer.appendChild(entry);
            });
            
            console.log('[Revision History] All revisions rendered');
            
            // Check if request has been approved before showing action buttons
            const hasApprovalEntry = result.revisions.some(rev => 
                rev.status === 'resolved' || 
                rev.status === 'approved' || 
                (rev.type && rev.type === 'approved')
            );
            
            console.log('[Revision History] Has approval entry:', hasApprovalEntry);
            
            const revisionHistoryActions = document.getElementById('revisionHistoryActions');
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            
            if (hasApprovalEntry) {
                // Request is approved - hide all action buttons
                console.log('[Revision History] Request approved - hiding all action buttons');
                if (revisionHistoryActions) {
                    revisionHistoryActions.style.display = 'none';
                }
                if (approvalActionsPanel) {
                    approvalActionsPanel.style.display = 'none';
                }
            } else {
                // Request not approved - show action buttons in revision history
                console.log('[Revision History] Request not approved - showing action buttons');
                if (revisionHistoryActions) {
                    revisionHistoryActions.style.display = 'flex';
                }
                if (approvalActionsPanel) {
                    approvalActionsPanel.style.display = 'none';
                }
            }
        } else {
            console.log('[Revision History] No revisions to display');
            // Show section with empty state
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available</p>';
            
            // Note: Do NOT show approval panel here - let openRequestDetails handle panel display
            // based on requestType to avoid conflicts with service requests
        }
    } catch (error) {
        console.error('[Revision History] Error loading:', error);
        // Show section with error message instead of hiding
        if (historySection) historySection.style.display = 'block';
        historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">Unable to load revision history</p>';
    }
}

// Function: loadServiceRevisionHistory
async function loadServiceRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    const serviceActionsPanel = document.getElementById('serviceActionsPanel');
    const completeTaskPanel = document.getElementById('completeTaskPanel');
    
    console.log('[Service Revision History] ===== STARTING LOAD =====');
    console.log('[Service Revision History] Request ID:', requestId);
    console.log('[Service Revision History] History section element:', !!historySection);
    console.log('[Service Revision History] History container element:', !!historyContainer);
    console.log('[Service Revision History] Service actions panel element:', !!serviceActionsPanel);
    console.log('[Service Revision History] Complete task panel element:', !!completeTaskPanel);
    
    if (!historyContainer) {
        console.warn('[Service Revision History] ❌ Container not found!');
        return;
    }
    
    try {
        console.log('[Service Revision History] Fetching from API...');
        const response = await fetch(`/api/service-revision-history/${requestId}`);
        console.log('[Service Revision History] Response status:', response.status);
        console.log('[Service Revision History] Response OK:', response.ok);
        
        const contentType = response.headers.get('content-type');
        console.log('[Service Revision History] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Service Revision History] ❌ API returned non-JSON response');
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available</p>';
            return;
        }
        
        const result = await response.json();
        console.log('[Service Revision History] ===== API RESPONSE =====');
        console.log('[Service Revision History] Success:', result.success);
        console.log('[Service Revision History] Revisions count:', result.revisions ? result.revisions.length : 0);
        console.log('[Service Revision History] Full response:', result);
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            // Log each revision before filtering
            result.revisions.forEach((rev, idx) => {
                console.log(`[Service Revision History] ===== REVISION ${idx} DETAILS =====`);
                console.log('[Service Revision History] Type:', rev.type);
                console.log('[Service Revision History] Has requestedBy:', !!rev.requestedBy);
                console.log('[Service Revision History] Has respondedBy:', !!rev.respondedBy);
                console.log('[Service Revision History] Deliverable files:', rev.deliverableFiles ? rev.deliverableFiles.length : 0);
                console.log('[Service Revision History] Response files:', rev.responseFiles ? rev.responseFiles.length : 0);
                console.log('[Service Revision History] Timestamp:', rev.timestamp || rev.requestedAt || rev.respondedAt);
                console.log('[Service Revision History] Full object:', rev);
                console.log('[Service Revision History] =====================================');
            });
            
            // Check if requestor has approved deliverables
            const hasApprovedDeliverables = result.revisions.some(rev => rev.type === 'approved_by_requestor');
            console.log('[Service Revision History] Has approved deliverables:', hasApprovedDeliverables);
            
            // Get current status from the modal status badge
            const modalStatus = document.getElementById('modalStatus');
            const currentStatus = modalStatus ? modalStatus.textContent.toLowerCase().trim() : '';
            console.log('[Service Revision History] Current modal status:', currentStatus);
            
            // Also check the table row status for more accurate detection
            const tableRow = document.querySelector(`tr[data-request-id="${requestId}"]`);
            const rowStatus = tableRow ? tableRow.getAttribute('data-status')?.toLowerCase().trim() : '';
            console.log('[Service Revision History] Table row status:', rowStatus);
            
            // Determine the actual status (prefer modal status, fallback to row status)
            const actualStatus = currentStatus || rowStatus;
            console.log('[Service Revision History] Actual status:', actualStatus);
            
            // If approved and NOT already completed, show complete task panel
            if (hasApprovedDeliverables && actualStatus !== 'completed') {
                console.log('[Service Revision History] ✅ Deliverables approved - hiding upload panel, showing complete task panel');
                if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';
                if (completeTaskPanel) {
                    completeTaskPanel.style.display = 'block';
                    // Scroll the panel into view
                    setTimeout(() => {
                        completeTaskPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 300);
                }
            } else if (actualStatus === 'completed') {
                console.log('[Service Revision History] ✅ Task already completed - hiding both panels');
                if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';
                if (completeTaskPanel) completeTaskPanel.style.display = 'none';
            } else {
                // No approval yet - show upload panel
                console.log('[Service Revision History] No approval yet - showing upload panel');
                if (serviceActionsPanel) serviceActionsPanel.style.display = 'block';
                if (completeTaskPanel) completeTaskPanel.style.display = 'none';
            }
            
            // Filter out initial submission
            const revisionsToShow = result.revisions.filter(revision => revision.type !== 'initial');
            
            console.log('[Service Revision History] Filtered revisions count:', revisionsToShow.length);
            console.log('[Service Revision History] Revisions to show:', revisionsToShow);
            
            if (revisionsToShow.length > 0) {
                console.log('[Service Revision History] ✅ Showing section with', revisionsToShow.length, 'revisions');
                
                // Show the revision history section
                if (historySection) {
                    historySection.style.display = 'block';
                }
                
                // Clear container
                historyContainer.innerHTML = '';
                
                // Render each revision entry
                revisionsToShow.forEach((revision, index) => {
                    console.log('[Service Revision History] Creating entry', index + 1, 'of', revisionsToShow.length);
                    console.log('[Service Revision History] Revision type:', revision.type);
                    const entry = createServiceRevisionEntry(revision, index, revisionsToShow.length);
                    historyContainer.appendChild(entry);
                });
                
                // Enable two-column layout for revision history
                const modalBody = document.querySelector('.unit-modal-body');
                const rightColumn = document.querySelector('.unit-right-column');
                
                console.log('[Service Revision History] Modal body element:', !!modalBody);
                console.log('[Service Revision History] Right column element:', !!rightColumn);
                
                if (modalBody) {
                    modalBody.classList.add('two-column');
                    console.log('[Service Revision History] ✅ Added two-column class to modal body');
                }
                if (rightColumn) {
                    rightColumn.style.display = 'flex';
                    console.log('[Service Revision History] ✅ Set right column display to flex');
                }
                
                // Check if deliverables have been submitted and if revisions are requested
                const hasDeliverable = revisionsToShow.some(rev => 
                    rev.type === 'deliverable_submitted' || 
                    rev.type === 'completed' ||
                    (rev.deliverableFiles && rev.deliverableFiles.length > 0)
                );
                
                const hasRevisionRequest = revisionsToShow.some(rev => 
                    rev.type === 'revision_requested' ||
                    rev.status === 'pending'
                );
                
                const hasApproval = revisionsToShow.some(rev => rev.type === 'approved_by_requestor');
                
                console.log('[Service Revision History] Has deliverable:', hasDeliverable);
                console.log('[Service Revision History] Has revision request:', hasRevisionRequest);
                console.log('[Service Revision History] Has approval (override check):', hasApproval);
                
                // Don't override panel visibility if:
                // 1. Deliverables are approved (complete task panel should be showing)
                // 2. Task is completed (both panels should be hidden)
                if (serviceActionsPanel && !hasApproval && actualStatus !== 'completed') {
                    // Show upload panel if no deliverables submitted OR if revisions are requested
                    if (!hasDeliverable || hasRevisionRequest) {
                        serviceActionsPanel.style.display = 'block';
                        console.log('[Service Revision History] ✅ Showed service actions panel');
                    } else {
                        serviceActionsPanel.style.display = 'none';
                        console.log('[Service Revision History] ✅ Hid service actions panel');
                    }
                } else {
                    console.log('[Service Revision History] ⏭️ Skipped panel override (approved or completed)');
                }
                
                // Show action buttons for non-completed requests
                const isCompleted = revisionsToShow.some(rev => rev.type === 'completed');
                const revisionHistoryActions = document.getElementById('revisionHistoryActions');
                
                if (!isCompleted && revisionHistoryActions) {
                    revisionHistoryActions.style.display = 'none'; // Hide approval actions for service requests
                }
            } else {
                // No revisions to show, but keep section visible (empty state)
                console.log('[Service Revision History] No revisions after filtering');
                if (historySection) historySection.style.display = 'block';
                historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available yet</p>';
                const modalBody = document.querySelector('.unit-modal-body');
                const rightColumn = document.querySelector('.unit-right-column');
                if (modalBody) modalBody.classList.add('two-column');
                if (rightColumn) rightColumn.style.display = 'flex';
            }
        } else {
            console.log('[Service Revision History] No revisions to display');
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available yet</p>';
            const modalBody = document.querySelector('.unit-modal-body');
            const rightColumn = document.querySelector('.unit-right-column');
            if (modalBody) modalBody.classList.add('two-column');
            if (rightColumn) rightColumn.style.display = 'flex';
        }
    } catch (error) {
        console.error('[Service Revision History] ❌ ERROR:', error);
        console.error('[Service Revision History] Error stack:', error.stack);
        if (historySection) historySection.style.display = 'block';
        historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">Unable to load revision history</p>';
        const modalBody = document.querySelector('.unit-modal-body');
        const rightColumn = document.querySelector('.unit-right-column');
        if (modalBody) modalBody.classList.add('two-column');
        if (rightColumn) rightColumn.style.display = 'flex';
    }
}

// Function: createServiceRevisionEntry
function createServiceRevisionEntry(revision, index, total) {
    console.log('🔍 [Service Unit] Creating revision entry:', {
        index,
        total,
        type: revision.type,
        hasDeliverableFiles: !!(revision.deliverableFiles && revision.deliverableFiles.length),
        hasResponseFiles: !!(revision.responseFiles && revision.responseFiles.length)
    });
    
    const entry = document.createElement('div');
    
    // Determine if this is a unit action or requestor action
    const isUnitAction = revision.requestedBy || 
                         (revision.type === 'deliverable_submitted' || 
                          revision.type === 'completed');
    const isRequestorAction = revision.respondedBy || 
                              (revision.type === 'revision_requested' && !revision.requestedBy);
    
    entry.className = `revision-conversation-item ${isUnitAction ? 'unit-action' : 'requestor-action'}`;
    
    // Format timestamp
    const timestamp = new Date(revision.requestedAt || revision.respondedAt);
    const fullTimestamp = timestamp.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    // Get relative time
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let relativeTime;
    if (diffMins < 1) relativeTime = 'Just now';
    else if (diffMins < 60) relativeTime = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    else if (diffHours < 24) relativeTime = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else relativeTime = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Determine message type and styling
    let typeLabel, badgeClass;
    
    if (revision.type === 'deliverable_submitted') {
        typeLabel = 'Deliverables Uploaded';
        badgeClass = 'badge-resubmitted';
    } else if (revision.type === 'approved_by_requestor') {
        typeLabel = '✓ Approved by Requestor';
        badgeClass = 'badge-approved';
    } else if (revision.type === 'completed') {
        typeLabel = '✓ Completed';
        badgeClass = 'badge-approved';
    } else if (revision.type === 'revision_requested') {
        typeLabel = 'Revision Requested';
        badgeClass = 'badge-revision';
    } else {
        typeLabel = 'Update';
        badgeClass = 'badge-revision';
    }
    
    // Get author name
    let authorName = 'Unknown';
    let authorUnit = '';
    
    if (revision.requestedBy) {
        if (typeof revision.requestedBy === 'object' && revision.requestedBy.fName) {
            authorName = `${revision.requestedBy.fName} ${revision.requestedBy.lName}`;
            if (revision.requestedBy.unitTeam) {
                authorUnit = ` (${revision.requestedBy.unitTeam} Unit)`;
            }
        }
    } else if (revision.respondedBy) {
        if (typeof revision.respondedBy === 'object' && revision.respondedBy.fName) {
            authorName = `${revision.respondedBy.fName} ${revision.respondedBy.lName}`;
        }
    }
    
    // Status indicator for last message
    const isLast = index === total - 1;
    let statusIndicator = '';
    
    if (revision.type === 'completed') {
        statusIndicator = `
            <div class="status-indicator approved">
                <svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="8 12 11 15 16 9"/>
                </svg>
                <span style="color: #10b981; font-weight: 600;">Service Request Completed</span>
            </div>
        `;
    } else if (revision.type === 'approved_by_requestor') {
        statusIndicator = `
            <div class="status-indicator approved">
                <svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="8 12 11 15 16 9"/>
                </svg>
                <span style="color: #10b981; font-weight: 600;">Approved by Requestor - Ready to Complete</span>
            </div>
        `;
    } else if (isLast) {
        if (isUnitAction) {
            let statusText = 'Awaiting Requestor Review';
            if (revision.type === 'deliverable_submitted') {
                statusText = 'Deliverables Uploaded - Awaiting Requestor Review';
            }
            statusIndicator = `
                <div class="status-indicator waiting">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    ${statusText}
                </div>
            `;
        } else {
            statusIndicator = `
                <div class="status-indicator under-review">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Under Unit Review
                </div>
            `;
        }
    }
    
    // Get content
    let content = '';
    if (isUnitAction) {
        content = revision.revisionNotes || 'Deliverables submitted';
    } else {
        content = revision.responseNotes || 'Revision requested';
    }
    
    // Get files
    const files = revision.deliverableFiles || revision.responseFiles || [];
    
    // Show revision number for completed entries, otherwise just sequential number
    const badgeNumber = (revision.type === 'completed' && revision.revisionNumber > 0) 
        ? `REV #${revision.revisionNumber}` 
        : `#${index + 1}`;
    
    entry.innerHTML = `
        <div class="revision-number-badge">${badgeNumber}</div>
        <div class="revision-message-bubble">
            <div class="revision-bubble-header">
                <div>
                    <span class="revision-author">${escapeHtml(authorName)}${escapeHtml(authorUnit)}</span>
                    <span class="revision-badge ${badgeClass}" style="margin-left: 0.5rem;">${typeLabel}</span>
                </div>
                <div class="revision-timestamp">
                    <span style="font-weight: 600; color: #1e293b;">${fullTimestamp}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">${relativeTime}</span>
                </div>
            </div>
            
            <div class="message-content-section">
                <div class="content-label">${isUnitAction ? 'UNIT UPDATE:' : 'REQUESTOR FEEDBACK:'}</div>
                <div class="content-text">${displayFormattedText(content)}</div>
            </div>
            
            ${files && files.length > 0 ? `
                <div class="message-attachments-section">
                    <div class="attachments-header">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span class="attachments-count">${files.length} file${files.length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div class="attachments-grid">
                        ${files.map(file => createRevisionFileCard(file, revision.requestedAt || revision.respondedAt)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${statusIndicator}
        </div>
    `;
    
    return entry;
}

// Function: createRevisionEntry
function createRevisionEntry(revision, index, total) {
    console.log('🔍 [Unit] Creating revision entry:', {
        index,
        total,
        hasRequestedBy: !!revision.requestedBy,
        hasRespondedBy: !!revision.respondedBy,
        type: revision.type,
        status: revision.status,
        revisionNotes: revision.revisionNotes,
        responseNotes: revision.responseNotes
    });
    
    const entry = document.createElement('div');
    
    // Determine if this is a unit action or requestor action
    // Unit action: has requestedBy (unit requests revision)
    // Requestor action: has respondedBy (user resubmits)  OR type is 'initial' or 'resubmitted'
    const isRequestorAction = revision.respondedBy || revision.type === 'initial' || revision.type === 'resubmitted';
    const isUnitAction = !isRequestorAction;
    
    entry.className = `revision-conversation-item ${isUnitAction ? 'unit-action' : 'requestor-action'}`;
    
    // Format detailed timestamp - use requestedAt for unit actions, respondedAt for requestor actions
    const timestamp = new Date(revision.requestedAt || revision.respondedAt || revision.timestamp);
    const fullTimestamp = timestamp.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const shortTimestamp = timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get relative time
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let relativeTime;
    if (diffMins < 1) relativeTime = 'Just now';
    else if (diffMins < 60) relativeTime = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    else if (diffHours < 24) relativeTime = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else if (diffDays < 7) relativeTime = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    else relativeTime = shortTimestamp;
    
    // Determine message type and styling
    let typeLabel, badgeClass;
    
    if (revision.type === 'initial') {
        typeLabel = 'Initial Submission';
        badgeClass = 'badge-initial';
    } else if (revision.type === 'approved') {
        typeLabel = '✓ Approved';
        badgeClass = 'badge-approved';
    } else if (revision.type === 'revision_requested') {
        typeLabel = 'Revision Requested';
        badgeClass = 'badge-revision';
    } else if (isUnitAction) {
        // Unit requested revision
        typeLabel = 'Revision Requested';
        badgeClass = 'badge-revision';
    } else if (isRequestorAction) {
        // User resubmitted
        typeLabel = 'Resubmitted For Review';
        badgeClass = 'badge-resubmitted';
    } else {
        typeLabel = 'Update';
        badgeClass = 'badge-revision';
    }
    
    const isLast = index === total - 1;
    
    // Calculate revision/resubmission numbers
    let revisionNumber = 0;
    let resubmissionNumber = 0;
    for (let i = 0; i <= index; i++) {
        // This would need the full array, so we'll use index + 1 as approximation
        if (revision.type === 'revision' || revision.type === 'revoked') {
            revisionNumber = index; // Will be corrected in next iteration
        } else if (revision.type === 'resubmitted') {
            resubmissionNumber = index;
        }
    }
    
    // Determine status indicator for last message
    let statusIndicator = '';
    if (revision.type === 'approved') {
        // Show completion indicator for approved requests
        statusIndicator = `
            <div class="status-indicator approved">
                <svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="8 12 11 15 16 9"/>
                </svg>
                <span style="color: #10b981; font-weight: 600;">Request Approved - Process Complete</span>
            </div>
        `;
    } else if (isLast) {
        if (isUnitAction) {
            statusIndicator = `
                <div class="status-indicator waiting">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Waiting for Requestor Response
                </div>
            `;
        } else {
            statusIndicator = `
                <div class="status-indicator under-review">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Under Unit Review
                </div>
            `;
        }
    }
    
    // Get the actual author name
    let authorName = 'Unknown';
    let authorUnit = '';
    
    if (revision.by) {
        authorName = revision.by;
    } else if (revision.requestedBy) {
        // Unit action - show unit member name
        if (typeof revision.requestedBy === 'object' && revision.requestedBy.fName) {
            authorName = `${revision.requestedBy.fName} ${revision.requestedBy.lName}`;
            if (revision.requestedBy.unitTeam) {
                authorUnit = ` (${revision.requestedBy.unitTeam} Unit)`;
            }
        } else {
            authorName = 'Unit Team';
        }
    } else if (revision.respondedBy) {
        // Requestor action - show requestor name
        if (typeof revision.respondedBy === 'object' && revision.respondedBy.fName) {
            authorName = `${revision.respondedBy.fName} ${revision.respondedBy.lName}`;
        } else {
            authorName = 'Requestor';
        }
    } else if (isUnitAction) {
        authorName = 'Unit Team';
    } else {
        authorName = 'Requestor';
    }
    
    // Show revision number for completed entries, otherwise just sequential number
    const badgeNumber = (revision.type === 'completed' && revision.revisionNumber > 0) 
        ? `REV #${revision.revisionNumber}` 
        : `#${index + 1}`;
    
    entry.innerHTML = `
        <div class="revision-number-badge">${badgeNumber}</div>
        <div class="revision-message-bubble">
            <div class="revision-bubble-header">
                <div>
                    <span class="revision-author">${escapeHtml(authorName)}${escapeHtml(authorUnit)}</span>
                    <span class="revision-badge ${badgeClass}" style="margin-left: 0.5rem;">${typeLabel}</span>
                </div>
                <div class="revision-timestamp">
                    <span style="font-weight: 600; color: #1e293b;">${fullTimestamp}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">${relativeTime}</span>
                </div>
            </div>
            
            <div class="message-content-section">
                <div class="content-label">${(() => {
                    if (revision.type === 'approved') return 'APPROVAL REMARKS:';
                    if (revision.type === 'initial') return 'REQUEST DESCRIPTION:';
                    if (isUnitAction) return 'UNIT FEEDBACK:';
                    return 'USER RESPONSE:';
                })()}</div>
                <div class="content-text">${(() => {
                    let content;
                    if (revision.type === 'approved') {
                        content = revision.revisionNotes || 'The request has been reviewed and approved by the unit team. All requirements have been met.';
                    } else if (revision.type === 'initial') {
                        content = revision.description || 'No description provided';
                    } else if (isUnitAction) {
                        content = revision.revisionNotes || revision.description || 'No feedback provided';
                    } else {
                        content = revision.responseNotes || revision.description || 'No response provided';
                    }
                    console.log('🎯 [Unit] Rendering content:', { isUnitAction, content, type: typeof content });
                    return displayFormattedText(content);
                })()}</div>
            </div>
            
            ${((revision.revisionFiles && revision.revisionFiles.length > 0) || (revision.responseFiles && revision.responseFiles.length > 0) || (revision.files && revision.files.length > 0)) ? `
                <div class="message-attachments-section">
                    <div class="attachments-header">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span class="attachments-count">${(revision.revisionFiles || revision.responseFiles || revision.files || []).length} file${(revision.revisionFiles || revision.responseFiles || revision.files || []).length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div class="attachments-grid">
                        ${(revision.revisionFiles || revision.responseFiles || revision.files || []).map(file => createRevisionFileCard(file, revision.requestedAt || revision.respondedAt || revision.timestamp)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${((revision.revisionLinks && revision.revisionLinks.length > 0) || (revision.responseLinks && revision.responseLinks.length > 0)) ? `
                <div class="message-attachments-section" style="margin-top: 1rem;">
                    <div class="attachments-header">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        <span class="attachments-count">${(revision.revisionLinks || revision.responseLinks).length} link${(revision.revisionLinks || revision.responseLinks).length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
                        ${(revision.revisionLinks || revision.responseLinks).map(link => `
                            <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" 
                               style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; color: #0ea5e9; text-decoration: none; transition: all 0.2s;"
                               onmouseover="this.style.background='#e0f2fe'; this.style.borderColor='#0ea5e9';"
                               onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0';">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(link)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${statusIndicator}
        </div>
    `;
    
    return entry;
}

// Helper function to truncate long filenames intelligently
function truncateFilename(filename, maxLength = 50) {
    if (!filename || filename.length <= maxLength) return filename;
    
    const ext = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const availableLength = maxLength - ext.length - 4; // 4 for "...."
    
    if (availableLength < 10) {
        // Very short limit, just show start and extension
        return nameWithoutExt.substring(0, 10) + '...' + ext;
    }
    
    // Show start and end of filename with ellipsis in middle
    const startLength = Math.ceil(availableLength * 0.6);
    const endLength = Math.floor(availableLength * 0.4);
    
    return nameWithoutExt.substring(0, startLength) + '...' + nameWithoutExt.substring(nameWithoutExt.length - endLength) + '.' + ext;
}

// Function: createRevisionFileCard
function createRevisionFileCard(file, revisionTimestamp) {
    // Handle different file object formats
    const filename = file.filename || file.path || file.name || file;
    
    // If file is just a string (simple filename), use it directly
    if (typeof file === 'string') {
        const ext = file.split('.').pop().toLowerCase();
        const truncatedName = truncateFilename(file, 45);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isPDF = ext === 'pdf';
        
        let iconColor = '#64748b';
        if (isImage) iconColor = '#059669';
        else if (isPDF) iconColor = '#dc2626';
        else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
        else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
        
        return `
            <div class="revision-file-card">
                <div class="revision-file-icon" style="background: ${iconColor}20; color: ${iconColor};">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <line x1="8" y1="8" x2="16" y2="8"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                </div>
                <div class="revision-file-info">
                    <div class="revision-file-name" title="${escapeHtml(file)}">${escapeHtml(truncatedName)}</div>
                    <div class="revision-file-size">${ext.toUpperCase()}</div>
                </div>
                <div class="revision-file-actions">
                    ${isImage ? `
                    <button class="revision-file-btn" onclick="viewImage('/uploads/${file}', '${escapeHtml(file)}')" title="View Image" style="border: none; background: none; cursor: pointer; padding: 0; margin-right: 8px;">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    ` : ''}
                    ${isPDF ? `
                    <button class="revision-file-btn" onclick="viewPdf('/uploads/${file}', '${escapeHtml(file)}')" title="View PDF" style="border: none; background: none; cursor: pointer; padding: 0; margin-right: 8px;">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    ` : ''}
                    <a href="/uploads/${file}" download="${escapeHtml(file)}" class="revision-file-btn" title="Download">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </a>
                </div>
            </div>
        `;
    }
    
    // Handle file objects
    const ext = filename.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPDF = ext === 'pdf';
    
    let iconColor = '#64748b';
    if (isImage) iconColor = '#059669';
    else if (isPDF) iconColor = '#dc2626';
    else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
    else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
    
    const displayName = file.originalname || file.name || filename;
    const truncatedName = truncateFilename(displayName, 45);
    
    return `
        <div class="revision-file-card">
            <div class="revision-file-icon" style="background: ${iconColor}20; color: ${iconColor};">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
            </div>
            <div class="revision-file-info">
                <div class="revision-file-name" title="${escapeHtml(displayName)}">${escapeHtml(truncatedName)}</div>
                <div class="revision-file-size">${ext.toUpperCase()}</div>
            </div>
            <div class="revision-file-actions">
                ${isImage ? `
                <button class="revision-file-btn" onclick="viewImage('/uploads/${filename}', '${escapeHtml(displayName)}')" title="View Image" style="border: none; background: none; cursor: pointer; padding: 0; margin-right: 8px;">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
                ` : ''}
                ${isPDF ? `
                <button class="revision-file-btn" onclick="viewPdf('/uploads/${filename}', '${escapeHtml(displayName)}')" title="View PDF" style="border: none; background: none; cursor: pointer; padding: 0; margin-right: 8px;">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
                ` : ''}
                <a href="/uploads/${filename}" download="${escapeHtml(displayName)}" class="revision-file-btn" title="Download">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </a>
            </div>
        </div>
    `;
}

// Function: populateAdminForm - Populate admin form fields with current values
function populateAdminForm(rowData) {
    // Populate status options
    const statusSelect = document.getElementById('adminStatusSelect');
    const currentStatusValue = document.getElementById('currentStatusValue');
    
    if (statusSelect && currentStatusValue) {
        const statusOptions = [
            { value: 'Pending', label: 'Pending' },
            { value: 'Queued', label: 'Queued' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Approved', label: 'Approved' },
            { value: 'For Revision', label: 'For Revision' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'Archived', label: 'Archived' }
        ];
        
        statusSelect.innerHTML = statusOptions.map(option => 
            `<option value="${option.value}" ${option.value === rowData.status ? 'selected' : ''}>${option.label}</option>`
        ).join('');
        
        // Set current status value
        currentStatusValue.textContent = rowData.status || 'N/A';
    }
    
    // Populate units
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const currentUnitsValue = document.getElementById('currentUnitsValue');

    if (unitsSelect && currentUnitsValue) {
        unitsSelect.innerHTML = `
            <option value="">Not yet assigned</option>
            <optgroup label="Recommended Units (based on request type)">
                <option value="Social Media Unit">⭐ Social Media Unit</option>
                <option value="Graphics Unit">⭐ Graphics Unit</option>
                <option value="Multimedia Unit">⭐ Multimedia Unit</option>
                <option value="Public Relations Unit">⭐ Public Relations Unit</option>
            </optgroup>
            <optgroup label="All Available Units">
                <option value="Social Media Unit">Social Media Unit</option>
                <option value="Graphics Unit">Graphics Unit</option>
                <option value="Multimedia Unit">Multimedia Unit</option>
                <option value="Public Relations Unit">Public Relations Unit</option>
            </optgroup>
        `;

        unitsSelect.value = '';
        
        // Set current units value
        currentUnitsValue.textContent = rowData.units || 'Not yet assigned';
    }
}

// Function: closeRequestModal
function closeRequestModal() {
    const modal = document.getElementById('requestDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Reset forms
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'none';
    }

    const revisionComments = document.getElementById('revisionComments');
    if (revisionComments) {
        revisionComments.value = '';
    }
    
    // Clear revision files
    revisionFiles = [];
    const revisionFilesPreview = document.getElementById('revisionFilesPreview');
    if (revisionFilesPreview) {
        revisionFilesPreview.style.display = 'none';
    }
    const revisionFileInput = document.getElementById('revisionFileInput');
    if (revisionFileInput) {
        revisionFileInput.value = '';
    }

    const deliverablesFileInput = document.getElementById('deliverablesFileInput');
    if (deliverablesFileInput) {
        deliverablesFileInput.value = '';
    }

    const selectedFilesPreview = document.getElementById('selectedFilesPreview');
    if (selectedFilesPreview) {
        selectedFilesPreview.innerHTML = '';
    }

    // Reset modal header color
    const modalHeader = document.querySelector('.unit-modal-header');
    if (modalHeader) {
        modalHeader.classList.remove('approval-header-color', 'service-header-color');
    }

    selectedFiles = [];
    currentRequestId = null;
    currentRequestType = null;
}

// Function: approveRequest
function approveRequest() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Only allow approval for approval requests
    if (currentRequestType !== 'approval') {
        showErrorMessage('Approval is only available for approval requests');
        return;
    }

    // Directly open the final remarks modal for approval
    openCompleteApprovalModal();
}

function showApprovalConfirmation() {
    // Create modal backdrop
    const modal = document.createElement('div');
    modal.id = 'approvalConfirmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <div style="flex-shrink: 0; width: 3rem; height: 3rem; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #16a34a;">
                    <svg width="28" height="28" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="8 12 11 15 16 9"/>
                    </svg>
                </div>
                <div style="flex: 1;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0;">Approve Request</h3>
                    <p style="font-size: 0.9375rem; color: #6b7280; margin: 0; line-height: 1.6;">Are you sure you want to approve this request? You'll be able to add final remarks when you mark it as complete.</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem;">
                <button onclick="closeApprovalConfirmModal()" style="background: #f3f4f6; color: #374151; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                    Cancel
                </button>
                <button onclick="window.confirmApproveRequest()" style="background: #16a34a; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9375rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Yes, Approve</span>
                </button>
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeApprovalConfirmModal();
        }
    });
}

function cancelInlineApprovalConfirmation() {
    // Remove the confirmation panel
    const confirmationPanel = document.getElementById('inlineApprovalConfirmation');
    if (confirmationPanel) {
        confirmationPanel.remove();
    }
    
    // Close modal if exists
    closeApprovalConfirmModal();
}

window.cancelInlineApprovalConfirmation = cancelInlineApprovalConfirmation;

function closeApprovalConfirmModal() {
    const modal = document.getElementById('approvalConfirmModal');
    if (modal) {
        modal.remove();
    }
}

window.closeApprovalConfirmModal = closeApprovalConfirmModal;

// Note: confirmApproveRequest is deprecated - approvals now go directly through completeApproval()
// This function is kept for backward compatibility but redirects to the new flow
async function confirmApproveRequest() {
    console.log('[DEBUG] confirmApproveRequest called - redirecting to openCompleteApprovalModal');
    
    // Close any confirmation modal
    closeApprovalConfirmModal();
    
    // Open the final remarks modal directly
    openCompleteApprovalModal();
}

// Function: completeApproval - Approve request with final remarks (single step - final status is Approved)
async function completeApproval() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Get final remarks from modal
    const remarksTextarea = document.getElementById('approvalFinalRemarksInput');
    const remarks = remarksTextarea ? remarksTextarea.value.trim() : '';
    
    // Validate that remarks are provided
    if (!remarks) {
        showErrorMessage('Please provide final remarks before approving this request. Final remarks are required for reports.');
        return;
    }

    try {
        const response = await fetch(`/unit/task/complete-approval/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                remarks: remarks
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Request approved successfully! Final remarks have been saved.');
            
            // Close the approval modal
            closeCompleteApprovalModal();
            
            // Update modal UI immediately
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'APPROVED';
                modalStatus.className = 'status-badge approved';
            }
            
            // Hide all action buttons and sections since Approved is the final state
            const adminFormSection = document.querySelector('.admin-form-section');
            if (adminFormSection) {
                adminFormSection.style.display = 'none';
            }
            const adminActionButtons = document.querySelector('.admin-action-buttons');
            if (adminActionButtons) {
                adminActionButtons.style.display = 'none';
            }
            
            // Reload revision history to show the approval entry with final remarks
            await loadRevisionHistory(currentRequestId);
            
            // Update table row status in background
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status-badge');
                if (statusCell) {
                    statusCell.textContent = 'Approved';
                    statusCell.className = 'status-badge approved';
                }
            }
        } else {
            showErrorMessage(result.message || 'Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('An error occurred while approving the request');
    }
}

window.completeApproval = completeApproval;

// Function: openCompleteApprovalModal - Open modal for completing approval
function openCompleteApprovalModal() {
    const modal = document.getElementById('completeApprovalModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous input
        const textarea = document.getElementById('approvalFinalRemarksInput');
        if (textarea) {
            textarea.value = '';
        }
    }
}

window.openCompleteApprovalModal = openCompleteApprovalModal;

// Function: closeCompleteApprovalModal - Close completion modal
function closeCompleteApprovalModal() {
    const modal = document.getElementById('completeApprovalModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear input
        const textarea = document.getElementById('approvalFinalRemarksInput');
        if (textarea) {
            textarea.value = '';
        }
    }
}

window.closeCompleteApprovalModal = closeCompleteApprovalModal;

// Function: revokeApproval
function revokeApproval() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Show revoke approval form
    const revokeForm = document.getElementById('revokeApprovalForm');
    if (revokeForm) {
        revokeForm.style.display = 'block';
    }
}

// Function: hideRevokeForm
function hideRevokeForm() {
    const revokeForm = document.getElementById('revokeApprovalForm');
    if (revokeForm) {
        revokeForm.style.display = 'none';
    }

    // Clear revoke reason (Quill or textarea)
    if (window.revokeReasonQuill) {
        window.revokeReasonQuill.setText('');
    } else {
        const revokeReasonText = document.getElementById('revokeReasonText');
        if (revokeReasonText) {
            revokeReasonText.value = '';
        }
    }
}

// Function: submitRevokeApproval
async function submitRevokeApproval() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Get content from Quill editor if available, otherwise from textarea
    let reason = '';
    if (window.revokeReasonQuill) {
        reason = window.revokeReasonQuill.root.innerHTML;
    } else {
        const reasonText = document.getElementById('revokeReasonText');
        reason = reasonText ? reasonText.value.trim() : '';
    }
    
    try {
        const response = await fetch(`/unit/task/revoke-approval/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason || '' })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Approval revoked. Status changed to For Revision.');
            
            // Hide revoke form and approval indicator
            hideRevokeForm();
            
            // Update modal UI immediately
            const approvalStatusIndicator = document.getElementById('approvalStatusIndicator');
            const revisionHistorySection = document.getElementById('revisionHistorySection');
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            const modalStatus = document.getElementById('modalStatus');
            const revokeApprovalForm = document.getElementById('revokeApprovalForm');
            
            if (approvalStatusIndicator) approvalStatusIndicator.style.display = 'none';
            if (revokeApprovalForm) revokeApprovalForm.style.display = 'none';
            if (approvalActionsPanel) approvalActionsPanel.style.display = 'none';
            if (modalStatus) {
                modalStatus.textContent = 'FOR REVISION';
                modalStatus.className = 'status-badge for-revision';
            }
            
            // Reload revision history to show the revocation
            if (currentRequestId) {
                loadRevisionHistory(currentRequestId);
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR REVISION';
                    statusCell.className = 'status for-revision';
                }
            }
        } else {
            showErrorMessage(result.message || 'Failed to revoke approval');
        }
    } catch (error) {
        console.error('Error revoking approval:', error);
        showErrorMessage('An error occurred while revoking the approval');
    }
}

window.confirmApproveRequest = confirmApproveRequest;

// Function: showRevisionForm
function showRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'block';
        
        // Scroll the form into view smoothly
        setTimeout(() => {
            revisionForm.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
            
            // Focus on the textarea
            const revisionComments = document.getElementById('revisionComments');
            if (revisionComments) {
                revisionComments.focus();
            }
        }, 100);
    }
}

// Function: hideRevisionForm
function hideRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'none';
    }

    const revisionNotes = document.getElementById('revisionNotes');
    if (revisionNotes) {
        revisionNotes.value = '';
    }
}

// Function: submitRevision
async function submitRevision() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Get content from Quill editor if available, otherwise from textarea
    let revisionComments;
    if (window.revisionCommentsQuill) {
        const html = window.revisionCommentsQuill.root.innerHTML;
        const text = window.revisionCommentsQuill.getText().trim();
        revisionComments = html;
        
        if (!text) {
            showErrorMessage('Please enter revision feedback');
            return;
        }
    } else {
        revisionComments = document.getElementById('revisionComments')?.value.trim();
        if (!revisionComments) {
            showErrorMessage('Please enter revision feedback');
            return;
        }
    }

    try {
        // Create FormData to handle both text and files
        const formData = new FormData();
        formData.append('revisionNotes', revisionComments);
        
        // Add files if any
        revisionFiles.forEach((file, index) => {
            formData.append('revisionFiles', file);
        });

        const response = await fetch(`/unit/task/revise/${currentRequestId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Revision request submitted successfully');
            
            // Clear and hide revision form
            if (window.revisionCommentsQuill) {
                window.revisionCommentsQuill.setText('');
            } else {
                document.getElementById('revisionComments').value = '';
            }
            clearAllRevisionFiles();
            hideRevisionForm();
            
            // Reload revision history to show the new revision
            await loadRevisionHistory(currentRequestId);
            
            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'FOR REVISION';
                modalStatus.className = 'status-badge for-revision';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR REVISION';
                    statusCell.className = 'status for-revision';
                }
            }
        } else {
            showErrorMessage(result.message || 'Failed to submit revision request');
        }
    } catch (error) {
        console.error('Error submitting revision:', error);
        showErrorMessage('An error occurred while submitting the revision request');
    }
}

// Function: Handle file input change for deliverables
let unitSelectedFiles = [];

function handleFileInputChange(event) {
    const files = event.target.files;
    unitSelectedFiles = Array.from(files);
    updateUnitFileUI();
}

function updateUnitFileUI() {
    const fileManagement = document.getElementById('unitFileManagement');
    const filesCount = document.getElementById('unitFilesCount');
    const selectedFilesContainer = document.getElementById('unitSelectedFiles');
    const filesSummary = document.getElementById('unitFilesSummary');
    const uploadBtn = document.getElementById('uploadDeliverablesBtn');
    
    if (unitSelectedFiles.length > 0) {
        fileManagement.style.display = 'block';
        filesCount.textContent = `${unitSelectedFiles.length} file${unitSelectedFiles.length > 1 ? 's' : ''} selected`;
        
        // Clear and populate selected files
        selectedFilesContainer.innerHTML = '';
        let totalSize = 0;
        
        unitSelectedFiles.forEach((file, index) => {
            totalSize += file.size;
            const fileItem = document.createElement('div');
            fileItem.className = 'unit-file-item-card';
            
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const ext = file.name.split('.').pop().toLowerCase();
            let iconColor = '#64748b';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) iconColor = '#059669';
            else if (ext === 'pdf') iconColor = '#dc2626';
            else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
            else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
            
            fileItem.innerHTML = `
                <div class="unit-file-info-wrapper">
                    <div class="unit-file-icon-wrapper" style="color: ${iconColor};">
                        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <rect x="4" y="4" width="16" height="16" rx="2"/>
                            <line x1="8" y1="8" x2="16" y2="8"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                    </div>
                    <div class="unit-file-details">
                        <div class="unit-file-name-text" title="${file.name}">${file.name}</div>
                        <div class="unit-file-size-text">${fileSizeMB} MB · ${ext.toUpperCase()}</div>
                    </div>
                </div>
                <button type="button" class="unit-remove-file-btn" onclick="removeUnitFile(${index})" aria-label="Remove file">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            selectedFilesContainer.appendChild(fileItem);
        });
        
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        filesSummary.textContent = `Total size: ${totalSizeMB} MB`;
        
        if (uploadBtn) uploadBtn.disabled = false;
    } else {
        fileManagement.style.display = 'none';
        if (uploadBtn) uploadBtn.disabled = true;
    }
}

function removeUnitFile(index) {
    unitSelectedFiles.splice(index, 1);
    
    // Update file input
    const dt = new DataTransfer();
    unitSelectedFiles.forEach(file => dt.items.add(file));
    document.getElementById('deliverablesFileInput').files = dt.files;
    
    updateUnitFileUI();
}

function clearAllUnitFiles() {
    unitSelectedFiles = [];
    document.getElementById('deliverablesFileInput').value = '';
    updateUnitFileUI();
}

// Function: uploadDeliverables
async function uploadDeliverables() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    if (unitSelectedFiles.length === 0) {
        showErrorMessage('Please select files to upload');
        return;
    }

    try {
        // Show upload progress
        const progressBar = document.getElementById('unitUploadProgress');
        const progressFill = document.getElementById('unitProgressFill');
        if (progressBar) {
            progressBar.classList.add('active');
            progressFill.style.width = '0%';
        }

        const formData = new FormData();
        unitSelectedFiles.forEach(file => {
            formData.append('deliverables', file);
        });

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90 && progressFill) {
                progressFill.style.width = progress + '%';
            }
        }, 100);

        const response = await fetch(`/unit/task/upload/${currentRequestId}`, {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        if (progressFill) progressFill.style.width = '100%';

        const result = await response.json();

        setTimeout(() => {
            if (progressBar) progressBar.classList.remove('active');
            if (progressFill) progressFill.style.width = '0%';
        }, 500);

        if (response.ok && result.success) {
            showSuccessMessage(result.message || 'Deliverables uploaded successfully. Status changed to "For Checking".');
            
            // Clear file input and preview
            clearAllUnitFiles();
            document.getElementById('uploadDeliverablesBtn').disabled = true;

            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'FOR CHECKING';
                modalStatus.className = 'status-badge for-checking';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR CHECKING';
                    statusCell.className = 'status for-checking';
                }
            }

            // Reload service revision history if this is a service request
            if (currentRequestType === 'service') {
                loadServiceRevisionHistory(currentRequestId);
            }
        } else {
            showErrorMessage(result.message || 'Failed to upload deliverables');
        }
    } catch (error) {
        console.error('Error uploading deliverables:', error);
        showErrorMessage('An error occurred while uploading deliverables');
    }
}

// Function: completeServiceRequest
async function completeServiceRequest() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    if (!confirm('Are you sure you want to mark this service request as completed?')) {
        return;
    }

    try {
        const response = await fetch(`/unit/task/complete/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Service request marked as completed');
            
            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'COMPLETED';
                modalStatus.className = 'status-badge completed';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'COMPLETED';
                    statusCell.className = 'status completed';
                }
            }

            // Reload service revision history to show completion entry
            if (currentRequestType === 'service') {
                loadServiceRevisionHistory(currentRequestId);
            }
        } else {
            showErrorMessage(result.message || 'Failed to complete service request');
        }
    } catch (error) {
        console.error('Error completing service request:', error);
        showErrorMessage('An error occurred while completing the service request');
    }
}

// Function: loadConversation
async function loadConversation(requestId) {
    try {
        const response = await fetch(`/api/conversation/${requestId}`);
        const result = await response.json();

        const messagesContainer = document.getElementById('conversationMessages') || document.getElementById('teamMessagesContainer');
        if (!messagesContainer) return;

        if (response.ok && result.success && result.conversation) {
            messagesContainer.innerHTML = '';
            
            if (result.conversation.length === 0) {
                messagesContainer.innerHTML = '<p class="no-messages">No messages yet. Start the conversation!</p>';
                return;
            }

            result.conversation.forEach(message => {
                // Skip revision-related messages (they appear in revision history instead)
                const content = message.content || '';
                if (content.includes('Revision Request') || 
                    content.includes('REVISION REQUEST') ||
                    content.includes('Approval Revoked') || 
                    content.includes('APPROVAL REVOKED') ||
                    content.includes('RESUBMITTED') ||
                    content.includes('Revision Required')) {
                    return; // Skip this message
                }
                
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.senderRole === 'unit' ? 'message-unit' : 'message-user'}`;
                
                const senderName = message.senderName || (message.senderRole === 'unit' ? 'Unit Member' : 'Requestor');
                const timestamp = formatDate(message.timestamp);
                
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${senderName}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">${formatText(message.content)}</div>
                `;
                
                messagesContainer.appendChild(messageDiv);
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            messagesContainer.innerHTML = '<p class="no-messages">Unable to load conversation</p>';
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        const messagesContainer = document.getElementById('conversationMessages') || document.getElementById('teamMessagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<p class="no-messages">Error loading conversation</p>';
        }
    }
}

// Function: sendMessage
async function sendMessage() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    const messageInput = document.getElementById('messageInput') || document.getElementById('teamMessageInput');
    const messageText = messageInput?.value.trim();

    if (!messageText) {
        showErrorMessage('Please enter a message');
        return;
    }

    try {
        const response = await fetch(`/api/conversation/${currentRequestId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: messageText,
                senderRole: 'unit'
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Reload conversation to show the new message
            loadTeamConversation(currentRequestId);

            // Clear input
            messageInput.value = '';
        } else {
            showErrorMessage(result.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showErrorMessage('An error occurred while sending the message');
    }
}

// Helper Functions

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const iconMap = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        ppt: '📊',
        pptx: '📊',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        zip: '📦',
        rar: '📦',
        txt: '📃',
        csv: '📋'
    };
    
    return iconMap[ext] || '📎';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to display formatted text (for revision history display)
function displayFormattedText(text) {
    if (!text) return '';
    
    // Check if the text is already HTML (from Quill editor)
    // Quill outputs HTML like <p>text</p>, <strong>bold</strong>, etc.
    if (text.includes('<p>') || text.includes('<strong>') || text.includes('<em>') || text.includes('<u>')) {
        // It's HTML content from Quill, return as-is
        return text;
    }
    
    // It's plain text, escape HTML first
    let formatted = escapeHtml(text);
    
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

// Helper function to format text (for text editor formatting - different from display)
function formatText(text) {
    if (!text) return '';
    
    // Escape HTML first
    let formatted = escapeHtml(text);
    
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

// Expose helper functions globally for createMessageElement
window.escapeHtml = escapeHtml;
window.formatText = formatText;
window.displayFormattedText = displayFormattedText;

function showSuccessMessage(message) {
    // Check if alert handler exists
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'success');
    } else {
        alert(message);
    }
}

function showErrorMessage(message) {
    // Check if alert handler exists
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'error');
    } else {
        alert(message);
    }
}

// ==========================================
// TEAM CONVERSATION MODAL FUNCTIONS
// ==========================================

function openTeamConversationModal() {
    const modal = document.getElementById('teamConversationModal');
    if (modal && currentRequestId) {
        loadTeamConversation(currentRequestId);
        modal.style.display = 'flex';
    }
}

function closeTeamConversationModal() {
    const modal = document.getElementById('teamConversationModal');
    if (modal) {
        modal.style.display = 'none';
        clearConversationInput();
    }
}

function loadTeamConversation(requestId) {
    const container = document.getElementById('teamMessagesContainer');
    if (!container) return;

    fetch(`/api/conversation/${requestId}`)
        .then(response => response.json())
        .then(data => {
            if (data.conversation && data.conversation.length > 0) {
                container.innerHTML = '';
                data.conversation.forEach(msg => {
                    const messageDiv = createMessageElement(msg);
                    container.appendChild(messageDiv);
                });
                container.scrollTop = container.scrollHeight;
            } else {
                container.innerHTML = `
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
            }
        })
        .catch(error => {
            console.error('Error loading conversation:', error);
            showErrorMessage('Failed to load conversation');
        });
}

function createMessageElement(msg) {
    const div = document.createElement('div');
    
    // Determine if this is the current user's message
    const isOwnMessage = window.currentUserFullName && msg.senderName === window.currentUserFullName;
    
    // Role-based styling (matching Admin)
    let roleClass = 'user-message';
    let roleColor = '#e0f2fe'; // Light blue for users
    
    if (isOwnMessage) {
        roleClass = 'own-message';
        roleColor = '#ffffff'; // White for own messages (matches Admin)
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
        const attachmentItems = msg.attachments.map(file => {
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
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
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
        
        attachmentsHTML = `
            <div class="message-attachments-section">
                ${attachmentItems}
            </div>
        `;
    }
    
    // Build read receipts display
    let readReceiptsHTML = '';
    if (msg.readBy && msg.readBy.length > 0 && isOwnMessage) {
        const readers = msg.readBy
            .filter(r => r.userId && r.userId.fName)
            .map(r => `${r.userId.fName} ${r.userId.lName}`)
            .join(', ');
        if (readers) {
            readReceiptsHTML = `
                <div class="message-read-receipt">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Seen by ${readers}</span>
                </div>
            `;
        }
    }
    
    div.innerHTML = `
        <div class="unit-message-bubble ${roleClass}">
            <div class="message-header">
                <strong>${window.escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${window.formatText(msg.content || '')}</div>
            ${attachmentsHTML}
            ${readReceiptsHTML}
        </div>
    `;
    
    return div;
}

async function sendTeamMessage() {
    // Get content from Quill editor if available, otherwise from textarea
    let content = '';
    let plainText = '';
    
    if (window.teamMessageQuill) {
        content = window.teamMessageQuill.root.innerHTML;
        plainText = window.teamMessageQuill.getText().trim();
    } else {
        const input = document.getElementById('teamMessageInput');
        content = input ? input.value.trim() : '';
        plainText = content;
    }
    
    if (!plainText && chatFiles.length === 0) {
        showErrorMessage('Please enter a message or select a file');
        return;
    }
    
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }
    
    try {
        console.log('[AllTasks] Sending message with', chatFiles.length, 'files');
        let response;
        
        if (chatFiles.length > 0) {
            // Send with file attachments using FormData
            const formData = new FormData();
            formData.append('content', content || '');
            
            // Append all files with 'chatFiles' field name
            chatFiles.forEach(file => {
                formData.append('chatFiles', file);
            });
            
            console.log('[AllTasks] FormData prepared with chatFiles field');
            
            response = await fetch(`/api/conversation/${currentRequestId}/message`, {
                method: 'POST',
                body: formData
            });
        } else {
            // Send text only using JSON
            response = await fetch(`/api/conversation/${currentRequestId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });
        }
        
        if (!response.ok) {
            let errorMessage = 'Failed to send message';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                if (response.status === 401) errorMessage = 'Session expired. Please log in again.';
                else if (response.status === 403) errorMessage = 'Access denied.';
                else errorMessage = `Server error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('[AllTasks] Message sent successfully');
        
        // Clear message input (Quill or textarea)
        if (window.teamMessageQuill) {
            window.teamMessageQuill.setText('');
        } else {
            const input = document.getElementById('teamMessageInput');
            if (input) input.value = '';
        }
        
        clearAllChatFiles();
        // Reload conversation to show new message
        await loadTeamConversation(currentRequestId);
        console.log('[AllTasks] Conversation reloaded');
    } catch (error) {
        console.error('[AllTasks] Error sending message:', error);
        showErrorMessage('Failed to send message: ' + error.message);
    }
}

function clearConversationInput() {
    // Clear message input (Quill or textarea)
    if (window.teamMessageQuill) {
        window.teamMessageQuill.setText('');
    } else {
        const input = document.getElementById('teamMessageInput');
        if (input) input.value = '';
    }
    
    const preview = document.getElementById('attachmentPreview');
    if (preview) preview.style.display = 'none';
}

// ==========================================
// TEXT FORMATTING FUNCTIONS
// ==========================================

function applyTextFormat(format) {
    const input = document.getElementById('teamMessageInput');
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const selectedText = text.substring(start, end);

    let formattedText = selectedText;
    let wrapper = '';

    switch(format) {
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

    if (selectedText) {
        input.value = text.substring(0, start) + formattedText + text.substring(end);
        input.focus();
        input.selectionStart = start;
        input.selectionEnd = start + formattedText.length;
    }
}

// Create global alias for notification system
window.openConversationModal = openTeamConversationModal;

// ==========================================
// EVENT LISTENER SETUP FOR CONVERSATION
// ==========================================

// Add conversation modal event listeners after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced file upload setup
    setupEnhancedFileUpload();
    
    // Open team chat button
    const openChatBtn = document.getElementById('openTeamChatBtn');
    if (openChatBtn) {
        openChatBtn.removeEventListener('click', openTeamConversationModal); // Remove any existing
        openChatBtn.addEventListener('click', openTeamConversationModal);
    }

    // Send team message button - ensure only one listener
    const sendTeamBtn = document.getElementById('sendTeamMessageBtn');
    if (sendTeamBtn) {
        // Clone and replace to remove all existing listeners
        const newSendBtn = sendTeamBtn.cloneNode(true);
        sendTeamBtn.parentNode.replaceChild(newSendBtn, sendTeamBtn);
        newSendBtn.addEventListener('click', sendTeamMessage);
    }

    // Enter key to send - ensure only one listener
    const teamInput = document.getElementById('teamMessageInput');
    if (teamInput) {
        // Clone and replace to remove all existing listeners
        const newInput = teamInput.cloneNode(true);
        teamInput.parentNode.replaceChild(newInput, teamInput);
        newInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTeamMessage();
            }
        });
    }

    // Text formatting buttons
    const boldBtn = document.getElementById('boldBtn');
    if (boldBtn) {
        boldBtn.addEventListener('click', () => applyTextFormat('bold'));
    }

    const italicBtn = document.getElementById('italicBtn');
    if (italicBtn) {
        italicBtn.addEventListener('click', () => applyTextFormat('italic'));
    }

    const underlineBtn = document.getElementById('underlineBtn');
    if (underlineBtn) {
        underlineBtn.addEventListener('click', () => applyTextFormat('underline'));
    }

    // File upload buttons (placeholder - implement as needed)
    const imageBtn = document.getElementById('imageBtn');
    if (imageBtn) {
        imageBtn.addEventListener('click', () => {
            const imageUpload = document.getElementById('imageUpload');
            if (imageUpload) imageUpload.click();
        });
    }

    const fileBtn = document.getElementById('fileBtn');
    if (fileBtn) {
        fileBtn.addEventListener('click', () => {
            const fileUpload = document.getElementById('fileUpload');
            if (fileUpload) fileUpload.click();
        });
    }
});

// Enhanced file preview function (like user side)
function createEnhancedFilePreview(allFiles, previewContainer, uploadTimestamp) {
  if (!previewContainer) return;
  
  if (allFiles.length > 0) {
    const enhancedPreview = document.createElement('div');
    enhancedPreview.className = 'enhanced-file-preview';
    
    let fileGridHTML = `
      <h3>
        <svg width="20" height="20" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        Attached Files (${allFiles.length})
      </h3>
      <div class="file-grid">
    `;
    
    allFiles.forEach((file, index) => {
      const fileObj = typeof file === 'string' ? { filename: file, originalname: file } : file;
      const fileName = fileObj.originalname || fileObj.filename || file;
      const fileUrl = `/uploads/${fileObj.filename || file}`;
      const ext = fileName.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
      const isPDF = ext === 'pdf';
      const isDoc = ['doc', 'docx'].includes(ext);
      const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext);
      const isText = ['txt', 'rtf'].includes(ext);
      
      // Get upload timestamp from request creation time or file metadata
      let uploadTimeInfo = '';
      const timestamp = fileObj.createdAt || fileObj.uploadedAt || fileObj.timestamp || uploadTimestamp;
      if (timestamp) {
        const uploadDate = new Date(timestamp);
        uploadTimeInfo = uploadDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Determine file icon
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
              <div class="file-name-enhanced" title="${fileName}">${fileName}</div>
              <div class="file-type-enhanced">
                <span>${ext.toUpperCase()} FILE</span>
                ${uploadTimeInfo ? `<span class="file-upload-timestamp" title="Uploaded: ${uploadTimeInfo}">
                  <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 3px;">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  ${uploadTimeInfo}
                </span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="file-preview-container">
      `;
      
      if (isImage) {
        fileGridHTML += `
          <img src="${fileUrl}" 
               alt="Preview of ${fileName}" 
               onclick="openImagePreview('${fileUrl}', '${fileName}')"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div style="display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; height: 160px;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">
              <svg width="32" height="32" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8" cy="8" r="2"/>
                <path d="M21 21l-6-6a2 2 0 0 0-2.83 0L3 21"/>
              </svg>
            </div>
            <p>Preview Not Available</p>
            <small>Click download</small>
          </div>
        `;
      } else if (isPDF) {
        fileGridHTML += `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #dc2626; height: 160px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">
              <svg width="40" height="40" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
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
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #2563eb; height: 160px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">
              <svg width="40" height="40" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
              </svg>
            </div>
            <p><strong>Word Document</strong></p>
            <small>Click download to view</small>
          </div>
        `;
      } else if (isSpreadsheet) {
        fileGridHTML += `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #16a34a; height: 160px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">
              <svg width="40" height="40" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24">
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
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; height: 160px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${fileIcon}</div>
            <p><strong>Document File</strong></p>
            <small>Click download to view</small>
          </div>
        `;
      }
      
      fileGridHTML += `
        </div>
        
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: center; align-items: stretch; width: 100%;">
          <a href="${fileUrl}" download="${fileName}" class="download-btn-enhanced">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download
          </a>
          ${isPDF ? `<button onclick="viewPdf('${fileUrl}', '${fileName}')" class="download-btn-enhanced" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View PDF
          </button>` : ''}
          ${isImage ? `<button onclick="openImagePreview('${fileUrl}', '${fileName}')" class="download-btn-enhanced" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
            <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View
          </button>` : ''}
        </div>
      </div>
      `;
    });
    
    fileGridHTML += `</div>`;
    enhancedPreview.innerHTML = fileGridHTML;
    previewContainer.appendChild(enhancedPreview);
  } else {
    previewContainer.innerHTML = `
      <div class="enhanced-file-preview">
        <h3>
          <svg width="20" height="20" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
          Attached Files
        </h3>
        <div class="no-files-message">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.6;">
            <svg width="64" height="64" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="11" rx="2"/>
              <path d="M3 7l9 6 9-6"/>
            </svg>
          </div>
          <div class="no-files-title">No Files Attached</div>
          <div class="no-files-subtitle">
            This request was submitted without any file attachments.
          </div>
        </div>
      </div>
    `;
  }
}

// Image preview modal function
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
    z-index: 999999;
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
  closeBtn.innerHTML = '&times;';
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
    font-size: 20px;
    font-weight: bold;
    color: #1e293b;
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

// Setup Enhanced File Upload with Drag and Drop
function setupEnhancedFileUpload() {
    const fileUploadGroup = document.getElementById('unitFileUploadGroup');
    const fileInput = document.getElementById('deliverablesFileInput');
    const clearAllBtn = document.getElementById('unitClearAllBtn');
    
    if (!fileUploadGroup || !fileInput) return;
    
    // Click to select files
    fileUploadGroup.addEventListener('click', (e) => {
        if (e.target.closest('.unit-browse-file-btn')) return;
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileInputChange);
    
    // Clear all button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllUnitFiles);
    }
    
    // Drag and drop
    fileUploadGroup.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadGroup.classList.add('dragging');
    });
    
    fileUploadGroup.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === fileUploadGroup) {
            fileUploadGroup.classList.remove('dragging');
        }
    });
    
    fileUploadGroup.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadGroup.classList.remove('dragging');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Update file input
            const dt = new DataTransfer();
            Array.from(files).forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
            
            // Trigger change event
            handleFileInputChange({ target: { files: dt.files } });
        }
    });
}

// ==========================================
// REVISION FORM FEATURES
// ==========================================

function initializeRevisionFeatures() {
    // Text formatting buttons are now handled in AllTasks.ejs to avoid duplication

    // Attach files button
    const attachBtn = document.getElementById('revisionAttachBtn');
    const fileInput = document.getElementById('revisionFileInput');
    
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleRevisionFileSelect);
    }

    // Clear all files button
    const clearFilesBtn = document.getElementById('clearRevisionFiles');
    if (clearFilesBtn) {
        clearFilesBtn.addEventListener('click', clearAllRevisionFiles);
    }
}

// Revision formatting is now handled in AllTasks.ejs - keeping stub for backward compatibility
window.applyRevisionFormat = function(format) {
    console.log('[AllTasks] applyRevisionFormat called but handled in EJS');
};

function applyRevisionFormat(format) {
    window.applyRevisionFormat(format);
}

// Apply formatting to revoke reason textarea
window.applyRevokeFormat = function(format) {
    const textarea = document.getElementById('revokeReasonText');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText) {
        // If no text selected, just focus the textarea
        textarea.focus();
        return;
    }
    
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = selectedText;
    let newCursorPos = end;

    switch(format) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            newCursorPos = start + formattedText.length;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            newCursorPos = start + formattedText.length;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            newCursorPos = start + formattedText.length;
            break;
        case 'bullet':
            const lines = selectedText.split('\n');
            formattedText = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
            newCursorPos = start + formattedText.length;
            break;
    }

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
};

function handleRevisionFileSelect(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        // Check if file already exists
        const exists = revisionFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            revisionFiles.push(file);
        }
    });
    
    updateRevisionFilesPreview();
}

function updateRevisionFilesPreview() {
    const preview = document.getElementById('revisionFilesPreview');
    const container = document.getElementById('revisionFilesContainer');
    const filesCount = preview.querySelector('.files-count');
    
    if (!preview || !container) return;
    
    if (revisionFiles.length > 0) {
        preview.style.display = 'block';
        filesCount.textContent = `${revisionFiles.length} file(s) attached`;
        
        container.innerHTML = '';
        revisionFiles.forEach((file, index) => {
            const fileItem = createRevisionFileItem(file, index);
            container.appendChild(fileItem);
        });
    } else {
        preview.style.display = 'none';
    }
}

function createRevisionFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'revision-file-item';
    
    const fileSizeKB = (file.size / 1024).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
    
    const ext = file.name.split('.').pop().toLowerCase();
    let iconColor = '#64748b';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) iconColor = '#059669';
    else if (ext === 'pdf') iconColor = '#dc2626';
    else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
    else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
    
    item.innerHTML = `
        <div class="file-item-info">
            <div class="file-item-icon" style="color: ${iconColor};">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="16" x2="12" y2="16"/>
                </svg>
            </div>
            <div class="file-item-details">
                <div class="file-item-name" title="${file.name}">${file.name}</div>
                <div class="file-item-size">${displaySize}</div>
            </div>
        </div>
        <button type="button" class="remove-file-btn" onclick="removeRevisionFile(${index})" title="Remove file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    return item;
}

window.removeRevisionFile = function(index) {
    revisionFiles.splice(index, 1);
    updateRevisionFilesPreview();
    
    // Update file input
    const fileInput = document.getElementById('revisionFileInput');
    if (fileInput) {
        const dt = new DataTransfer();
        revisionFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }
};

function clearAllRevisionFiles() {
    revisionFiles = [];
    updateRevisionFilesPreview();
    
    const fileInput = document.getElementById('revisionFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

// ==========================================
// CHAT FILE ATTACHMENTS
// ==========================================

let chatFiles = [];

function initializeChatFileFeatures() {
    console.log('[AllTasks] Initializing chat file features...');
    // Attach files button
    const attachBtn = document.getElementById('chatAttachBtn');
    const fileInput = document.getElementById('chatFileInput');
    
    if (attachBtn && fileInput) {
        console.log('[AllTasks] Chat file elements found');
        attachBtn.addEventListener('click', () => {
            console.log('[AllTasks] Attach button clicked');
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleChatFileSelect);
    } else {
        console.warn('[AllTasks] Chat file elements not found:', { attachBtn: !!attachBtn, fileInput: !!fileInput });
    }

    // Clear all files button
    const clearFilesBtn = document.getElementById('clearChatFiles');
    if (clearFilesBtn) {
        clearFilesBtn.addEventListener('click', clearAllChatFiles);
    }
    
    // Text formatting for chat
    const chatFormatBtns = document.querySelectorAll('[data-chat-format]');
    chatFormatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-chat-format');
            applyChatFormat(format);
        });
    });
}

function handleChatFileSelect(event) {
    console.log('[AllTasks] File selection triggered');
    const files = Array.from(event.target.files);
    console.log('[AllTasks] Selected files:', files.length);
    
    files.forEach(file => {
        // Check if file already exists
        const exists = chatFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            chatFiles.push(file);
            console.log('[AllTasks] Added file:', file.name);
        } else {
            console.log('[AllTasks] Duplicate file skipped:', file.name);
        }
    });
    
    console.log('[AllTasks] Total files:', chatFiles.length);
    updateChatFilesPreview();
}

function updateChatFilesPreview() {
    const preview = document.getElementById('chatFilesPreview');
    const container = document.getElementById('chatFilesContainer');
    const filesCount = preview.querySelector('.files-count');
    
    if (!preview || !container) return;
    
    if (chatFiles.length > 0) {
        preview.style.display = 'block';
        filesCount.textContent = `${chatFiles.length} file(s) attached`;
        
        container.innerHTML = '';
        chatFiles.forEach((file, index) => {
            const fileItem = createChatFileItem(file, index);
            container.appendChild(fileItem);
        });
    } else {
        preview.style.display = 'none';
    }
}

function createChatFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'revision-file-item';
    
    const fileSizeKB = (file.size / 1024).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
    
    const ext = file.name.split('.').pop().toLowerCase();
    let iconColor = '#64748b';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) iconColor = '#059669';
    else if (ext === 'pdf') iconColor = '#dc2626';
    else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
    else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
    
    item.innerHTML = `
        <div class="file-item-info">
            <div class="file-item-icon" style="color: ${iconColor};">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="16" x2="12" y2="16"/>
                </svg>
            </div>
            <div class="file-item-details">
                <div class="file-item-name" title="${file.name}">${file.name}</div>
                <div class="file-item-size">${displaySize}</div>
            </div>
        </div>
        <button type="button" class="remove-file-btn" onclick="removeChatFile(${index})" title="Remove file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    return item;
}

window.removeChatFile = function(index) {
    chatFiles.splice(index, 1);
    updateChatFilesPreview();
    
    // Update file input
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) {
        const dt = new DataTransfer();
        chatFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }
};

function clearAllChatFiles() {
    chatFiles = [];
    updateChatFilesPreview();
    
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

function applyChatFormat(format) {
    const textarea = document.getElementById('teamMessageInput');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = selectedText;
    let newCursorPos = end;

    switch(format) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            newCursorPos = start + formattedText.length;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            newCursorPos = start + formattedText.length;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            newCursorPos = start + formattedText.length;
            break;
    }

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
}

// PDF Viewer Functions
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

// Image viewer modal
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

// ==========================================
// QUEUED STATUS HANDLING - START TASK
// ==========================================
function handleQueuedStatus(status, requestId, requestType) {
    const statusLower = status.toLowerCase().trim();
    
    const actionPanel = requestType === 'approval' 
        ? document.getElementById('approvalActionsPanel')
        : document.getElementById('serviceActionsPanel');
    
    if (!actionPanel) return;
    
    // Show the action panel for all statuses
    actionPanel.style.display = 'block';
}



// Initialize chat file features when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChatFileFeatures();
    
    // Initialize admin action buttons
    initializeAdminActionButtons();
    
    // Keyboard shortcuts are now handled in AllTasks.ejs to avoid duplication
});

// Function: initializeAdminActionButtons - Initialize admin action button event handlers
function initializeAdminActionButtons() {
    // Approve Request Button
    const adminApproveBtn = document.getElementById('adminApproveBtn');
    if (adminApproveBtn) {
        adminApproveBtn.addEventListener('click', function() {
            approveRequest();
        });
    }

    // Ask for Revisions Button
    const adminRevisionBtn = document.getElementById('adminRevisionBtn');
    if (adminRevisionBtn) {
        adminRevisionBtn.addEventListener('click', function() {
            showAdminRevisionForm();
        });
    }

    // Cancel Revision Button
    const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
    if (cancelRevisionBtn) {
        cancelRevisionBtn.addEventListener('click', function() {
            hideAdminRevisionForm();
        });
    }

    // Submit Revision Button
    const submitRevisionBtn = document.getElementById('submitRevisionBtn');
    if (submitRevisionBtn) {
        submitRevisionBtn.addEventListener('click', function() {
            submitAdminRevision();
        });
    }

    // Submit Complete Approval Button (from modal) - handles final approval with remarks
    const submitCompleteApprovalBtn = document.getElementById('submitCompleteApprovalBtn');
    if (submitCompleteApprovalBtn) {
        submitCompleteApprovalBtn.addEventListener('click', function() {
            completeApproval();
        });
    }

    // Revision File Attachment Button
    const revisionAttachBtn = document.getElementById('revisionAttachBtn');
    const revisionFileInput = document.getElementById('revisionFileInput');
    if (revisionAttachBtn && revisionFileInput) {
        revisionAttachBtn.addEventListener('click', function() {
            revisionFileInput.click();
        });

        revisionFileInput.addEventListener('change', function(e) {
            handleRevisionFileSelection(e.target.files);
        });
    }

    // Revision Text Formatting Buttons
    initializeRevisionFormatting();
}

// Function: showAdminRevisionForm - Show the admin revision form
function showAdminRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'block';
        // Scroll to the form
        revisionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Function: hideAdminRevisionForm - Hide the admin revision form
function hideAdminRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'none';
        // Clear the form
        const revisionComments = document.getElementById('revisionComments');
        if (revisionComments) {
            revisionComments.value = '';
        }
        clearRevisionFiles();
    }
}

// Function: submitAdminRevision - Submit admin revision request
async function submitAdminRevision() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    const revisionComments = document.getElementById('revisionComments')?.value.trim();
    if (!revisionComments) {
        showErrorMessage('Please enter revision feedback');
        return;
    }

    try {
        // Create FormData to handle both text and files
        const formData = new FormData();
        formData.append('revisionNotes', revisionComments);

        // Add files if any
        revisionFiles.forEach((file, index) => {
            formData.append('revisionFiles', file);
        });

        const response = await fetch(`/unit/task/revise/${currentRequestId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Revision request submitted successfully');

            // Clear and hide revision form
            document.getElementById('revisionComments').value = '';
            clearRevisionFiles();
            hideAdminRevisionForm();

            // Reload revision history to show the new revision immediately
            await loadRevisionHistory(currentRequestId);

            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'FOR REVISION';
                modalStatus.className = 'status-badge for-revision';
            }

            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status-badge');
                if (statusCell) {
                    statusCell.textContent = 'FOR REVISION';
                    statusCell.className = 'status-badge for-revision';
                }
                tableRow.setAttribute('data-status', 'For Revision');
            }
        } else {
            showErrorMessage(result.message || 'Failed to submit revision request');
        }
    } catch (error) {
        console.error('Error submitting revision:', error);
        showErrorMessage('An error occurred while submitting the revision request');
    }
}

// Function: handleRevisionFileSelection - Handle file selection for revisions
function handleRevisionFileSelection(files) {
    Array.from(files).forEach(file => {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showErrorMessage(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return;
        }

        // Check if file already exists
        const exists = revisionFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size);
        if (exists) {
            showErrorMessage(`File "${file.name}" is already attached.`);
            return;
        }

        revisionFiles.push(file);
    });

    updateRevisionFilesPreview();
}

// Function: clearRevisionFiles - Clear all revision files
function clearRevisionFiles() {
    revisionFiles = [];
    const revisionFileInput = document.getElementById('revisionFileInput');
    if (revisionFileInput) {
        revisionFileInput.value = '';
    }
    updateRevisionFilesPreview();
}

// Function: updateRevisionFilesPreview - Update the revision files preview
function updateRevisionFilesPreview() {
    const revisionFilesPreview = document.getElementById('revisionFilesPreview');
    const revisionFilesContainer = document.getElementById('revisionFilesContainer');
    const filesCount = document.querySelector('.files-count');

    if (!revisionFilesPreview || !revisionFilesContainer) return;

    if (revisionFiles.length > 0) {
        revisionFilesPreview.style.display = 'block';
        if (filesCount) {
            filesCount.textContent = `${revisionFiles.length} file${revisionFiles.length > 1 ? 's' : ''} attached`;
        }

        revisionFilesContainer.innerHTML = revisionFiles.map((file, index) => `
            <div class="file-item" data-index="${index}">
                <div class="file-info">
                    <div class="file-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                    </div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="remove-file-btn" onclick="removeRevisionFile(${index})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    } else {
        revisionFilesPreview.style.display = 'none';
    }
}

// Function: removeRevisionFile - Remove a specific revision file
function removeRevisionFile(index) {
    if (index >= 0 && index < revisionFiles.length) {
        revisionFiles.splice(index, 1);
        updateRevisionFilesPreview();
    }
}

// Function: initializeRevisionFormatting - Initialize text formatting for revision comments
function initializeRevisionFormatting() {
    // Use event delegation for revision formatting buttons
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-revision-format]');
        if (target) {
            e.preventDefault();
            e.stopPropagation();

            const revisionComments = document.getElementById('revisionComments');
            if (!revisionComments) return;

            const format = target.getAttribute('data-revision-format');
            applyTextFormatting(revisionComments, format);
        }
    });

    // Keyboard shortcuts are handled in AllTasks.ejs to avoid duplication
}

// Function: applyTextFormatting - Apply text formatting to textarea
function applyTextFormatting(textarea, format) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    if (format === 'bold') {
        formattedText = `**${selectedText}**`;
    } else if (format === 'italic') {
        formattedText = `*${selectedText}*`;
    } else if (format === 'underline') {
        formattedText = `<u>${selectedText}</u>`;
    }

    // Insert formatted text
    textarea.value = beforeText + formattedText + afterText;

    // Position cursor - if no text selected, place between tags; if text selected, place after
    let newPosition;
    if (selectedText.length === 0) {
        newPosition = start + (format === 'bold' ? 2 : 1);
    } else {
        newPosition = start + formattedText.length;
    }
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
}

// Function: formatFileSize - Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// COMPLETE TASK MODAL FUNCTIONS
// ==========================================

// Function: openCompleteTaskModal
function openCompleteTaskModal() {
    const modal = document.getElementById('completeTaskModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous input
        const remarksInput = document.getElementById('finalRemarksInput');
        if (remarksInput) remarksInput.value = '';
    }
}

// Function: closeCompleteTaskModal
window.closeCompleteTaskModal = function() {
    const modal = document.getElementById('completeTaskModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Function: submitCompleteTask
async function submitCompleteTask() {
    const remarksInput = document.getElementById('finalRemarksInput');
    const finalRemarks = remarksInput ? remarksInput.value.trim() : '';

    if (!finalRemarks) {
        showErrorMessage('Please provide final remarks');
        return;
    }

    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    try {
        const submitBtn = document.getElementById('submitCompleteTaskBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Completing...</span>';
        }

        const response = await fetch(`/unit/task/complete/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ finalRemarks })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Task completed successfully!');
            closeCompleteTaskModal();

            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'COMPLETED';
                modalStatus.className = 'status-badge completed';
            }

            // Update table row status
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status-badge');
                if (statusCell) {
                    statusCell.textContent = 'COMPLETED';
                    statusCell.className = 'status-badge completed';
                }
                tableRow.setAttribute('data-status', 'Completed');
            }

            // Hide both panels since task is now completed
            const completeTaskPanel = document.getElementById('completeTaskPanel');
            const serviceActionsPanel = document.getElementById('serviceActionsPanel');
            if (completeTaskPanel) completeTaskPanel.style.display = 'none';
            if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';

            if (currentRequestType === 'service') {
                loadServiceRevisionHistory(currentRequestId);
            }
        } else {
            showErrorMessage(result.message || 'Failed to complete task');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showErrorMessage('An error occurred while completing the task');
    } finally {
        const submitBtn = document.getElementById('submitCompleteTaskBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Complete Task
            `;
        }
    }
}

// Make openRequestDetails globally accessible for notifications
window.openRequestModal = function(requestId, requestType) {
    console.log('🌐 Global openRequestModal called:', { requestId, requestType });
    openRequestDetails(requestId, requestType);
};

// Check URL parameters and auto-open modals if needed
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if we should open a modal
    const hasModal = urlParams.has('modal');
    const hasConversation = urlParams.has('conversation');
    const requestId = urlParams.get('requestId');
    const requestType = urlParams.get('type');
    
    console.log('🔍 Checking URL parameters:', { hasModal, hasConversation, requestId, requestType });
    
    if (requestId && requestType && (hasModal || hasConversation)) {
        console.log('📋 Auto-opening modal from URL parameters');
        
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            // Open the request modal
            openRequestDetails(requestId, requestType);
            
            // If conversation parameter is present, also open conversation tab
            if (hasConversation) {
                setTimeout(() => {
                    const conversationTab = document.querySelector('[data-tab="conversation"]');
                    if (conversationTab) {
                        console.log('💬 Switching to conversation tab');
                        conversationTab.click();
                    }
                }, 500);
            }
        }, 300);
    }
}
