/* ===========================================
   APPROVALS PAGE JAVASCRIPT
   File: public/javascripts/approvals.js
   Connected to: views/Admin/approvals.ejs (via <script src="/javascripts/approvals.js">)
   Dependencies: None (vanilla JavaScript), connects to various API endpoints
   Purpose: Client-side functionality for the admin approvals management page
   Features: Filtering, modals, form handling, conversation system, file uploads
   Connection Details:
   - Loaded by views/Admin/approvals.ejs at the end of the document
   - Styles are provided by public/stylesheets/approvals.css
   - Handles DOM manipulation for the approvals table and modals
   - Manages AJAX calls to backend API endpoints for data updates
   =========================================== */

console.log('🚀 Starting Approvals Admin script...');

// Global variable to store available units from database
let availableUnits = [];
// Global variable to store available request statuses from database
let availableStatuses = [];
// Global variables for organizations and offices
let availableOrganizations = [];
let availableOffices = [];

// ==================================
// HELPER FUNCTIONS FOR CONVERSATION
// ==================================

// Helper function to escape HTML
window.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper: convert contenteditable HTML to clean markdown before storing
window.htmlToMarkdown = function(html) {
  if (!html) return '';
  let text = html;
  text = text.replace(/<\/?(strong|b)>/gi, '**');
  text = text.replace(/<\/?(em|i)>/gi, '*');
  text = text.replace(/<\/?u>/gi, '__');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '');
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#039;/g, "'");
  text = text.replace(/\*{4,}/g, '**');
  text = text.replace(/_{4,}/g, '__');
  text = text.replace(/\*\*\s*\*\*/g, '');
  text = text.replace(/__\s*__/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

// Helper function to format text with markdown-style syntax
window.formatText = function(text) {
  if (!text) return '';
  
  // Decode HTML entities first (handles legacy &lt;b&gt; stored messages)
  let formatted = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  const hasHtml = /<\/?(p|div|strong|b|em|i|u|a|br|span)[\s>]/i.test(formatted);
  
  if (!hasHtml) {
    formatted = window.escapeHtml(formatted);
    // Auto-link bare URLs (only matches literal http(s):// prefixes, so this
    // can't be used to smuggle in a javascript:/data: URI)
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
      let trail = '';
      const trailMatch = url.match(/[).,!?;:]+$/);
      if (trailMatch) {
        trail = trailMatch[0];
        url = url.slice(0, -trail.length);
      }
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>' + trail;
    });
  }

  // Always run markdown conversion
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/__([^_]+)__/g, '<u>$1</u>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// PDF viewer modal functions
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

// Image viewer modal functions
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
// GLOBAL DROPDOWN MANAGER
// ==================================

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

// Organization and Office data arrays (now loaded from database)

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
  
  // ==========================================
  // CREATE REQUEST MODAL HANDLER
  // ==========================================
  const openModalBtn = document.getElementById('openModalBtn');
  const requestModal = document.getElementById('requestModal');
  
  if (openModalBtn && requestModal) {
    openModalBtn.onclick = () => {
      requestModal.style.display = 'flex';
      // Clear user search when opening modal
      const userInput = document.getElementById('requestForUser');
      const userIdInput = document.getElementById('requestForUserId');
      if (userInput) userInput.value = '';
      if (userIdInput) userIdInput.value = '';
    };
  }
  
  // ==========================================
  // USER SEARCH FUNCTIONALITY
  // ==========================================
  const requestForUserInput = document.getElementById('requestForUser');
  const requestForUserIdInput = document.getElementById('requestForUserId');
  const userSuggestionsDropdown = document.getElementById('userSuggestionsDropdown');
  
  let userSearchTimeout;
  let usersCache = [];
  
  if (requestForUserInput && userSuggestionsDropdown) {
    // Debounced search function
    requestForUserInput.addEventListener('input', function() {
      clearTimeout(userSearchTimeout);
      const query = this.value.trim();
      
      if (query.length < 2) {
        userSuggestionsDropdown.style.display = 'none';
        requestForUserIdInput.value = '';
        return;
      }
      
      // Show loading state
      userSuggestionsDropdown.innerHTML = '<div class="user-suggestions-loading">Searching users...</div>';
      userSuggestionsDropdown.style.display = 'block';
      
      userSearchTimeout = setTimeout(async () => {
        try {
          console.log('[USER SEARCH] Fetching users for query:', query);
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
          console.log('[USER SEARCH] Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            console.error('[USER SEARCH] Request failed with status:', response.status);
            const contentType = response.headers.get('content-type');
            console.error('[USER SEARCH] Content-Type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.error('[USER SEARCH] Error response:', errorData);
            } else {
              const errorText = await response.text();
              console.error('[USER SEARCH] Error response (text):', errorText.substring(0, 200));
            }
            
            userSuggestionsDropdown.innerHTML = '<div class="user-suggestions-empty">Error: Unable to search users. Please check your permissions.</div>';
            return;
          }
          
          const users = await response.json();
          console.log('[USER SEARCH] Found users:', users.length, users);
          usersCache = users;
          
          if (users.length === 0) {
            userSuggestionsDropdown.innerHTML = '<div class="user-suggestions-empty">No users found</div>';
          } else {
            // Populate dropdown with rich suggestions
            userSuggestionsDropdown.innerHTML = users.map(user => {
              const initials = `${user.fName.charAt(0)}${user.lName.charAt(0)}`.toUpperCase();
              return `
                <div class="user-suggestion-item" data-user-id="${user._id}" data-user-name="${user.fName} ${user.lName}" data-user-email="${user.email}">
                  <div class="user-suggestion-avatar">${initials}</div>
                  <div class="user-suggestion-info">
                    <div class="user-suggestion-name">${user.fName} ${user.lName}</div>
                    <div class="user-suggestion-email">${user.email}</div>
                  </div>
                </div>
              `;
            }).join('');
            
            // Add click handlers to suggestion items
            const suggestionItems = userSuggestionsDropdown.querySelectorAll('.user-suggestion-item');
            suggestionItems.forEach(item => {
              item.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-user-name');
                const userEmail = this.getAttribute('data-user-email');
                
                requestForUserInput.value = `${userName} (${userEmail})`;
                requestForUserIdInput.value = userId;
                userSuggestionsDropdown.style.display = 'none';

                console.log('[USER SEARCH] Selected user:', { userId, userName, userEmail });

                // Let the page react to the selection (e.g., auto-fill organization)
                const selectedUser = usersCache.find(u => u._id === userId);
                if (selectedUser && typeof window.onAdminRequestUserSelected === 'function') {
                  window.onAdminRequestUserSelected(selectedUser);
                }
              });
            });
          }
        } catch (error) {
          console.error('[USER SEARCH] Error searching users:', error);
          userSuggestionsDropdown.innerHTML = '<div class="user-suggestions-empty">Error loading users</div>';
        }
      }, 300);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!requestForUserInput.contains(e.target) && !userSuggestionsDropdown.contains(e.target)) {
        userSuggestionsDropdown.style.display = 'none';
      }
    });
    
    // Clear hidden ID if user manually changes input
    requestForUserInput.addEventListener('keydown', function() {
      requestForUserIdInput.value = '';
    });
  }
  
  // Debug: Check all rows for allowAdditionalUpload data
  console.log('🚀 Page loaded - checking all data attributes...');
  const allRows = document.querySelectorAll('.request-row');
  allRows.forEach((row, index) => {
    const debugInfo = row.getAttribute('data-debug-allow');
    const allowUpload = row.getAttribute('data-allow-additional-upload');
    console.log(`Row ${index + 1}:`, {
      requestId: row.dataset.requestId,
      allowAdditionalUpload: allowUpload,
      debugInfo: debugInfo ? JSON.parse(debugInfo) : 'No debug info'
    });
  });
  
  // Get filter data from database (passed from server via EJS)
  const dbData = window.filterDataFromDatabase || {};
  const statusOptions = dbData.requestStatuses || ['Pending', 'Queued', 'In Progress', 'For Checking', 'For Revision', 'Approved', 'Completed', 'Rejected', 'Archived'];
  const orgOptions = dbData.organizations || [];
  const officeOptions = dbData.offices || [];
  const unitOptions = dbData.units || [];
  
  // Initialize enhanced multi-select dropdowns with database values
  const statusFilter = new EnhancedMultiSelect('statusFilter', 
    statusOptions, 
    'Select Status', false);
  
  const statusFilterContainer = document.getElementById('statusFilter');
  if (statusFilterContainer) {
    statusFilterContainer.__instance = statusFilter;
  }
  
  // Initialize assigned unit filter
  const assignedUnitFilter = new EnhancedMultiSelect('assignedUnitFilter',
    unitOptions,
    'Select Assigned Unit', false);
  
  const assignedUnitFilterContainer = document.getElementById('assignedUnitFilter');
  if (assignedUnitFilterContainer) {
    assignedUnitFilterContainer.__instance = assignedUnitFilter;
  }
    
  const studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter', 
    orgOptions, 
    'Select Student Organizations', true);
  
  const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
  if (studentOrgFilterContainer) {
    studentOrgFilterContainer.__instance = studentOrgFilter;
  }
    
  const officeDeptFilter = new EnhancedMultiSelect('officeDeptFilter', 
    officeOptions, 
    'Select Offices/Departments', true);
  
  const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
  if (officeDeptFilterContainer) {
    officeDeptFilterContainer.__instance = officeDeptFilter;
  }

  // Global variables
  let detailModal = document.getElementById("detailsModal");
  let updateConfirmationModal = document.getElementById("updateConfirmationModal");
  let currentRequestId = null;
  let currentRequestType = 'Request Approval';
  let originalValues = {};
  let allRequestsData = [];
  let uploadedFile = null;
  
  console.log('🔍 DOM Elements Check:', {
    detailModal: !!detailModal,
    updateConfirmationModal: !!updateConfirmationModal,
    requestRows: document.querySelectorAll('.request-row').length
  });

  // Initialize filters functionality
  function initializeFilters() {
    console.log('🔍 Initializing filters...');
    
    // Store all original request data
    const rows = document.querySelectorAll('.request-row');
    allRequestsData = Array.from(rows).map(row => ({
      element: row,
      requestId: row.dataset.requestId,
      type: row.dataset.type,
      title: row.dataset.title?.toLowerCase() || '',
      status: row.dataset.status?.toLowerCase() || '',
      organization: row.dataset.organization?.toLowerCase() || '',
      units: row.dataset.units?.toLowerCase() || '',
      student: row.dataset.student?.toLowerCase() || '',
      datetime: row.dataset.datetime,
      date: row.dataset.date,
      deadline: row.dataset.deadline,
      description: row.dataset.description?.toLowerCase() || ''
    }));

    // Get filter elements
    const requestIdFilter = document.getElementById('requestIdFilter');
    const studentFilter = document.getElementById('studentFilter');
    const sortByFilter = document.getElementById('sortByFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const resultsCount = document.getElementById('resultsCount');

    // Add event listeners for all filters
    if (requestIdFilter) {
      requestIdFilter.addEventListener('input', debounce(applyFilters, 300));
    }

    if (studentFilter) {
      studentFilter.addEventListener('input', debounce(applyFilters, 300));
    }

    // Enhanced dropdown change listeners
    if (statusFilterContainer) {
      statusFilterContainer.addEventListener('selectionChange', applyFilters);
    }
    
    if (assignedUnitFilterContainer) {
      assignedUnitFilterContainer.addEventListener('selectionChange', applyFilters);
    }
    
    if (studentOrgFilterContainer) {
      studentOrgFilterContainer.addEventListener('selectionChange', applyFilters);
    }
    
    if (officeDeptFilterContainer) {
      officeDeptFilterContainer.addEventListener('selectionChange', applyFilters);
    }

    if (dateFromFilter) {
      dateFromFilter.addEventListener('change', () => {
        // Set minimum date for "Date To" based on "Date From" selection
        if (dateToFilter && dateFromFilter.value) {
          dateToFilter.min = dateFromFilter.value;
          if (dateToFilter.value && dateToFilter.value < dateFromFilter.value) {
            dateToFilter.value = '';
          }
        } else if (dateToFilter) {
          dateToFilter.min = '';
        }
        applyFilters();
      });
    }

    if (dateToFilter) {
      dateToFilter.addEventListener('change', applyFilters);
    }
    
    if (sortByFilter) {
      sortByFilter.addEventListener('change', applyFilters);
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Pagination variables
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let filteredData = [];
    
    // Pagination elements
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const paginationNumbers = document.getElementById('paginationNumbers');
    
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          displayPage();
        }
      });
    }
    
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          displayPage();
        }
      });
    }
    
    function displayPage() {
      const tableBody = document.getElementById('requestsTableBody');
      if (!tableBody) return;
      
      const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      // Hide all rows first
      allRequestsData.forEach(request => {
        request.element.style.display = 'none';
      });
      
      // Show only the rows for current page and reorder them
      const pageData = filteredData.slice(startIndex, endIndex);
      pageData.forEach(request => {
        tableBody.appendChild(request.element);
        request.element.style.display = '';
      });
      
      // Update pagination controls
      renderPaginationNumbers(totalPages);
      if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
      if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
      
      updateResultsCount(filteredData.length);
    }
    
    function renderPaginationNumbers(totalPages) {
      if (!paginationNumbers) return;
      
      paginationNumbers.innerHTML = '';
      
      if (totalPages <= 1) return;
      
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // First page button
      if (startPage > 1) {
        paginationNumbers.appendChild(createPageButton(1));
        if (startPage > 2) {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          paginationNumbers.appendChild(ellipsis);
        }
      }
      
      // Page number buttons
      for (let i = startPage; i <= endPage; i++) {
        paginationNumbers.appendChild(createPageButton(i));
      }
      
      // Last page button
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          paginationNumbers.appendChild(ellipsis);
        }
        paginationNumbers.appendChild(createPageButton(totalPages));
      }
    }
    
    function createPageButton(pageNum) {
      const btn = document.createElement('button');
      btn.className = 'pagination-btn' + (pageNum === currentPage ? ' active' : '');
      btn.textContent = pageNum;
      btn.addEventListener('click', () => {
        currentPage = pageNum;
        displayPage();
      });
      return btn;
    }
    
    // Sort data function
    function sortData(data, sortValue) {
      // Statuses that should be sorted to the bottom (completed/closed requests)
      const bottomStatuses = ['completed', 'approved', 'rejected', 'archived'];
      // Status priority order (lower index = higher priority, appears first)
      const statusOrder = { 'completed': 0, 'approved': 1, 'rejected': 2, 'archived': 3 };
      
      const [field, direction] = sortValue.split('-');
      const isAsc = direction === 'asc';
      
      data.sort((a, b) => {
        // Check if either request has a "bottom" status
        const aIsBottom = bottomStatuses.includes(a.status?.toLowerCase());
        const bIsBottom = bottomStatuses.includes(b.status?.toLowerCase());
        
        // Always push bottom statuses to the bottom
        if (aIsBottom && !bIsBottom) return 1;
        if (!aIsBottom && bIsBottom) return -1;
        
        // If both are bottom statuses, sort by status order first, then by date newest to oldest
        if (aIsBottom && bIsBottom) {
          const aStatus = a.status?.toLowerCase();
          const bStatus = b.status?.toLowerCase();
          const aOrder = statusOrder[aStatus] ?? 999;
          const bOrder = statusOrder[bStatus] ?? 999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder; // Lower order first
          }
          
          // Same status, sort by date newest to oldest
          const aDate = new Date(a.date || a.createdAt || 0);
          const bDate = new Date(b.date || b.createdAt || 0);
          return bDate - aDate; // Newest first
        }
        
        // Both are active requests, sort normally by the selected field
        let valA, valB;
        
        switch (field) {
          case 'deadline':
            // Get deadline from element's dataset
            valA = a.element?.dataset?.deadline || '';
            valB = b.element?.dataset?.deadline || '';
            // Put items without deadline at the end (but before bottom statuses)
            if (!valA && valB) return isAsc ? 1 : -1;
            if (valA && !valB) return isAsc ? -1 : 1;
            if (!valA && !valB) return 0;
            break;
          case 'date':
            valA = a.date || '';
            valB = b.date || '';
            break;
          default:
            valA = a.date || '';
            valB = b.date || '';
        }
        
        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });
    }

    // Apply filters function
    function applyFilters() {
      console.log('🔍 Applying filters...');
      
      const filters = {
        requestId: requestIdFilter ? requestIdFilter.value.toLowerCase().trim() : '',
        status: statusFilterContainer?.__instance?.getSelectedValues() || ['all'],
        assignedUnit: assignedUnitFilterContainer?.__instance?.getSelectedValues() || ['all'],
        student: studentFilter ? studentFilter.value.toLowerCase().trim() : '',
        studentOrg: studentOrgFilterContainer?.__instance?.getSelectedValues() || ['all'],
        officeDept: officeDeptFilterContainer?.__instance?.getSelectedValues() || ['all'],
        dateFrom: dateFromFilter ? dateFromFilter.value : '',
        dateTo: dateToFilter ? dateToFilter.value : ''
      };

      console.log('Applied filters:', filters);

      // Filter the data
      filteredData = allRequestsData.filter(request => {
        // Request ID filter
        if (filters.requestId && !request.requestId?.toLowerCase().includes(filters.requestId)) {
          return false;
        }

        // Status filter (multi-select, case-insensitive)
        if (filters.status.length > 0 && !filters.status.includes('all')) {
          const statusMatch = filters.status.some(s => s.toLowerCase() === request.status?.toLowerCase());
          if (!statusMatch) return false;
        }
        
        // Assigned Unit filter (case-insensitive)
        if (filters.assignedUnit.length > 0 && !filters.assignedUnit.includes('all')) {
          const unitMatch = filters.assignedUnit.some(u => request.units?.toLowerCase().includes(u.toLowerCase()));
          if (!unitMatch) return false;
        }

        // Student filter
        if (filters.student && !request.student?.includes(filters.student)) {
          return false;
        }

        // Organization filter (multi-select)
        const hasStudentOrgSelection = filters.studentOrg.length > 0 && !filters.studentOrg.includes('all');
        const hasOfficeDeptSelection = filters.officeDept.length > 0 && !filters.officeDept.includes('all');
        
        if (hasStudentOrgSelection || hasOfficeDeptSelection) {
          let organizationMatch = false;
          
          // Check student organizations
          if (hasStudentOrgSelection) {
            organizationMatch = filters.studentOrg.some(org => 
              request.organization?.includes(org.toLowerCase())
            );
          }
          
          // Check office/departments (OR logic with student orgs)
          if (!organizationMatch && hasOfficeDeptSelection) {
            organizationMatch = filters.officeDept.some(dept => 
              request.organization?.includes(dept.toLowerCase())
            );
          }
          
          if (!organizationMatch) return false;
        }

        // Date range filter
        if (filters.dateFrom && request.date && request.date < filters.dateFrom) return false;
        if (filters.dateTo && request.date && request.date > filters.dateTo) return false;

        return true;
      });
      
      // Then sort the filtered data
      const sortValue = sortByFilter?.value || 'deadline-asc';
      sortData(filteredData, sortValue);
      
      // Reset to first page and display
      currentPage = 1;
      displayPage();

      // Update results count
      updateResultsCount(filteredData.length);
    }

    // Clear all filters
    function clearAllFilters() {
      console.log('🧹 Clearing all filters...');
      
      // Clear text inputs
      if (requestIdFilter) requestIdFilter.value = '';
      if (studentFilter) studentFilter.value = '';
      if (sortByFilter) sortByFilter.value = 'deadline-asc';
      if (dateFromFilter) {
        dateFromFilter.value = '';
      }
      if (dateToFilter) {
        dateToFilter.value = '';
        dateToFilter.min = '';
      }
      
      // Reset enhanced dropdowns
      statusFilterContainer?.__instance?.reset();
      assignedUnitFilterContainer?.__instance?.reset();
      studentOrgFilterContainer?.__instance?.reset();
      officeDeptFilterContainer?.__instance?.reset();

      // Reset pagination and apply filters
      currentPage = 1;
      applyFilters();
    }

    // Update results count
    function updateResultsCount(count) {
      if (resultsCount) {
        const total = allRequestsData.length;
        if (count === total) {
          resultsCount.textContent = `Showing all ${total} requests`;
        } else {
          resultsCount.textContent = `Showing ${count} of ${total} requests`;
        }
      }
    }

    // Debounce function to limit API calls
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

    // Initial filter application (apply sort and show first page)
    applyFilters();
    
    console.log('✅ Filters initialized successfully');
  }
  
  // Initialize modal close handlers
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

  function applyChatFormat(format) {
    console.log('[Approvals] Apply format:', format);
    const input = document.getElementById('messageInput');
    if (!input) {
      console.error('[Approvals] Message input not found');
      return;
    }

    // If contenteditable (WYSIWYG), use execCommand to apply formatting
    if (input.isContentEditable) {
      input.focus();
      // Ensure there's a selection inside the editable element
      const selection = window.getSelection();
      if (!selection) return;

      let selectionInside = false;
      for (let i = 0; i < selection.rangeCount; i++) {
        const node = selection.getRangeAt(i).commonAncestorContainer;
        if (input.contains(node)) { selectionInside = true; break; }
      }

      if (!selectionInside) {
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      switch(format) {
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'underline': document.execCommand('underline'); break;
      }
      input.focus();
      return;
    }

    // Fallback for legacy textarea inputs: insert markdown-like markers
    const textarea = input; // treat same variable name
    if (textarea && typeof textarea.selectionStart !== 'undefined') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);

      console.log('[Approvals] Selection:', { start, end, selectedText });

      let prefix = '';
      let suffix = '';
      let cursorOffset = 0;

      switch(format) {
        case 'bold':
          prefix = '**';
          suffix = '**';
          cursorOffset = 2;
          break;
        case 'italic':
          prefix = '*';
          suffix = '*';
          cursorOffset = 1;
          break;
        case 'underline':
          prefix = '__';
          suffix = '__';
          cursorOffset = 2;
          break;
      }

      const newText = beforeText + prefix + selectedText + suffix + afterText;
      textarea.value = newText;
      
      // Set cursor position
      if (selectedText) {
        // If text was selected, place cursor after the formatted text
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        // If no text selected, place cursor between the markers
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
      
      textarea.focus();
      console.log('[Approvals] Format applied, new text length:', newText.length);
      return;
    }

    console.warn('[Approvals] Input does not support selection-based formatting');
  }

  // Add conversation modal functionality
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

    // Upload functionality
    const imageBtn = document.getElementById('imageBtn');
    const fileBtn = document.getElementById('fileBtn');
    const imageUpload = document.getElementById('imageUpload');
    const fileUpload = document.getElementById('fileUpload');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const removeAttachment = document.getElementById('removeAttachment');
    
    // Image upload button click
    if (imageBtn && imageUpload) {
      imageBtn.addEventListener('click', function() {
        imageUpload.click();
      });
    }
    
    // File upload button click
    if (fileBtn && fileUpload) {
      fileBtn.addEventListener('click', function() {
        fileUpload.click();
      });
    }
    
    // Handle image file selection
    if (imageUpload) {
      imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          handleFileSelection(file);
        }
      });
    }
    
    // Handle regular file selection
    if (fileUpload) {
      fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          handleFileSelection(file);
        }
      });
    }
    
    // Remove attachment
    if (removeAttachment) {
      removeAttachment.addEventListener('click', function() {
        clearAttachment();
      });
    }
    
    function handleFileSelection(file) {
      uploadedFile = file;
      const attachmentInfo = document.getElementById('attachmentInfo');
      const attachmentIcon = document.getElementById('attachmentIcon');
      const attachmentName = document.getElementById('attachmentName');
      const imagePreviewContainer = document.getElementById('imagePreviewContainer');
      const imagePreview = document.getElementById('imagePreview');
      
      if (attachmentPreview && attachmentIcon && attachmentName) {
        // Set icon based on file type
        if (file.type.startsWith('image/')) {
          attachmentIcon.textContent = '📷';
          // Show image preview
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

    function insertFormatting(startTag, endTag) {
      const input = messageInput;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);
      
      if (selected) {
        input.value = before + startTag + selected + endTag + after;
        input.setSelectionRange(start, end + startTag.length + endTag.length);
      } else {
        input.value = before + startTag + endTag + after;
        input.setSelectionRange(start + startTag.length, start + startTag.length);
      }
      input.focus();
    }
    
    if (openChatBtn) {
      openChatBtn.addEventListener('click', function() {
        if (currentRequestId) {
          console.log('Opening conversation for request:', currentRequestId);
          openConversation(currentRequestId);
        } else {
          showNotification('Please select a request first', 'error');
        }
      });
    }
    
    if (closeConversationBtn) {
      closeConversationBtn.addEventListener('click', function() {
        conversationModal.style.display = 'none';
      });
    }
    
    if (sendMessageBtn) {
      sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
      console.log('[Approvals] Message input found, attaching event listeners');
      
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Add keyboard shortcuts for formatting (use execCommand for contenteditable)
      messageInput.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + B/I/U shortcuts
        if ((e.ctrlKey || e.metaKey) && ['b','i','u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          const k = e.key.toLowerCase();
          if (messageInput.isContentEditable) {
            if (k === 'b') document.execCommand('bold');
            if (k === 'i') document.execCommand('italic');
            if (k === 'u') document.execCommand('underline');
          } else {
            // fallback to existing function which handles textarea
            if (k === 'b') applyChatFormat('bold');
            if (k === 'i') applyChatFormat('italic');
            if (k === 'u') applyChatFormat('underline');
          }
          return false;
        }
      });
    } else {
      console.log('[Approvals] Message input element not found (may load later via conversation modal)');
    }

    // Delegate toolbar button clicks to apply formatting appropriately
    const toolbarEl = document.querySelector('.unit-format-toolbar');
    if (toolbarEl) {
      toolbarEl.addEventListener('click', function(e) {
        const btn = e.target.closest('.format-btn');
        if (!btn) return;
        const format = btn.dataset.chatFormat;
        if (!format) return;
        if (messageInput && messageInput.isContentEditable) {
          messageInput.focus();
          switch(format) {
            case 'bold': document.execCommand('bold'); break;
            case 'italic': document.execCommand('italic'); break;
            case 'underline': document.execCommand('underline'); break;
          }
        } else {
          // If textarea fallback exists, use insertFormatting/applyChatFormat
          if (format === 'bold') applyChatFormat('bold');
          if (format === 'italic') applyChatFormat('italic');
          if (format === 'underline') applyChatFormat('underline');
        }
      });
    }
    
    // Close modal when clicking outside
    if (conversationModal) {
      conversationModal.addEventListener('click', function(e) {
        if (e.target === conversationModal) {
          conversationModal.style.display = 'none';
        }
      });
    }
  }

  // Open conversation function
  async function openConversation(requestId) {
    const conversationModal = document.getElementById('conversationModal');
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (!conversationModal || !messagesContainer) {
      console.error('Conversation modal elements not found');
      return;
    }
    
    try {
      // Show loading state
      messagesContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #64748b;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">💬</div>
            <p>Loading conversation...</p>
          </div>
        </div>
      `;
      
      conversationModal.style.display = 'flex';
      
      // Fetch conversation
      const response = await fetch(`/api/conversation/${requestId}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to load conversation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 401) errorMessage = 'Session expired. Please log in again.';
          else if (response.status === 403) errorMessage = 'Access denied.';
          else errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[Approvals] API response data:', data);
      console.log('[Approvals] data.messages:', data.messages);
      console.log('[Approvals] data.conversation:', data.conversation);
      
      // Try both possible response formats
      const messages = data.messages || data.conversation || [];
      console.log('[Approvals] Using messages array with length:', messages.length);
      displayMessages(messages);
      // Mark messages as read
      await fetch(`/api/conversation/${requestId}/mark-read`, { method: 'POST' });
    } catch (error) {
      console.error('Error loading conversation:', error);
      messagesContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #dc2626;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
            <p>Failed to load conversation</p>
            <small>${error.message}</small>
          </div>
        </div>
      `;
      showNotification('Failed to load conversation: ' + error.message, 'error');
    }
  }

  // Clear attachment function
  function clearAttachment() {
    uploadedFile = null;
    const attachmentPreview = document.getElementById('attachmentPreview');
    const imageUpload = document.getElementById('imageUpload');
    const fileUpload = document.getElementById('fileUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    if (attachmentPreview) {
      attachmentPreview.style.display = 'none';
    }
    if (imageUpload) imageUpload.value = '';
    if (fileUpload) fileUpload.value = '';
    if (imagePreviewContainer) {
      imagePreviewContainer.style.display = 'none';
    }
  }

  // Send message function
  async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
      showNotification('Message input not found', 'error');
      return;
    }

    // Support contenteditable (WYSIWYG) and textarea inputs
    let content = '';
    let plainText = '';
    if (messageInput.isContentEditable) {
      plainText = (messageInput.textContent || '').trim();
      content = (messageInput.innerHTML || '').trim();
    } else {
      plainText = (messageInput.value || '').trim();
      content = plainText;
    }
    
    if (!content || content === '<br>' || plainText === '') {
      showNotification('Please enter a message', 'error');
      return;
    }
    
    if (!currentRequestId) {
      showNotification('No request selected', 'error');
      return;
    }
    
    try {
      let response;
      
      response = await fetch(`/api/conversation/${currentRequestId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });
      
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
      console.log('[Approvals] Message sent successfully');
      console.log('[Approvals] Current request ID:', currentRequestId);
      // Clear the input depending on type
      if (messageInput.isContentEditable) {
        messageInput.innerHTML = '';
      } else {
        messageInput.value = '';
      }
      // Reload conversation to show new message
      console.log('[Approvals] Reloading conversation...');
      await openConversation(currentRequestId);
      console.log('[Approvals] Conversation reloaded');
    } catch (error) {
      console.error('[Approvals] Error sending message:', error);
      showNotification('Failed to send message: ' + error.message, 'error');
    }
  }
  
  // Reset form to original values
  function resetFormToOriginalValues() {
    const statusSelect = document.getElementById('adminStatusSelect');
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const deadlineInput = document.getElementById('adminDeadlineInput');
    
    if (statusSelect) {
      statusSelect.value = originalValues.status || '';
      const currentStatusValue = document.getElementById('currentStatusValue');
      if (currentStatusValue) currentStatusValue.textContent = originalValues.status || '';
    }
    
    if (unitsSelect) {
      unitsSelect.value = originalValues.units === 'Not yet assigned' ? '' : (originalValues.units || '');
      const currentUnitsValue = document.getElementById('currentUnitsValue');
      if (currentUnitsValue) currentUnitsValue.textContent = originalValues.units || 'Not yet assigned';
    }
    
    if (deadlineInput) deadlineInput.value = originalValues.deadline || '';
    
    showNotification('Changes cancelled - form reset to original values', 'info');
  }
  
  // Show update confirmation modal
  function showUpdateConfirmation() {
      const statusSelect = document.getElementById('adminStatusSelect');
      if (statusSelect && statusSelect.value === 'Archived' && originalValues.status !== 'Archived') {
        if (typeof window.openDeleteConfirm === 'function') {
          window.openDeleteConfirm({
            requestId: currentRequestId,
            requestType: currentRequestType
          });
          return;
        }
      }

    const changes = getFormChanges();
    if (changes.length === 0) {
      showNotification('No changes detected', 'info');
      return;
    }
    
    populateChangesModal(changes);
    updateConfirmationModal.classList.add('show');
  }
  
  // Get form changes
  function getFormChanges() {
    const changes = [];
    
    const statusSelect = document.getElementById('adminStatusSelect');
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const deadlineInput = document.getElementById('adminDeadlineInput');
    
    if (statusSelect && statusSelect.value !== originalValues.status) {
      changes.push({
        field: 'Status',
        oldValue: originalValues.status || 'Not set',
        newValue: statusSelect.value
      });
    }
    
    if (unitsSelect && unitsSelect.value !== originalValues.units) {
      changes.push({
        field: 'Assigned Unit',
        oldValue: originalValues.units || 'Not yet assigned',
        newValue: unitsSelect.value || 'Not yet assigned'
      });
    }
    
    if (deadlineInput && deadlineInput.value !== originalValues.deadline) {
      changes.push({
        field: 'Deadline',
        oldValue: originalValues.deadline ? new Date(originalValues.deadline).toLocaleDateString() : 'No deadline',
        newValue: deadlineInput.value ? new Date(deadlineInput.value).toLocaleDateString() : 'No deadline'
      });
    }
    
    return changes;
  }
  
  // Populate changes in confirmation modal
  function populateChangesModal(changes) {
    const changesContainer = document.getElementById('changesContainer');
    
    changesContainer.innerHTML = changes.map(change => `
      <div class="change-item">
        <span class="change-label">${change.field}:</span>
        <div class="change-values">
          <span class="old-value">${change.oldValue}</span>
          <span>→</span>
          <span class="new-value">${change.newValue}</span>
        </div>
      </div>
    `).join('');
  }
  
  // Perform the actual update
  async function performUpdate() {
    console.log('Performing update...');

    // Gather form data
    const statusSelect = document.getElementById('adminStatusSelect');
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const deadlineInput = document.getElementById('adminDeadlineInput');

    const updateData = {
      requestId: currentRequestId,
      status: statusSelect?.value || '',
      assignedUnits: unitsSelect?.value || 'Not yet assigned',
      deadline: deadlineInput?.value || null
    };

    console.log('Update data:', updateData);

    try {
      const response = await fetch('/admin/approval/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.success) {
        // Update the table row with the updated data
        const updatedDisplayUnits = updateData.assignedUnits || 'Not yet assigned';
        const formattedDeadline = updateData.deadline ?
          new Date(updateData.deadline).toLocaleDateString() : 'N/A';

        updateTableRowData(currentRequestId, {
          status: updateData.status,
          units: updatedDisplayUnits,
          deadline: updateData.deadline,
          formattedDeadline: formattedDeadline
        });

        // Close modals
        updateConfirmationModal.classList.remove('show');
        showNotification('All changes applied successfully!', 'success');

        // Update original values
        originalValues = {
          status: updateData.status,
          units: updateData.assignedUnits,
          deadline: updateData.deadline
        };

        // Reopen modal
        setTimeout(() => {
          reopenModalAfterUpdate(currentRequestId);
        }, 1000);

        // Refresh page shortly after so server-side changes (deliverables,
        // revision history, etc.) are reflected across the UI.
        setTimeout(() => {
          try {
            window.location.reload();
          } catch (e) {
            console.error('Auto-reload failed:', e);
          }
        }, 1500);
      } else {
        showNotification('Update failed: ' + result.message, 'error');
        updateConfirmationModal.classList.remove('show');
      }
    } catch (error) {
      console.error('Error performing update:', error);
      showNotification('Update failed: ' + error.message, 'error');
      updateConfirmationModal.classList.remove('show');
    } finally {
      const confirmBtn = document.getElementById('confirmUpdateBtn');
      if (confirmBtn) {
        confirmBtn.classList.remove('loading');
        confirmBtn.textContent = 'Confirm Update';
      }
    }
  }


  async function updateRequestUnits(requestId, newUnit, requestType) {
    console.log('🔄 Updating units:', { requestId, newUnit, requestType });
    
    try {
      const endpoint = '/admin/approval/update-status';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          requestId: requestId,
          assignedUnits: newUnit || ''
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update display elements in the modal
        const unitsElement = document.getElementById('detailUnits');
        const currentUnitsValue = document.getElementById('currentUnitsValue');
        
        const displayValue = newUnit || 'Not yet assigned';
        if (unitsElement) unitsElement.innerText = displayValue;
        if (currentUnitsValue) currentUnitsValue.innerText = displayValue;
        
        // Update table row
        updateTableRowData(requestId, {
          units: displayValue
        });
        
        return true;
      } else {
        console.error('Units update failed:', result.message);
        showNotification('Failed to update assigned units: ' + result.message, 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating units:', error);
      showNotification('Failed to update assigned units: ' + error.message, 'error');
      return false;
    }
  }
  
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
    
    // Determine colors based on type
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

  // Populate modal with request data
  function populateModalData(rowData) {
    console.log('📝 Populating modal with data:', rowData);
    
    // Store original values
    originalValues = {
      status: rowData.status,
      units: rowData.units,
      deadline: rowData.deadline || null
    };
    
    // Helper function to safely set element text
    function setElementText(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || 'N/A';
      }
    }
    
    function setElementHTML(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = value || 'N/A';
      }
    }
    
    // Populate general information
    setElementText('detailTitle', rowData.title);
    setElementText('detailStudent', rowData.student);
    // Toggle admin-created label
    const detailAdminLabel = document.getElementById('detailAdminLabel');
    if (detailAdminLabel) {
      detailAdminLabel.style.display = rowData.adminCreated === 'true' ? 'inline' : 'none';
    }
    setElementText('detailType', 'Request Approval');
    setElementText('detailOrganization', rowData.organization);
    setElementText('detailDatetime', rowData.datetime);
    setElementText('detailDeadlineInfo', rowData.formattedDeadline);
    setElementHTML('detailDescription', rowData.description || 'No description provided');
    
    // Update specific request type with fallback
  const specificRequestType = document.querySelector('[data-field="specificRequestType"]');
console.log(' Specific Request Type Element:', specificRequestType);
console.log(' Available values:', {
  specifictype: rowData.specifictype,
  specificRequestType: rowData.specificRequestType,
  raw: rowData
});

if (specificRequestType) {
  const requestTypeValue = rowData.specifictype || rowData.specificRequestType || 'Not specified';
  specificRequestType.textContent = requestTypeValue;
  console.log(' Setting specific request type to:', requestTypeValue);
} else {
  console.error(' Specific request type element not found!');
}
    // Populate admin form
    populateAdminForm(rowData);
    
    // Clear file-preview (legacy); links shown in detailsLinksSection below
    const filePreviewEl = document.getElementById('file-preview');
    if (filePreviewEl) filePreviewEl.innerHTML = '';
    
    // Populate links section
    const linksSection = document.getElementById('detailsLinksSection');
    const linksContainer = document.getElementById('detailLinks');
    if (linksSection && linksContainer) {
      let linksArray = [];
      try {
        linksArray = JSON.parse(rowData.links || '[]');
      } catch (e) {
        if (rowData.links && typeof rowData.links === 'string') {
          linksArray = rowData.links.split(',').filter(Boolean);
        }
      }
      if (linksArray.length > 0) {
        linksSection.style.display = 'block';
        linksContainer.innerHTML = linksArray.map(link => `
          <div class="link-item" style="margin-bottom:0.5rem;">
            <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#0891b2;word-break:break-all;text-decoration:underline;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;margin-right:4px;vertical-align:middle;">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              ${link}
            </a>
          </div>
        `).join('');
      } else {
        linksSection.style.display = 'block';
        linksContainer.innerHTML = '<p style="color:#6b7280;margin:0;">No links submitted</p>';
      }
    }

    // Load revision history (pass status to determine visibility)
    loadRevisionHistory(currentRequestId, rowData.status);
    
    // Show/hide additional file upload toggle based on status
    // Hide for terminal statuses: Approved, Completed, Rejected, Archived
    const additionalFileToggleSection = document.getElementById('additionalFileToggleSection');
    if (additionalFileToggleSection) {
      const terminalStatuses = ['approved', 'completed', 'rejected', 'archived'];
      const currentStatusLower = (rowData.status || '').toLowerCase();
      
      if (!terminalStatuses.includes(currentStatusLower)) {
        additionalFileToggleSection.style.display = 'block';
        // Add event listener for the toggle
        const toggleCheckbox = document.getElementById('toggleAdditionalFileUploadBtn');
        if (toggleCheckbox) {
          // Try multiple methods to get the allowAdditionalUpload value
          let allowAdditionalUpload = 'false';
          
          // Method 1: From rowData (converted from dataset)
          if (rowData.allowAdditionalUpload !== undefined) {
            allowAdditionalUpload = rowData.allowAdditionalUpload;
          }
          // Method 2: From HTML attribute directly
          else {
            const currentRow = document.querySelector(`tr[data-id="${currentRequestId}"]`);
            if (currentRow) {
              allowAdditionalUpload = currentRow.getAttribute('data-allow-additional-upload') || 'false';
            }
          }
          
          console.log('🔍 Checkbox initialization:', {
            currentRequestId,
            'rowData.allowAdditionalUpload': rowData.allowAdditionalUpload,
            'final allowAdditionalUpload': allowAdditionalUpload,
            'will check': allowAdditionalUpload === 'true'
          });
          
          // Set checkbox state based on current allowAdditionalUpload value
          toggleCheckbox.checked = allowAdditionalUpload === 'true';
          
          // Remove existing listener to prevent duplicates
          toggleCheckbox.removeEventListener('change', handleAdditionalFileToggle);
          // Add new listener
          toggleCheckbox.addEventListener('change', handleAdditionalFileToggle);
        }
      } else {
        additionalFileToggleSection.style.display = 'none';
        // Remove event listener when hidden
        const toggleCheckbox = document.getElementById('toggleAdditionalFileUploadBtn');
        if (toggleCheckbox) {
          toggleCheckbox.removeEventListener('change', handleAdditionalFileToggle);
        }
      }
    }
  }

  // Populate admin form
  function populateAdminForm(rowData) {
    // Populate status options for approval requests
    const statusSelect = document.getElementById('adminStatusSelect');
    const currentStatusValue = document.getElementById('currentStatusValue');
    
    if (statusSelect && currentStatusValue) {
      // Ensure statuses are loaded from database
      if (availableStatuses.length === 0) {
        // Try to get from filterDataFromDatabase first
        const dbData = window.filterDataFromDatabase || {};
        if (dbData.requestStatuses && dbData.requestStatuses.length > 0) {
          availableStatuses = dbData.requestStatuses;
        } else {
          // Fallback to default statuses
          availableStatuses = ['Pending', 'Queued', 'In Progress', 'For Checking', 'For Revision', 'Approved', 'Completed', 'Rejected', 'Archived'];
        }
      }
      
      const statusOptions = availableStatuses.map(status => ({
        value: status,
        label: status
      }));
      
      // Compare status values case-insensitively so values from dataset
      // (which may be lowercased) still match option values from DB
      const rowStatusLower = (rowData.status || '').toString().toLowerCase();
      let selectedFound = false;
      statusSelect.innerHTML = statusOptions.map(option => {
        const optVal = option.value || '';
        const isSelected = optVal.toString().toLowerCase() === rowStatusLower && rowStatusLower !== '';
        if (isSelected) selectedFound = true;
        return `<option value="${optVal}" ${isSelected ? 'selected' : ''}>${option.label}</option>`;
      }).join('');

      // Display a friendly current value: prefer the matched option label,
      // otherwise show a capitalized fallback of the stored value
      if (selectedFound) {
        const matched = statusOptions.find(o => (o.value || '').toString().toLowerCase() === rowStatusLower);
        currentStatusValue.textContent = matched ? matched.label : (rowData.status || 'N/A');
      } else {
        const fallback = rowData.status ? (rowData.status.toString().charAt(0).toUpperCase() + rowData.status.toString().slice(1)) : 'N/A';
        currentStatusValue.textContent = fallback;
      }
    }
    
  // Populate units
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const currentUnitsValue = document.getElementById('currentUnitsValue');

    if (unitsSelect && currentUnitsValue) {
      // Ensure units are loaded from database (consistent with services.js)
      if (availableUnits.length === 0) {
        // Try to get from filterDataFromDatabase first
        const dbData = window.filterDataFromDatabase || {};
        if (dbData.units && dbData.units.length > 0) {
          availableUnits = dbData.units;
        } else {
          // Fallback to default units
          availableUnits = ['Graphics Unit', 'Multimedia Unit', 'Public Relations Unit', 'Social Media Unit'];
        }
      }
      
      // Define recommendation mapping for approval requests
      const recommendationMapping = {
        'Social Media Post Content/Caption': ['Social Media Unit', 'Public Relations Unit'],
        'Draft Official Letter/Advisory': ['Public Relations Unit'],
        'Publication Material/Pubmat Design Vetting': ['Graphics Unit'],
        'Publication Wording/Content Check': ['Public Relations Unit', 'Social Media Unit'],
        'Logo/Merchandise Design Vetting': ['Graphics Unit']
      };

      // Get recommended units for this request type
      const specificType = rowData.specifictype || rowData.specificRequestType || '';
      const recommendedUnits = recommendationMapping[specificType.trim()] || [];

      console.log('Request type:', specificType, 'Recommended units:', recommendedUnits);

      if (unitsSelect) {
        // Clear existing options
        let optionsHtml = '<option value="">Not yet assigned</option>';
        
        // Add units from database
        availableUnits.forEach(unit => {
          const isRecommended = recommendedUnits.includes(unit);
          optionsHtml += `<option value="${unit}" ${isRecommended ? 'class="recommended-unit"' : ''}>${isRecommended ? '★ ' : ''}${unit}</option>`;
        });
        
        unitsSelect.innerHTML = optionsHtml;

        // Set the current value
        unitsSelect.value = rowData.units === 'Not yet assigned' ? '' : rowData.units;
      }

      if (currentUnitsValue) {
        currentUnitsValue.textContent = rowData.units || 'Not yet assigned';
      }

      // Update detail units display
      const detailUnits = document.getElementById('detailUnits');
      if (detailUnits) {
        detailUnits.textContent = rowData.units || 'Not yet assigned';
      }
    }
    
    // Populate deadline
    const deadlineInput = document.getElementById('adminDeadlineInput');
    const currentDeadlineValue = document.getElementById('currentDeadlineValue');
    
    if (deadlineInput && currentDeadlineValue) {
      // Set the deadline value
      if (rowData.deadline) {
        deadlineInput.value = rowData.deadline;
        currentDeadlineValue.textContent = rowData.formattedDeadline || rowData.deadline;
      } else {
        deadlineInput.value = '';
        currentDeadlineValue.textContent = 'No deadline set';
      }
    }
  }
  
  // File preview function (simplified)
// Enhanced file preview function with proper image viewing
function populateFilePreview(rowData) {
  const previewContainer = document.getElementById('file-preview');
  if (!previewContainer) return;
  
  previewContainer.innerHTML = '';
  
  let allFiles = [];
  
  if (rowData.files && rowData.files.trim() !== '') {
    allFiles = rowData.files.split(',').map(f => f.trim()).filter(Boolean);
  } else if (rowData.file && rowData.file.trim() !== '') {
    allFiles = [rowData.file.trim()];
  }
  
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

// Add image preview modal function (add this right after the populateFilePreview function)
window.openImagePreview = function(imageUrl, fileName) {
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
  
  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 90vw;
    max-height: 90vh;
    position: relative;
  `;
  
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = fileName;
  img.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  `;
  
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
  
  container.appendChild(img);
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
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
  
  document.body.style.overflow = 'hidden';
};

  // Reopen modal after update
  function reopenModalAfterUpdate(requestId) {
    const updatedRow = document.querySelector(`[data-id="${requestId}"]`);
    if (updatedRow) {
      const rowData = {
        id: updatedRow.dataset.id,
        requestId: updatedRow.dataset.requestId,
        type: updatedRow.dataset.type,
        title: updatedRow.dataset.title,
        status: updatedRow.dataset.status,
        organization: updatedRow.dataset.organization,
        specifictype: updatedRow.dataset.specifictype,
        specificRequestType: updatedRow.dataset.specifictype,
        units: updatedRow.dataset.units,
        datetime: updatedRow.dataset.datetime,
        deadline: updatedRow.dataset.deadline,
        formattedDeadline: updatedRow.dataset.formattedDeadline,
        description: updatedRow.dataset.description,
        file: updatedRow.dataset.file,
        files: updatedRow.dataset.files,
        links: updatedRow.dataset.links,
        allowAdditionalUpload: updatedRow.dataset.allowAdditionalUpload,
        student: updatedRow.dataset.student,
        adminCreated: updatedRow.dataset.adminCreated
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
    }
  }

  // Update table row data
  function updateTableRowData(requestId, updatedData) {
    const row = document.querySelector(`[data-id="${requestId}"]`);
    if (!row) return;
    
    if (updatedData.status) {
      row.dataset.status = updatedData.status;
      
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.className = `status-badge ${updatedData.status.toLowerCase().replace(/\s+/g, '-')}`;
        statusBadge.textContent = updatedData.status;
      }
    }
    
    if (updatedData.units !== undefined) {
      row.dataset.units = updatedData.units;
      
      const cells = row.querySelectorAll('td');
      if (cells[5]) {
        cells[5].textContent = updatedData.units;
      }
    }

    if (updatedData.formattedDeadline) {
      row.dataset.deadline = updatedData.deadline;
      row.dataset.formattedDeadline = updatedData.formattedDeadline;
      // Update deadline display in table if exists
      const cells = row.querySelectorAll('td');
      if (cells[7]) { // Deadline column
        const deadlineCell = cells[7];
        deadlineCell.innerHTML = updatedData.formattedDeadline !== 'N/A' ? 
          `<span class="deadline-badge">${updatedData.formattedDeadline}</span>` : 
          '<span class="deadline-badge">N/A</span>';
      }
    }

    // Update the allRequestsData array for filtering
    const requestIndex = allRequestsData.findIndex(req => req.element === row);
    if (requestIndex !== -1) {
      if (updatedData.status) {
        allRequestsData[requestIndex].status = updatedData.status.toLowerCase();
      }
      if (updatedData.units !== undefined) {
        allRequestsData[requestIndex].units = updatedData.units.toLowerCase();
      }
      if (updatedData.deadline !== undefined) {
        allRequestsData[requestIndex].deadline = updatedData.deadline;
      }
    }
  }
  
  // Function to mark request as viewed
  async function markRequestAsViewed(requestId, requestType) {
    try {
      const endpoint = '/api/admin/approval/mark-viewed';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: requestId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`Request ${requestId} marked as viewed by admin`);
        return true;
      } else {
        console.error('Failed to mark request as viewed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking request as viewed:', error);
      return false;
    }
  }

  // Handle additional file toggle
  async function handleAdditionalFileToggle() {
    const toggleCheckbox = document.getElementById('toggleAdditionalFileUploadBtn');

    if (!currentRequestId) {
      showNotification('No request selected', 'error');
      return;
    }

    try {
      const response = await fetch('/admin/toggle-additional-file-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          requestId: currentRequestId,
          requestType: currentRequestType,
          allowAdditionalFileUpload: toggleCheckbox.checked.toString()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the HTML data attribute to persist the change
        const currentRow = document.querySelector(`tr[data-id="${currentRequestId}"]`);
        if (currentRow) {
          currentRow.setAttribute('data-allow-additional-upload', toggleCheckbox.checked.toString());
          console.log('🔄 Updated HTML attribute to:', toggleCheckbox.checked.toString());
        }
        
        showNotification('Additional file upload permission updated successfully', 'success');
      } else {
        showNotification('Failed to update additional file upload permission: ' + (result.message || 'Unknown error'), 'error');
        // Revert the checkbox state
        if (toggleCheckbox) {
          toggleCheckbox.checked = !toggleCheckbox.checked;
        }
      }
    } catch (error) {
      console.error('Error toggling additional file upload:', error);
      showNotification('Failed to update additional file upload permission: ' + error.message, 'error');
      // Revert the checkbox state
      if (toggleCheckbox) {
        toggleCheckbox.checked = !toggleCheckbox.checked;
      }
    }
  }

  // Initialize row click handlers
  function initializeRowClickHandlers() {
    const rows = document.querySelectorAll('.request-row');
    console.log(`🖱️ Setting up click handlers for ${rows.length} rows`);
    
    rows.forEach((row, index) => {
      row.style.cursor = 'pointer';
      
      row.addEventListener('click', async function(e) {
        // Prevent click on badges and buttons
        if (e.target.closest('.status-badge') ||
            e.target.closest('.type-badge') ||
            e.target.closest('button') ||
            e.target.closest('a')) {
          return;
        }

        // Extract data from row
        const rowData = {
          id: row.dataset.id,
          requestId: row.dataset.requestId,
          type: row.dataset.type,
          title: row.dataset.title,
          status: row.dataset.status,
          organization: row.dataset.organization,
          specifictype: row.dataset.specifictype,
          specificRequestType: row.dataset.specifictype,
          units: row.dataset.units,
          datetime: row.dataset.datetime,
          deadline: row.dataset.deadline,
          formattedDeadline: row.dataset.formattedDeadline,
          description: row.dataset.description,
          file: row.dataset.file,
          files: row.dataset.files,
          links: row.dataset.links,
          allowAdditionalUpload: row.dataset.allowAdditionalUpload,
          student: row.dataset.student,
          adminCreated: row.dataset.adminCreated
        };

        console.log('Row clicked with data:', rowData);

        // Mark notification as read when opening request
        if (typeof window.markNotificationReadForRequest === 'function') {
          window.markNotificationReadForRequest(rowData.id, rowData.type);
        }

        // Set current request data
        currentRequestId = rowData.id;
        currentRequestType = rowData.type;

        // Populate modal and open
        populateModalData(rowData);
        detailModal.style.display = 'flex';

        // Reset scroll position to top
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

console.log('✅ Approvals Admin script loaded successfully');

  // Image modal functionality
  function openImageModal(imageSrc) {
    let imageModal = document.getElementById('imageModal');
    
    if (!imageModal) {
      // Create image modal if it doesn't exist
      imageModal = document.createElement('div');
      imageModal.id = 'imageModal';
      imageModal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        cursor: pointer;
      `;
      
      const modalImg = document.createElement('img');
      modalImg.id = 'modalImage';
      modalImg.style.cssText = `
        margin: auto;
        display: block;
        width: auto;
        height: auto;
        max-width: 90%;
        max-height: 90%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      
      const closeBtn = document.createElement('span');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 35px;
        color: #f1f1f1;
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
        z-index: 10001;
      `;
      
      closeBtn.onclick = function() {
        imageModal.style.display = 'none';
      };
      
      imageModal.onclick = function(e) {
        if (e.target === imageModal) {
          imageModal.style.display = 'none';
        }
      };
      
      imageModal.appendChild(modalImg);
      imageModal.appendChild(closeBtn);
      document.body.appendChild(imageModal);
    }
    
    const modalImg = document.getElementById('modalImage');
    modalImg.src = imageSrc;
    imageModal.style.display = 'block';
  }

  // Display messages function using the same format as allrequestsadmin.js
  function displayMessages(messages) {
    console.log('[Approvals] displayMessages called with', messages?.length || 0, 'messages');
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.error('[Approvals] messagesContainer not found!');
      return;
    }
    
    if (!messages || messages.length === 0) {
      console.log('[Approvals] No messages to display');
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
      return;
    }
    
    // Clear container
    messagesContainer.innerHTML = '';
    
    // Create and append message elements
    messages.forEach(msg => {
      const messageElement = createMessageElement(msg);
      messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Create message element function (matching allrequestsadmin.js format)
  function createMessageElement(msg) {
    const div = document.createElement('div');
    
    // Determine if this is the current user's message
    const isOwnMessage = window.currentUserFullName && msg.senderName === window.currentUserFullName;
    
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
    }
    
    // Build read receipts HTML
    let readReceiptsHTML = '';
    const isAdmin = window.currentUserRole === 'admin';
    const showReadReceipts = isAdmin ? (msg.readBy && msg.readBy.length > 0) : (msg.readBy && msg.readBy.length > 0 && isOwnMessage);
    if (showReadReceipts) {
      const filteredReadBy = msg.readBy.filter(r => {
        if (!r.userName) return false;
        if (!isAdmin && r.userRole === 'admin') return false;
        return true;
      });
      if (filteredReadBy.length > 0) {
        const readByList = filteredReadBy.map(reader => {
          const readTime = new Date(reader.readAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          return `
            <div style="display: flex; align-items: center; gap: 0.25rem; color: #059669;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M1 12l5 5L23 3"></path>
                <path d="M1 12l5 5L23 3" transform="translate(3, 0)"></path>
              </svg>
              <span>Read by ${reader.userName} at ${readTime}</span>
            </div>
          `;
        }).join('');
        readReceiptsHTML = `<div class="read-receipts" style="margin-top: 0.5rem; font-size: 0.7rem; color: #6b7280;">${readByList}</div>`;
      }
    }
    
    div.innerHTML = `
      <div class="unit-message-bubble ${roleClass}">
        <div class="message-header">
          <strong>${window.escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${window.formatText(msg.content || '')}</div>
        ${attachmentsHTML}
        ${readReceiptsHTML}
      </div>
    `;
    
    return div;
  }

// Auto-open modal if openModalId is in URL
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const openModalId = urlParams.get('openModalId');
  
  if (openModalId) {
    const targetRow = document.querySelector(`[data-id="${openModalId}"]`);
    if (targetRow) {
      setTimeout(() => {
        targetRow.click();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 500);
    }
  }
});

// Global function to open request modal by ID (for notification clicks)
window.openRequestModal = function(requestId, requestType) {
  console.log('Opening admin approval modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // Trigger the existing modal opening
    targetRow.click();
  } else {
    console.warn('Approval request not found on current admin page:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Global function to open conversation modal by ID (for message notifications)
window.openConversationModal = function(requestId, requestType) {
  console.log('Opening admin approval conversation modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // First open the details modal
    targetRow.click();
    
    // Then trigger the conversation modal after a short delay
    setTimeout(() => {
      const chatButton = document.getElementById('openChatFromModal');
      if (chatButton) {
        console.log('Found approval chat button, clicking it');
        chatButton.click();
      } else {
        console.warn('Chat button #openChatFromModal not found in approval modal');
      }
    }, 300);
  } else {
    console.warn('Approval request not found for conversation:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Enhanced auto-opening logic for modal and conversation parameters
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle modal opening from notifications
  if (urlParams.has('modal') && urlParams.has('requestId') && urlParams.get('type') === 'approval') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening approval modal for notification:', requestId);
    
    setTimeout(() => {
      window.openRequestModal(requestId, 'approval');
    }, 500);
  }
  
  // Handle conversation opening from message notifications
  if (urlParams.has('conversation') && urlParams.has('requestId') && urlParams.get('type') === 'approval') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening approval conversation for message notification:', requestId);
    
    setTimeout(() => {
      window.openConversationModal(requestId, 'approval');
    }, 500);
  }
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

// Toggle dropdown function
window.toggleDropdown = function() {
  if (!headerDropdown.menu) {
    headerDropdown.init();
  }
  headerDropdown.toggle();
};

// Initialize header dropdown on load
document.addEventListener('DOMContentLoaded', () => {
  headerDropdown.init();
});

// Close dropdown when clicking outside
document.addEventListener("click", function(event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (toggle && menu && !toggle.contains(event.target)) {
    headerDropdown.close();
  }
});

// ==========================================
// REVISION HISTORY FUNCTIONS (Admin Approvals - Observer Only)
// ==========================================

async function loadRevisionHistory(requestId, currentStatus = '') {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    console.log('[Admin Approvals - Revision History] Loading for request:', requestId, 'Status:', currentStatus);
    
    if (!historyContainer) {
        console.warn('[Admin Approvals - Revision History] Container not found!');
        return;
    }
    
    // Helper function to show empty state
    const showEmptyState = () => {
        if (historySection) {
            historySection.style.display = 'block';
        }
        historyContainer.innerHTML = `
            <div class="revision-empty-state" style="text-align: center; padding: 2rem; color: #6b7280;">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 1rem; opacity: 0.5;">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                </svg>
                <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">No Revision History</p>
                <p style="font-size: 0.875rem;">This request has not gone through any revisions yet.</p>
            </div>
        `;
    };
    
    try {
        const response = await fetch(`/api/revision-history/${requestId}`);
        console.log('[Admin Approvals - Revision History] Response status:', response.status);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Admin Approvals - Revision History] API returned non-JSON response');
            showEmptyState();
            return;
        }
        
        const result = await response.json();
        console.log('[Admin Approvals - Revision History] API Response:', result);
        console.log('[Admin Approvals - Revision History] Revisions count:', result.revisions?.length || 0);
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            console.log('[Admin Approvals - Revision History] Showing section with', result.revisions.length, 'revisions');
            
            // Enable two-column layout when revisions exist
            const modalContent = document.querySelector('#detailsModal .modal-content');
            const modalBody = document.querySelector('#detailsModal .admin-modal-body');
            const rightColumn = document.querySelector('#detailsModal .admin-right-column');
            
            if (modalContent && modalBody) {
                modalContent.style.maxWidth = '1600px';
                modalBody.classList.add('has-revisions');
            }
            
            if (historySection) {
                historySection.style.display = 'block';
            }
            
            historyContainer.innerHTML = '';
            
            // Filter out initial submission and render all revisions
            const revisionsToShow = result.revisions.filter(revision => revision.type !== 'initial');
            
            if (revisionsToShow.length > 0) {
                revisionsToShow.forEach((revision, index) => {
                    console.log('[Admin Approvals - Revision History] Rendering revision', index, ':', revision.type);
                    const entry = createAdminRevisionEntry(revision, index, revisionsToShow.length);
                    historyContainer.appendChild(entry);
                });
                
                console.log('[Admin Approvals - Revision History] All revisions rendered');
            } else {
                showEmptyState();
            }
        } else {
            console.log('[Admin Approvals - Revision History] No revisions to display - showing empty state');
            showEmptyState();
        }
    } catch (error) {
        console.error('[Admin Approvals - Revision History] Error loading revision history:', error);
        showEmptyState();
    }
}

function createAdminRevisionEntry(revision, index, total) {
    console.log('🔍 [Admin Approvals] Creating revision entry:', {
        index,
        total,
        hasRequestedBy: !!revision.requestedBy,
        hasRespondedBy: !!revision.respondedBy,
        type: revision.type
    });
    
    const entry = document.createElement('div');
    
    const isUnitAction = revision.requestedBy || revision.type === 'revision' || revision.type === 'revoked' || revision.type === 'approved';
    const isRequestorAction = revision.respondedBy || revision.type === 'initial' || revision.type === 'resubmitted';
    
    entry.className = `revision-conversation-item ${isUnitAction ? 'unit-action' : 'requestor-action'}`;
    
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
    
    let typeLabel, badgeClass;
    if (revision.type === 'initial') {
        typeLabel = 'Initial Submission';
        badgeClass = 'badge-initial';
    } else if (revision.type === 'approved') {
        typeLabel = '✓ Approved';
        badgeClass = 'badge-approved';
    } else if (isUnitAction) {
        typeLabel = 'Revision Requested';
        badgeClass = 'badge-revision';
    } else if (isRequestorAction) {
        typeLabel = 'Resubmitted For Review';
        badgeClass = 'badge-resubmitted';
    } else {
        typeLabel = 'Update';
        badgeClass = 'badge-revision';
    }
    
    const isLast = index === total - 1;
    let statusIndicator = '';
    if (revision.type === 'approved') {
        statusIndicator = `<div class="status-indicator approved"><svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg><span style="color: #10b981; font-weight: 600;">Request Approved - Process Complete</span></div>`;
    } else if (isLast) {
        statusIndicator = isUnitAction ?
            `<div class="status-indicator waiting"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Waiting for Requestor Response</div>` :
            `<div class="status-indicator under-review"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Under Unit Review</div>`;
    }
    
    let authorName = 'Unknown', authorUnit = '';
    if (revision.by) {
        authorName = revision.by;
    } else if (revision.requestedBy) {
        if (typeof revision.requestedBy === 'object' && revision.requestedBy.fName) {
            authorName = `${revision.requestedBy.fName} ${revision.requestedBy.lName}`;
            if (revision.requestedBy.unitTeam) authorUnit = ` (${revision.requestedBy.unitTeam} Unit)`;
        } else {
            authorName = 'Unit Team';
        }
    } else if (revision.respondedBy) {
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
                    if (revision.type === 'approved') return 'APPROVAL DETAILS:';
                    if (revision.type === 'initial') return 'REQUEST DESCRIPTION:';
                    if (isUnitAction) return 'UNIT FEEDBACK:';
                    return 'USER RESPONSE:';
                })()}</div>
                <div class="content-text">${displayFormattedText((() => {
                    if (revision.type === 'approved') return 'The request has been reviewed and approved by the unit team. All requirements have been met.';
                    if (revision.type === 'initial') return revision.description || 'No description provided';
                    if (isUnitAction) return revision.revisionNotes || revision.description || 'No feedback provided';
                    return revision.responseNotes || revision.description || 'No response provided';
                })())}</div>
            </div>
            ${((revision.revisionFiles && revision.revisionFiles.length > 0) || (revision.responseFiles && revision.responseFiles.length > 0) || (revision.files && revision.files.length > 0)) ? `
                <div class="message-attachments-section">
                    <div class="attachments-header">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        <span class="attachments-count">${(revision.revisionFiles || revision.responseFiles || revision.files || []).length} file${(revision.revisionFiles || revision.responseFiles || revision.files || []).length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div class="attachments-grid">
                        ${(revision.revisionFiles || revision.responseFiles || revision.files || []).map(file => createAdminRevisionFileCard(file, revision.requestedAt || revision.respondedAt || revision.timestamp)).join('')}
                    </div>
                </div>
            ` : ''}
            ${statusIndicator}
        </div>
    `;
    return entry;
}

function createAdminRevisionFileCard(file, revisionTimestamp) {
    const filename = file.filename || file.path || file.name || file;
    if (typeof file === 'string') {
        const ext = file.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isPDF = ext === 'pdf';
        const fileUrl = `/uploads/${file}`;
        let iconColor = '#64748b';
        if (isImage) iconColor = '#059669';
        else if (isPDF) iconColor = '#dc2626';
        else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
        else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
        const timestamp = revisionTimestamp ? new Date(revisionTimestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unknown date';
        return `
            <div class="revision-file-card">
                <div class="revision-file-icon" style="background: ${iconColor}20; color: ${iconColor};">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </div>
                <div class="revision-file-info">
                    <div class="revision-file-name" title="${escapeHtml(file)}">${escapeHtml(file)}</div>
                    <div class="revision-file-size">${ext.toUpperCase()}</div>
                    <div class="revision-file-date">${timestamp}</div>
                </div>
                <div class="revision-file-actions">
                    ${isPDF ? `<button class="file-action-icon" onclick="window.open('${fileUrl}', '_blank')" title="View PDF"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>` : ''}
                    <button class="file-action-icon" onclick="window.open('${fileUrl}', '_blank')" title="Download"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
                </div>
            </div>
        `;
    }
    return '';
}

function getFileColor(ext) {
    const colorMap = {
        'pdf': '#dc2626',
        'doc': '#2563eb', 'docx': '#2563eb',
        'xls': '#059669', 'xlsx': '#059669',
        'ppt': '#ea580c', 'pptx': '#ea580c',
        'jpg': '#7c3aed', 'jpeg': '#7c3aed', 'png': '#7c3aed', 'gif': '#7c3aed',
        'zip': '#ca8a04', 'rar': '#ca8a04',
        'txt': '#64748b'
    };
    return colorMap[ext] || '#6b7280';
}

// Helper function to display formatted text (supports HTML from Quill and markdown-style formatting)
function displayFormattedText(text) {
    if (!text) return '';
    
    let formatted = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ');
    
    const hasHtml = /<\/?(p|div|strong|b|em|i|u|a|br|span)[\s>]/i.test(formatted);
    
    if (!hasHtml) {
        formatted = escapeHtml(formatted);
        // Auto-link bare URLs (only matches literal http(s):// prefixes, so this
        // can't be used to smuggle in a javascript:/data: URI)
        formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
            let trail = '';
            const trailMatch = url.match(/[).,!?;:]+$/);
            if (trailMatch) {
                trail = trailMatch[0];
                url = url.slice(0, -trail.length);
            }
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>' + trail;
        });
    }

    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/__([^_]+)__/g, '<u>$1</u>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// FILTER TOGGLE SECTION
// ==========================================
window.toggleFilterSection = function(header) {
    const body = header.nextElementSibling;
    const icon = header.querySelector('.filter-toggle-icon');
    if (body) {
        body.classList.toggle('collapsed');
    }
    if (icon) {
        icon.classList.toggle('rotated');
    }
};
