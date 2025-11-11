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

// DOM Elements
const detailModal = document.getElementById("detailsModal");
const closeDetailsModal = document.getElementById("closeDetailsModal");
const clearFiltersBtn = document.getElementById("clearFilters");
const tableBody = document.getElementById("requestsTableBody");
const allRows = Array.from(document.querySelectorAll('.request-row'));
const conversationModal = document.getElementById("conversationModal");
const closeConversationModal = document.getElementById("closeConversationModal");
const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const openChatFromDetailsModal = document.getElementById("openChatFromDetailsModal");
let currentConversationId = null;

// Filter variables
let organizationFilter;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize organization filter based on user's organizations
  if (userOrganizations.length > 0) {
    const placeholderText = userType === 'student' ? 'My Organizations' : 'My Departments';
    organizationFilter = new EnhancedMultiSelect('organizationFilter', 
      userOrganizations, 
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
});

// Modal close handlers
closeDetailsModal.onclick = () => detailModal.style.display = 'none';
closeConversationModal.onclick = () => conversationModal.style.display = 'none';

openChatFromDetailsModal.onclick = function() {
  detailModal.style.display = 'none';
  openChat(currentConversationId);
};

window.onclick = function(event) {
  if (event.target === detailModal) detailModal.style.display = 'none';
  if (event.target === conversationModal) conversationModal.style.display = 'none';
}

function filterRequests() {
  const selectedTypes = getSelectedTypes();
  const selectedStatuses = getSelectedStatuses();
  const titleValue = document.getElementById('titleFilter').value.toLowerCase();
  const requestorValue = document.getElementById('requestorFilter') ? document.getElementById('requestorFilter').value.toLowerCase() : '';
  const organizationValue = organizationFilter ? organizationFilter.getSelectedValues() : ['all'];
  const dateFromValue = document.getElementById('dateFromFilter').value ? new Date(document.getElementById('dateFromFilter').value) : null;
  const dateToValue = document.getElementById('dateToFilter').value ? new Date(document.getElementById('dateToFilter').value) : null;
  
  let visibleCount = 0;

  allRows.forEach(row => {
    const rowType = row.dataset.type.toLowerCase();
    const rowStatus = row.dataset.status.toLowerCase();
    const rowTitle = row.dataset.title.toLowerCase();
    const rowRequestor = (row.dataset.requestor || '').toLowerCase();
    const rowOrganization = row.dataset.organization.toLowerCase();
    const rowDate = new Date(row.dataset.date);

    // Type filter logic
    let typeMatch = true;
    if (selectedTypes.length > 0 && !selectedTypes.includes('all')) {
      typeMatch = selectedTypes.some(type => rowType.includes(type.toLowerCase()));
    }

    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes('all') || selectedStatuses.includes(rowStatus);
    const titleMatch = titleValue === '' || rowTitle.includes(titleValue);
    const requestorMatch = requestorValue === '' || rowRequestor.includes(requestorValue);
    
    // Organization filter logic
    let organizationMatch = true;
    if (organizationFilter && organizationValue.length > 0 && !organizationValue.includes('all')) {
      organizationMatch = organizationValue.some(org => 
        rowOrganization.includes(org.toLowerCase())
      );
    }
    
    let dateMatch = true;
    if (dateFromValue && rowDate < dateFromValue) dateMatch = false;
    if (dateToValue && rowDate > dateToValue) dateMatch = false;

    const isVisible = typeMatch && statusMatch && titleMatch && requestorMatch && organizationMatch && dateMatch;
    row.style.display = isVisible ? '' : 'none';
    
    if (isVisible) visibleCount++;
  });

  const totalCount = allRows.length;
  const resultsCount = document.getElementById('resultsCount');
  if (visibleCount === totalCount) {
    resultsCount.textContent = `Showing all ${totalCount} tasks`;
  } else {
    resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} tasks`;
  }

  toggleNoResultsMessage(visibleCount === 0);
}

function toggleNoResultsMessage(show) {
  let noResultsRow = document.getElementById('noResultsRow');
  
  if (show && !noResultsRow) {
    const tbody = document.getElementById('requestsTableBody');
    noResultsRow = document.createElement('tr');
    noResultsRow.id = 'noResultsRow';
    noResultsRow.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 3rem; color: #6b7280;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">
          <svg width="48" height="48" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: var(--primary-green);">No requests found</h3>
        <p>Try adjusting your filters to see more results.</p>
      </td>
    `;
    tbody.appendChild(noResultsRow);
  } else if (!show && noResultsRow) {
    noResultsRow.remove();
  }
}

// Event listeners for filters
document.getElementById('titleFilter').addEventListener('input', filterRequests);
if (document.getElementById('requestorFilter')) {
  document.getElementById('requestorFilter').addEventListener('input', filterRequests);
}
document.getElementById('dateFromFilter').addEventListener('change', filterRequests);
document.getElementById('dateToFilter').addEventListener('change', filterRequests);

clearFiltersBtn.addEventListener('click', () => {
  document.getElementById('titleFilter').value = '';
  if (document.getElementById('requestorFilter')) {
    document.getElementById('requestorFilter').value = '';
  }
  document.getElementById('dateFromFilter').value = '';
  document.getElementById('dateToFilter').value = '';
  
  // Clear type filter
  typeCheckboxes.forEach(cb => cb.checked = false);
  allTypeCheckbox.checked = true;
  updateTypeDisplay();
  
  // Clear status filter
  statusCheckboxes.forEach(cb => cb.checked = false);
  allStatusCheckbox.checked = true;
  updateStatusDisplay();
  
  // Clear organization filter
  if (organizationFilter) {
    organizationFilter.reset();
  }
  
  filterRequests();
});

// Enhanced row click handler with improved modal population
document.querySelectorAll('.request-row').forEach(row => {
  row.addEventListener('click', (e) => {
    // Mark related notifications as read when opening request
    const requestId = row.dataset.id;
    const requestType = row.dataset.type;
    if (requestId && window.markNotificationReadForRequest) {
      window.markNotificationReadForRequest(requestId, requestType);
    }
    
    // Populate basic fields
    const detailTitle = document.getElementById("detailTitle");
    const detailStudent = document.getElementById("detailStudent");
    const detailOrganization = document.getElementById("detailOrganization");
    const detailDescription = document.getElementById("detailDescription");
    const detailDatetime = document.getElementById("detailDatetime");
    const detailType = document.getElementById("detailType");
    const detailSpecificRequest = document.getElementById("detailSpecificRequest");
    
    if (detailTitle) detailTitle.innerText = row.dataset.title || '';
    if (detailStudent) detailStudent.innerText = row.dataset.requestor || 'Unknown';
    if (detailOrganization) detailOrganization.innerText = row.dataset.organization || 'N/A';
    if (detailDescription) detailDescription.innerText = row.dataset.description || 'No description provided';
    if (detailDatetime) detailDatetime.innerText = row.dataset.datetime || '';

    // Set request type
    if (detailType) {
      if (requestType === 'approval') {
        detailType.innerText = 'Approval Request';
      } else if (requestType === 'service') {
        detailType.innerText = 'Service Request';
        if (detailSpecificRequest) {
          detailSpecificRequest.innerText = row.dataset.servicetype || 'Not specified';
        }
      }
    }

    // Enhanced deadline handling
    const deadlineInfo = document.getElementById("deadlineInfo");
    const deadline = row.dataset.deadline;
    if (deadlineInfo && deadline && deadline !== '') {
      const deadlineElement = document.getElementById("detailDeadlineInfo");
      const formattedDeadline = row.dataset.formattedDeadline || 'N/A';
      if (deadlineElement) {
        deadlineElement.innerText = formattedDeadline;
      }
      deadlineInfo.style.display = 'block';
    } else if (deadlineInfo) {
      deadlineInfo.style.display = 'none';
    }

    // Enhanced file preview
    const filesData = row.dataset.files;
    const previewContainer = document.getElementById('file-preview');
    
    if (previewContainer) {
      previewContainer.innerHTML = '';
      
      let allFiles = [];
      if (filesData && filesData.trim() !== '') {
        allFiles = filesData.split(',').map(f => f.trim()).filter(Boolean);
      }
      
      createEnhancedFilePreview(allFiles, previewContainer);
    }
    
    // Show appropriate action section based on request type
    const approvalActionsSection = document.getElementById('approvalActionsSection');
    const serviceActionsSection = document.getElementById('serviceActionsSection');
    const currentStatusValue = document.getElementById('currentStatusValue');
    const serviceStatusValue = document.getElementById('serviceStatusValue');
    const status = row.dataset.status || '';
    
    if (requestType === 'approval') {
      // Show approval actions, hide service actions
      if (approvalActionsSection) approvalActionsSection.style.display = 'block';
      if (serviceActionsSection) serviceActionsSection.style.display = 'none';
      
      // Update status display
      if (currentStatusValue) {
        currentStatusValue.innerText = status;
        currentStatusValue.className = `status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`;
      }
    } else if (requestType === 'service') {
      // Show service actions, hide approval actions
      if (approvalActionsSection) approvalActionsSection.style.display = 'none';
      if (serviceActionsSection) serviceActionsSection.style.display = 'block';
      
      // Update status display
      if (serviceStatusValue) {
        serviceStatusValue.innerText = status;
        serviceStatusValue.className = `status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`;
      }
    }
    
    // Chat functionality
    currentConversationId = row.dataset.id;
    
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
});

// Custom Type Filter Logic with DropdownManager integration
const typeFilterElement = document.getElementById('typeFilter');
const typeDropdown = document.getElementById('typeDropdown');
const typeDisplay = typeFilterElement.querySelector('.select-display');
const typeCheckboxes = typeDropdown.querySelectorAll('input[type="checkbox"]');
const allTypeCheckbox = typeDropdown.querySelector('input[value="all"]');

// Create a dropdown wrapper object that works with DropdownManager
const typeFilterDropdown = {
  isOpen: false,
  
  open() {
    // Register with DropdownManager to close other dropdowns
    DropdownManager.registerOpen(this);
    
    this.isOpen = true;
    typeFilterElement.classList.add('active');
    typeDropdown.classList.add('show');
  },
  
  close() {
    this.isOpen = false;
    typeFilterElement.classList.remove('active');
    typeDropdown.classList.remove('show');
    
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

// Toggle dropdown
typeFilterElement.addEventListener('click', function(e) {
  e.stopPropagation();
  typeFilterDropdown.toggle();
});

// Prevent dropdown from closing when clicking inside
typeDropdown.addEventListener('click', function(e) {
  e.stopPropagation();
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  if (!typeFilterElement.contains(e.target)) {
    typeFilterDropdown.close();
  }
});

// Handle checkbox changes for type filter
typeCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    if (this.value === 'all') {
      // If "All Types" is checked, uncheck others
      if (this.checked) {
        typeCheckboxes.forEach(cb => {
          if (cb.value !== 'all') cb.checked = false;
        });
      }
    } else {
      // If any specific type is checked, uncheck "All Types"
      if (this.checked) {
        allTypeCheckbox.checked = false;
      }
      
      // If no specific type is checked, check "All Types"
      const specificChecked = Array.from(typeCheckboxes).some(cb => 
        cb.value !== 'all' && cb.checked
      );
      if (!specificChecked) {
        allTypeCheckbox.checked = true;
      }
    }
    
    updateTypeDisplay();
    filterRequests();
  });
});

function updateTypeDisplay() {
  const checkedBoxes = Array.from(typeCheckboxes).filter(cb => cb.checked);
  
  if (allTypeCheckbox.checked || checkedBoxes.length === 0) {
    typeDisplay.textContent = 'All Types';
  } else if (checkedBoxes.length === 1) {
    const value = checkedBoxes[0].value;
    if (value === 'request approval') {
      typeDisplay.textContent = 'Request Approval';
    } else if (value === 'service request') {
      typeDisplay.textContent = 'Service Request';
    } else {
      typeDisplay.textContent = value.charAt(0).toUpperCase() + value.slice(1);
    }
  } else {
    typeDisplay.textContent = `${checkedBoxes.length} Selected`;
  }
}

// Get selected type values for filtering
function getSelectedTypes() {
  const checkedBoxes = Array.from(typeCheckboxes).filter(cb => 
    cb.checked && cb.value !== 'all'
  );
  
  if (allTypeCheckbox.checked || checkedBoxes.length === 0) {
    return [];
  }
  
  return checkedBoxes.map(cb => cb.value.toLowerCase());
}

// Custom Status Filter Logic with DropdownManager integration
const statusFilterElement = document.getElementById('statusFilter');
const statusDropdown = document.getElementById('statusDropdown');
const statusDisplay = statusFilterElement.querySelector('.select-display');
const statusCheckboxes = statusDropdown.querySelectorAll('input[type="checkbox"]');
const allStatusCheckbox = statusDropdown.querySelector('input[value="all"]');

// Create a dropdown wrapper object that works with DropdownManager
const statusFilterDropdown = {
  isOpen: false,
  
  open() {
    // Register with DropdownManager to close other dropdowns
    DropdownManager.registerOpen(this);
    
    this.isOpen = true;
    statusFilterElement.classList.add('active');
    statusDropdown.classList.add('show');
  },
  
  close() {
    this.isOpen = false;
    statusFilterElement.classList.remove('active');
    statusDropdown.classList.remove('show');
    
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

// Toggle dropdown
statusFilterElement.addEventListener('click', function(e) {
  e.stopPropagation();
  statusFilterDropdown.toggle();
});

// Prevent dropdown from closing when clicking inside
statusDropdown.addEventListener('click', function(e) {
  e.stopPropagation();
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  if (!statusFilterElement.contains(e.target)) {
    statusFilterDropdown.close();
  }
});

// Handle checkbox changes
statusCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    if (this.value === 'all') {
      // If "All Status" is checked, uncheck others
      if (this.checked) {
        statusCheckboxes.forEach(cb => {
          if (cb.value !== 'all') cb.checked = false;
        });
      }
    } else {
      // If any specific status is checked, uncheck "All Status"
      if (this.checked) {
        allStatusCheckbox.checked = false;
      }
      
      // If no specific status is checked, check "All Status"
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
  const checkedBoxes = Array.from(statusCheckboxes).filter(cb => cb.checked);
  
  if (allStatusCheckbox.checked || checkedBoxes.length === 0) {
    statusDisplay.textContent = 'All Status';
  } else if (checkedBoxes.length === 1) {
    statusDisplay.textContent = checkedBoxes[0].value.charAt(0).toUpperCase() + 
                              checkedBoxes[0].value.slice(1);
  } else {
    statusDisplay.textContent = `${checkedBoxes.length} Selected`;
  }
}

// Get selected status values for filtering
function getSelectedStatuses() {
  const checkedBoxes = Array.from(statusCheckboxes).filter(cb => 
    cb.checked && cb.value !== 'all'
  );
  
  if (allStatusCheckbox.checked || checkedBoxes.length === 0) {
    return [];
  }
  
  return checkedBoxes.map(cb => cb.value.toLowerCase());
}
// Get selected status values for filtering
function getSelectedStatuses() {
  const checkedBoxes = Array.from(statusCheckboxes).filter(cb => 
    cb.checked && cb.value !== 'all'
  );
  
  if (allStatusCheckbox.checked || checkedBoxes.length === 0) {
    return [];
  }
  
  return checkedBoxes.map(cb => cb.value.toLowerCase());
}

// Chat functions
function openChat(requestId) {
  currentConversationId = requestId;
  loadConversation(requestId);
  conversationModal.style.display = 'flex';
}

async function loadConversation(requestId) {
  try {
    const response = await fetch(`/api/conversation/${requestId}`);
    const conversation = await response.json();
    
    messagesContainer.innerHTML = '';
    
    if (conversation.messages && conversation.messages.length > 0) {
      conversation.messages.forEach(message => {
        addMessageToUI(message);
      });
      
      await fetch(`/api/conversation/${requestId}/mark-read`, {
        method: 'POST'
      });
    } else {
      messagesContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #64748b;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">💭</div>
            <p>No messages yet</p>
            <small>Start the conversation by sending a message below</small>
          </div>
        </div>
      `;
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error('Error loading conversation:', error);
    messagesContainer.innerHTML = '<p style="color: red;">Error loading conversation</p>';
  }
}

function addMessageToUI(message) {
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
  messageDiv.innerHTML = `
    <div class="message-content">
      <div style="display: flex; align-items: flex-start;">
        ${userAvatar}
        <div style="flex: 1; min-width: 0; overflow-wrap: break-word;">
          <div class="message-header">
            <strong>${senderName}</strong>
            <span class="message-time">${new Date(message.timestamp).toLocaleString()}</span>
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
  }
  
  messagesContainer.appendChild(messageDiv);
}

sendMessageBtn.onclick = async function() {
  const content = messageInput.value.trim();
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
      messageInput.value = '';
      
      // Clear attachment
      if (currentAttachment) {
        currentAttachment = null;
        if (attachmentPreview) attachmentPreview.style.display = 'none';
        if (imageUpload) imageUpload.value = '';
        if (fileUpload) fileUpload.value = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
      }
      
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      throw new Error(result.error || 'Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message: ' + error.message);
  }
};

messageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessageBtn.click();
  }
});

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

// Formatting toolbar functionality
document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
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
});

// Image modal function for message previews
function openImageModal(imageSrc) {
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
}

// Global function to open request modal by ID (for notification clicks)
window.openRequestModal = function(requestId, requestType) {
  console.log('Opening request modal for:', requestId, requestType);
  
  // Find the row with the matching request ID and type
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"][data-type="${requestType === 'approval' ? 'Request Approval' : 'Service Request'}"]`);
  
  if (targetRow) {
    // Trigger the existing click handler
    targetRow.click();
  } else {
    console.warn('Request not found on current page:', requestId, requestType);
    // Navigate to the appropriate specific page
    const targetPage = requestType === 'approval' ? '/request-approvals' : '/service-requests';
    window.location.href = `${targetPage}?highlight=${requestId}`;
  }
};

// Global function alternative names for backward compatibility
window.showApprovalDetails = function(requestId) {
  window.openRequestModal(requestId, 'approval');
};

window.showServiceDetails = function(requestId) {
  window.openRequestModal(requestId, 'service');
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
  if (urlParams.has('modal') && urlParams.has('requestId')) {
    const requestId = urlParams.get('requestId');
    const requestType = urlParams.get('type');
    console.log('Auto-opening modal for request:', requestId, requestType);
    
    // Wait for page to fully load
    setTimeout(() => {
      window.openRequestModal(requestId, requestType);
    }, 500);
  }
  
  // Handle conversation modal opening (for message notifications)
  if (urlParams.has('conversation') && urlParams.has('requestId')) {
    const requestId = urlParams.get('requestId');
    const requestType = urlParams.get('type');
    console.log('Auto-opening conversation modal for request:', requestId, requestType);
    
    // Wait for page to fully load
    setTimeout(() => {
      window.openConversationModal(requestId, requestType);
    }, 500);
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
        const response = await fetch(`/api/unit/approve-request/${currentConversationId}`, {
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
      const response = await fetch(`/api/unit/request-revision/${currentConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
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

// Upload Deliverable Button
const uploadDeliverableBtn = document.getElementById('uploadDeliverableBtn');
const deliverableUpload = document.getElementById('deliverableUpload');
const deliverablePreview = document.getElementById('deliverablePreview');

if (deliverableUpload) {
  deliverableUpload.addEventListener('change', function() {
    if (deliverablePreview) {
      deliverablePreview.innerHTML = '';
      const files = this.files;
      if (files.length > 0) {
        const preview = document.createElement('div');
        preview.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #d1d5db;';
        preview.innerHTML = `<strong>Selected files:</strong> ${Array.from(files).map(f => f.name).join(', ')}`;
        deliverablePreview.appendChild(preview);
      }
    }
  });
}

if (uploadDeliverableBtn) {
  uploadDeliverableBtn.addEventListener('click', async function() {
    if (!currentConversationId) return;
    
    const files = deliverableUpload ? deliverableUpload.files : null;
    if (!files || files.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('deliverables', files[i]);
    }
    
    try {
      uploadDeliverableBtn.disabled = true;
      uploadDeliverableBtn.innerText = 'Uploading...';
      
      const response = await fetch(`/api/unit/upload-deliverable/${currentConversationId}`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Deliverable uploaded successfully!');
        location.reload();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.message || 'Failed to upload deliverable'));
      }
    } catch (error) {
      console.error('Error uploading deliverable:', error);
      alert('An error occurred while uploading');
    } finally {
      uploadDeliverableBtn.disabled = false;
      uploadDeliverableBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Deliverable';
    }
  });
}

// Mark Done Button
const markDoneBtn = document.getElementById('markDoneBtn');
if (markDoneBtn) {
  markDoneBtn.addEventListener('click', async function() {
    if (!currentConversationId) return;
    
    if (confirm('Are you sure you want to mark this service request as completed?')) {
      try {
        const response = await fetch(`/api/unit/mark-completed/${currentConversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          alert('Service request marked as completed!');
          location.reload();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.message || 'Failed to mark as completed'));
        }
      } catch (error) {
        console.error('Error marking as completed:', error);
        alert('An error occurred while marking as completed');
      }
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