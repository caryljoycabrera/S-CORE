/* ===========================================
   PROFILE ADMIN PAGE JAVASCRIPT
   ===========================================
   This JavaScript file contains all client-side functionality for the profile admin page.
   Connected to: views/Admin/profileadmin.ejs
   Last updated: 2025-11-04
   =========================================== */

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

document.addEventListener("click", function (event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (!toggle.contains(event.target)) {
    headerDropdown.close();
  }
});

document.getElementById('openUpdateProfile').onclick = () => openModal('updateProfileModal');
document.getElementById('openChangePassword').onclick = () => openModal('passwordModal');
document.getElementById('openPictureModal').onclick = () => openModal('pictureModal');

// Enhanced toggle function
function toggleCustomOrg() {
  const container = document.getElementById('customOrgContainer');
  const button = document.getElementById('toggleCustomOrg');
  const section = document.getElementById('customOrgSection');
  const input = document.getElementById('otherOrganization');

  const isVisible = container.style.display !== 'none';

  container.style.display = isVisible ? 'none' : 'block';
  button.classList.toggle('expanded', !isVisible);
  section.classList.toggle('expanded', !isVisible);

  if (!isVisible) {
    setTimeout(() => input.focus(), 100);
  } else {
    input.value = '';
    hideFeedback();
  }
}

// Enhanced add organization function
function addCustomOrganization() {
  const input = document.getElementById('otherOrganization');
  const orgName = input.value.trim();
  const select = $('#studentOrganization');

  if (!orgName) {
    showFeedback('Please enter an organization name.', 'error');
    input.focus();
    return;
  }

  if (orgName.length < 3) {
    showFeedback('Organization name must be at least 3 characters long.', 'error');
    input.focus();
    return;
  }

  // Check if organization already exists
  const existingOptions = Array.from(select[0].options).map(option => option.value.toLowerCase());
  if (existingOptions.includes(orgName.toLowerCase())) {
    showFeedback('This organization is already in your list.', 'warning');
    input.focus();
    return;
  }

  // Add new option
  const newOption = new Option(orgName, orgName, true, true);
  select.append(newOption);

  // Update selection
  const selected = select.val() || [];
  if (!selected.includes(orgName)) {
    selected.push(orgName);
    select.val(selected).trigger('change');
  }

  // Clear input and show success
  input.value = '';
  showFeedback(`"${orgName}" has been added successfully!`, 'success');
  updateOrganizationCounter();

  // Auto-hide feedback after 3 seconds
  setTimeout(hideFeedback, 3000);
}

// Feedback system
function showFeedback(message, type = 'success') {
  const feedback = document.getElementById('orgAddedFeedback');
  feedback.textContent = message;
  feedback.className = `org-added-feedback ${type}`;
  feedback.classList.add('show');
}

function hideFeedback() {
  const feedback = document.getElementById('orgAddedFeedback');
  feedback.classList.remove('show');
}

// Organization counter
function updateOrganizationCounter() {
  const select = $('#studentOrganization');
  const counter = document.getElementById('orgCounter');
  const selectedCount = select.val()?.length || 0;

  if (selectedCount === 0) {
    counter.textContent = 'No organizations selected';
    counter.classList.remove('has-selections');
  } else if (selectedCount === 1) {
    counter.textContent = '1 organization selected';
    counter.classList.add('has-selections');
  } else {
    counter.textContent = `${selectedCount} organizations selected`;
    counter.classList.add('has-selections');
  }
}

// Custom organization removal handler
function setupOrganizationClickHandlers() {
  // Remove existing handlers to prevent duplicates
  $(document).off('click', '.select2-selection__choice');

  // Add click handler for organization removal
  $(document).on('click', '.select2-selection__choice', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const $choice = $(this);
    const value = $choice.attr('title');
    const select = $('#studentOrganization');

    if (value) {
      // Get current selections
      let currentValues = select.val() || [];

      // Remove the clicked value
      currentValues = currentValues.filter(v => v !== value);

      // Update the select
      select.val(currentValues).trigger('change');

      // Update counter
      updateOrganizationCounter();

      // Show feedback
      showFeedback(`"${value}" has been removed.`, 'warning');
      setTimeout(hideFeedback, 2000);
    }
  });
}

// Office selection click handlers (similar to organization handlers)
function setupOfficeClickHandlers() {
  // Remove existing handlers to prevent duplicates
  $(document).off('click', '#officeSelect + .select2-container .select2-selection__choice');

  // Add click handler for office removal
  $(document).on('click', '#officeSelect + .select2-container .select2-selection__choice', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const $choice = $(this);
    const value = $choice.attr('title');
    const select = $('#officeSelect');

    if (value) {
      // Get current selections
      let currentValues = select.val() || [];

      // Remove the clicked value
      currentValues = currentValues.filter(v => v !== value);

      // Update the select
      select.val(currentValues).trigger('change');

      console.log('Removed office:', value);
    }
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = 'flex';

  // Student logic with enhanced functionality
  if (id === 'updateProfileModal' && '<%= user.userType %>' === 'student') {
    console.log('Initializing student organization select for student user');
    const select = $('#studentOrganization');
    if (!select.hasClass('select2-hidden-accessible')) {
      console.log('Select2 not yet initialized, initializing now...');
      select.select2({
        placeholder: "Search and select organizations...",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#updateProfileModal'),
        closeOnSelect: false,
        templateResult: function(data) {
          if (!data.id) return data.text;
          return $(`<div style="padding: 4px 0;">${data.text}</div>`);
        }
      });

      // Initialize with organization options - ADD YOUR ORGANIZATION LIST HERE
      const organizationOptions = [
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

      const currentOrgs = `<%= user.studentOrganization || '' %>`
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      // Add predefined options
      organizationOptions.forEach(org => {
        const exists = currentOrgs.includes(org);
        if (select.find(`option[value="${org}"]`).length === 0) {
          const option = new Option(org, org, exists, exists);
          select.append(option);
        }
      });

      // Add custom organizations
      currentOrgs.forEach(org => {
        if (!organizationOptions.includes(org)) {
          if (select.find(`option[value="${org}"]`).length === 0) {
            const option = new Option(org, org, true, true);
            select.append(option);
          }
        }
      });

      select.trigger('change');
      updateOrganizationCounter();

      // Listen for selection changes
      select.on('change', function() {
        updateOrganizationCounter();
        // Re-setup click handlers after any change
        setTimeout(setupOrganizationClickHandlers, 100);
      });

      // Initial setup of click handlers
      setTimeout(setupOrganizationClickHandlers, 200);
    }

    // Set up toggle functionality
    document.getElementById('toggleCustomOrg').onclick = toggleCustomOrg;

    // Set up add organization button
    document.getElementById('addOrganizationButton').onclick = addCustomOrganization;

    // Set up Enter key functionality
    document.getElementById('otherOrganization').onkeypress = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomOrganization();
      }
    };
  }

  // NON-STUDENT LOGIC - Fixed version for multiple selection
  if (id === 'updateProfileModal' && '<%= user.userType %>' !== 'student') {
    const select = $('#officeSelect');

    // Only initialize if not already initialized
    if (!select.hasClass('select2-hidden-accessible')) {
      console.log('Initializing office select for non-student admin user');

      // Office options array - ADD YOUR OFFICE LIST HERE
      const officeOptions = [
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

      const currentAffiliations = `<%= Array.isArray(user.affiliation) ? user.affiliation.join(',') : (user.affiliation || '') %>`
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      console.log('Current affiliations:', currentAffiliations);

      // Clear existing options
      select.empty();

      // Add all office options
      officeOptions.forEach(office => {
        const isSelected = currentAffiliations.includes(office);
        const option = new Option(office, office, isSelected, isSelected);
        select.append(option);
      });

      // Initialize Select2 for MULTIPLE selection
      select.select2({
        placeholder: "Search or select office(s)/department(s)",
        allowClear: true,
        width: '100%',
        dropdownParent: $('#updateProfileModal'),
        closeOnSelect: false  // Allow multiple selections
      });

      // Trigger change to show current selections
      select.trigger('change');

      console.log('Office select initialized with values:', select.val());

      // Set up change handler and click handlers
      select.on('change', function() {
        console.log('Office selection changed:', $(this).val());
        setTimeout(setupOfficeClickHandlers, 100);
      });

      // Initial setup of click handlers
      setTimeout(setupOfficeClickHandlers, 200);
    }
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

window.onclick = function (e) {
  ['updateProfileModal', 'passwordModal', 'pictureModal'].forEach(id => {
    if (e.target.id === id) closeModal(id);
  });
};

document.getElementById('updateProfileForm').onsubmit = async function (e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = {};

  // Handle regular form fields
  formData.forEach((value, key) => {
    if (key === 'studentOrganization[]' || key === 'affiliation[]') {
      return;
    }
    data[key] = value;
  });

  // Handle student organizations from Select2
  if (document.getElementById('studentOrganization')) {
    const selectedOrgs = $('#studentOrganization').val() || [];
    data.studentOrganization = selectedOrgs.join(',');
  }

  // Handle office/department affiliations from Select2 for non-students
  if (document.getElementById('officeSelect')) {
    const selectedOffices = $('#officeSelect').val() || [];
    data.affiliation = selectedOffices.join(',');
  }

  try {
    const res = await fetch('/admin/profile/update-popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showSuccess('Profile updated successfully!', () => {
        location.reload();
      });
    } else {
      const errorText = await res.text();
      showError('Update failed: ' + errorText);
    }
  } catch (error) {
    console.error('Update error:', error);
    showError('An error occurred while updating the profile');
  }
};

// Password visibility toggle function
function togglePasswordVisibility(inputId, iconId) {
  const passwordInput = document.getElementById(inputId);
  const eyeIcon = document.getElementById(iconId);

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    passwordInput.classList.add('password-input');
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    passwordInput.type = 'password';
    passwordInput.classList.remove('password-input');
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

// Enhanced password strength checker (without uppercase requirement)
function checkPasswordStrength(password) {
  const strengthIndicator = document.getElementById('passwordStrength');
  const passwordValidation = document.getElementById('passwordValidation');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  if (password.length === 0) {
    strengthIndicator.style.display = 'none';
    passwordValidation.style.display = 'none';
    return false;
  }

  strengthIndicator.style.display = 'block';
  passwordValidation.style.display = 'block';

  // Check individual requirements (removed uppercase requirement)
  const checks = {
    length: password.length >= 8,
    number: password.match(/[0-9]/),
    special: password.match(/[^a-zA-Z0-9]/)
  };

  // Update validation items
  updateValidationItem('lengthCheck', checks.length);
  updateValidationItem('numberCheck', checks.number);
  updateValidationItem('specialCheck', checks.special);

  // Calculate strength (adjusted for 3 requirements instead of 4)
  let strength = Object.values(checks).filter(Boolean).length;

  strengthFill.className = 'strength-fill';

  if (strength <= 1) {
    strengthFill.classList.add('strength-weak');
    strengthText.textContent = 'Weak password';
  } else if (strength === 2) {
    strengthFill.classList.add('strength-medium');
    strengthText.textContent = 'Medium strength';
  } else {
    strengthFill.classList.add('strength-strong');
    strengthText.textContent = 'Strong password';
  }

  // Return true if all requirements are met
  return strength >= 3;
}

// Update validation item styling
function updateValidationItem(itemId, isValid) {
  const item = document.getElementById(itemId);
  if (item) {
    if (isValid) {
      item.classList.remove('invalid');
      item.classList.add('valid');
    } else {
      item.classList.remove('valid');
      item.classList.add('invalid');
    }
  }
}

// Password match checker
function checkPasswordMatch() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  const matchIndicator = document.getElementById('passwordMatchIndicator');
  const updateBtn = document.getElementById('updatePasswordBtn');

  if (confirmPassword.length === 0) {
    matchIndicator.textContent = 'Enter password confirmation';
    matchIndicator.className = 'password-match-indicator empty';
    updateBtn.disabled = true;
    return false;
  }

  if (newPassword === confirmPassword) {
    matchIndicator.textContent = '✓ Passwords match';
    matchIndicator.className = 'password-match-indicator match';

    // Check if password is strong enough (updated requirements)
    const isStrong = checkPasswordStrength(newPassword);
    updateBtn.disabled = !isStrong;
    return true;
  } else {
    matchIndicator.textContent = '✗ Passwords do not match';
    matchIndicator.className = 'password-match-indicator no-match';
    updateBtn.disabled = true;
    return false;
  }
}

// Enhanced password form event listeners
document.addEventListener('DOMContentLoaded', function() {
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmNewPassword');

  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      checkPasswordStrength(this.value);
      checkPasswordMatch();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
  }
});

document.getElementById('passwordForm').onsubmit = async function (e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  // Final validation
  const newPassword = data.newPassword;
  const confirmPassword = data.confirmNewPassword;

  if (newPassword !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  if (newPassword.length < 8) {
    showError('Password must be at least 8 characters long');
    return;
  }

  if (!/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
    showError('Password must contain at least one letter and one number');
    return;
  }

  try {
    const res = await fetch('/admin/profile/change-password-popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmNewPassword
      })
    });

    const result = await res.json();
    
    if (result.success) {
      showSuccess('Password updated successfully!', () => {
        closeModal('passwordModal');
        form.reset();
        document.getElementById('passwordStrength').style.display = 'none';
        document.getElementById('passwordValidation').style.display = 'none';
        document.getElementById('passwordMatchIndicator').textContent = 'Enter password confirmation';
        document.getElementById('passwordMatchIndicator').className = 'password-match-indicator empty';
        document.getElementById('updatePasswordBtn').disabled = true;
      });
    } else {
      showError(result.message || 'Failed to update password');
    }
  } catch (error) {
    console.error('Password update error:', error);
    showError('An error occurred while updating the password');
  }
};

// Request password reset via email
async function requestPasswordReset(event) {
  if (event) event.preventDefault();
  
  // Close password modal and show reset modal
  closeModal('passwordModal');
  showResetPasswordModal();
}

// Show reset password modal
function showResetPasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'resetPasswordModal';
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 520px; border-radius: 24px; overflow: hidden;">
      <div style="padding: 2rem 2.5rem; text-align: center; background: rgba(255, 255, 255, 0.98);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="color: #408b4e; font-size: 1.75rem; margin: 0; font-weight: 700;">Reset Password</h2>
          <span class="close" onclick="closeResetModal()" style="font-size: 2rem; cursor: pointer; color: #64748b;">&times;</span>
        </div>
        
        <div id="resetStepOne">
          <p style="color: #6b7280; font-size: 15px; margin-bottom: 1.5rem;">
            We'll send a password reset link to your email. You can reset your password immediately from this page.
          </p>
          <button onclick="sendResetEmail()" class="button" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #408b4e, #275730); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            Send Reset Link
          </button>
          <button onclick="closeResetModal()" style="width: 100%; padding: 12px; background: white; color: #666; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; transition: all 0.3s ease;">
            Cancel
          </button>
        </div>
        
        <div id="resetStepTwo" style="display: none;">
          <div style="background: #e8f5e9; border: 2px solid #408b4e; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <svg style="width: 48px; height: 48px; margin: 0 auto 12px; display: block;" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#408b4e" stroke-width="2"/>
              <path d="M8 12l2 2 4-4" stroke="#408b4e" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <strong style="font-size: 18px; color: #275730; display: block; margin-bottom: 8px;">Email Sent!</strong>
            <p style="color: #408b4e; font-size: 14px; margin: 0;">
              A password reset link has been sent to your email address.
            </p>
          </div>
          
          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: left;">
            <strong style="font-size: 15px; color: #1e293b; display: block; margin-bottom: 12px;">Reset your password now:</strong>
            <button onclick="openResetPage()" class="button" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #408b4e, #275730); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M15 3h6v6M10 14L21 3M21 12v9H3V3h9"/>
              </svg>
              Open Reset Page
            </button>
            <p style="color: #64748b; font-size: 13px; margin-top: 10px; text-align: center;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <button onclick="closeResetModal()" style="width: 100%; padding: 12px; background: white; color: #408b4e; border: 2px solid #408b4e; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            Done
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Send reset email
async function sendResetEmail() {
  const button = document.querySelector('#resetStepOne button');
  button.disabled = true;
  button.textContent = 'Sending...';
  
  try {
    const res = await fetch('/admin/profile/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await res.json();
    
    if (result.success) {
      window.resetToken = result.resetToken;
      document.getElementById('resetStepOne').style.display = 'none';
      document.getElementById('resetStepTwo').style.display = 'block';
    } else {
      showError(result.message || 'Failed to send reset email');
      closeResetModal();
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    showError('An error occurred while requesting password reset');
    closeResetModal();
  }
}

// Open reset page in new tab
function openResetPage() {
  if (window.resetToken) {
    const resetUrl = window.location.origin + '/reset-password/' + window.resetToken;
    window.open(resetUrl, '_blank');
  }
}

// Close reset modal
function closeResetModal() {
  const modal = document.getElementById('resetPasswordModal');
  if (modal) {
    modal.remove();
  }
  window.resetToken = null;
}

// Enhanced picture modal functionality - Updated for new layout
let selectedFile = null;

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const uploadContainer = document.getElementById('fileUploadContainer');
  const selectedImagePreview = document.getElementById('selectedImagePreview');
  const imagePreviewContent = document.getElementById('imagePreviewContent');
  const uploadBtn = document.getElementById('uploadBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  if (!fileInput || !uploadContainer) return; // Guard clause

  // Drag and drop functionality
  uploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadContainer.classList.add('dragover');
  });

  uploadContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadContainer.classList.remove('dragover');
  });

  uploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadContainer.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Handle file selection
  // Handle file selection
function handleFileSelection(file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    showError('Please select a valid image file (JPG, JPEG, PNG, or GIF)');
    return;
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    showError('File size must be less than 5MB');
    return;
  }

  selectedFile = file;

  // Show preview in the selected image section
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImagePreview.classList.add('has-image');

    // Update file info
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    imagePreviewContent.innerHTML = `
  <img src="${e.target.result}" class="preview-image" alt="Preview" />
    <div class="preview-info">
      <strong>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline; vertical-align: middle; margin-right: 0.25rem;">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
        </svg>
        Selected File:
      </strong><br>
      <strong>${file.name}</strong><br>
      Size: ${sizeInMB} MB<br>
      Type: ${file.type}
    </div>
  `;

    // Enable upload button
    if (uploadBtn) uploadBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

// Upload button click
if (uploadBtn) {
  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<span class="notification-spinner"></span>Uploading...';

      const res = await fetch('/profileadmin/upload-picture', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      showSuccess('Profile picture updated successfully!', () => {
        location.reload();
      });
    } catch (error) {
      showError('Error uploading picture: ' + error.message);
      uploadBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24" style="display: inline; vertical-align: middle; margin-right: 0.5rem;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Upload Picture
      `;

      deleteBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24" style="display: inline; vertical-align: middle; margin-right: 0.5rem;">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Delete Picture
      `;
          }
  });
}
  // Delete button click
// Delete button click
if (deleteBtn) {
  deleteBtn.addEventListener('click', async () => {
    showConfirmation(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture? This action cannot be undone.',
      async () => {
        try {
          deleteBtn.disabled = true;
          deleteBtn.innerHTML = '<span class="notification-spinner"></span>Deleting...';

          const res = await fetch('/profileadmin/delete-picture', {
            method: 'POST'
          });

          if (res.ok) {
            showSuccess('Profile picture deleted successfully!', () => {
              location.reload();
            });
          } else {
            const err = await res.text();
            showError('Error: ' + err);
            deleteBtn.disabled = false;
            deleteBtn.textContent = '🗑️ Delete Picture';
          }
        } catch (error) {
          showError('An error occurred while deleting the picture');
          deleteBtn.disabled = false;
          deleteBtn.textContent = '🗑️ Delete Picture';
        }
      }
    );
  });
}
  // Reset modal when closed
  window.resetPictureModal = function() {
    selectedFile = null;
    if (selectedImagePreview) selectedImagePreview.classList.remove('has-image');
    if (imagePreviewContent) imagePreviewContent.innerHTML = '<p class="no-image-placeholder">No image selected</p>';
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.textContent = '📤 Upload Picture';
    }
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = '🗑️ Delete Picture';
    }
    if (fileInput) fileInput.value = '';
  };
});

// Update the closeModal function to reset picture modal
const originalCloseModal = window.closeModal;
window.closeModal = function(id) {
  if (id === 'pictureModal' && window.resetPictureModal) {
    window.resetPictureModal();
  }
  originalCloseModal(id);
};

// =========================== ////
// NOTIFICATION SYSTEM         ////
// =========================== ////

// Show notification modal
function showNotification(type, title, message, callback = null) {
  const modal = document.getElementById('notificationModal');
  const icon = document.getElementById('notificationIcon');
  const iconText = document.getElementById('notificationIconText');
  const titleEl = document.getElementById('notificationTitle');
  const messageEl = document.getElementById('notificationMessage');
  const okBtn = document.getElementById('notificationOkBtn');

  // Set icon and styling based on type
  icon.className = `notification-icon ${type}`;
  switch(type) {
    case 'success':
      iconText.innerHTML = `
    <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `;
      break;
    case 'error':
      iconText.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `;
      break;
    case 'warning':
      iconText.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
      break;
    case 'info':
      iconText.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      `;
      break;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Handle OK button click
  okBtn.onclick = () => {
    hideNotification();
    if (callback) callback();
  };

  // Show modal
  modal.classList.add('show');
}

// Hide notification modal
function hideNotification() {
  const modal = document.getElementById('notificationModal');
  modal.classList.remove('show');
}

// Show confirmation dialog
function showConfirmation(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmationModal');
  const titleEl = document.getElementById('confirmationTitle');
  const messageEl = document.getElementById('confirmationMessage');
  const cancelBtn = document.getElementById('confirmationCancelBtn');
  const confirmBtn = document.getElementById('confirmationConfirmBtn');

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Handle button clicks
  cancelBtn.onclick = () => {
    hideConfirmation();
    if (onCancel) onCancel();
  };

  confirmBtn.onclick = () => {
    hideConfirmation();
    if (onConfirm) onConfirm();
  };

  // Show modal
  modal.classList.add('show');
}

// Hide confirmation modal
function hideConfirmation() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.remove('show');
}

// Enhanced notification functions
function showSuccess(message, callback = null) {
  showNotification('success', 'Success!', message, callback);
}

function showError(message, callback = null) {
  showNotification('error', 'Error!', message, callback);
}

function showWarning(message, callback = null) {
  showNotification('warning', 'Warning!', message, callback);
}

function showInfo(message, callback = null) {
  showNotification('info', 'Information', message, callback);
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('notification-modal')) {
    hideNotification();
    hideConfirmation();
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    hideNotification();
    hideConfirmation();
  }
});

/* ===========================================
   END OF PROFILE ADMIN JAVASCRIPT
   =========================================== */
