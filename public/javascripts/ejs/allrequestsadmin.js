/* =============================================================================
   ALLREQUESTSADMIN.JS - S-CORE Admin All Requests Page JavaScript
   =============================================================================
   Purpose: Interactive functionality for the admin all requests dashboard
   Connected file: views/Admin/allrequestsadmin.ejs
   Dependencies: jQuery (for some operations), admin routes, modal system
   Features: Request filtering, modal management, update handling, conversation system
   ============================================================================= */

console.log('🚀 Starting All RequestsAdmin script...');

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

// Note: Organization and Office data are now fetched from the database
// and passed via window.filterDataFromDatabase from the EJS template

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

// Enhanced Single Select Class
class EnhancedSingleSelect {
  constructor(containerId, options, placeholder = 'Select option') {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.placeholder = placeholder;
    this.selectedValue = 'all';
    this.isOpen = false;

    this.init();
  }

  init() {
    this.setupElements();
    this.populateOptions();
    this.attachEventListeners();
    this.updateDisplay();
  }

  setupElements() {
    this.display = this.container.querySelector('.single-select-display');
    this.dropdown = this.container.querySelector('.single-select-dropdown');
    this.optionsContainer = this.container.querySelector('.single-options-container');
    this.selectedText = this.display.querySelector('.single-selected-text');
  }

  populateOptions() {
    this.options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'single-dropdown-option';
      optionElement.dataset.value = option.value;
      optionElement.innerHTML = `
        <span>${option.text}</span>
        ${option.value === this.selectedValue ? '<span style="color: var(--primary-green)">●</span>' : ''}
      `;
      this.optionsContainer.appendChild(optionElement);
    });
  }

  attachEventListeners() {
    this.display.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.optionsContainer.addEventListener('click', (e) => {
      const option = e.target.closest('.single-dropdown-option');
      if (option) {
        this.selectOption(option.dataset.value, option.textContent.trim());
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

  selectOption(value, text) {
    this.selectedValue = value;
    this.updateOptionsDisplay();
    this.updateDisplay();
    this.close();
    this.triggerChange();
  }

  updateOptionsDisplay() {
    const options = this.optionsContainer.querySelectorAll('.single-dropdown-option');
    options.forEach(option => {
      const checkmark = option.querySelector('span:last-child');
      if (option.dataset.value === this.selectedValue) {
        option.classList.add('selected');
        checkmark.textContent = '●';
        checkmark.style.color = 'var(--primary-green)';
      } else {
        option.classList.remove('selected');
        checkmark.textContent = '';
      }
    });
  }

  updateDisplay() {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
    this.selectedText.textContent = selectedOption ? selectedOption.text : this.placeholder;
  }

  getSelectedValue() {
    return this.selectedValue;
  }

  setValue(value) {
    this.selectedValue = value;
    this.updateDisplay();
    this.updateOptionsDisplay();
    this.triggerChange();
  }

  reset() {
    this.selectedValue = 'all';
    this.updateDisplay();
    this.updateOptionsDisplay();
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
  }

  close() {
    this.isOpen = false;
    this.display.classList.remove('active');
    this.dropdown.classList.remove('show');
    
    // Clear this dropdown from the manager
    DropdownManager.clearActive(this);
  }

  triggerChange() {
    const event = new CustomEvent('selectionChange', {
      detail: { value: this.selectedValue }
    });
    this.container.dispatchEvent(event);
  }
}

// Global modal variables and functions (must be accessible globally)
let detailModal;
let updateConfirmationModal;
let cancelConfirmationModal;
let currentRequestId = null;
let currentRequestType = null;
let originalValues = {};
let allRequestsData = [];

// Global enhanced dropdown instances
let statusFilter, studentOrgFilter, officeDeptFilter;

// Modal opening functions - MUST be global
function openModalFromRow(row) {
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
    file: row.dataset.file,
    files: row.dataset.files,
    links: row.dataset.links,
    formattedDeadline: row.dataset.formattedDeadline,
    student: row.dataset.student,
    specifictype: row.dataset.specifictype,
    adminCreated: row.dataset.adminCreated
  };

  openModal(rowData);
}

function openModal(rowData) {
  console.log('Opening modal for request:', rowData.requestId);
  // Mark notification as read when opening request
  if (typeof window.markNotificationReadForRequest === 'function') {
    window.markNotificationReadForRequest(rowData.id, rowData.type);
  }

  currentRequestId = rowData.id;
  currentRequestType = rowData.type;

  populateModalData(rowData);

  const modalBody = detailModal.querySelector('.details-modal-body');
  modalBody.scrollTop = 0;

  console.log('Setting modal display to flex');
  detailModal.style.display = 'flex';
}

function closeModal() {
  detailModal.style.display = 'none';
}

// Initialize enhanced dropdowns when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('📋 DOM Content Loaded - Initializing...');

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
  const statusOptions = dbData.requestStatuses || [];
  const orgOptions = dbData.organizations || [];
  const officeOptions = dbData.offices || [];
  const unitOptions = dbData.units || [];

  // Initialize enhanced multi-select dropdowns with database values
  statusFilter = new EnhancedMultiSelect('statusFilter',
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

  studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter',
    orgOptions,
    'Select Student Organizations', true);
  
  const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
  if (studentOrgFilterContainer) {
    studentOrgFilterContainer.__instance = studentOrgFilter;
  }

  officeDeptFilter = new EnhancedMultiSelect('officeDeptFilter',
    officeOptions,
    'Select Offices/Departments', true);
  
  const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
  if (officeDeptFilterContainer) {
    officeDeptFilterContainer.__instance = officeDeptFilter;
  }

  // Initialize global modal variables
  detailModal = document.getElementById("detailsModal");
  updateConfirmationModal = document.getElementById("updateConfirmationModal");
  cancelConfirmationModal = document.getElementById("cancelConfirmationModal");

  console.log('🔍 DOM Elements Check:', {
    detailModal: !!detailModal,
    updateConfirmationModal: !!updateConfirmationModal,
    cancelConfirmationModal: !!cancelConfirmationModal,
    requestRows: document.querySelectorAll('.request-row').length
  });

  // Initialize all functionality components
  initializeFilters();
  initializeModalHandlers();
  initializeRichModalHandlers();
  initializeConversationModal();
  initializeAdditionalFileToggle();

  // Initialize row click handlers (this must come after all other initializations)
  initializeRowClickHandlers();

  console.log('✅ All initialization complete!');
});

// Filter functionality
function initializeFilters() {
  console.log('🔍 Initializing filters...');

  const rows = document.querySelectorAll('.request-row');
  allRequestsData = Array.from(rows).map(row => ({
    element: row,
    requestId: row.dataset.requestId,
    type: row.dataset.type,
    title: row.dataset.title?.toLowerCase(),
    status: row.dataset.status?.toLowerCase(),
    organization: row.dataset.organization?.toLowerCase(),
    units: row.dataset.units?.toLowerCase(),
    student: row.dataset.student?.toLowerCase(),
    datetime: row.dataset.datetime,
    date: row.dataset.date,
    description: row.dataset.description?.toLowerCase()
  }));

  const requestIdFilter = document.getElementById('requestIdFilter');
  const studentFilter = document.getElementById('studentFilter');
  const sortByFilter = document.getElementById('sortByFilter');
  const dateFromFilter = document.getElementById('dateFromFilter');
  const dateToFilter = document.getElementById('dateToFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultsCount = document.getElementById('resultsCount');

  // Event listeners setup
  const statusFilterContainer = document.getElementById('statusFilter');
  if (statusFilterContainer) {
    statusFilterContainer.addEventListener('selectionChange', applyFilters);
  }

  const assignedUnitFilterContainer = document.getElementById('assignedUnitFilter');
  if (assignedUnitFilterContainer) {
    assignedUnitFilterContainer.addEventListener('selectionChange', applyFilters);
  }

  const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
  if (studentOrgFilterContainer) {
    studentOrgFilterContainer.addEventListener('selectionChange', applyFilters);
  }

  const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
  if (officeDeptFilterContainer) {
    officeDeptFilterContainer.addEventListener('selectionChange', applyFilters);
  }

  if (requestIdFilter) {
    requestIdFilter.addEventListener('input', debounce(applyFilters, 300));
  }

  if (studentFilter) {
    studentFilter.addEventListener('input', debounce(applyFilters, 300));
  }

  if (dateFromFilter) {
    dateFromFilter.addEventListener('change', () => {
      // Set minimum date for "Date To" based on "Date From" selection
      if (dateToFilter && dateFromFilter.value) {
        dateToFilter.min = dateFromFilter.value;
        // If current "Date To" is earlier than "Date From", clear it
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
    sortByFilter.addEventListener('change', () => {
      console.log('Sort filter changed to:', sortByFilter.value);
      applyFilters();
    });
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
  
  function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      displayPage();
    }
  }
  
  function renderPaginationNumbers(totalPages) {
    if (!paginationNumbers) return;
    
    paginationNumbers.innerHTML = '';
    
    // Determine which page numbers to show
    const maxVisiblePages = 5;
    let startPage = 1;
    let endPage = totalPages;
    
    if (totalPages > maxVisiblePages) {
      // Calculate start and end pages
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      if (currentPage <= halfVisible + 1) {
        // Near the beginning
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisible) {
        // Near the end
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        // In the middle
        startPage = currentPage - halfVisible;
        endPage = currentPage + halfVisible;
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      paginationNumbers.appendChild(createPageButton(1));
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationNumbers.appendChild(ellipsis);
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationNumbers.appendChild(createPageButton(i));
    }
    
    // Add ellipsis and last page if needed
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
    btn.addEventListener('click', () => goToPage(pageNum));
    return btn;
  }

  function applyFilters() {
    console.log('Applying filters...');
    const filters = getFilterValues();
    const sortValue = sortByFilter?.value || 'deadline-asc';
    console.log('Sort value:', sortValue);
    
    // Reset to first page when filters change
    currentPage = 1;

    // First, filter the data
    filteredData = allRequestsData.filter(request => testFilters(request, filters));
    console.log(`Filtered to ${filteredData.length} requests`);
    
    // Then sort the filtered data
    sortData(filteredData, sortValue);
    console.log('Data sorted');
    
    // Display the current page
    displayPage();
    console.log('Page displayed');
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
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    
    updateResultsCount(filteredData.length);
  }

  function sortData(data, sortValue) {
    // Statuses that should be sorted to the bottom (completed/closed requests)
    const bottomStatusPriority = {
      completed: 1,
      approved: 2,
      rejected: 3,
      archived: 4
    };

    const getBottomPriority = (status) => {
      if (!status) return null;
      const key = status.toLowerCase();
      return Object.prototype.hasOwnProperty.call(bottomStatusPriority, key)
        ? bottomStatusPriority[key]
        : null;
    };

    const getSortDateValue = (item, field) => {
      if (field === 'deadline') {
        return item.element?.dataset?.deadline || '';
      }
      // For date-based sorts and default, use the request date
      return item.date || '';
    };

    const [field, direction] = sortValue.split('-');
    const isAsc = direction === 'asc';

    data.sort((a, b) => {
      const aPriority = getBottomPriority(a.status);
      const bPriority = getBottomPriority(b.status);

      const aIsBottom = aPriority !== null;
      const bIsBottom = bPriority !== null;

      // Non-bottom requests should always come before bottom ones
      if (aIsBottom && !bIsBottom) return 1;
      if (!aIsBottom && bIsBottom) return -1;

      // High-priority org/office/dept rows always pin to the top of their group
      const aHP = a.element?.classList.contains('priority-row') || false;
      const bHP = b.element?.classList.contains('priority-row') || false;
      if (aHP !== bHP) return aHP ? -1 : 1;

      // If both are bottom-status requests, enforce fixed ordering
      if (aIsBottom && bIsBottom) {
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Same bottom status: sort newest to oldest by date/deadline
        const valA = getSortDateValue(a, field);
        const valB = getSortDateValue(b, field);

        if (!valA && valB) return 1;
        if (valA && !valB) return -1;
        if (!valA && !valB) return 0;

        if (valA < valB) return 1;
        if (valA > valB) return -1;
        return 0;
      }

      // For non-bottom requests, keep existing sort behavior
      let valA = '';
      let valB = '';

      switch (field) {
        case 'deadline': {
          valA = a.element?.dataset?.deadline || '';
          valB = b.element?.dataset?.deadline || '';
          // Put items without deadline at the end (within the non-bottom group)
          if (!valA && valB) return isAsc ? 1 : -1;
          if (valA && !valB) return isAsc ? -1 : 1;
          if (!valA && !valB) return 0;
          break;
        }
        case 'date':
        default:
          valA = a.date || '';
          valB = b.date || '';
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });
  }

  function getFilterValues() {
    return {
      requestId: requestIdFilter?.value?.toLowerCase().trim() || '',
      status: statusFilterContainer?.__instance?.getSelectedValues() || ['all'],
      assignedUnit: assignedUnitFilterContainer?.__instance?.getSelectedValues() || ['all'],
      student: studentFilter?.value?.toLowerCase().trim() || '',
      studentOrg: studentOrgFilterContainer?.__instance?.getSelectedValues() || ['all'],
      officeDept: officeDeptFilterContainer?.__instance?.getSelectedValues() || ['all'],
      dateFrom: dateFromFilter?.value || '',
      dateTo: dateToFilter?.value || ''
    };
  }

  function testFilters(request, filters) {
    // Request ID filter
    if (filters.requestId && !request.requestId?.includes(filters.requestId)) {
      return false;
    }

    // Status filter (case-insensitive comparison)
    if (filters.status.length > 0 && !filters.status.includes('all')) {
      const statusMatch = filters.status.some(s => s.toLowerCase() === request.status?.toLowerCase());
      if (!statusMatch) return false;
    }

    // Assigned Unit filter (case-insensitive comparison)
    if (filters.assignedUnit.length > 0 && !filters.assignedUnit.includes('all')) {
      const unitMatch = filters.assignedUnit.some(u => request.units?.toLowerCase().includes(u.toLowerCase()));
      if (!unitMatch) return false;
    }

    // Student filter
    if (filters.student && !request.student?.includes(filters.student)) {
      return false;
    }

    // Organization filters (OR logic, case-insensitive)
    const hasStudentOrgFilter = filters.studentOrg.length > 0 && !filters.studentOrg.includes('all');
    const hasOfficeDeptFilter = filters.officeDept.length > 0 && !filters.officeDept.includes('all');

    if (hasStudentOrgFilter || hasOfficeDeptFilter) {
      let matches = false;

      if (hasStudentOrgFilter && filters.studentOrg.some(org => request.organization?.toLowerCase().includes(org.toLowerCase()))) {
        matches = true;
      }

      if (hasOfficeDeptFilter && filters.officeDept.some(dept => request.organization?.toLowerCase().includes(dept.toLowerCase()))) {
        matches = true;
      }

      if (!matches) return false;
    }

    // Date range filter
    if (filters.dateFrom && request.date && request.date < filters.dateFrom) return false;
    if (filters.dateTo && request.date && request.date > filters.dateTo) return false;

    return true;
  }

  function clearAllFilters() {
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

    statusFilterContainer?.__instance?.reset();
    assignedUnitFilterContainer?.__instance?.reset();
    studentOrgFilterContainer?.__instance?.reset();
    officeDeptFilterContainer?.__instance?.reset();

    // Reset pagination and apply filters
    currentPage = 1;
    applyFilters();
  }

  function updateResultsCount(count) {
    if (resultsCount) {
      const total = allRequestsData.length;
      resultsCount.textContent = count === total ? `Showing all ${total} requests` : `Showing ${count} of ${total} requests`;
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Initial sort and display with pagination
  applyFilters();
}

// Modal system
function initializeModalHandlers() {
  const closeBtn = document.getElementById("closeDetailsModal");
  if (closeBtn) {
    closeBtn.onclick = () => closeModal();
  }

  window.onclick = function(event) {
    if (event.target === detailModal) closeModal();
    if (event.target === updateConfirmationModal) {
      updateConfirmationModal.classList.remove('show');
      updateConfirmationModal.style.display = 'none';
    }
    if (event.target === cancelConfirmationModal) {
      cancelConfirmationModal.classList.remove('show');
      cancelConfirmationModal.style.display = 'none';
    }
  };
}

function initializeRichModalHandlers() {
  console.log('🟢 initializeRichModalHandlers called');
  const updateBtn = document.getElementById('adminUpdateBtn');
  const cancelBtn = document.getElementById('adminCancelBtn');
  console.log('🟢 updateBtn:', !!updateBtn, 'cancelBtn:', !!cancelBtn);

  if (updateBtn) {
    updateBtn.onclick = showUpdateConfirmation;
    console.log('🟢 updateBtn.onclick set');
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      resetFormToOriginalValues();
    };
    console.log('🟢 cancelBtn.onclick set');
  }

  // Confirmation modal handlers
  const confirmBtn = document.getElementById('confirmUpdateBtn');
  const cancelConfirmBtn = document.getElementById('confirmCancelBtn');

  if (confirmBtn) {
    confirmBtn.onclick = performUpdate;
  }

  if (cancelConfirmBtn) {
    cancelConfirmBtn.onclick = () => {
      if (updateConfirmationModal) {
        updateConfirmationModal.classList.remove('show');
        updateConfirmationModal.style.display = 'none';
      }
    };
  }

  // Cancel confirmation modal handlers
  const confirmCancelChangesBtn = document.getElementById('confirmCancelChangesBtn');
  const cancelCancelBtn = document.getElementById('cancelCancelBtn');

  if (confirmCancelChangesBtn) {
    confirmCancelChangesBtn.onclick = () => {
      resetFormToOriginalValues();
      const cancelModal = document.getElementById('cancelConfirmationModal');
      if (cancelModal) {
        cancelModal.classList.remove('show');
        cancelModal.style.display = 'none';
      }
      if (updateConfirmationModal) {
        updateConfirmationModal.classList.remove('show');
        updateConfirmationModal.style.display = 'none';
      }
    };
  }

  if (cancelCancelBtn) {
    cancelCancelBtn.onclick = () => {
      const cancelModal = document.getElementById('cancelConfirmationModal');
      if (cancelModal) {
        cancelModal.classList.remove('show');
        cancelModal.style.display = 'none';
      }
    };
  }
}

// Conversation functionality
function initializeConversationModal() {
  const chatBtn = document.getElementById('openChatFromModal');
  const conversationModal = document.getElementById('teamConversationModal');
  const closeBtn = document.getElementById('closeTeamConversationModal');
  const sendBtn = document.getElementById('sendTeamMessageBtn');
  const input = document.getElementById('teamMessageInput');

  if (chatBtn) {
    chatBtn.onclick = () => {
      console.log('[AllRequestsAdmin] Chat button clicked, currentRequestId:', currentRequestId);
      if (currentRequestId) {
        window.openTeamConversationModal(currentRequestId);
      } else {
        console.error('[AllRequestsAdmin] No currentRequestId set!');
      }
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      if (conversationModal) conversationModal.style.display = 'none';
    };
  }

  if (sendBtn) {
    // send button listener is attached later in the file to avoid duplicate handlers
  }

  // message input key handling is attached later to avoid duplicate handlers

  if (conversationModal) {
    conversationModal.onclick = (e) => {
      if (e.target === conversationModal) {
        conversationModal.style.display = 'none';
      }
    };
  }
}

// Core modal functions
function closeModal() {
  detailModal.style.display = 'none';
}

function openModal(rowData) {
  currentRequestId = rowData.id;
  currentRequestType = rowData.type;

  populateModalData(rowData);

  const modalBody = detailModal.querySelector('.admin-modal-body');
  if (modalBody) {
    modalBody.scrollTop = 0;
  }

  detailModal.style.display = 'flex';

  // Initialize modal handlers after modal is displayed
  initializeRichModalHandlers();
}

function populateModalData(rowData) {
  // Update modal header based on request type
  const modalTitle = document.getElementById('modalTitle');
  const modalTypeBadge = document.getElementById('modalTypeBadge');
  const modalHeader = document.querySelector('#detailsModal .modal-header');
  
  if (rowData.type === 'Service Request') {
    if (modalTitle) modalTitle.textContent = 'Service Request Details';
    if (modalTypeBadge) modalTypeBadge.textContent = 'SERVICE';
    if (modalHeader) {
      modalHeader.classList.remove('approval-header-color');
      modalHeader.classList.add('service-header-color');
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'Approval Request Details';
    if (modalTypeBadge) modalTypeBadge.textContent = 'APPROVAL';
    if (modalHeader) {
      modalHeader.classList.remove('service-header-color');
      modalHeader.classList.add('approval-header-color');
    }
  }
  
  // Basic info population
  setDetailText('detailTitle', rowData.title);
  setDetailText('detailStudent', rowData.student);
  // Toggle admin-created label
  const detailAdminLabel = document.getElementById('detailAdminLabel');
  if (detailAdminLabel) {
    detailAdminLabel.style.display = rowData.adminCreated === 'true' ? 'inline' : 'none';
  }
  setDetailText('detailType', rowData.type);
  setDetailText('detailSpecificRequest', rowData.specifictype);
  setDetailText('detailOrganization', rowData.organization);
  setDetailText('detailDatetime', rowData.datetime);
  setElementHTML('detailDescription', rowData.description || 'No description provided');

  // Handle deadline visibility based on whether a deadline exists
  const deadlineElements = ['deadlineInfo', 'adminDeadlineField'];
  const hasDeadline = rowData.formattedDeadline && rowData.formattedDeadline !== 'N/A';
  deadlineElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = hasDeadline ? 'block' : 'none';
    }
  });

  setDetailText('detailDeadlineInfo', rowData.formattedDeadline);

  populateAdminForm(rowData);
  // Clear file-preview (legacy); links shown in detailsLinksSection below
  const filePreviewEl = document.getElementById('file-preview');
  if (filePreviewEl) filePreviewEl.innerHTML = '';
  
  // Populate links section
  const linksSection = document.getElementById('detailsLinksSection');
  const linksContainer = document.getElementById('detailLinks');
  if (linksSection && linksContainer) {
    const links = (rowData.links && rowData.links.trim()) ? rowData.links.split(',').map(l => l.trim()).filter(Boolean) : [];
    if (links.length > 0) {
      linksSection.style.display = 'block';
      linksContainer.innerHTML = links.map(link => `
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

  // Load revision history based on request type
  if (currentRequestType === 'Service Request') {
    loadServiceRevisionHistory(currentRequestId);
  } else {
    loadRevisionHistory(currentRequestId);
  }
  
  // Setup chat button click handler
  const chatButton = document.getElementById('openChatFromModal');
  if (chatButton) {
    chatButton.onclick = function() {
      window.openConversation(currentRequestId);
    };
  }
}

function setDetailText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || 'N/A';
}

function setElementHTML(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value || 'N/A';
}

// Admin form population
function populateAdminForm(rowData) {
  originalValues = {
    status: rowData.status,
    units: rowData.units,
    deadline: rowData.formattedDeadline,
    deadlineDisplay: rowData.formattedDeadline
  };

  // Status dropdown
  const statusSelect = document.getElementById('adminStatusSelect');
  if (statusSelect) {
    statusSelect.value = rowData.status;
    const currentStatusValue = document.getElementById('currentStatusValue');
    if (currentStatusValue) {
      currentStatusValue.textContent = rowData.status;
    }
  }

  // Units dropdown - set value from current request data (dropdown options are pre-populated from database)
  const unitsSelect = document.getElementById('adminUnitsSelect');
  if (unitsSelect) {
    const currentUnitsValue = rowData.units === 'Not yet assigned' ? '' : rowData.units;
    unitsSelect.value = currentUnitsValue;
    const currentUnitsValueEl = document.getElementById('currentUnitsValue');
    if (currentUnitsValueEl) {
      currentUnitsValueEl.textContent = rowData.units;
    }
  }

  // Deadline (if available)
  const deadlineInput = document.getElementById('adminDeadlineInput');
  if (deadlineInput && rowData.formattedDeadline && rowData.formattedDeadline !== 'N/A') {
    try {
      deadlineInput.value = formatDateForInput(rowData.formattedDeadline);
      originalValues.deadline = deadlineInput.value;
    } catch (e) {
      console.error('Error setting deadline:', e);
    }
  }

  const currentDeadlineValueEl = document.getElementById('currentDeadlineValue');
  if (currentDeadlineValueEl) {
    currentDeadlineValueEl.textContent =
      rowData.formattedDeadlineDisplay || rowData.formattedDeadline || 'N/A';
  }
}

function getStatusOptions(type) {
  const baseStatuses = ['Approved', 'Rejected', 'Archived'];

  if (type === 'Request Approval') {
    return ['Pending', 'Queued', 'In Progress', 'For Checking', 'For Revision', ...baseStatuses];
  } else {
    return ['Pending', 'Queued', 'In Progress', 'For Checking', 'For Revision', 'Completed', ...baseStatuses];
  }
}

function populateUnitsDropdown(rowData) {
  const unitNames = [
    'Social Media Unit', 'Graphics Unit', 'Multimedia Unit', 'Public Relations Unit'
  ];

  const specificRecommendations = {
    'Creation of New Graphics/Pubmat': ['Graphics Unit'],
    'Creation of New Logo/Branding Element': ['Graphics Unit'],
    'Event Photo & Video Coverage': ['Multimedia Unit'],
    'Photo/Video Editing Service': ['Multimedia Unit'],
    'Magazine Content Creation': ['Public Relations Unit'],
    'Social Media Content Sharing/Posting': ['Social Media Unit'],
    'Draft Official Letter/Advisory': ['Public Relations Unit'],
    'Publication Material/Pubmat Design Vetting': ['Graphics Unit'],
    'Publication Wording/Content Check': ['Public Relations Unit', 'Social Media Unit'],
    'Logo/Merchandise Design Vetting': ['Graphics Unit']
  };

  const recommendations = specificRecommendations[rowData.specifictype || rowData.specificRequestType] || [];
  const unitsSelect = document.getElementById('adminUnitsSelect');
  const currentUnitsValue = rowData.units === 'Not yet assigned' ? '' : rowData.units;

  // Create current unit option at the top
  let currentUnitOption = '';
  if (currentUnitsValue) {
    currentUnitOption = `<option value="${currentUnitsValue}" selected>${currentUnitsValue}</option>`;
  }

  // Create recommended units optgroup (excluding current unit if it's recommended)
  const recommendedUnitsHTML = recommendations.length > 0 ?
    `<optgroup label="Recommended Units">${recommendations.filter(unit => unit !== currentUnitsValue).map(unit =>
      `<option value="${unit}" class="recommended-unit">★ ${unit}</option>`
    ).join('')}</optgroup>` :
    `<optgroup label="Recommended Units"><option value="" disabled>No recommendations available</option></optgroup>`;

  // Create other units optgroup (units not in recommendations and not current)
  const otherUnits = unitNames.filter(unit => !recommendations.includes(unit) && unit !== currentUnitsValue);
  const otherUnitsHTML = otherUnits.length > 0 ?
    `<optgroup label="Other Units">${otherUnits.map(unit =>
      `<option value="${unit}">${unit}</option>`
    ).join('')}</optgroup>` : '';

  unitsSelect.innerHTML = `
    <option value="" ${currentUnitsValue === '' ? 'selected' : ''}>Not yet assigned</option>
    ${currentUnitOption}
    ${recommendedUnitsHTML}
    ${otherUnitsHTML}
  `;

  // Also set the value programmatically as backup
  unitsSelect.value = currentUnitsValue;
}

function formatDateForInput(dateStr) {
  if (!dateStr || dateStr === 'N/A') return '';

  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    return `20${parts[2].length === 2 ? parts[2] : parts[2].slice(-2)}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00`;
  }
  return '';
}

// populateFilePreview removed — file uploads deprecated; links shown via detailsLinksSection

function generateFileItemHTML(file, ext, isImage) {
  const fileUrl = `/uploads/${file}`;
  const canView = isImage;

  return `
    <div class="file-header-enhanced">
      <div style="color: var(--primary-green);">${getFileIcon(ext)}</div>
      <div class="file-info-enhanced">
        <div class="file-name-enhanced" title="${file}">${file}</div>
        <div class="file-type-enhanced">${ext.toUpperCase()} File</div>
      </div>
    </div>
    <div class="file-preview-container">${getPreviewContent(file, ext, isImage)}</div>
    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: center; align-items: stretch; width: 100%;">
      <a href="${fileUrl}" target="_blank" download="${file}" class="download-btn-enhanced">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Download
      </a>
      ${canView ? `<button onclick="openImagePreview('${fileUrl}', '${file}')" class="download-btn-enhanced" style="background: #3b82f6;">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="9" ry="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        View
      </button>` : ''}
    </div>
  `;
}

function getFileIcon(ext) {
  const iconMap = {
    image: `<svg width="20" height="20" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8" cy="8" r="2"/>
      <path d="M21 21l-6-6a2 2 0 0 0-2.83 0L3 21"/>
    </svg>`,
    pdf: `<svg width="20" height="20" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M8 6h8M8 10h8M8 14h4"/>
    </svg>`,
    doc: `<svg width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <text x="8" y="16" font-size="6" fill="#2563eb" font-family="Arial" font-weight="bold">W</text>
    </svg>`,
    spreadsheet: `<svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <rect x="7" y="10" width="2" height="7"/>
      <rect x="11" y="7" width="2" height="10"/>
      <rect x="15" y="13" width="2" height="4"/>
    </svg>`,
    default: `<svg width="20" height="20" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <polyline points="14,6 8,6 8,16 16,16"></polyline>
    </svg>`
  };

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return iconMap.image;
  if (ext === 'pdf') return iconMap.pdf;
  if (['doc', 'docx'].includes(ext)) return iconMap.doc;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return iconMap.spreadsheet;
  return iconMap.default;
}

function getPreviewContent(file, ext, isImage) {
  const fileUrl = `/uploads/${file}`;

  if (isImage) {
    return `
      <img src="${fileUrl}" alt="Preview of ${file}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px; cursor: pointer;" onclick="openImagePreview('${fileUrl}', '${file}')" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
  }

  const iconContent = {
    pdf: `
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
    `,
    doc: `
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
    `,
    spreadsheet: `
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
    `,
    default: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; height: 200px;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${getFileIcon(ext)}</div>
        <p><strong>Document File</strong></p>
        <small>Click download to view</small>
      </div>
    `
  };

  return iconContent[ext] || iconContent.default;
}

// Global image preview function
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
  container.style.cssText = `max-width: 90vw; max-height: 90vh; position: relative;`;

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = fileName;
  img.style.cssText = `max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;`;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: -40px;
    right: 0;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    color: #000;
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

  function closeModal() {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    }
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.body.style.overflow = 'hidden';
};

// Update table row data
function updateTableRowData(requestId, updatedData) {
  const row = document.querySelector(`[data-id="${requestId}"]`);
  if (!row) return;

  if (updatedData.status) {
    row.dataset.status = updatedData.status;
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = `status-badge ${updatedData.status.toLowerCase().replace(/ /g, '-')}`;
      statusBadge.textContent = updatedData.status;
    }
  }

  if (updatedData.units !== undefined) {
    row.dataset.units = updatedData.units;
    const cells = row.querySelectorAll('td');
    if (cells[6]) cells[6].textContent = updatedData.units;
  }

  if (updatedData.formattedDeadline) {
    row.dataset.formattedDeadline = updatedData.formattedDeadline;
  }
}

// Initialize row click handlers
function initializeRowClickHandlers() {
  console.log('🖱️ Initializing row click handlers...');

  const rows = document.querySelectorAll('.request-row');
  console.log(`Found ${rows.length} request rows`);
  rows.forEach((row, index) => {
    row.addEventListener('click', () => {
      console.log(`Row ${index} clicked, opening modal for request:`, row.dataset.requestId);
      openModalFromRow(row);
    });
    row.style.cursor = 'pointer';
  });

  console.log(`✅ Added click handlers to ${rows.length} request rows`);
}

// Dropdown toggle function
window.toggleDropdown = function() {
  const menu = document.getElementById("dropdownMenu");
  if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
};

// Initialize dropdown functionality
document.addEventListener("click", function(event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (toggle && menu && !toggle.contains(event.target)) {
    menu.style.display = "none";
  }
});

// Show notification function - displays styled modal notifications
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
    z-index: 1005000 !important;
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
    position: relative;
    z-index: 1005001 !important;
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
  
  function closeNotificationModal() {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    modal.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      document.body.style.overflow = '';
    }, 300);
  }
  
  okBtn.addEventListener('click', closeNotificationModal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeNotificationModal();
    }
  });
  
  // Auto close after 5 seconds for success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(closeNotificationModal, 5000);
  }
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// Missing modal handlers - these need to be implemented based on the EJS template
function showUpdateConfirmation() {
  // Get current form values
  const statusSelect = document.getElementById('adminStatusSelect');
  const unitsSelect = document.getElementById('adminUnitsSelect');
  const deadlineInput = document.getElementById('adminDeadlineInput');

  const currentStatus = statusSelect ? statusSelect.value : '';
  const currentUnits = unitsSelect ? unitsSelect.value : '';
  const currentDeadline = deadlineInput ? deadlineInput.value : '';

  // Intercept Archived status
  if (currentStatus === 'Archived' && originalValues.status !== 'Archived') {
    if (typeof window.openDeleteConfirm === 'function') {
      window.openDeleteConfirm({
        requestId: currentRequestId,
        requestType: currentRequestType
      });
      return;
    }
  }

  // Compare with original values
  const changes = [];

  if (currentStatus !== originalValues.status) {
    changes.push({
      label: 'Status',
      old: originalValues.status,
      new: currentStatus
    });
  }

  if (currentUnits !== originalValues.units && currentUnits !== (originalValues.units === 'Not yet assigned' ? '' : originalValues.units)) {
    changes.push({
      label: 'Assigned Unit',
      old: originalValues.units,
      new: currentUnits === '' ? 'Not yet assigned' : currentUnits
    });
  }

  if (currentDeadline !== originalValues.deadline) {
    changes.push({
      label: 'Deadline',
      old: originalValues.deadlineDisplay,
      new: currentDeadline ? new Date(currentDeadline).toLocaleDateString() : 'N/A'
    });
  }

  if (changes.length > 0) {
    // Show confirmation modal with changes
    const changesContainer = document.getElementById('changesContainer');
    if (changesContainer) {
      changesContainer.innerHTML = changes.map(change =>
        `<div class="change-item">
          <span class="change-label">${change.label}:</span>
          <span class="change-values">
            <span class="old-value">${change.old || 'N/A'}</span> →
            <span class="new-value">${change.new || 'N/A'}</span>
          </span>
        </div>`
      ).join('');
    }

    if (updateConfirmationModal) {
      updateConfirmationModal.classList.add('show');
      updateConfirmationModal.style.display = 'flex';
    }
  } else {
    console.log('No changes detected');
    showNotification('No changes detected', 'info');
  }
}

function showCancelConfirmation() {
  console.log('🔴 showCancelConfirmation called');
  const modal = document.getElementById('cancelConfirmationModal');
  console.log('🔴 cancelConfirmationModal element:', modal);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    console.log('🔴 Modal should now be visible');
  } else {
    console.error('🔴 cancelConfirmationModal not found in DOM!');
  }
}

function resetFormToOriginalValues() {
  const statusSelect = document.getElementById('adminStatusSelect');
  if (statusSelect) {
    statusSelect.value = originalValues.status || '';
    const currentStatusValue = document.getElementById('currentStatusValue');
    if (currentStatusValue) currentStatusValue.textContent = originalValues.status || '';
  }

  const unitsSelect = document.getElementById('adminUnitsSelect');
  if (unitsSelect) {
    unitsSelect.value = originalValues.units === 'Not yet assigned' ? '' : (originalValues.units || '');
    const currentUnitsValue = document.getElementById('currentUnitsValue');
    if (currentUnitsValue) currentUnitsValue.textContent = originalValues.units || 'Not yet assigned';
  }

  const deadlineInput = document.getElementById('adminDeadlineInput');
  if (deadlineInput && originalValues.deadline) {
    deadlineInput.value = originalValues.deadline;
  }
  
  showNotification('Changes cancelled - form reset to original values', 'info');
}

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
    requestType: currentRequestType
  };

  // Only include deadline if it was actually changed from the original value
  const currentDeadline = deadlineInput?.value || null;
  if (currentDeadline && currentDeadline !== originalValues.deadline) {
    updateData.deadline = currentDeadline;
  }

  console.log('Update data:', updateData);

  try {
    const response = await fetch('/admin/all-requests/update-status', {
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
      const updatedDisplayUnits = result.updatedRequest.assignedUnits || 'Not yet assigned';
      const formattedDeadline = result.updatedRequest.deadline ?
        new Date(result.updatedRequest.deadline).toLocaleDateString() : 'N/A';

      updateTableRowData(currentRequestId, {
        status: result.updatedRequest.status,
        units: updatedDisplayUnits,
        formattedDeadline: formattedDeadline
      });

      // Close modals
      if (updateConfirmationModal) {
        updateConfirmationModal.classList.remove('show');
        updateConfirmationModal.style.display = 'none';
      }
      if (detailModal) {
        detailModal.style.display = 'none';
      }

      console.log('Update completed successfully');

      // Show success notification modal
      showNotification('Request updated successfully!', 'success');

      // Refresh the page shortly after to ensure server-side changes
      // (deliverables, revision history, etc.) are reflected in the UI.
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (e) {
          console.error('Auto-reload failed:', e);
        }
      }, 1400);

    } else {
      console.error('Update failed:', result.message);
      showNotification('Failed to update request: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error performing update:', error);
    showNotification('Error updating request: ' + error.message, 'error');

    // Revert modals on error
    if (updateConfirmationModal) {
      updateConfirmationModal.classList.remove('show');
      updateConfirmationModal.style.display = 'none';
    }
  }
}

function openConversation(requestId) {
  console.log('Opening conversation for request:', requestId);

  const conversationModal = document.getElementById('conversationModal');
  const messagesContainer = document.getElementById('messagesContainer');

  if (conversationModal && messagesContainer) {
    // TODO: Load conversation history for the request
    messagesContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #6b7280;">
        Conversation functionality not fully implemented yet.<br>
        This would show messages between admin and student.
      </div>
    `;

    conversationModal.style.display = 'flex';
  }
}

function sendMessage() {
  console.log('Sending message...');

  const input = document.getElementById('messageInput');
  const messagesContainer = document.getElementById('messagesContainer');

  if (input && messagesContainer && input.value.trim()) {
    const message = input.value.trim();

    // TODO: Implement actual message sending via AJAX
    console.log('Message to send:', message);

    // Add message to UI (placeholder)
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message admin-message';
    messageDiv.innerHTML = `
      <div class="message-content admin-message">
        <div class="message-header">
          <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-text">${message}</div>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';
  }
}

// Additional file upload toggle functionality
function initializeAdditionalFileToggle() {
  // Handle checkbox-based toggle (check for both possible IDs)
  const toggleCheckbox = document.getElementById('allowAdditionalFileUpload') || 
                        document.getElementById('toggleAdditionalFileUploadBtn');
  if (toggleCheckbox && toggleCheckbox.type === 'checkbox') {
    // Remove any existing listeners first to prevent duplicates
    toggleCheckbox.removeEventListener('change', handleAdditionalFileToggle);
    // Add the new listener
    toggleCheckbox.addEventListener('change', async () => {
      await handleAdditionalFileToggle();
    });
  }
}

async function toggleAdditionalFileUpload() {
  if (!currentRequestId || !currentRequestType) {
    alert('No request selected');
    return;
  }

  const toggleButton = document.getElementById('toggleAdditionalFileUploadBtn');
  if (toggleButton) {
    toggleButton.disabled = true;
    toggleButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" fill="currentColor"/>
      </svg>
      Processing...
    `;
  }

  try {
    const response = await fetch('/admin/toggle-additional-file-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        requestId: currentRequestId,
        requestType: currentRequestType
      })
    });

    const result = await response.json();

    if (result.success) {
      // Close modal to reflect changes
      if (detailModal) {
        detailModal.style.display = 'none';
      }

      alert('✅ Additional file upload permission granted successfully!\n\nUsers can now upload additional files for revision.');

      // The toggle section will be hidden when modal reopens since files exist
    } else {
      alert('❌ Failed to grant additional file upload permission: ' + result.message);
    }
  } catch (error) {
    console.error('Error toggling additional file upload:', error);
    alert('❌ Error granting additional file upload permission: ' + error.message);
  } finally {
    // Reset button state
    if (toggleButton) {
      toggleButton.disabled = false;
      toggleButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem;">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Allow additional file upload
      `;
    }
  }
}

// Handle checkbox-based additional file toggle
async function handleAdditionalFileToggle() {
  if (!currentRequestId || !currentRequestType) {
    alert('No request selected');
    return;
  }

  // Check for both possible checkbox IDs
  const checkbox = document.getElementById('allowAdditionalFileUpload') || 
                  document.getElementById('toggleAdditionalFileUploadBtn');
  if (!checkbox) return;

  try {
    const response = await fetch('/admin/toggle-additional-file-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'same-origin',
      body: new URLSearchParams({
        requestId: currentRequestId,
        requestType: currentRequestType,
        allowAdditionalFileUpload: checkbox.checked.toString()
      })
    });

    const result = await response.json();

    if (result.success) {
      // Update the data attribute in the current row based on actual checkbox state
      // Use the full ID (data-id) instead of the short request ID (data-request-id)
      const currentRow = document.querySelector(`tr[data-id="${currentRequestId}"]`);
      if (currentRow) {
        currentRow.setAttribute('data-allow-additional-upload', checkbox.checked.toString());
        console.log('🔄 Updated HTML attribute to:', checkbox.checked.toString());
      }

      alert('Additional file upload permission updated successfully!');
    } else {
      // Revert checkbox state on failure
      checkbox.checked = !checkbox.checked;
      alert('Failed to update additional file upload permission: ' + result.message);
    }
  } catch (error) {
    console.error('Error toggling additional file upload:', error);
    // Revert checkbox state on error
    checkbox.checked = !checkbox.checked;
    alert('Error updating additional file upload permission: ' + error.message);
  }
}

// Global function to open request modal by ID (for notification clicks)
window.openRequestModal = function(requestId, requestType) {
  console.log('Opening admin request modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // Trigger the existing modal opening
    openModalFromRow(targetRow);
  } else {
    console.warn('Request not found on current admin page:', requestId);
    // If not found, try to reload the page and search
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Global function to open conversation modal by ID (for message notifications)
window.openConversationModal = function(requestId, requestType) {
  console.log('Opening admin conversation modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // First open the details modal
    openModalFromRow(targetRow);
    
    // Then trigger the conversation modal after a short delay
    setTimeout(() => {
      const chatButton = document.getElementById('openChatFromModal');
      if (chatButton) {
        console.log('Found chat button, clicking it');
        chatButton.click();
      } else {
        console.warn('Chat button #openChatFromModal not found in modal');
      }
    }, 300);
  } else {
    console.warn('Request not found for conversation:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

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

console.log('✅ AllRequestsAdmin script loaded and initialized successfully');

// ==========================================
// CONVERSATION MODAL FUNCTIONALITY
// ==========================================






function applyChatFormat(format) {
  const input = document.getElementById('teamMessageInput');
  if (!input) return;

  // Detect contenteditable by tagName or attribute (more robust than isContentEditable)
  const isContentEditableDiv = input.tagName === 'DIV' || input.getAttribute('contenteditable') !== null;

  // If contenteditable, use execCommand for WYSIWYG
  if (isContentEditableDiv) {
    input.focus();
    const selection = window.getSelection();
    if (!selection) return;

    let selectionInside = false;
    if (selection.rangeCount > 0) {
      for (let i = 0; i < selection.rangeCount; i++) {
        const node = selection.getRangeAt(i).commonAncestorContainer;
        if (input.contains(node)) { selectionInside = true; break; }
      }
    }

    if (!selectionInside) {
      const range = document.createRange();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    switch (format) {
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
        formattedText = `<u>${selectedText}</u>`;
        newCursorPos = start + formattedText.length;
        break;
    }

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    return;
  }
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

// Close team conversation modal
window.closeTeamConversationModal = function() {
    const modal = document.getElementById('teamConversationModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// ==========================================
// CONVERSATION LOADING AND SENDING
// ==========================================
let currentConversationRequestId = null;

window.openTeamConversationModal = function(requestId) {
    console.log('[AllRequestsAdmin] openTeamConversationModal called with requestId:', requestId);
    currentConversationRequestId = requestId;
    console.log('[AllRequestsAdmin] Set currentConversationRequestId to:', currentConversationRequestId);
    const modal = document.getElementById('teamConversationModal');
    console.log('[AllRequestsAdmin] Modal element found:', !!modal);
    if (modal && requestId) {
        loadTeamConversation(requestId);
        modal.style.display = 'flex';
        console.log('[AllRequestsAdmin] Modal opened successfully');
    } else {
        console.error('[AllRequestsAdmin] Cannot open modal - modal:', !!modal, 'requestId:', requestId);
    }
};

function loadTeamConversation(requestId) {
    console.log('[AllRequestsAdmin] ========== LOADING CONVERSATION ==========');
    console.log('[AllRequestsAdmin] Request ID:', requestId);
    const container = document.getElementById('teamMessagesContainer');
    if (!container) {
        console.error('[AllRequestsAdmin] Container not found!');
        return;
    }

    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #64748b;">
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">💬</div>
                <p>Loading conversation...</p>
            </div>
        </div>
    `;

    fetch(`/api/conversation/${requestId}`)
        .then(response => {
            console.log('[AllRequestsAdmin] Conversation fetch status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('[AllRequestsAdmin] Server error response:', text);
                    let errorMsg = 'Failed to load conversation';
                    if (response.status === 401) errorMsg = 'Session expired. Please log in again.';
                    else if (response.status === 403) errorMsg = 'Access denied.';
                    throw new Error(errorMsg);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('[AllRequestsAdmin] Conversation data received:', data);
            console.log('[AllRequestsAdmin] Raw data structure:', JSON.stringify(Object.keys(data)));
            
            // Extract messages from response - check both data.conversation and data.messages
            const messages = data.conversation || data.messages || [];
            console.log('[AllRequestsAdmin] Extracted messages array:', messages);
            console.log('[AllRequestsAdmin] Displaying', messages.length, 'messages');
            
            if (messages && messages.length > 0) {
                container.innerHTML = '';
                messages.forEach(msg => {
                    const messageDiv = createMessageElement(msg);
                    container.appendChild(messageDiv);
                });
                container.scrollTop = container.scrollHeight;
                
                // Mark messages as read
                console.log('[AllRequestsAdmin] Marking messages as read');
                fetch(`/api/conversation/${requestId}/mark-read`, { method: 'POST' })
                    .then(() => console.log('[AllRequestsAdmin] Messages marked as read'))
                    .catch(err => console.error('[AllRequestsAdmin] Error marking as read:', err));
            } else {
                console.log('[AllRequestsAdmin] No messages found, showing empty state');
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
            console.error('[AllRequestsAdmin] Error loading conversation:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin: 0 auto 1rem;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <p>Failed to load conversation</p>
                    <small>${error.message}</small>
                </div>
            `;
        });
}

function createMessageElement(msg) {
    const div = document.createElement('div');
    
    // Determine if this is the current user's message
    const isOwnMessage = window.currentUserRole && msg.senderRole === window.currentUserRole;
    
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
        console.log('[AllRequests] Message has attachments:', msg.attachments.length);
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
                        <div class="message-attachment-name">${escapeHtml(file.originalname || file.filename)}</div>
                        <div class="message-attachment-size">${ext.toUpperCase()}</div>
                    </div>
                    <div class="message-attachment-actions">
                        ${isImage ? `
                            <button class="attachment-action-btn" onclick="viewImage('/uploads/${file.filename}', '${escapeHtml(file.originalname || file.filename)}')" title="View Image">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        ` : ''}
                        ${isPdf ? `
                            <button class="attachment-action-btn pdf-view" onclick="viewPdf('/uploads/${file.filename}', '${escapeHtml(file.originalname || file.filename)}')" title="View PDF">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        ` : ''}
                        <a href="/uploads/${file.filename}" download="${escapeHtml(file.originalname || file.filename)}" class="attachment-action-btn" title="Download">
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
                        <span>Read by ${escapeHtml(reader.userName)} at ${readTime}</span>
                    </div>
                `;
            }).join('');
            readReceiptsHTML = `<div class="read-receipts" style="margin-top: 0.5rem; font-size: 0.7rem; color: #6b7280;">${readByList}</div>`;
        }
    }
    
    div.innerHTML = `
        <div class="unit-message-bubble ${roleClass}">
            <div class="message-header">
                <strong>${escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${displayFormattedText(msg.content || '')}</div>
            ${attachmentsHTML}
            ${readReceiptsHTML}
        </div>
    `;
    
    return div;
}

// Helper function to display formatted text (supports HTML from Quill and markdown-style formatting)
function displayFormattedText(text) {
    if (!text) return '';
    
    let formatted = text;
    const hasHtml = /<\/?(p|div|strong|b|em|i|u|a|br|span)[\s>]/i.test(text);
    
    if (!hasHtml) {
        formatted = escapeHtml(text);
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

function formatText(text) {
    return displayFormattedText(text);
}

// ==========================================
// APPROVAL REQUEST REVISION HISTORY FUNCTIONS (Admin View)
// ==========================================

function resetModalLayout() {
    const modalContent = document.querySelector('#detailsModal .modal-content');
    const modalBody = document.querySelector('#detailsModal .admin-modal-body');
    const rightColumn = document.querySelector('#detailsModal .admin-right-column');
    
    if (modalContent && modalBody) {
        modalContent.style.maxWidth = '900px';
        modalBody.classList.remove('has-revisions');
    }
    if (rightColumn) rightColumn.style.display = 'none';
}

// Send team message
window.sendTeamMessage = function() {
    console.log('[AllRequestsAdmin] Send team message triggered');
    
    // Check if conversation modal is open
    const modal = document.getElementById('teamConversationModal');
    if (!modal || modal.style.display !== 'flex') {
        console.warn('[AllRequestsAdmin] Conversation modal is not open, ignoring send');
        return;
    }
    
    const input = document.getElementById('teamMessageInput');
    
    // Use currentConversationRequestId OR window.currentConversationId (from inline script)
    const requestId = currentConversationRequestId || window.currentConversationId;
    
    if (!input || !requestId) {
        console.error('[AllRequestsAdmin] Missing input or request ID:', {
            input: !!input,
            currentConversationRequestId,
            'window.currentConversationId': window.currentConversationId,
            modalDisplay: modal?.style.display
        });
        alert('Cannot send message. Please open a conversation first.');
        return;
    }
    
    // Sync the variables
    currentConversationRequestId = requestId;

    // Support both contenteditable (WYSIWYG) and legacy textarea inputs
    let content = '';
    const isContentEditableDiv = input.tagName === 'DIV' || input.getAttribute('contenteditable') !== null;
    if (isContentEditableDiv) {
      // Use innerHTML so formatting (bold/italic/underline) is preserved as HTML
      content = input.innerHTML.trim();
    } else {
      content = (input.value || '').trim();
    }
    console.log('[AllRequestsAdmin] Message content:', content || '(empty)');
    if (!content) {
        console.warn('[AllRequestsAdmin] No content');
        alert('Please enter a message');
        return;
    }

    console.log('[AllRequestsAdmin] Sending to:', `/api/conversation/${requestId}/message`);
    fetch(`/api/conversation/${requestId}/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
    })
    .then(response => {
        console.log('[AllRequestsAdmin] Response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('[AllRequestsAdmin] Server error:', text);
                let errorMsg = 'Failed to send message';
                if (response.status === 401) errorMsg = 'Session expired. Please log in again.';
                else if (response.status === 403) errorMsg = 'Access denied.';
                throw new Error(errorMsg);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('[AllRequestsAdmin] Response data:', data);
        if (data.success) {
        console.log('[AllRequestsAdmin] Message sent successfully');
        // Clear the input appropriately depending on type
        const isContentEditableDiv = input.tagName === 'DIV' || input.getAttribute('contenteditable') !== null;
        if (isContentEditableDiv) {
          input.innerHTML = '';
        } else {
          input.value = '';
        }
        loadTeamConversation(requestId);
      } else {
            console.error('[AllRequestsAdmin] Server error:', data);
            alert(data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('[AllRequestsAdmin] Error sending message:', error);
        console.error('[AllRequestsAdmin] Error stack:', error.stack);
        alert('Failed to send message');
    });
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

// Create global alias for notification system
window.openConversationModal = openTeamConversationModal;

// Setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Team conversation modal button
    const openChatBtn = document.getElementById('openTeamChatBtn');
    if (openChatBtn) {
        openChatBtn.addEventListener('click', function() {
            // Use the global currentRequestId that's set when details modal opens
            if (currentRequestId) {
                console.log('[AllRequestsAdmin] Opening conversation for request:', currentRequestId);
                openTeamConversationModal(currentRequestId);
            } else {
                console.error('[AllRequestsAdmin] No request ID available');
                alert('No request selected. Please open a request first.');
            }
        });
    }
    
    const sendBtn = document.getElementById('sendTeamMessageBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendTeamMessage);
    }
    
    const messageInput = document.getElementById('teamMessageInput');
    if (messageInput) {
        console.log('[AllRequestsAdmin] Message input found, attaching event listeners');
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTeamMessage();
            }
        });
        
        // Browser handles Ctrl+B/I/U natively on contenteditable - skip JS handler for those
        const isContentEditableDiv = messageInput.tagName === 'DIV' || messageInput.getAttribute('contenteditable') !== null;
        if (isContentEditableDiv) {
            console.log('[AllRequestsAdmin] Contenteditable detected, native formatting shortcuts active');
        } else {
            messageInput.addEventListener('keydown', function(e) {
                // Ctrl+B or Cmd+B for bold
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    applyChatFormat('bold');
                    return false;
                }
                // Ctrl+I or Cmd+I for italic
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                    e.preventDefault();
                    applyChatFormat('italic');
                    return false;
                }
                // Ctrl+U or Cmd+U for underline
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                    e.preventDefault();
                    applyChatFormat('underline');
                    return false;
                }
            });
        }
    } else {
        console.log('[AllRequestsAdmin] Message input element not found (may load later via conversation modal)');
    }
});

// ==========================================
// REVISION HISTORY FUNCTIONS (Admin View - Observer Only)
// ==========================================

async function loadRevisionHistory(requestId, page = Number.MAX_SAFE_INTEGER) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    const pagerContainer = document.getElementById('revisionHistoryPager');

    console.log('[Admin Revision History] Loading for request:', requestId);

    if (!historyContainer) {
        console.warn('[Admin Revision History] Container not found!');
        return;
    }

    try {
        const response = await fetch(`/api/revision-history/${requestId}?page=${page}&limit=5`);
        console.log('[Admin Revision History] Response status:', response.status);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Admin Revision History] API returned non-JSON response');
            if (historySection) historySection.style.display = 'none';
            if (pagerContainer) pagerContainer.innerHTML = '';
            return;
        }
        
        const result = await response.json();
        console.log('[Admin Revision History] API Response:', result);
        console.log('[Admin Revision History] Revisions count:', result.revisions?.length || 0);
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            console.log('[Admin Revision History] Showing section with', result.revisions.length, 'revisions');
            
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

            const pagination = result.pagination || { page: 1, totalPages: 1 };
            const isLastPage = pagination.page >= pagination.totalPages;

            revisionsToShow.forEach((revision, index) => {
                console.log('[Admin Revision History] Rendering revision', index, ':', revision.type);
                const entry = createAdminRevisionEntry(revision, index, revisionsToShow.length, isLastPage);
                historyContainer.appendChild(entry);
            });

            renderRevisionPager(pagerContainer, requestId, pagination, 'loadRevisionHistory');

            console.log('[Admin Revision History] All revisions rendered');
        } else {
            console.log('[Admin Revision History] No revisions to display');

            // Always show revision history section with empty state message
            if (historySection) {
                historySection.style.display = 'block';
            }
            if (pagerContainer) pagerContainer.innerHTML = '';

            // Show empty state message
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
        }
    } catch (error) {
        console.error('[Admin Revision History] Error loading revision history:', error);

        // Always show revision history section with error/empty state
        if (historySection) {
            historySection.style.display = 'block';
        }
        if (pagerContainer) pagerContainer.innerHTML = '';

        // Show empty state message
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
    }
}

// Renders Prev/Page X of Y/Next controls for a revision-history timeline.
// loaderFnName lets this single helper serve both loadRevisionHistory
// (approval requests) and loadServiceRevisionHistory (service requests),
// since this shared modal can show either type.
function renderRevisionPager(pagerContainer, requestId, pagination, loaderFnName) {
    if (!pagerContainer) return;
    const { page, totalPages } = pagination;
    if (!totalPages || totalPages <= 1) {
        pagerContainer.innerHTML = '';
        return;
    }
    pagerContainer.innerHTML = `
        <button type="button" class="pager-btn" ${page <= 1 ? 'disabled' : ''} onclick="${loaderFnName}('${requestId}', ${page - 1})">‹ Prev</button>
        <span class="pager-status">Page ${page} of ${totalPages}</span>
        <button type="button" class="pager-btn" ${page >= totalPages ? 'disabled' : ''} onclick="${loaderFnName}('${requestId}', ${page + 1})">Next ›</button>
    `;
}

function createAdminRevisionEntry(revision, index, total, isLastPage = true) {
    console.log('🔍 [Admin] Creating revision entry:', {
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
    const isUnitAction = revision.requestedBy || revision.type === 'revision' || revision.type === 'revoked' || revision.type === 'approved';
    const isRequestorAction = revision.respondedBy || revision.type === 'initial' || revision.type === 'resubmitted';
    
    entry.className = `revision-conversation-item ${isUnitAction ? 'unit-action' : 'requestor-action'}`;
    
    // Format detailed timestamp
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
    
    const isLast = isLastPage && index === total - 1;
    
    // Determine status indicator for last message
    let statusIndicator = '';
    if (revision.type === 'approved') {
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
        if (typeof revision.requestedBy === 'object' && revision.requestedBy.fName) {
            authorName = `${revision.requestedBy.fName} ${revision.requestedBy.lName}`;
            if (revision.requestedBy.unitTeam) {
                authorUnit = ` (${revision.requestedBy.unitTeam} Unit)`;
            }
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
                <div class="content-text">${(() => {
                    let content;
                    if (revision.type === 'approved') {
                        content = 'The request has been reviewed and approved by the unit team. All requirements have been met.';
                    } else if (revision.type === 'initial') {
                        content = revision.description || 'No description provided';
                    } else if (isUnitAction) {
                        content = revision.revisionNotes || revision.description || 'No feedback provided';
                    } else {
                        content = revision.responseNotes || revision.description || 'No response provided';
                    }
                    console.log('🎯 [Admin] Rendering content:', { isUnitAction, content, type: typeof content });
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
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <line x1="8" y1="8" x2="16" y2="8"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                </div>
                <div class="revision-file-info">
                    <div class="revision-file-name" title="${escapeHtml(file)}">${escapeHtml(file)}</div>
                    <div class="revision-file-size">${ext.toUpperCase()}</div>
                    <div class="revision-file-date">${timestamp}</div>
                </div>
                <div class="revision-file-actions">
                    ${isPDF ? `<button class="file-action-icon" onclick="window.open('${fileUrl}', '_blank')" title="View PDF">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>` : ''}
                    <button class="file-action-icon" onclick="window.open('${fileUrl}', '_blank')" title="Download">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// SERVICE REVISION HISTORY FUNCTIONS (Admin View)
// ==========================================

async function loadServiceRevisionHistory(requestId, page = Number.MAX_SAFE_INTEGER) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    const pagerContainer = document.getElementById('revisionHistoryPager');

    console.log('[Service Revision History] ===== STARTING LOAD =====');
    console.log('[Service Revision History] Request ID:', requestId);
    console.log('[Service Revision History] History section element:', !!historySection);
    console.log('[Service Revision History] History container element:', !!historyContainer);
    
    if (!historyContainer) {
        console.warn('[Service Revision History] ❌ Container not found!');
        return;
    }
    
    try {
        console.log('[Service Revision History] Fetching from API...');
        const response = await fetch(`/api/service-revision-history/${requestId}?page=${page}&limit=5`);
        console.log('[Service Revision History] Response status:', response.status);
        console.log('[Service Revision History] Response OK:', response.ok);

        const contentType = response.headers.get('content-type');
        console.log('[Service Revision History] Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Service Revision History] ❌ API returned non-JSON response');
            if (historySection) historySection.style.display = 'none';
            if (pagerContainer) pagerContainer.innerHTML = '';
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

                const pagination = result.pagination || { page: 1, totalPages: 1 };
                const isLastPage = pagination.page >= pagination.totalPages;

                // Render each revision entry
                revisionsToShow.forEach((revision, index) => {
                    console.log('[Service Revision History] Creating entry', index + 1, 'of', revisionsToShow.length);
                    console.log('[Service Revision History] Revision type:', revision.type);
                    const entry = createServiceRevisionEntry(revision, index, revisionsToShow.length, isLastPage);
                    historyContainer.appendChild(entry);
                });

                renderRevisionPager(pagerContainer, requestId, pagination, 'loadServiceRevisionHistory');

                // Enable two-column layout for revision history
                const modalContent = document.querySelector('#detailsModal .modal-content');
                const modalBody = document.querySelector('#detailsModal .unit-modal-body');
                const rightColumn = document.querySelector('#detailsModal .unit-right-column');
                
                console.log('[Service Revision History] Modal content element:', !!modalContent);
                console.log('[Service Revision History] Modal body element:', !!modalBody);
                console.log('[Service Revision History] Right column element:', !!rightColumn);
                
                if (modalContent && modalBody) {
                    modalContent.style.maxWidth = '1600px';
                    modalBody.classList.add('has-revisions');
                }
                if (rightColumn) {
                    rightColumn.style.display = 'flex';
                    console.log('[Service Revision History] ✅ Set right column display to flex');
                }
                
                console.log('[Service Revision History] ✅ Two-column layout enabled');
            } else {
                // No revisions to show, but keep section visible with empty state
                console.log('[Service Revision History] No revisions after filtering');
                if (historySection) historySection.style.display = 'block';
                if (pagerContainer) pagerContainer.innerHTML = '';
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
            }
        } else {
            console.log('[Service Revision History] No revisions to display');
            // Always show revision history section with empty state
            if (historySection) historySection.style.display = 'block';
            if (pagerContainer) pagerContainer.innerHTML = '';
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
        }
    } catch (error) {
        console.error('[Service Revision History] ❌ ERROR:', error);
        console.error('[Service Revision History] Error stack:', error.stack);
        // Always show revision history section with empty state
        if (historySection) historySection.style.display = 'block';
        if (pagerContainer) pagerContainer.innerHTML = '';
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
    }
}

function createServiceRevisionEntry(revision, index, total, isLastPage = true) {
    console.log('🔍 [Service Admin] Creating revision entry:', {
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
    } else if (revision.type === 'rejected') {
        typeLabel = '✕ Rejected';
        badgeClass = 'badge-revoked';
    } else if (revision.type === 'limit_override') {
        typeLabel = 'Revision Limit Extended';
        badgeClass = 'badge-approved';
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
    const isLast = isLastPage && index === total - 1;
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
    } else if (isLast) {
        if (isUnitAction) {
            statusIndicator = `
                <div class="status-indicator waiting">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 16 14"/>
                    </svg>
                    Awaiting Requestor Review
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
                        ${files.map(file => createAdminRevisionFileCard(file, revision.requestedAt || revision.respondedAt)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${statusIndicator}
        </div>
    `;
    
    return entry;
}

// Helper function to display formatted text (supports HTML from Quill and markdown-style formatting)
function displayFormattedText(text) {
    if (!text) return '';
    
    if (typeof text === 'string' && /<\/?(p|div|strong|b|em|i|u|a|br|span)[\s>]/i.test(text)) {
        return text;
    }
    
    // It's plain text, escape HTML first
    let formatted = escapeHtml(text);

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

// ==========================================
// ADD REQUEST MODAL FUNCTIONALITY
// ==========================================

// Quill editor instances
let approvalQuillEditor = null;
let serviceQuillEditor = null;

// Modal open/close functions
window.openAddApprovalModal = function() {
  const modal = document.getElementById('addApprovalModal');
  if (modal) {
    modal.style.display = 'flex';
    initializeApprovalModal();
  }
};

window.closeAddApprovalModal = function() {
  const modal = document.getElementById('addApprovalModal');
  if (modal) {
    modal.style.display = 'none';
    resetApprovalForm();
  }
};

window.openAddServiceModal = function() {
  const modal = document.getElementById('addServiceModal');
  if (modal) {
    modal.style.display = 'flex';
    initializeServiceModal();
  }
};

window.closeAddServiceModal = function() {
  const modal = document.getElementById('addServiceModal');
  if (modal) {
    modal.style.display = 'none';
    resetServiceForm();
  }
};

// Initialize approval modal
function initializeApprovalModal() {
  // Initialize Quill editor if not already initialized
  if (!approvalQuillEditor && typeof Quill !== 'undefined') {
    approvalQuillEditor = new Quill('#approvalDescriptionEditor', {
      theme: 'snow',
      placeholder: 'Describe your request in detail...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link'],
          ['clean']
        ]
      }
    });
  }

  // Initialize file upload
  initializeApprovalFileUpload();
}

// Initialize service modal
function initializeServiceModal() {
  // Initialize Quill editor if not already initialized
  if (!serviceQuillEditor && typeof Quill !== 'undefined') {
    serviceQuillEditor = new Quill('#serviceDescriptionEditor', {
      theme: 'snow',
      placeholder: 'Describe your service request in detail...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link'],
          ['clean']
        ]
      }
    });
  }

  // Load request types
  loadServiceRequestTypes();
  
  // Initialize file upload
  initializeServiceFileUpload();
}

// Load service request types
async function loadServiceRequestTypes() {
  try {
    const response = await fetch('/api/request-types?requestCategory=Service Request');
    const data = await response.json();
    
    const select = document.getElementById('serviceSpecificRequestType');
    if (select && data.requestTypes) {
      select.innerHTML = '<option value="" disabled selected>Select from predefined types...</option>';
      data.requestTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.typeName;
        option.textContent = type.typeName;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading request types:', error);
  }
}

// File upload handlers for approval
let approvalSelectedFiles = [];

function initializeApprovalFileUpload() {
  const fileInput = document.getElementById('approvalUpload');
  const fileUploadGroup = document.getElementById('approvalFileUploadGroup');
  const clearAllBtn = document.getElementById('approvalClearAllBtn');

  if (fileInput) {
    fileInput.addEventListener('change', handleApprovalFileSelect);
  }

  if (fileUploadGroup) {
    // Drag and drop
    fileUploadGroup.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadGroup.classList.add('dragover');
    });

    fileUploadGroup.addEventListener('dragleave', () => {
      fileUploadGroup.classList.remove('dragover');
    });

    fileUploadGroup.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadGroup.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      handleApprovalFiles(files);
    });

    fileUploadGroup.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllApprovalFiles);
  }
}

function handleApprovalFileSelect(event) {
  const files = Array.from(event.target.files);
  handleApprovalFiles(files);
}

function handleApprovalFiles(files) {
  approvalSelectedFiles = [...approvalSelectedFiles, ...files];
  updateApprovalFileDisplay();
}

function updateApprovalFileDisplay() {
  const fileManagement = document.getElementById('approvalFileManagement');
  const filesContainer = document.getElementById('approvalSelectedFiles');
  const filesCount = document.getElementById('approvalFilesCount');
  const filesSummary = document.getElementById('approvalFilesSummary');

  if (approvalSelectedFiles.length > 0) {
    fileManagement.style.display = 'block';
    filesCount.textContent = `${approvalSelectedFiles.length} file${approvalSelectedFiles.length > 1 ? 's' : ''} selected`;

    let totalSize = 0;
    filesContainer.innerHTML = '';

    approvalSelectedFiles.forEach((file, index) => {
      totalSize += file.size;
      const fileItem = createFileCard(file, index, 'approval');
      filesContainer.innerHTML += fileItem;
    });

    const totalSizeMb = totalSize / (1024 * 1024);
    filesSummary.textContent = `Total size: ${totalSizeMb.toFixed(2)} MB`;
  } else {
    fileManagement.style.display = 'none';
  }
}

function clearAllApprovalFiles() {
  approvalSelectedFiles = [];
  document.getElementById('approvalUpload').value = '';
  updateApprovalFileDisplay();
}

window.removeApprovalFile = function(index) {
  approvalSelectedFiles.splice(index, 1);
  updateApprovalFileDisplay();
};

// File upload handlers for service
let serviceSelectedFiles = [];

function initializeServiceFileUpload() {
  const fileInput = document.getElementById('serviceUpload');
  const fileUploadGroup = document.getElementById('serviceFileUploadGroup');
  const clearAllBtn = document.getElementById('serviceClearAllBtn');

  if (fileInput) {
    fileInput.addEventListener('change', handleServiceFileSelect);
  }

  if (fileUploadGroup) {
    // Drag and drop
    fileUploadGroup.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadGroup.classList.add('dragover');
    });

    fileUploadGroup.addEventListener('dragleave', () => {
      fileUploadGroup.classList.remove('dragover');
    });

    fileUploadGroup.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadGroup.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      handleServiceFiles(files);
    });

    fileUploadGroup.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllServiceFiles);
  }
}

function handleServiceFileSelect(event) {
  const files = Array.from(event.target.files);
  handleServiceFiles(files);
}

function handleServiceFiles(files) {
  serviceSelectedFiles = [...serviceSelectedFiles, ...files];
  updateServiceFileDisplay();
}

function updateServiceFileDisplay() {
  const fileManagement = document.getElementById('serviceFileManagement');
  const filesContainer = document.getElementById('serviceSelectedFiles');
  const filesCount = document.getElementById('serviceFilesCount');
  const filesSummary = document.getElementById('serviceFilesSummary');

  if (serviceSelectedFiles.length > 0) {
    fileManagement.style.display = 'block';
    filesCount.textContent = `${serviceSelectedFiles.length} file${serviceSelectedFiles.length > 1 ? 's' : ''} selected`;

    let totalSize = 0;
    filesContainer.innerHTML = '';

    serviceSelectedFiles.forEach((file, index) => {
      totalSize += file.size;
      const fileItem = createFileCard(file, index, 'service');
      filesContainer.innerHTML += fileItem;
    });

    const totalSizeMb = totalSize / (1024 * 1024);
    filesSummary.textContent = `Total size: ${totalSizeMb.toFixed(2)} MB`;
  } else {
    fileManagement.style.display = 'none';
  }
}

function clearAllServiceFiles() {
  serviceSelectedFiles = [];
  document.getElementById('serviceUpload').value = '';
  updateServiceFileDisplay();
}

window.removeServiceFile = function(index) {
  serviceSelectedFiles.splice(index, 1);
  updateServiceFileDisplay();
};

// Create file card HTML
function createFileCard(file, index, type) {
  const fileExt = file.name.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
  const sizeKb = (file.size / 1024).toFixed(1);
  const removeFn = type === 'approval' ? 'removeApprovalFile' : 'removeServiceFile';

  return `
    <div class="file-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #f3f4f6; transition: all 0.3s ease;">
      <div class="file-item-info" style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #3b82f6;">
          <path d="M4 4h16v16H4z" />
        </svg>
        <div class="file-item-details" style="flex: 1;">
          <p class="file-item-name" style="margin: 0 0 0.25rem 0; font-size: 0.875rem; font-weight: 600; color: #334155; word-break: break-all;">${file.name}</p>
          <p class="file-item-size" style="margin: 0; font-size: 0.75rem; color: #64748b;">${sizeKb} KB</p>
        </div>
      </div>
      <button type="button" class="file-delete-btn" onclick="${removeFn}(${index})" style="background: #ef4444; color: white; border: none; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: all 0.3s ease; font-weight: bold; min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
  `;
}

// Links management for approval
window.addApprovalLink = function() {
  const container = document.getElementById('approvalLinksContainer');
  const linkGroup = document.createElement('div');
  linkGroup.className = 'link-input-group';
  linkGroup.innerHTML = `
    <input type="text" name="links[]" class="link-input" placeholder="https://example.com" />
    <button type="button" class="remove-link-btn" onclick="removeApprovalLink(this)">×</button>
  `;
  container.appendChild(linkGroup);
};

window.removeApprovalLink = function(button) {
  const linkGroup = button.closest('.link-input-group');
  linkGroup.remove();
};

// Links management for service
window.addServiceLink = function() {
  const container = document.getElementById('serviceLinksContainer');
  const linkGroup = document.createElement('div');
  linkGroup.className = 'link-input-group';
  linkGroup.innerHTML = `
    <input type="text" name="links[]" class="link-input" placeholder="https://example.com" />
    <button type="button" class="remove-link-btn" onclick="removeServiceLink(this)">×</button>
  `;
  container.appendChild(linkGroup);
};

window.removeServiceLink = function(button) {
  const linkGroup = button.closest('.link-input-group');
  linkGroup.remove();
};

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  const approvalForm = document.getElementById('addApprovalForm');
  const serviceForm = document.getElementById('addServiceForm');

  if (approvalForm) {
    approvalForm.addEventListener('submit', handleApprovalSubmit);
  }

  if (serviceForm) {
    serviceForm.addEventListener('submit', handleServiceSubmit);
  }
});

async function handleApprovalSubmit(event) {
  event.preventDefault();
  
  if (approvalQuillEditor) {
    const description = document.getElementById('approvalDescription');
    description.value = approvalQuillEditor.root.innerHTML;
  }

  const form = event.target;
  const formData = new FormData(form);

  approvalSelectedFiles.forEach(file => {
    formData.append('upload', file);
  });

  try {
    const response = await fetch('/submit-request-approval', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.showSuccessAlert('Request submitted successfully!');
      closeAddApprovalModal();
      setTimeout(() => location.reload(), 1500);
    } else {
      window.showErrorAlert('Failed to submit request. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting approval request:', error);
    window.showErrorAlert('An error occurred. Please try again.');
  }
}

async function handleServiceSubmit(event) {
  event.preventDefault();
  
  if (serviceQuillEditor) {
    const description = document.getElementById('serviceDescription');
    description.value = serviceQuillEditor.root.innerHTML;
  }

  const predefinedType = document.getElementById('serviceSpecificRequestType').value;
  const customType = document.getElementById('serviceCustomRequestType').value;
  const finalTypeInput = document.getElementById('serviceFinalRequestType');
  
  if (customType.trim()) {
    finalTypeInput.value = customType.trim();
  } else if (predefinedType) {
    finalTypeInput.value = predefinedType;
  } else {
    window.showErrorAlert('Please select or enter a request type.');
    return;
  }

  const form = event.target;
  const formData = new FormData(form);

  serviceSelectedFiles.forEach(file => {
    formData.append('upload', file);
  });

  try {
    const response = await fetch('/submit-service-request', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.showSuccessAlert('Service request submitted successfully!');
      closeAddServiceModal();
      setTimeout(() => location.reload(), 1500);
    } else {
      window.showErrorAlert('Failed to submit service request. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting service request:', error);
    window.showErrorAlert('An error occurred. Please try again.');
  }
}

function resetApprovalForm() {
  const form = document.getElementById('addApprovalForm');
  if (form) form.reset();
  
  if (approvalQuillEditor) {
    approvalQuillEditor.setText('');
  }
  
  approvalSelectedFiles = [];
  updateApprovalFileDisplay();
  
  const linksContainer = document.getElementById('approvalLinksContainer');
  if (linksContainer) {
    linksContainer.innerHTML = `
      <div class="link-input-group">
        <input type="text" name="links[]" class="link-input" placeholder="https://example.com" />
        <button type="button" class="remove-link-btn" onclick="removeApprovalLink(this)" style="display: none;">×</button>
      </div>
    `;
  }
}

function resetServiceForm() {
  const form = document.getElementById('addServiceForm');
  if (form) form.reset();
  
  if (serviceQuillEditor) {
    serviceQuillEditor.setText('');
  }
  
  serviceSelectedFiles = [];
  updateServiceFileDisplay();
  
  const linksContainer = document.getElementById('serviceLinksContainer');
  if (linksContainer) {
    linksContainer.innerHTML = `
      <div class="link-input-group">
        <input type="text" name="links[]" class="link-input" placeholder="https://example.com" />
        <button type="button" class="remove-link-btn" onclick="removeServiceLink(this)" style="display: none;">A-</button>
      </div>
    `;
  }
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
