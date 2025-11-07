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
    ['pending', 'approved', 'for revision', 'completed', 'rejected', 'archived'],
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

  const modalBody = detailModal.querySelector('.details-modal-body');
  modalBody.scrollTop = 0;

  detailModal.style.display = 'flex';
}

function populateModalData(rowData) {
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
    return ['Pending', 'For Revision', ...baseStatuses];
  } else {
    return ['Pending', 'For Revision', 'completed', ...baseStatuses];
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
