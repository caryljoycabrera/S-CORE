
console.log('🚀 Starting Services Admin script...');

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
  
  // Initialize enhanced multi-select dropdowns
  const statusFilter = new EnhancedMultiSelect('statusFilter', 
    ['pending', 'approved', 'for revision', 'completed', 'rejected', 'archived'], 
    'Select Status', false);
    
  const studentOrgFilter = new EnhancedMultiSelect('studentOrgFilter', 
    studentOrganizations, 
    'Select Student Organizations', true);
    
  const officeDeptFilter = new EnhancedMultiSelect('officeDeptFilter', 
    officesDepartments, 
    'Select Offices/Departments', true);

  // Global variables
  let detailModal = document.getElementById("detailsModal");
  let updateConfirmationModal = document.getElementById("updateConfirmationModal");
  let currentRequestId = null;
  let currentRequestType = 'Service Request';
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
      title: row.dataset.title.toLowerCase(),
      status: row.dataset.status.toLowerCase(),
      organization: row.dataset.organization.toLowerCase(),
      units: row.dataset.units.toLowerCase(),
      student: row.dataset.student.toLowerCase(),
      datetime: row.dataset.datetime,
      date: row.dataset.date,
      description: row.dataset.description.toLowerCase()
    }));

    // Get filter elements
    const requestIdFilter = document.getElementById('requestIdFilter');
    const studentFilter = document.getElementById('studentFilter');
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
    document.getElementById('statusFilter').addEventListener('selectionChange', applyFilters);
    document.getElementById('studentOrgFilter').addEventListener('selectionChange', applyFilters);
    document.getElementById('officeDeptFilter').addEventListener('selectionChange', applyFilters);

    if (dateFromFilter) {
      dateFromFilter.addEventListener('change', applyFilters);
    }

    if (dateToFilter) {
      dateToFilter.addEventListener('change', applyFilters);
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Apply filters function
    function applyFilters() {
      console.log('🔍 Applying filters...');
      
      const filters = {
        requestId: requestIdFilter ? requestIdFilter.value.toLowerCase().trim() : '',
        status: statusFilter.getSelectedValues(),
        student: studentFilter ? studentFilter.value.toLowerCase().trim() : '',
        studentOrg: studentOrgFilter.getSelectedValues(),
        officeDept: officeDeptFilter.getSelectedValues(),
        dateFrom: dateFromFilter ? dateFromFilter.value : '',
        dateTo: dateToFilter ? dateToFilter.value : ''
      };

      console.log('Applied filters:', filters);

      let visibleCount = 0;

      allRequestsData.forEach(request => {
        let shouldShow = true;

        // Request ID filter
        if (filters.requestId && !request.requestId.toLowerCase().includes(filters.requestId)) {
          shouldShow = false;
        }

        // Status filter (multi-select)
        if (filters.status.length > 0 && !filters.status.includes('all')) {
          if (!filters.status.includes(request.status)) {
            shouldShow = false;
          }
        }

        // Student filter
        if (filters.student && !request.student.includes(filters.student)) {
          shouldShow = false;
        }

        // Organization filter (multi-select)
        let organizationMatch = true;
        const hasStudentOrgSelection = filters.studentOrg.length > 0 && !filters.studentOrg.includes('all');
        const hasOfficeDeptSelection = filters.officeDept.length > 0 && !filters.officeDept.includes('all');
        
        if (hasStudentOrgSelection || hasOfficeDeptSelection) {
          organizationMatch = false;
          
          // Check student organizations
          if (hasStudentOrgSelection) {
            organizationMatch = filters.studentOrg.some(org => 
              request.organization.includes(org.toLowerCase())
            );
          }
          
          // Check office/departments (OR logic with student orgs)
          if (!organizationMatch && hasOfficeDeptSelection) {
            organizationMatch = filters.officeDept.some(dept => 
              request.organization.includes(dept.toLowerCase())
            );
          }
        }

        if (!organizationMatch) {
          shouldShow = false;
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          const requestDate = request.date;
          
          if (filters.dateFrom && requestDate < filters.dateFrom) {
            shouldShow = false;
          }
          
          if (filters.dateTo && requestDate > filters.dateTo) {
            shouldShow = false;
          }
        }

        // Show/hide row
        if (shouldShow) {
          request.element.style.display = '';
          visibleCount++;
        } else {
          request.element.style.display = 'none';
        }
      });

      // Update results count
      updateResultsCount(visibleCount);
    }

    // Clear all filters
    function clearAllFilters() {
      console.log('🧹 Clearing all filters...');
      
      // Clear text inputs
      if (requestIdFilter) requestIdFilter.value = '';
      if (studentFilter) studentFilter.value = '';
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';
      
      // Reset enhanced dropdowns
      statusFilter.reset();
      studentOrgFilter.reset();
      officeDeptFilter.reset();

      // Show all rows
      allRequestsData.forEach(request => {
        request.element.style.display = '';
      });

      // Update results count
      updateResultsCount(allRequestsData.length);
      
      showNotification('All filters cleared', 'info');
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

    // Initial results count
    updateResultsCount(allRequestsData.length);
    
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
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
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
      const data = await response.json();
      
      if (response.ok && data) {
        // API returns the conversation document directly (with .messages array)
        displayMessages(data.messages || []);
        // Mark messages as read
        await fetch(`/api/conversation/${requestId}/mark-read`, { method: 'POST' });
      } else {
        throw new Error(data && data.error ? data.error : 'Failed to load conversation');
      }
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
    const content = messageInput.value.trim();
    
    if (!content && !uploadedFile) {
      showNotification('Please enter a message or select a file', 'error');
      return;
    }
    
    if (!currentRequestId) {
      showNotification('No request selected', 'error');
      return;
    }
    
    try {
      let response;
      
      if (uploadedFile) {
        // Send with file attachment using FormData
        const formData = new FormData();
        formData.append('content', content || ''); // Always include content field
        formData.append('file', uploadedFile);
        
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
      
      const data = await response.json();
      
      if (response.ok) {
        messageInput.value = '';
        clearAttachment();
        // Reload conversation to show new message
        openConversation(currentRequestId);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
          success = await updateRequestDeadline(currentRequestId, deadlineInput.value);
          if (success) {
            const newDate = new Date(deadlineInput.value);
            updatedData.formattedDeadline = `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`;
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
        
        if (deadlineElement && currentDeadlineValue) {
          const newDate = new Date(newDeadline);
          const formattedDate = `${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`;
          deadlineElement.innerText = formattedDate;
          currentDeadlineValue.innerText = newDate.toLocaleString();
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
    setElementText('detailDescription', rowData.description || 'No description provided');
    
    // Populate admin form
    populateAdminForm(rowData);
    
    // Handle file preview
    populateFilePreview(rowData);

    // Show/hide additional file upload toggle based on status
    const additionalFileToggleSection = document.getElementById('additionalFileToggleSection');
    if (additionalFileToggleSection) {
      if (rowData.status && rowData.status.toLowerCase() === 'for revision') {
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
    // Populate status options for service requests
    const statusSelect = document.getElementById('adminStatusSelect');
    const currentStatusValue = document.getElementById('currentStatusValue');
    
    if (statusSelect && currentStatusValue) {
      const statusOptions = [
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'For Revision', label: 'For Revision' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'Archived', label: 'Archived' }
      ];
      
      statusSelect.innerHTML = statusOptions.map(option => 
        `<option value="${option.value}" ${option.value === rowData.status ? 'selected' : ''}>${option.label}</option>`
      ).join('');
      
      currentStatusValue.textContent = rowData.status;
    }
    
    // Populate units
    const unitsSelect = document.getElementById('adminUnitsSelect');
    const currentUnitsValue = document.getElementById('currentUnitsValue');

    if (unitsSelect && currentUnitsValue) {
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
        // Clear existing options and rebuild with recommendations
        unitsSelect.innerHTML = `
          <option value="">Not yet assigned</option>
          <option value="Social Media Unit" ${recommendedUnits.includes('Social Media Unit') ? 'class="recommended-unit"' : ''}>${recommendedUnits.includes('Social Media Unit') ? '★ ' : ''}Social Media Unit</option>
          <option value="Graphics Unit" ${recommendedUnits.includes('Graphics Unit') ? 'class="recommended-unit"' : ''}>${recommendedUnits.includes('Graphics Unit') ? '★ ' : ''}Graphics Unit</option>
          <option value="Multimedia Unit" ${recommendedUnits.includes('Multimedia Unit') ? 'class="recommended-unit"' : ''}>${recommendedUnits.includes('Multimedia Unit') ? '★ ' : ''}Multimedia Unit</option>
          <option value="Public Relations Unit" ${recommendedUnits.includes('Public Relations Unit') ? 'class="recommended-unit"' : ''}>${recommendedUnits.includes('Public Relations Unit') ? '★ ' : ''}Public Relations Unit</option>
        `;

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
        statusBadge.className = `status-badge ${updatedData.status.toLowerCase().replace(' ', '-')}`;
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
  function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #64748b;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        </div>
      `;
      return;
    }
    
    messagesContainer.innerHTML = messages.map(message => {
      const isUser = message.senderRole === 'user';
      const senderName = message.senderId ? `${message.senderId.fName} ${message.senderId.lName}` : 'Unknown';
      
      // Create user avatar (profile picture or default icon)
      const userAvatar = `
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 0.75rem; overflow: hidden; border: 2px solid ${isUser ? '#d1d5db' : 'var(--primary-green)'};">
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
      
      let attachmentHtml = '';
      if (message.file_path) {
        const fileName = message.original_filename || 'File';
        const isImage = message.file_type && message.file_type.startsWith('image/');
        
        if (isImage) {
          attachmentHtml = `
            <div style="margin-top: 0.5rem;">
              <img src="${message.file_path}" 
                   style="max-width: 200px; max-height: 150px; border-radius: 0.375rem; cursor: pointer; border: 1px solid #e5e7eb;" 
                   onclick="openImageModal('${message.file_path}')"
                   alt="${fileName}">
            </div>
          `;
        } else {
          attachmentHtml = `
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
      
      return `
        <div class="message ${isUser ? 'user-message' : 'admin-message'}">
          <div class="message-content">
            <div style="display: flex; align-items: flex-start;">
              ${userAvatar}
              <div style="flex: 1; min-width: 0; overflow-wrap: break-word;">
                <div class="message-header">
                  <strong>${senderName}</strong>
                  <span class="message-time">${new Date(message.timestamp || message.created_at).toLocaleString()}</span>
                </div>
                <div class="message-text" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; white-space: pre-wrap;">${message.content}</div>
                <div class="message-attachment">${attachmentHtml}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
