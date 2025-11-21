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

// Organization and Office data arrays (simplified for brevity)
const studentOrganizations = [
 "University Student Government (USG)",
        "Internal Audit Service (IAS)",
        "University Student Election Commission (USEC)",
        "Office of the Solicitor General (OSG)",
        "College of Business Administration and Accountancy Student Government (CBAASG)",
        "Business Management Program Council (BMPC)",
        "Junior Philippine Institute of Accountants (JPIA)",
        "Marketing Management Program Council (MMPC)",
        "College of Education Student Government (COEdSG)",
        "College of Engineering, Architecture and Technology Student Government (CEATSG)",
        "Architecture Program Council (ArchPC)",
        "Civil Engineering Program Council (CEEPC)",
        "Computer Engineering Program Council (CpEPC)",
        "Electrical Engineering Program Council (EEEPC)",
        "Electronics Engineering Program Council (ECEPC)",
        "Industrial Engineering Program Council (IEEPC)",
        "Mechanical Engineering Program Council (MEEPC)",
        "Multimedia Arts Program Council (MMAPC)",
        "College of Tourism and Hospitality Management Student Government (CTHMSG)",
        "College of Criminal Justice Education Student Government (CCJESG)",
        "Criminology Program Council (CrimPC)",
        "Forensic Science Program Council (FScPC)",
        "College of Liberal Arts and Communication Student Government (CLACSG)",
        "Communication Program Council (CPC)",
        "International Development Program Council (IDPC)",
        "Political Science Program Council (PSPC)",
        "Psychology Program Council (PPC)",
        "College of Science Student Government (COSSG)",
        "Applied Mathematics Program Council (AMPC)",
        "Biology Program Council (BioPC)",
        "College of Information and Computer Studies Student Government (CICSSG)",
        "Computer Science Program Council (CSPC)",
        "Information Technology Program Council (ITPC)",
        "DLSU-D Chorale (CHORALE)",
        "Lasallian Symphony Orchestra (LSO)",
        "La Salle Filipiniana Dance Company (LSFDC)",
        "Lasallian Pointes N' Flexes Dance Company (LPNFDC)",
        "Lasallian Pop Band (LPB)",
        "Teatro Lasalliana (TEATRO)",
        "Visual and Performing Arts Production Unit (VPAPU)",
        "Heraldo Filipino",
        "Vicissitude",
        "Council of Student Organizations (CSO)",
        "Business Operations Management Society (BOMS)",
        "Junior Marketing Association (JMA)",
        "DLSU-D Psychological Society (DPS)",
        "DLSU-D Pre-Medical Society (DPMS)",
        "Hotel and Restaurant Management Society (HRMS)",
        "Turismo Lasalleño Society (TLS)",
        "Lasallian Educators Society (LES)",
        "American Society of Heating, Refrigerating, and Air-Conditioning Engineers (ASHRAE DLSU-D)",
        "DLSU-D Pre-Law Society (DPLS)",
        "Astraeus Literary and Arts Guild",
        "Accounting Enrichment Society (ACES)",
        "Circle of Student Assistants (COSA)",
        "DLSU-D Lifters",
        "DLSU-D Patriots of Animal Welfare and Support (PAWS)",
        "DLSU-D United Patriots Football Club",
        "Junior Financial Executives Institute of the Philippines (JFINEX)",
        "Marché Société (MS)",
        "PROJECT: Ikigai (PROJ:Ik) - former Viridescent A-1",
        "SINAG Society of Leaders (SISOL)",
        "Campus Peer Ministers (CPM) and Youth for Christ of (YFC) of Campus Ministry Office",
        "Lasallian Peer Facilitators (LPF) of Student Wellness Center",
        "Lasallian Student Ambassadors (LSA) of Linkages and Scholarship Office",
        "LS Verde of Campus Sustainability Office",
        "Students' Extension of Resources through Voluntary Effort (SERVE) of LCDC",
        "Green FM of Communications and Journalism Department",
        "International Students' Association (ISA) of International Students Office",
        "Lasallian Youth Accompaniment Group (LaYAG) of University Lasallian Family Office"
];

const officesDepartments = [
  "Office of the President",
          "Office of the Chief Administrative Officer",
          "Office of the Provost",
          "Office of the Chief Lasallian Mission Officer",
          "Office of the Principal",
          "Corporate and Executive Management Office",
          "Center for Heritage Conservation",
          "Museo De La Salle",
          "Risk, Compliance and Audit Office",
          "University Chaplain",
          "Office of the Vice President for Administrative Services",
          "Office of the Vice President for Finance",
          "Office of the Vice President for Global Engagement and External Relations",
          "Human Resource Management Office",
          "Strategic Communications Office",
          "Ancillary and Asset Management Office",
          "Legal Counsel",
          "Data Protection Office",
          "Campus Development Office",
          "Buildings and Facilities Maintenance Office",
          "Campus Sustainability Office",
          "General Services Office",
          "Green Architecture and Campus Planning Office",
          "Information and Communications Technology Center",
          "Accounting Office",
          "Treasury Office",
          "Advancement and Alumni Relations Office",
          "Lasallian Community Development Center",
          "Linkages and Scholarship Office",
          "Office of the Vice Provost for Academics",
          "Office of the Deputy Provost for Research",
          "Academic Planning and Quality Management",
          "College of Law",
          "College of Professional and Graduate Studies",
          "School of Innovative and Flexible Learning",
          "School of Governance, Public Service, and Corporate Leadership",
          "Aklatang Emilio Aguinaldo-Information Resource Center",
          "Center for Student Admissions",
          "University Registrar",
          "Cavite Studies Center",
          "University Research Office",
          "Herminia D. Torres Quality Assurance Office",
          "Center for Innovative Learning Program",
          "Center for Curriculum Development and Instruction",
          "Language Learning Center",
          "Center for Artificial Intelligence",
          "Center for Creative Program",
          "Academy of Continuing Education",
          "College of Business Administration and Accountancy",
          "Accountancy Department",
          "Allied Business Department",
          "Business Management Department",
          "Marketing Department",
          "College of Criminal Justice Education",
          "College of Education",
          "Physical Education Department",
          "Professional Education Department",
          "Religious Education Department",
          "College of Engineering, Architecture and Technology",
          "Architecture Department",
          "Engineering Department",
          "Graphics Design and Multimedia Department",
          "Center of Technology",
          "College of Information and Computer Studies",
          "Computer Studies Department",
          "Information Technology Department",
          "College of Liberal Arts and Communication",
          "Communication and Journalism Department",
          "Languages and Literature Department",
          "Social Sciences Department",
          "Philosophy and Psychology Department",
          "College of Tourism and Hospitality Management",
          "Hospitality Management Department",
          "Tourism Management Department",
          "College of Science",
          "Biological Sciences Department",
          "Mathematics & Statistics Department",
          "Physical Sciences Department",
          "Office of Student Services",
          "Student Development and Activities Office",
          "Student Welfare and Formation Office",
          "Student Wellness Center",
          "NSTP-CWTS",
          "Campus Ministry Office",
          "DLS Bahay Pag-asa Dasmariñas",
          "Night College",
          "Sports Development Office",
          "University Lasallian Family Office",
          "Basic Education",
          "Office of the Associate Principal for Academics and Research",
          "Office of the Associate Principal for Administrative Services and Student Affairs",
          "Dormitory",
          "Materials Reproduction Office / Food Services Office",
          "Retreat and Conference Center / Sports & Recreation Complex",
          "Warehouse Office",
          "Safety & Health Office",
          "Purchasing Office",
          "Transportation Office",
          "Facilities Maintenance Office",
          "Housekeeping & Grounds",
          "De La Salle Dasmariñas Alumni Association",
          "DLSU-D Development Cooperative",
          "Faculty Organization",
          "KABALIKAT ng DLSU-D Inc.",
          "Parents Organization La Salle Cavite",
          "Human Resource Management Office"
];

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
let currentRequestId = null;
let currentRequestType = null;
let originalValues = {};
let allRequestsData = [];

// Global enhanced dropdown instances
let typeFilter, statusFilter, studentOrgFilter, officeDeptFilter;

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
    formattedDeadline: row.dataset.formattedDeadline,
    student: row.dataset.student,
    specifictype: row.dataset.specifictype
  };

  openModal(rowData);
}

function openModal(rowData) {
  // Mark notification as read when opening request
  if (typeof window.markNotificationReadForRequest === 'function') {
    window.markNotificationReadForRequest(rowData.id, rowData.type);
  }

  currentRequestId = rowData.id;
  currentRequestType = rowData.type;

  populateModalData(rowData);

  const modalBody = detailModal.querySelector('.details-modal-body');
  modalBody.scrollTop = 0;

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

  // Initialize enhanced multi-select for type filter (with checkboxes like Status)
  typeFilter = new EnhancedMultiSelect('typeFilter',
    ['Request Approval', 'Service Request'],
    'Select Type', false);
  
  // Store instance reference on container
  const typeFilterContainer = document.getElementById('typeFilter');
  if (typeFilterContainer) {
    typeFilterContainer.__instance = typeFilter;
  }

  // Initialize enhanced multi-select dropdowns
  statusFilter = new EnhancedMultiSelect('statusFilter',
    ['pending', 'queued', 'in progress', 'approved', 'for revision', 'completed', 'rejected', 'archived'],
    'Select Status', false);
  
  const statusFilterContainer = document.getElementById('statusFilter');
  if (statusFilterContainer) {
    statusFilterContainer.__instance = statusFilter;
  }

  studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter',
    studentOrganizations,
    'Select Student Organizations', true);
  
  const studentOrgFilterContainer = document.getElementById('studentOrgFilter');
  if (studentOrgFilterContainer) {
    studentOrgFilterContainer.__instance = studentOrgFilter;
  }

  officeDeptFilter = new EnhancedMultiSelect('officeDeptFilter',
    officesDepartments,
    'Select Offices/Departments', true);
  
  const officeDeptFilterContainer = document.getElementById('officeDeptFilter');
  if (officeDeptFilterContainer) {
    officeDeptFilterContainer.__instance = officeDeptFilter;
  }

  // Initialize global modal variables
  detailModal = document.getElementById("detailsModal");
  updateConfirmationModal = document.getElementById("updateConfirmationModal");

  console.log('🔍 DOM Elements Check:', {
    detailModal: !!detailModal,
    updateConfirmationModal: !!updateConfirmationModal,
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
  const dateFromFilter = document.getElementById('dateFromFilter');
  const dateToFilter = document.getElementById('dateToFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultsCount = document.getElementById('resultsCount');

  // Event listeners setup
  const typeFilterContainer = document.getElementById('typeFilter');
  if (typeFilterContainer) {
    typeFilterContainer.addEventListener('selectionChange', applyFilters);
  }

  const statusFilterContainer = document.getElementById('statusFilter');
  if (statusFilterContainer) {
    statusFilterContainer.addEventListener('selectionChange', applyFilters);
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
    dateFromFilter.addEventListener('change', applyFilters);
  }

  if (dateToFilter) {
    dateToFilter.addEventListener('change', applyFilters);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }

  function applyFilters() {
    const filters = getFilterValues();
    let visibleCount = 0;

    allRequestsData.forEach(request => {
      const shouldShow = testFilters(request, filters);
      request.element.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    updateResultsCount(visibleCount);
  }

  function getFilterValues() {
    return {
      requestId: requestIdFilter?.value?.toLowerCase().trim() || '',
      type: typeFilterContainer?.__instance?.getSelectedValues() || ['all'],
      status: statusFilterContainer?.__instance?.getSelectedValues() || ['all'],
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

    // Type filter (multi-select with array)
    if (filters.type.length > 0 && !filters.type.includes('all') && !filters.type.includes(request.type)) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes('all') && !filters.status.includes(request.status)) {
      return false;
    }

    // Student filter
    if (filters.student && !request.student?.includes(filters.student)) {
      return false;
    }

    // Organization filters (OR logic)
    const hasStudentOrgFilter = filters.studentOrg.length > 0 && !filters.studentOrg.includes('all');
    const hasOfficeDeptFilter = filters.officeDept.length > 0 && !filters.officeDept.includes('all');

    if (hasStudentOrgFilter || hasOfficeDeptFilter) {
      let matches = false;

      if (hasStudentOrgFilter && filters.studentOrg.some(org => request.organization?.includes(org.toLowerCase()))) {
        matches = true;
      }

      if (hasOfficeDeptFilter && filters.officeDept.some(dept => request.organization?.includes(dept.toLowerCase()))) {
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
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';

    typeFilterContainer?.__instance?.reset();
    statusFilterContainer?.__instance?.reset();
    studentOrgFilterContainer?.__instance?.reset();
    officeDeptFilterContainer?.__instance?.reset();

    allRequestsData.forEach(request => {
      request.element.style.display = '';
    });

    updateResultsCount(allRequestsData.length);
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

  updateResultsCount(allRequestsData.length);
}

// Modal system
function initializeModalHandlers() {
  const closeBtn = document.getElementById("closeDetailsModal");
  if (closeBtn) {
    closeBtn.onclick = () => closeModal();
  }

  window.onclick = function(event) {
    if (event.target === detailModal) closeModal();
    if (event.target === updateConfirmationModal) updateConfirmationModal?.classList?.remove('show');
  };
}

function initializeRichModalHandlers() {
  const updateBtn = document.getElementById('adminUpdateBtn');
  const cancelBtn = document.getElementById('adminCancelBtn');

  if (updateBtn) {
    updateBtn.onclick = showUpdateConfirmation;
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      resetFormToOriginalValues();
      updateConfirmationModal?.classList?.remove('show');
    };
  }

  // Confirmation modal handlers
  const confirmBtn = document.getElementById('confirmUpdateBtn');
  const cancelConfirmBtn = document.getElementById('confirmCancelBtn');

  if (confirmBtn) {
    confirmBtn.onclick = performUpdate;
  }

  if (cancelConfirmBtn) {
    cancelConfirmBtn.onclick = () => updateConfirmationModal?.classList?.remove('show');
  }
}

// Conversation functionality
function initializeConversationModal() {
  const chatBtn = document.getElementById('openChatFromModal');
  const conversationModal = document.getElementById('conversationModal');
  const closeBtn = document.getElementById('closeConversationModal');
  const sendBtn = document.getElementById('sendMessageBtn');
  const input = document.getElementById('messageInput');

  if (chatBtn) {
    chatBtn.onclick = () => currentRequestId && openConversation(currentRequestId);
  }

  if (closeBtn) {
    closeBtn.onclick = () => conversationModal.style.display = 'none';
  }

  if (sendBtn) {
    sendBtn.onclick = sendMessage;
  }

  if (input) {
    input.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
  }

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
  setDetailText('detailType', rowData.type);
  setDetailText('detailSpecificRequest', rowData.specifictype);
  setDetailText('detailOrganization', rowData.organization);
  setDetailText('detailDatetime', rowData.datetime);
  setDetailText('detailDescription', rowData.description || 'No description provided');

  // Handle deadline visibility
  const deadlineElements = ['deadlineInfo', 'adminDeadlineField'];
  deadlineElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = rowData.type === 'Service Request' ? 'block' : 'none';
    }
  });

  setDetailText('detailDeadlineInfo', rowData.formattedDeadline);

  populateAdminForm(rowData);
  populateFilePreview(rowData);
  
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
      openTeamConversationModal(currentRequestId);
    };
  }
}

function setDetailText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || 'N/A';
}

// Admin form population
function populateAdminForm(rowData) {
  originalValues = {
    status: rowData.status,
    units: rowData.units,
    deadline: rowData.formattedDeadline,
    deadlineDisplay: rowData.formattedDeadline
  };

  // Show/hide additional file upload toggle based on status
  const additionalFileToggleSection = document.getElementById('additionalFileToggleSection');
  if (additionalFileToggleSection) {
    if (rowData.status && rowData.status.toLowerCase() === 'for revision') {
      additionalFileToggleSection.style.display = 'block';
      
      // Initialize checkbox state based on allowAdditionalUpload data
      // Check for both possible checkbox IDs
      const checkbox = document.getElementById('allowAdditionalFileUpload') || 
                      document.getElementById('toggleAdditionalFileUploadBtn');
      if (checkbox) {
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
        
        checkbox.checked = allowAdditionalUpload === 'true';
      }
    } else {
      additionalFileToggleSection.style.display = 'none';
    }
  }

  // Status dropdown
  const statusSelect = document.getElementById('adminStatusSelect');
  if (statusSelect) {
    const options = getStatusOptions(rowData.type);
    statusSelect.innerHTML = options.map(opt => `<option value="${opt}" ${opt === rowData.status ? 'selected' : ''}>${opt}</option>`).join('');
    document.getElementById('currentStatusValue').textContent = rowData.status;
  }

  // Units dropdown
  const unitsSelect = document.getElementById('adminUnitsSelect');
  if (unitsSelect) {
    populateUnitsDropdown(rowData);
    document.getElementById('currentUnitsValue').textContent = rowData.units;
  }

  // Deadline (for service requests)
  if (rowData.type === 'Service Request') {
    const deadlineInput = document.getElementById('adminDeadlineInput');
    if (deadlineInput && rowData.formattedDeadline) {
      try {
        deadlineInput.value = formatDateForInput(rowData.formattedDeadline);
        originalValues.deadline = deadlineInput.value;
      } catch (e) {
        console.error('Error setting deadline:', e);
      }
    }
    document.getElementById('currentDeadlineValue').textContent = rowData.formattedDeadlineDisplay || rowData.formattedDeadline;
  }
}

function getStatusOptions(type) {
  const baseStatuses = ['approved', 'rejected', 'archived'];

  if (type === 'Request Approval') {
    return ['Pending', 'Queued', 'In Progress', 'For Revision', ...baseStatuses];
  } else {
    return ['Pending', 'Queued', 'In Progress', 'For Revision', 'completed', ...baseStatuses];
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

  // Create recommended units optgroup (only recommended ones)
  const recommendedUnitsHTML = recommendations.length > 0 ?
    `<optgroup label="Recommended Units">${recommendations.map(unit =>
      `<option value="${unit}" class="recommended-unit">★ ${unit}</option>`
    ).join('')}</optgroup>` :
    `<optgroup label="Recommended Units"><option value="" disabled>No recommendations available</option></optgroup>`;

  // Create other units optgroup (units not in recommendations)
  const otherUnits = unitNames.filter(unit => !recommendations.includes(unit));
  const otherUnitsHTML = otherUnits.length > 0 ?
    `<optgroup label="Other Units">${otherUnits.map(unit =>
      `<option value="${unit}">${unit}</option>`
    ).join('')}</optgroup>` : '';

  unitsSelect.innerHTML = `
    <option value="">Not yet assigned</option>
    ${recommendedUnitsHTML}
    ${otherUnitsHTML}
  `;

  unitsSelect.value = rowData.units === 'Not yet assigned' ? '' : rowData.units;
}

function formatDateForInput(dateStr) {
  if (!dateStr || dateStr === 'N/A') return '';

  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  if (parts.length === 3) {
    return `20${parts[2].length === 2 ? parts[2] : parts[2].slice(-2)}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00`;
  }
  return '';
}

function populateFilePreview(rowData) {
  const previewContainer = document.getElementById('file-preview');
  previewContainer.innerHTML = '';

  let allFiles = [];

  if (rowData.files && rowData.files.trim() !== '') {
    allFiles = rowData.files.split(',').map(f => f.trim()).filter(Boolean);
  } else if (rowData.file && rowData.file.trim() !== '') {
    allFiles = [rowData.file.trim()];
  }

  // Show toggle section only when there are files and the request allows additional uploads
  const toggleSection = document.getElementById('additionalFileToggleSection');
  if (toggleSection) {
    // For now, show it when there are files (can be refined later based on request status)
    toggleSection.style.display = allFiles.length > 0 ? 'block' : 'none';
  }

  if (allFiles.length > 0) {
    const fileGrid = document.createElement('div');
    fileGrid.className = 'enhanced-file-preview';
    fileGrid.innerHTML = `<h3>Attached Files (${allFiles.length})</h3><div class="file-grid"></div>`;

    const grid = fileGrid.querySelector('.file-grid');

    allFiles.forEach((file, index) => {
      const ext = file.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);

      const fileItem = document.createElement('div');
      fileItem.className = 'enhanced-file-item';
      fileItem.innerHTML = generateFileItemHTML(file, ext, isImage);

      grid.appendChild(fileItem);
    });

    previewContainer.appendChild(fileGrid);
  } else {
    previewContainer.innerHTML = `
      <div class="enhanced-file-preview">
        <h3>Attached Files</h3>
        <div class="no-files-message">
          <div class="no-files-title">No Files Attached</div>
          <div class="no-files-subtitle">This request was submitted without any file attachments.<br><small>Files may have been uploaded but are not accessible.</small></div>
        </div>
      </div>
    `;
  }
}

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
  rows.forEach(row => {
    row.addEventListener('click', () => openModalFromRow(row));
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

// Missing modal handlers - these need to be implemented based on the EJS template
function showUpdateConfirmation() {
  // Get current form values
  const statusSelect = document.getElementById('adminStatusSelect');
  const unitsSelect = document.getElementById('adminUnitsSelect');
  const deadlineInput = document.getElementById('adminDeadlineInput');

  const currentStatus = statusSelect ? statusSelect.value : '';
  const currentUnits = unitsSelect ? unitsSelect.value : '';
  const currentDeadline = deadlineInput ? deadlineInput.value : '';

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
    }
  } else {
    console.log('No changes detected');
  }
}

function resetFormToOriginalValues() {
  const statusSelect = document.getElementById('adminStatusSelect');
  if (statusSelect) {
    const options = getStatusOptions(currentRequestType);
    statusSelect.innerHTML = options.map(opt => `<option value="${opt}" ${opt === originalValues.status ? 'selected' : ''}>${opt}</option>`).join('');
  }

  const unitsSelect = document.getElementById('adminUnitsSelect');
  if (unitsSelect) {
    unitsSelect.value = originalValues.units === 'Not yet assigned' ? '' : originalValues.units;
  }

  const deadlineInput = document.getElementById('adminDeadlineInput');
  if (deadlineInput && originalValues.deadline) {
    deadlineInput.value = originalValues.deadline;
  }
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
    deadline: deadlineInput?.value || null,
    requestType: currentRequestType
  };

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
      }
      if (detailModal) {
        detailModal.style.display = 'none';
      }

      console.log('Update completed successfully');

      // Optional: Show success message
      alert('Request updated successfully!');

    } else {
      console.error('Update failed:', result.message);
      alert('Failed to update request: ' + result.message);
    }
  } catch (error) {
    console.error('Error performing update:', error);
    alert('Error updating request: ' + error.message);

    // Revert modals on error
    if (updateConfirmationModal) {
      updateConfirmationModal.classList.remove('show');
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
let chatFiles = [];

function initializeChatFileFeatures() {
    console.log('[AllRequestsAdmin] Initializing chat file features...');
    // Attach files button
    const attachBtn = document.getElementById('chatAttachBtn');
    const fileInput = document.getElementById('chatFileInput');
    
    if (attachBtn && fileInput) {
        console.log('[AllRequestsAdmin] Chat file elements found');
        attachBtn.addEventListener('click', () => {
            console.log('[AllRequestsAdmin] Attach button clicked');
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleChatFileSelect);
    } else {
        console.warn('[AllRequestsAdmin] Chat file elements not found:', { attachBtn: !!attachBtn, fileInput: !!fileInput });
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
    console.log('[AllRequestsAdmin] File selection triggered');
    const files = Array.from(event.target.files);
    console.log('[AllRequestsAdmin] Selected files:', files.length);
    
    files.forEach(file => {
        // Check if file already exists
        const exists = chatFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            chatFiles.push(file);
            console.log('[AllRequestsAdmin] Added file:', file.name);
        } else {
            console.log('[AllRequestsAdmin] Duplicate file skipped:', file.name);
        }
    });
    
    console.log('[AllRequestsAdmin] Total files:', chatFiles.length);
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
    item.className = 'chat-file-item';
    
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
        <div class="chat-file-info">
            <div class="chat-file-icon" style="color: ${iconColor};">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="16" x2="12" y2="16"/>
                </svg>
            </div>
            <div class="chat-file-name" title="${file.name}">${file.name}</div>
        </div>
        <button type="button" class="chat-file-remove" onclick="removeChatFile(${index})" title="Remove file">
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

// Close team conversation modal
window.closeTeamConversationModal = function() {
    const modal = document.getElementById('teamConversationModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Initialize chat file features when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChatFileFeatures();
});

// ==========================================
// CONVERSATION LOADING AND SENDING
// ==========================================
let currentConversationRequestId = null;

window.openTeamConversationModal = function(requestId) {
    currentConversationRequestId = requestId;
    const modal = document.getElementById('teamConversationModal');
    if (modal && requestId) {
        loadTeamConversation(requestId);
        modal.style.display = 'flex';
    }
};

function loadTeamConversation(requestId) {
    const container = document.getElementById('teamMessagesContainer');
    if (!container) return;

    fetch(`/api/conversation/${requestId}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Server error response:', text);
                    let errorMsg = 'Failed to load conversation';
                    if (response.status === 401) errorMsg = 'Session expired. Please log in again.';
                    else if (response.status === 403) errorMsg = 'Access denied.';
                    throw new Error(errorMsg);
                });
            }
            return response.json();
        })
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
            alert('Failed to load conversation');
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
    
    // Create read receipts HTML
    let readReceiptsHTML = '';
    if (msg.readBy && msg.readBy.length > 0) {
        const readByList = msg.readBy.map(reader => {
            const readTime = new Date(reader.readAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            return `<div style="font-size: 0.7rem; color: #6b7280; margin-top: 0.15rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="vertical-align: middle; margin-right: 2px;">
                    <polyline points="20 6 9 17 4 12"/>
                    <polyline points="20 6 9 17" style="opacity: 0.5;"/>
                </svg>
                Read by ${escapeHtml(reader.userName)} at ${readTime}
            </div>`;
        }).join('');
        readReceiptsHTML = `<div class="read-receipts" style="margin-top: 0.25rem;">${readByList}</div>`;
    }
    
    div.innerHTML = `
        <div class="unit-message-bubble ${roleClass}" style="background: ${roleColor};">
            <div class="message-header">
                <strong>${escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${formatText(msg.content || '')}</div>
            ${attachmentsHTML}
            ${readReceiptsHTML}
        </div>
    `;
    
    return div;
}

// Helper function to display formatted text (supports HTML from Quill and markdown-style formatting)
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to format text with markdown-style syntax
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

// Send team message
window.sendTeamMessage = function() {
    console.log('[AllRequestsAdmin] Send team message triggered');
    const input = document.getElementById('teamMessageInput');
    if (!input || !currentConversationRequestId) {
        console.error('[AllRequestsAdmin] Missing input or request ID:', {
            input: !!input,
            currentConversationRequestId
        });
        return;
    }

    const content = input.value.trim();
    console.log('[AllRequestsAdmin] Message content:', content || '(empty)');
    console.log('[AllRequestsAdmin] Files to send:', chatFiles.length);
    
    if (!content && chatFiles.length === 0) {
        console.warn('[AllRequestsAdmin] No content or files');
        alert('Please enter a message or attach files');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    
    // Add files if any
    chatFiles.forEach((file, index) => {
        console.log(`[AllRequestsAdmin] Appending file ${index + 1}:`, file.name);
        formData.append('chatFiles', file);
    });

    console.log('[AllRequestsAdmin] Sending to:', `/api/conversation/${currentConversationRequestId}/message`);
    fetch(`/api/conversation/${currentConversationRequestId}/message`, {
        method: 'POST',
        body: formData
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
            input.value = '';
            clearAllChatFiles();
            loadTeamConversation(currentConversationRequestId);
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
            const requestId = document.getElementById('detailsModalRequestId')?.value;
            if (requestId) {
                openTeamConversationModal(requestId);
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
        
        // Add keyboard shortcuts for formatting
        messageInput.addEventListener('keydown', function(e) {
            console.log('[AllRequestsAdmin] Keydown event:', {
                key: e.key,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey
            });
            
            // Ctrl+B or Cmd+B for bold
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                console.log('[AllRequestsAdmin] Keyboard shortcut: Bold (Ctrl+B)');
                applyChatFormat('bold');
                return false;
            }
            // Ctrl+I or Cmd+I for italic
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                console.log('[AllRequestsAdmin] Keyboard shortcut: Italic (Ctrl+I)');
                applyChatFormat('italic');
                return false;
            }
            // Ctrl+U or Cmd+U for underline
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                console.log('[AllRequestsAdmin] Keyboard shortcut: Underline (Ctrl+U)');
                applyChatFormat('underline');
                return false;
            }
        });
    } else {
        console.error('[AllRequestsAdmin] Message input element not found!');
    }
});

// ==========================================
// REVISION HISTORY FUNCTIONS (Admin View - Observer Only)
// ==========================================

async function loadRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    console.log('[Admin Revision History] Loading for request:', requestId);
    
    if (!historyContainer) {
        console.warn('[Admin Revision History] Container not found!');
        return;
    }
    
    try {
        const response = await fetch(`/api/revision-history/${requestId}`);
        console.log('[Admin Revision History] Response status:', response.status);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Admin Revision History] API returned non-JSON response');
            if (historySection) historySection.style.display = 'none';
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
            
            revisionsToShow.forEach((revision, index) => {
                console.log('[Admin Revision History] Rendering revision', index, ':', revision.type);
                const entry = createAdminRevisionEntry(revision, index, revisionsToShow.length);
                historyContainer.appendChild(entry);
            });
            
            console.log('[Admin Revision History] All revisions rendered');
        } else {
            console.log('[Admin Revision History] No revisions to display');
            
            // Reset to single column layout when no revisions - keep original size
            const modalContent = document.querySelector('#detailsModal .modal-content');
            const modalBody = document.querySelector('#detailsModal .admin-modal-body');
            const rightColumn = document.querySelector('#detailsModal .admin-right-column');
            
            if (modalContent && modalBody) {
                modalContent.style.maxWidth = '900px';
                modalBody.classList.remove('has-revisions');
            }
            
            if (historySection) {
                historySection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('[Admin Revision History] Error loading revision history:', error);
        
        // Reset to single column layout on error - keep original size
        const modalContent = document.querySelector('#detailsModal .modal-content');
        const modalBody = document.querySelector('#detailsModal .admin-modal-body');
        const rightColumn = document.querySelector('#detailsModal .admin-right-column');
        
        if (modalContent && modalBody) {
            modalContent.style.maxWidth = '900px';
            modalBody.classList.remove('has-revisions');
        }
        
        if (historySection) {
            historySection.style.display = 'none';
        }
    }
}

function createAdminRevisionEntry(revision, index, total) {
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
    
    const isLast = index === total - 1;
    
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

async function loadServiceRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
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
        const response = await fetch(`/api/service-revision-history/${requestId}`);
        console.log('[Service Revision History] Response status:', response.status);
        console.log('[Service Revision History] Response OK:', response.ok);
        
        const contentType = response.headers.get('content-type');
        console.log('[Service Revision History] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Service Revision History] ❌ API returned non-JSON response');
            if (historySection) historySection.style.display = 'none';
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
                
                // Render each revision entry
                revisionsToShow.forEach((revision, index) => {
                    console.log('[Service Revision History] Creating entry', index + 1, 'of', revisionsToShow.length);
                    console.log('[Service Revision History] Revision type:', revision.type);
                    const entry = createServiceRevisionEntry(revision, index, revisionsToShow.length);
                    historyContainer.appendChild(entry);
                });
                
                // Enable two-column layout for revision history
                const modalContent = document.querySelector('#detailsModal .modal-content');
                const modalBody = document.querySelector('#detailsModal .admin-modal-body');
                const rightColumn = document.querySelector('#detailsModal .admin-right-column');
                
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
                // No revisions to show, hide history section
                console.log('[Service Revision History] No revisions after filtering');
                if (historySection) historySection.style.display = 'none';
                const modalContent = document.querySelector('#detailsModal .modal-content');
                const modalBody = document.querySelector('#detailsModal .admin-modal-body');
                const rightColumn = document.querySelector('#detailsModal .admin-right-column');
                if (modalContent && modalBody) {
                    modalContent.style.maxWidth = '900px';
                    modalBody.classList.remove('has-revisions');
                }
                if (rightColumn) rightColumn.style.display = 'none';
            }
        } else {
            console.log('[Service Revision History] No revisions to display');
            if (historySection) historySection.style.display = 'none';
            const modalContent = document.querySelector('#detailsModal .modal-content');
            const modalBody = document.querySelector('#detailsModal .admin-modal-body');
            const rightColumn = document.querySelector('#detailsModal .admin-right-column');
            if (modalContent && modalBody) {
                modalContent.style.maxWidth = '900px';
                modalBody.classList.remove('has-revisions');
            }
            if (rightColumn) rightColumn.style.display = 'none';
        }
    } catch (error) {
        console.error('[Service Revision History] ❌ ERROR:', error);
        console.error('[Service Revision History] Error stack:', error.stack);
        if (historySection) historySection.style.display = 'none';
        const modalContent = document.querySelector('#detailsModal .modal-content');
        const modalBody = document.querySelector('#detailsModal .admin-modal-body');
        const rightColumn = document.querySelector('#detailsModal .admin-right-column');
        if (modalContent && modalBody) {
            modalContent.style.maxWidth = '900px';
            modalBody.classList.remove('has-revisions');
        }
        if (rightColumn) rightColumn.style.display = 'none';
    }
}

function createServiceRevisionEntry(revision, index, total) {
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
                         revision.type === 'deliverable_submitted' || 
                         revision.type === 'completed';
    const isRequestorAction = revision.respondedBy || revision.type === 'revision_requested';
    
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
