
console.log('🚀 Starting Services Admin script...');

// Global variable to store available units from database
let availableUnits = [];
// Global variable to store available request statuses from database
let availableStatuses = [];

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

// Organization and Office data arrays (shortened for brevity)
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
  const statusOptions = dbData.requestStatuses || ['pending', 'queued', 'in progress', 'approved', 'for revision', 'completed', 'rejected', 'archived'];
  const orgOptions = dbData.organizations || studentOrganizations;
  const officeOptions = dbData.offices || officesDepartments;
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
  let currentRequestType = 'Service Request';
  let originalValues = {};
  let allRequestsData = [];
  let chatFiles = [];
  
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
      const bottomStatuses = ['approved', 'completed', 'rejected', 'archived'];
      
      const [field, direction] = sortValue.split('-');
      const isAsc = direction === 'asc';
      
      data.sort((a, b) => {
        // Check if either request has a "completed" status
        const aIsBottom = bottomStatuses.includes(a.status?.toLowerCase());
        const bIsBottom = bottomStatuses.includes(b.status?.toLowerCase());
        
        // Always push completed statuses to the bottom
        if (aIsBottom && !bIsBottom) return 1;
        if (!aIsBottom && bIsBottom) return -1;
        
        // If both are in the same category (both bottom or both not), sort normally
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

  // Add conversation modal functionality
  function initializeConversationModal() {
    const openChatBtn = document.getElementById('openChatFromModal') || document.getElementById('openTeamChatBtn');
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
    
    // Initialize chat file features
    initializeChatFileFeatures();
    
    if (sendMessageBtn) {
      sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
      console.log('[Services] Message input found, attaching event listeners');
      
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Add keyboard shortcuts for formatting
      messageInput.addEventListener('keydown', function(e) {
        console.log('[Services] Keydown event:', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey
        });
        
        // Ctrl+B or Cmd+B for bold
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          console.log('[Services] Keyboard shortcut: Bold (Ctrl+B)');
          applyChatFormat('bold');
          return false;
        }
        // Ctrl+I or Cmd+I for italic
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          console.log('[Services] Keyboard shortcut: Italic (Ctrl+I)');
          applyChatFormat('italic');
          return false;
        }
        // Ctrl+U or Cmd+U for underline
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
          e.preventDefault();
          console.log('[Services] Keyboard shortcut: Underline (Ctrl+U)');
          applyChatFormat('underline');
          return false;
        }
      });
    } else {
      console.error('[Services] Message input element not found!');
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
    console.log('[Services] ========== OPENING CONVERSATION ==========');
    console.log('[Services] Request ID:', requestId);
    console.log('[Services] Current user role:', window.currentUserRole);
    
    const conversationModal = document.getElementById('conversationModal');
    const messagesContainer = document.getElementById('messagesContainer');
    
    console.log('[Services] Modal elements check:', {
      conversationModal: !!conversationModal,
      messagesContainer: !!messagesContainer
    });
    
    if (!conversationModal || !messagesContainer) {
      console.error('[Services] ERROR: Conversation modal elements not found!');
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
      console.log('[Services] Fetching conversation from:', `/api/conversation/${requestId}`);
      const response = await fetch(`/api/conversation/${requestId}`);
      console.log('[Services] Conversation fetch status:', response.status);
      const data = await response.json();
      console.log('[Services] Conversation data received:', data);
      console.log('[Services] Raw data structure:', JSON.stringify(Object.keys(data)));
      
      if (response.ok && data) {
        // Extract messages from response - check both data.conversation and data.messages
        const messages = data.conversation || data.messages || [];
        console.log('[Services] Extracted messages array:', messages);
        console.log('[Services] Displaying', messages.length, 'messages');
        displayMessages(messages);
        // Mark messages as read
        console.log('[Services] Marking messages as read');
        await fetch(`/api/conversation/${requestId}/mark-read`, { method: 'POST' });
      } else {
        console.error('[Services] Failed to load conversation:', data);
        throw new Error(data && data.error ? data.error : 'Failed to load conversation');
      }
    } catch (error) {
      console.error('[Services] Error loading conversation:', error);
      console.error('[Services] Error stack:', error.stack);
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

  // Chat file management functions
  function initializeChatFileFeatures() {
    console.log('[Services] Initializing chat file features...');
    const attachBtn = document.getElementById('chatAttachBtn');
    const fileInput = document.getElementById('chatFileInput');
    
    if (attachBtn && fileInput) {
      console.log('[Services] Attach button and file input found');
      attachBtn.addEventListener('click', () => {
        console.log('[Services] Attach button clicked');
        fileInput.click();
      });
      
      fileInput.addEventListener('change', handleChatFileSelect);
    } else {
      console.warn('[Services] Chat file elements not found:', { attachBtn: !!attachBtn, fileInput: !!fileInput });
    }

    const clearFilesBtn = document.getElementById('clearChatFiles');
    if (clearFilesBtn) {
      clearFilesBtn.addEventListener('click', clearAllChatFiles);
    }
    
    const chatFormatBtns = document.querySelectorAll('[data-chat-format]');
    chatFormatBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const format = this.getAttribute('data-chat-format');
        applyChatFormat(format);
      });
    });
  }

  function handleChatFileSelect(event) {
    console.log('[Services] File selection event triggered');
    const files = Array.from(event.target.files);
    console.log('[Services] Files selected:', files.length);
    
    files.forEach(file => {
      const exists = chatFiles.some(f => f.name === file.name && f.size === file.size);
      if (!exists) {
        chatFiles.push(file);
        console.log('[Services] Added file:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log('[Services] File already exists, skipping:', file.name);
      }
    });
    
    console.log('[Services] Total files in chatFiles array:', chatFiles.length);
    updateChatFilesPreview();
  }

  function updateChatFilesPreview() {
    console.log('[Services] Updating chat files preview...');
    const preview = document.getElementById('chatFilesPreview');
    const container = document.getElementById('chatFilesContainer');
    const filesCount = preview ? preview.querySelector('.files-count') : null;
    
    if (!preview || !container) {
      console.error('[Services] Preview elements not found:', { preview: !!preview, container: !!container });
      return;
    }
    
    if (chatFiles.length > 0) {
      preview.style.display = 'block';
      if (filesCount) {
        filesCount.textContent = `${chatFiles.length} file(s) attached`;
      }
      
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
    
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) {
      const dt = new DataTransfer();
      chatFiles.forEach(file => dt.items.add(file));
      fileInput.files = dt.files;
    }
  };

  function clearAllChatFiles() {
    console.log('[Services] Clearing all chat files');
    chatFiles = [];
    updateChatFilesPreview();
    
    const fileInput = document.getElementById('chatFileInput');
    if (fileInput) {
      fileInput.value = '';
      console.log('[Services] File input cleared');
    } else {
      console.warn('[Services] File input element not found');
    }
  }

  function applyChatFormat(format) {
    console.log('[Services] Apply format:', format);
    const textarea = document.getElementById('messageInput');
    if (!textarea) {
      console.error('[Services] Message input not found');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    console.log('[Services] Selection:', { start, end, selectedText });

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
    console.log('[Services] Format applied, new text length:', newText.length);
  }

  // Clear attachment function (deprecated but kept for compatibility)
  function clearAttachment() {
    clearAllChatFiles();
  }

  // Send message function
  async function sendMessage() {
    console.log('[Services] Send message triggered');
    
    // Get content from Quill editor if available (defined in services.ejs)
    let content = '';
    let plainText = '';
    
    if (window.messageQuill) {
      content = window.messageQuill.root.innerHTML;
      plainText = window.messageQuill.getText().trim();
    } else {
      const messageInput = document.getElementById('messageInput');
      content = messageInput ? messageInput.value.trim() : '';
      plainText = content;
    }
    
    console.log('[Services] Message content:', content || '(empty)');
    console.log('[Services] Files to send:', chatFiles.length);
    
    if (!plainText && chatFiles.length === 0) {
      console.warn('[Services] No content or files to send');
      showNotification('Please enter a message or attach files', 'error');
      return;
    }
    
    if (!currentRequestId) {
      console.error('[Services] No request ID available');
      showNotification('No request selected', 'error');
      return;
    }
    
    console.log('[Services] Sending message to request:', currentRequestId);
    try {
      const formData = new FormData();
      formData.append('content', content || '');
      formData.append('senderRole', 'admin');
      
      // Add files if any
      chatFiles.forEach((file, index) => {
        console.log(`[Services] Appending file ${index + 1}:`, file.name, 'as chatFiles field');
        formData.append('chatFiles', file);
      });

      console.log('[Services] Sending POST request to:', `/api/conversation/${currentRequestId}/message`);
      const response = await fetch(`/api/conversation/${currentRequestId}/message`, {
        method: 'POST',
        body: formData
      });
      
      console.log('[Services] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          console.error('[Services] Server error response:', errorText);
          if (response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to send messages.';
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[Services] Response data:', data);
      
      console.log('[Services] Message sent successfully');
      
      // Clear message input (Quill or textarea)
      if (window.messageQuill) {
        window.messageQuill.setText('');
      } else {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.value = '';
      }
      
      clearAllChatFiles();
      // Reload conversation to show new message
      openConversation(currentRequestId);
    } catch (error) {
      console.error('[Services] Error sending message:', error);
      console.error('[Services] Error stack:', error.stack);
      showNotification('Failed to send message: ' + error.message, 'error');
    }
  }
  
  // Reset form to original values
  function resetFormToOriginalValues() {
    const statusSelect = document.getElementById('adminStatusSelect');
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const deadlineInput = document.getElementById('adminDeadlineInput');
    
    if (statusSelect) statusSelect.value = originalValues.status || '';
    if (unitsSelect) unitsSelect.value = originalValues.units || '';
    if (deadlineInput) deadlineInput.value = originalValues.deadline || '';
    
    showNotification('Changes cancelled - form reset to original values', 'info');
  }
  
  // Show update confirmation modal
  function showUpdateConfirmation() {
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
    
    if (deadlineInput && currentRequestType === 'Service Request') {
      const newDeadlineValue = deadlineInput.value;
      const currentDeadlineFormatted = originalValues.deadline || '';
      
      if (newDeadlineValue !== currentDeadlineFormatted) {
        const formattedNew = newDeadlineValue ? 
          new Date(newDeadlineValue).toLocaleString() : 'Not set';
        const formattedOld = originalValues.deadlineDisplay || 'Not set';
        
        changes.push({
          field: 'Deadline',
          oldValue: formattedOld,
          newValue: formattedNew
        });
      }
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
    const confirmBtn = document.getElementById('confirmUpdateBtn');
    confirmBtn.classList.add('loading');
    confirmBtn.textContent = 'Updating...';
    
    try {
      const changes = getFormChanges();
      let success = true;
      let updatedData = {};
      
      for (const change of changes) {
        if (change.field === 'Status') {
          const statusSelect = document.getElementById('adminStatusSelect');
          success = await updateRequestStatus(currentRequestId, statusSelect.value, currentRequestType);
          if (success) updatedData.status = statusSelect.value;
        } else if (change.field === 'Assigned Unit') {
          const unitsSelect = document.getElementById('adminUnitsSelect');
          success = await updateRequestUnits(currentRequestId, unitsSelect.value, currentRequestType);
          if (success) updatedData.units = unitsSelect.value || 'Not yet assigned';
        } else if (change.field === 'Deadline') {
          const deadlineInput = document.getElementById('adminDeadlineInput');
          // Use local date (YYYY-MM-DD or datetime-local) as-is, no manual UTC+8 conversion
          let deadlineValue = deadlineInput.value;
          if (deadlineValue) {
            // If input type is date, convert to Date object for formatting
            const newDate = new Date(deadlineValue);
            success = await updateRequestDeadline(currentRequestId, deadlineValue);
            if (success) {
              updatedData.formattedDeadline = `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`;
            }
          } else {
            success = await updateRequestDeadline(currentRequestId, '');
          }
        }
        
        if (!success) break;
      }
      
      if (success) {
        updateConfirmationModal.classList.remove('show');
        showNotification('All changes applied successfully!', 'success');
        
        // Update the table row data attributes
        updateTableRowData(currentRequestId, updatedData);
        
        // Update original values
        updateOriginalValues();
        
        // Reopen the modal with updated data after a short delay
        setTimeout(() => {
          reopenModalAfterUpdate(currentRequestId);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error during update:', error);
      showNotification('Update failed: ' + error.message, 'error');
    } finally {
      confirmBtn.classList.remove('loading');
      confirmBtn.textContent = 'Confirm Update';
    }
  }
  
  // Update original values after successful update
  function updateOriginalValues() {
    const statusSelect = document.getElementById('adminStatusSelect');
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const deadlineInput = document.getElementById('adminDeadlineInput');
    
    originalValues.status = statusSelect ? statusSelect.value : '';
    originalValues.units = unitsSelect ? unitsSelect.value : '';
    originalValues.deadline = deadlineInput ? deadlineInput.value : '';
  }
  
  // Update functions for service requests
  async function updateRequestStatus(requestId, newStatus, requestType) {
    console.log('🔄 Updating status:', { requestId, newStatus, requestType });
    
    try {
      const endpoint = '/admin/service/update-status';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          requestId: requestId,
          status: newStatus
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update display elements in the modal
        const statusElement = document.getElementById('detailStatus');
        const currentStatusValue = document.getElementById('currentStatusValue');
        
        if (statusElement) statusElement.innerText = newStatus;
        if (currentStatusValue) currentStatusValue.innerText = newStatus;
        
        return true;
      } else {
        console.error('Status update failed:', result.message);
        showNotification('Failed to update status: ' + result.message, 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status: ' + error.message, 'error');
      return false;
    }
  }

  async function updateRequestUnits(requestId, newUnit, requestType) {
    console.log('🔄 Updating units:', { requestId, newUnit, requestType });
    
    try {
      const endpoint = '/admin/service/update-status';
      
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

  async function updateRequestDeadline(requestId, newDeadline) {
    console.log('🔄 Updating deadline:', { requestId, newDeadline });
    
    try {
      const response = await fetch('/admin/service/update-deadline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          requestId: requestId,
          deadline: newDeadline
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update display elements
        const deadlineElement = document.getElementById('detailDeadlineInfo');
        const currentDeadlineValue = document.getElementById('currentDeadlineValue');
        const deadlineInput = document.getElementById('adminDeadlineInput');
        const newDate = new Date(newDeadline);
        const formattedDate = `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`;
        if (deadlineElement) deadlineElement.innerText = formattedDate;
        if (currentDeadlineValue) currentDeadlineValue.innerText = newDate.toLocaleString();
        if (deadlineInput) {
          // Set input value as local datetime-local string
          const year = newDate.getFullYear();
          const month = String(newDate.getMonth() + 1).padStart(2, '0');
          const day = String(newDate.getDate()).padStart(2, '0');
          const hours = String(newDate.getHours()).padStart(2, '0');
          const minutes = String(newDate.getMinutes()).padStart(2, '0');
          deadlineInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        return true;
      } else {
        console.error('Deadline update failed:', result.message);
        showNotification('Failed to update deadline: ' + (result.message || 'Unknown error'), 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      showNotification('Failed to update deadline: ' + error.message, 'error');
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
    
    // Determine colors and icons based on type
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
    console.log('Populating modal with data:', rowData);
    
    // Store original values
    originalValues = {
      status: rowData.status,
      units: rowData.units,
      deadline: '',
      deadlineDisplay: rowData.formattedDeadline
    };
    
    // Helper function to safely set element text
    function setElementText(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || 'N/A';
      }
    }
    
    // Populate general information
    setElementText('detailTitle', rowData.title);
    setElementText('detailSpecificType', rowData.specifictype || 'Not specified');
    setElementText('detailStudent', rowData.student);
    setElementText('detailType', 'Service Request');
    setElementText('detailOrganization', rowData.organization);
    setElementText('detailDatetime', rowData.datetime);
    setElementText('detailDeadlineInfo', rowData.formattedDeadline);
    // Set description with HTML rendering
    const descElement = document.getElementById('detailDescription');
    if (descElement) {
      descElement.innerHTML = rowData.description || 'No description provided';
    }
    
    // Populate admin form
    populateAdminForm(rowData);
    
    // Handle file preview
    populateFilePreview(rowData);

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
    
    // Load revision history (pass status to determine visibility)
    loadRevisionHistory(rowData.id, rowData.status);
  }
  
  // Populate admin form
  function populateAdminForm(rowData) {
    // Populate status options for service requests
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
      
      statusSelect.innerHTML = statusOptions.map(option => 
        `<option value="${option.value}" ${option.value === rowData.status ? 'selected' : ''}>${option.label}</option>`
      ).join('');
      
      currentStatusValue.textContent = rowData.status;
    }
    
    // Populate units
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const currentUnitsValue = document.getElementById('currentUnitsValue');

    if (unitsSelect && currentUnitsValue) {
      // Ensure units are loaded from database (consistent with approvals.js)
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
      
      // Define recommendation mapping for service requests
      const recommendationMapping = {
        'Creation of New Graphics/Pubmat': ['Graphics Unit'],
        'Creation of New Logo/Branding Element': ['Graphics Unit'],
        'Event Photo & Video Coverage': ['Multimedia Unit'],
        'Photo/Video Editing Service': ['Multimedia Unit'],
        'Magazine Content Creation': ['Public Relations Unit'],
        'Social Media Content Sharing/Posting': ['Social Media Unit']
      };

      // Get recommended units for this request type
      const specificType = rowData.specifictype || rowData.specificRequestType || '';
      const recommendedUnits = recommendationMapping[specificType.trim()] || [];

      console.log('Service request type:', specificType, 'Recommended units:', recommendedUnits);

      if (unitsSelect) {
        // Clear existing options and rebuild with recommendations from database
        let optionsHtml = '<option value="">Not yet assigned</option>';
        
        // Add units from database
        availableUnits.forEach(unit => {
          const isRecommended = recommendedUnits.includes(unit);
          optionsHtml += `<option value="${unit}" ${isRecommended ? 'class="recommended-unit"' : ''}>${isRecommended ? '★ ' : ''}${unit}</option>`;
        });
        
        unitsSelect.innerHTML = optionsHtml;
        unitsSelect.value = rowData.units === 'Not yet assigned' ? '' : rowData.units;
      }

      if (currentUnitsValue) {
        currentUnitsValue.textContent = rowData.units || 'Not yet assigned';
      }
    }
    
    // Populate deadline for service requests
    const deadlineInput = document.getElementById('adminDeadlineInput');
    const currentDeadlineValue = document.getElementById('currentDeadlineValue');
    
    if (deadlineInput && currentDeadlineValue) {
      const currentDeadline = rowData.formattedDeadline;
      currentDeadlineValue.textContent = currentDeadline || 'Not set';
      
      if (currentDeadline && currentDeadline !== 'N/A') {
        try {
          const parts = currentDeadline.split('/');
          if (parts.length === 3) {
            const date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00`);
            if (!isNaN(date.getTime())) {
              const tzOffset = date.getTimezoneOffset() * 60000;
              const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0,16);
              deadlineInput.value = localISO;
              originalValues.deadline = localISO;
            }
          }
        } catch (error) {
          console.error('Error setting deadline:', error);
        }
      }
    }
  }
  
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
  // Initialize row click handlers
  function initializeRowClickHandlers() {
    const rows = document.querySelectorAll('.request-row');
    console.log(`🖱️ Setting up click handlers for ${rows.length} rows`);
    
    rows.forEach((row, index) => {
      row.style.cursor = 'pointer';
      
      row.addEventListener('click', function(e) {
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
          units: row.dataset.units,
          datetime: row.dataset.datetime,
          description: row.dataset.description,
          specifictype: row.dataset.specifictype,
          file: row.dataset.file,
          files: row.dataset.files,
          formattedDeadline: row.dataset.formattedDeadline,
          allowAdditionalUpload: row.dataset.allowAdditionalUpload,
          student: row.dataset.student
        };

        console.log('Row clicked with data:', rowData);
        console.log('🔍 Debug - row.dataset.allowAdditionalUpload:', row.dataset.allowAdditionalUpload);
        console.log('🔍 Debug - HTML attribute:', row.getAttribute('data-allow-additional-upload'));
        console.log('🔍 Debug - Server debug info:', row.getAttribute('data-debug-allow'));

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
  
  // Initialize dropdown
  window.toggleDropdown = function() {
    const menu = document.getElementById("dropdownMenu");
    if (menu) {
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
  };
  
  document.addEventListener("click", function(event) {
    const toggle = document.querySelector(".dropdown-toggle");
    const menu = document.getElementById("dropdownMenu");
    if (toggle && menu && !toggle.contains(event.target)) {
      menu.style.display = "none";
    }
  });

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
        units: updatedRow.dataset.units,
        datetime: updatedRow.dataset.datetime,
        description: updatedRow.dataset.description,
        file: updatedRow.dataset.file,
        files: updatedRow.dataset.files,
        formattedDeadline: updatedRow.dataset.formattedDeadline,
        allowAdditionalUpload: updatedRow.dataset.allowAdditionalUpload,
        student: updatedRow.dataset.student
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
      row.dataset.formattedDeadline = updatedData.formattedDeadline;
      
      const cells = row.querySelectorAll('td');
      if (cells[7]) {
        const deadlineBadge = cells[7].querySelector('.deadline-badge');
        if (deadlineBadge) {
          deadlineBadge.textContent = updatedData.formattedDeadline;
        }
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
    }
  }
  
  // Function to mark request as viewed
  async function markRequestAsViewed(requestId, requestType) {
    try {
      const endpoint = '/api/admin/service/mark-viewed';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: requestId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`Service request ${requestId} marked as viewed by admin`);
        return true;
      } else {
        console.error('Failed to mark service request as viewed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking service request as viewed:', error);
      return false;
    }
  }

  // Function to show additional file toggle for "For Revision" requests
  function showAdditionalFileToggleForRevision(status) {
    const toggleSection = document.getElementById('additionalFileToggleSection');
    const toggleCheckbox = document.getElementById('toggleAdditionalFileUploadBtn');

    if (!toggleSection || !toggleCheckbox) return;

    if (status && status.toLowerCase() === 'for revision') {
      toggleSection.style.display = 'block';
      toggleCheckbox.addEventListener('change', handleAdditionalFileToggle);
    } else {
      toggleSection.style.display = 'none';
      toggleCheckbox.removeEventListener('change', handleAdditionalFileToggle);
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
        toggleCheckbox.checked = !toggleCheckbox.checked;
      }
    } catch (error) {
      console.error('Error toggling additional file upload:', error);
      showNotification('Failed to update additional file upload permission: ' + error.message, 'error');
      // Revert the checkbox state
      toggleCheckbox.checked = !toggleCheckbox.checked;
    }
  }

  // ==========================================
  // REVISION HISTORY FUNCTIONS (Admin Services)
  // ==========================================
  
  async function loadRevisionHistory(requestId, currentStatus = '') {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    console.log('[Admin Services - Revision History] Loading for request:', requestId, 'Status:', currentStatus);
    
    if (!historyContainer) {
      console.warn('[Admin Services - Revision History] Container not found!');
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
      console.log('[Admin Services - Revision History] Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('[Admin Services - Revision History] API returned non-JSON response');
        showEmptyState();
        return;
      }
      
      const result = await response.json();
      console.log('[Admin Services - Revision History] API Response:', result);
      console.log('[Admin Services - Revision History] Revisions count:', result.revisions?.length || 0);
      
      if (result.success && result.revisions && result.revisions.length > 0) {
        console.log('[Admin Services - Revision History] Showing section with', result.revisions.length, 'revisions');
        
        // Enable two-column layout when revisions exist
        const modalContent = document.querySelector('#detailsModal .modal-content');
        const modalBody = document.querySelector('#detailsModal .admin-modal-body');
        
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
            console.log('[Admin Services - Revision History] Rendering revision', index, ':', revision.type);
            const entry = createServiceRevisionEntry(revision, index, revisionsToShow.length);
            historyContainer.appendChild(entry);
          });
          
          console.log('[Admin Services - Revision History] All revisions rendered');
        } else {
          showEmptyState();
        }
      } else {
        console.log('[Admin Services - Revision History] No revisions to display - showing empty state');
        
        // Reset to single column layout when no revisions
        const modalContent = document.querySelector('#detailsModal .modal-content');
        const modalBody = document.querySelector('#detailsModal .admin-modal-body');
        
        if (modalContent && modalBody) {
          modalContent.style.maxWidth = '900px';
          modalBody.classList.remove('has-revisions');
        }
        
        showEmptyState();
      }
    } catch (error) {
      console.error('[Admin Services - Revision History] Error loading revision history:', error);
      showEmptyState();
    }
  }
  
  function createServiceRevisionEntry(revision, index, total) {
    console.log('🔍 [Admin Services] Creating revision entry:', {
      index,
      total,
      hasRequestedBy: !!revision.requestedBy,
      hasRespondedBy: !!revision.respondedBy,
      type: revision.type
    });
    
    const entry = document.createElement('div');
    entry.className = `revision-entry ${index === total - 1 ? 'latest' : ''}`;
    
    const isLatest = index === total - 1;
    const entryNumber = total - index;
    
    // Format date
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Get type label and icon
    const getTypeInfo = (type) => {
      switch (type) {
        case 'revision_request':
          return { label: 'Revision Requested', icon: '🔄', color: '#f59e0b' };
        case 'user_resubmit':
          return { label: 'Resubmitted', icon: '📤', color: '#10b981' };
        case 'admin_update':
          return { label: 'Admin Update', icon: '✏️', color: '#6366f1' };
        default:
          return { label: type || 'Update', icon: '📋', color: '#6b7280' };
      }
    };
    
    const typeInfo = getTypeInfo(revision.type);
    
    entry.innerHTML = `
      <div class="revision-header">
        <span class="revision-number" style="background: ${typeInfo.color};">${typeInfo.icon} #${entryNumber}</span>
        <span class="revision-type">${typeInfo.label}</span>
        ${isLatest ? '<span class="revision-latest-badge">Latest</span>' : ''}
      </div>
      <div class="revision-meta">
        <span class="revision-date">${formatDate(revision.timestamp || revision.createdAt)}</span>
        ${revision.requestedBy ? `<span class="revision-by">By: ${revision.requestedBy.name || revision.requestedBy}</span>` : ''}
      </div>
      ${revision.reason || revision.message ? `
        <div class="revision-reason">
          <strong>Reason:</strong> ${revision.reason || revision.message}
        </div>
      ` : ''}
      ${revision.changes && revision.changes.length > 0 ? `
        <div class="revision-changes">
          <strong>Changes:</strong>
          <ul>
            ${revision.changes.map(change => `<li>${change.field}: ${change.oldValue} → ${change.newValue}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
    
    return entry;
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

console.log('✅ Services Admin script loaded successfully');

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

  // Update displayMessages function to handle attachments
  // Helper function to escape HTML
  window.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to format text with markdown-style syntax
  window.formatText = function(text) {
    if (!text) return '';
    
    // Escape HTML first
    let formatted = window.escapeHtml(text);
    
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

  // Create message element function
  function createMessageElement(msg) {
    console.log('[Services] Creating message element:', msg);
    const div = document.createElement('div');
    
    // Determine if this is the current user's message
    const isOwnMessage = window.currentUserRole && msg.senderRole === window.currentUserRole;
    console.log('[Services] Message alignment:', { isOwnMessage, currentUserRole: window.currentUserRole, senderRole: msg.senderRole });
    
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
      console.log('[Services] Message has attachments:', msg.attachments.length);
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
    if (msg.readBy && msg.readBy.length > 0) {
      const readByList = msg.readBy.map(reader => {
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
            <span>Read by ${window.escapeHtml(reader.userName)} at ${readTime}</span>
          </div>
        `;
      }).join('');
      readReceiptsHTML = `<div class="read-receipts" style="margin-top: 0.5rem; font-size: 0.7rem; color: #6b7280;">${readByList}</div>`;
    }
    
    div.innerHTML = `
      <div class="unit-message-bubble ${roleClass}" style="background: ${roleColor};">
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

  // Display messages function
  function displayMessages(messages) {
    console.log('[Services] Displaying messages:', messages);
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.error('[Services] Messages container not found');
      return;
    }
    
    // Clear container
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
      console.log('[Services] No messages to display');
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
    
    console.log('[Services] Rendering', messages.length, 'messages');
    messages.forEach((msg, index) => {
      console.log(`[Services] Creating message ${index + 1}/${messages.length}:`, {
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        content: msg.content ? msg.content.substring(0, 50) : 'empty',
        hasAttachments: !!(msg.attachments && msg.attachments.length > 0)
      });
      const messageElement = createMessageElement(msg);
      messagesContainer.appendChild(messageElement);
      console.log(`[Services] Message ${index + 1} appended to container`);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('[Services] Messages rendered and scrolled to bottom');
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
  console.log('Opening admin service modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // Trigger the existing modal opening
    targetRow.click();
  } else {
    console.warn('Service request not found on current admin page:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Global function to open conversation modal by ID (for message notifications)
window.openConversationModal = function(requestId, requestType) {
  console.log('Opening admin service conversation modal for:', requestId, requestType);
  
  // Find the row with the matching request ID
  const targetRow = document.querySelector(`.request-row[data-id="${requestId}"]`);
  
  if (targetRow) {
    // First open the details modal
    targetRow.click();
    
    // Then trigger the conversation modal after a short delay
    setTimeout(() => {
      const chatButton = document.getElementById('openChatFromModal');
      if (chatButton) {
        console.log('Found service chat button, clicking it');
        chatButton.click();
      } else {
        console.warn('Chat button #openChatFromModal not found in service modal');
      }
    }, 300);
  } else {
    console.warn('Service request not found for conversation:', requestId);
    window.location.href = window.location.pathname + `?highlight=${requestId}`;
  }
};

// Enhanced auto-opening logic for modal and conversation parameters
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle modal opening from notifications
  if (urlParams.has('modal') && urlParams.has('requestId') && urlParams.get('type') === 'service') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening service modal for notification:', requestId);
    
    setTimeout(() => {
      window.openRequestModal(requestId, 'service');
    }, 500);
  }
  
  // Handle conversation opening from message notifications
  if (urlParams.has('conversation') && urlParams.has('requestId') && urlParams.get('type') === 'service') {
    const requestId = urlParams.get('requestId');
    console.log('Auto-opening service conversation for message notification:', requestId);
    
    setTimeout(() => {
      window.openConversationModal(requestId, 'service');
    }, 500);
  }
});
