/**
 * =============================================================================
 * UNIT PROFILE PAGE JAVASCRIPT
 * =============================================================================
 * Purpose: Client-side functionality for unit member profile page
 * Connected to: views/Unit/unitprofile.ejs
 * Dependencies: jQuery, Select2, shared-data.js
 * =============================================================================
 */

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

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (toggle && menu && !toggle.contains(event.target)) {
    headerDropdown.close();
  }
});

// Modal open handlers
document.getElementById('openUpdateProfile').onclick = () => openModal('updateProfileModal');
document.getElementById('openChangePassword').onclick = () => openModal('passwordModal');
document.getElementById('openPictureModal').onclick = () => openModal('pictureModal');

// Close modal function
window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
  }
};

// Close modal when clicking outside
window.onclick = function(e) {
  ['updateProfileModal', 'passwordModal', 'pictureModal'].forEach(id => {
    if (e.target.id === id) {
      closeModal(id);
    }
  });
};

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

// Office counter update
function updateOfficeCounter() {
  const select = $('#officeSelect');
  const counter = document.getElementById('officeCounter');
  if (!counter) return;
  
  const selectedCount = select.val()?.length || 0;
  
  if (selectedCount === 0) {
    counter.textContent = 'No offices selected';
    counter.classList.remove('has-selections');
  } else if (selectedCount === 1) {
    counter.textContent = '1 office selected';
    counter.classList.add('has-selections');
  } else {
    counter.textContent = `${selectedCount} offices selected`;
    counter.classList.add('has-selections');
  }
}

// Office selection click handlers
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

      // Update counter
      updateOfficeCounter();

      // Show feedback
      showOfficeFeedback(`"${value}" has been removed.`, 'warning');
      setTimeout(hideOfficeFeedback, 2000);
    }
  });
}

// Toggle custom office input
function toggleCustomOffice() {
  const customOfficeContainer = document.getElementById('customOfficeContainer');
  const toggleBtn = document.getElementById('toggleCustomOfficeBtn');
  const isVisible = customOfficeContainer.style.display !== 'none';
  
  customOfficeContainer.style.display = isVisible ? 'none' : 'block';
  toggleBtn.classList.toggle('expanded', !isVisible);
  
  if (!isVisible) {
    document.getElementById('otherOffice').focus();
  } else {
    document.getElementById('otherOffice').value = '';
    hideOfficeFeedback();
  }
}

// Add custom office
function addCustomOffice() {
  const input = document.getElementById('otherOffice');
  const officeName = input.value.trim();
  const select = $('#officeSelect');

  if (!officeName) {
    showOfficeFeedback('Please enter an office/department name.', 'error');
    input.focus();
    return;
  }
  
  if (officeName.length < 3) {
    showOfficeFeedback('Office/department name must be at least 3 characters long.', 'error');
    input.focus();
    return;
  }

  const existingOptions = Array.from(select[0].options).map(option => option.value.toLowerCase());
  if (existingOptions.includes(officeName.toLowerCase())) {
    showOfficeFeedback('This office/department is already in your list.', 'warning');
    input.focus();
    return;
  }

  if (select.find(`option[value="${officeName}"]`).length === 0) {
    const newOption = new Option(officeName, officeName, true, true);
    select.append(newOption);
  }

  const current = select.val() || [];
  if (!current.includes(officeName)) {
    current.push(officeName);
    select.val(current).trigger('change');
  }

  input.value = '';
  showOfficeFeedback(`"${officeName}" has been added successfully!`, 'success');
  updateOfficeCounter();
  
  setTimeout(hideOfficeFeedback, 3000);
}

// Office feedback system
function showOfficeFeedback(message, type = 'success') {
  const feedback = document.getElementById('officeAddedFeedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = `org-added-feedback ${type}`;
    feedback.classList.add('show');
  }
}

function hideOfficeFeedback() {
  const feedback = document.getElementById('officeAddedFeedback');
  if (feedback) {
    feedback.classList.remove('show');
  }
}

// Password visibility toggle
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    input.type = 'password';
    icon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

// Enhanced password strength checker
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

  // Check individual requirements
  const checks = {
    length: password.length >= 8,
    number: password.match(/[0-9]/),
    special: password.match(/[^a-zA-Z0-9]/)
  };

  // Update validation items
  updateValidationItem('lengthCheck', checks.length);
  updateValidationItem('numberCheck', checks.number);
  updateValidationItem('specialCheck', checks.special);

  // Calculate strength
  let strength = Object.values(checks).filter(Boolean).length;
  const percentage = (strength / 3) * 100;

  strengthFill.style.width = percentage + '%';

  if (percentage < 33) {
    strengthFill.style.background = '#ef4444';
    strengthText.textContent = 'Weak password';
    strengthText.style.color = '#ef4444';
  } else if (percentage < 67) {
    strengthFill.style.background = '#f59e0b';
    strengthText.textContent = 'Medium password';
    strengthText.style.color = '#f59e0b';
  } else {
    strengthFill.style.background = '#2d7a4a';
    strengthText.textContent = 'Strong password';
    strengthText.style.color = '#2d7a4a';
  }

  return strength === 3;
}

// Update validation item styling
function updateValidationItem(itemId, isValid) {
  const item = document.getElementById(itemId);
  if (item) {
    if (isValid) {
      item.classList.add('valid');
      item.style.color = '#2d7a4a';
    } else {
      item.classList.remove('valid');
      item.style.color = '#64748b';
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
    matchIndicator.className = 'password-match-indicator';
    updateBtn.disabled = true;
    return;
  }

  if (newPassword === confirmPassword) {
    matchIndicator.textContent = '✓ Passwords match';
    matchIndicator.className = 'password-match-indicator match';
    
    // Check if password meets all requirements
    const isStrong = checkPasswordStrength(newPassword);
    updateBtn.disabled = !isStrong;
  } else {
    matchIndicator.textContent = '✗ Passwords do not match';
    matchIndicator.className = 'password-match-indicator no-match';
    updateBtn.disabled = true;
  }
}

// Form submission handlers
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

  // Handle office/department affiliations from Select2
  if (document.getElementById('officeSelect')) {
    const selectedOffices = $('#officeSelect').val() || [];
    data.affiliation = selectedOffices.join(',');
  }

  try {
    const res = await fetch('/unit/profile/update', {
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

// Password form submission
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

  if (!newPassword.match(/[0-9]/)) {
    showError('Password must contain at least one number');
    return;
  }

  if (!newPassword.match(/[^a-zA-Z0-9]/)) {
    showError('Password must contain at least one special character');
    return;
  }

  try {
    const res = await fetch('/unit/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showSuccess('Password updated successfully!', () => {
        closeModal('passwordModal');
        form.reset();
        document.getElementById('passwordStrength').style.display = 'none';
        document.getElementById('passwordValidation').style.display = 'none';
        document.getElementById('passwordMatchIndicator').textContent = 'Enter password confirmation';
        document.getElementById('passwordMatchIndicator').className = 'password-match-indicator';
        document.getElementById('updatePasswordBtn').disabled = true;
      });
    } else {
      const err = await res.text();
      showError(err);
    }
  } catch (error) {
    showError('An error occurred while updating the password');
  }
};

// Password event listeners
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

  // Picture upload handling
  const fileInput = document.getElementById('fileInput');
  const uploadContainer = document.getElementById('fileUploadContainer');
  const uploadBtn = document.getElementById('uploadBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  if (fileInput && uploadContainer) {
    let selectedFile = null;

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

    // Click to browse
    uploadContainer.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });

    // Handle file selection
    function handleFileSelection(file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, JPEG, PNG, or GIF)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showError('File size must be less than 5MB');
        return;
      }

      selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('imagePreviewContent').innerHTML = `
          <img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;" alt="Preview" />
          <div style="text-align: left;">
            <strong>${file.name}</strong><br>
            Size: ${sizeInMB} MB<br>
            Type: ${file.type}
          </div>
        `;

        if (uploadBtn) uploadBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    // Upload button
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
          uploadBtn.innerHTML = '<span>Uploading...</span>';

          const res = await fetch('/unit/profile/upload-picture', {
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
          uploadBtn.innerHTML = 'Upload Picture';
          uploadBtn.disabled = false;
        }
      });
    }

    // Delete button
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        showConfirmation(
          'Delete Profile Picture',
          'Are you sure you want to delete your profile picture?',
          async () => {
            try {
              const res = await fetch('/unit/profile/delete-picture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              if (res.ok) {
                showSuccess('Profile picture deleted successfully!', () => {
                  location.reload();
                });
              } else {
                const err = await res.text();
                showError(err);
              }
            } catch (error) {
              showError('Error deleting picture');
            }
          }
        );
      });
    }
  }
});

// Notification system
function showNotification(type, title, message, callback = null) {
  const modal = document.getElementById('notificationModal');
  const icon = document.getElementById('notificationIcon');
  const titleEl = document.getElementById('notificationTitle');
  const messageEl = document.getElementById('notificationMessage');
  const okBtn = document.getElementById('notificationOkBtn');

  titleEl.textContent = title;
  messageEl.textContent = message;

  icon.className = 'notification-icon ' + type;
  if (type === 'success') {
    icon.innerHTML = '<span style="font-size: 2rem;">✓</span>';
  } else if (type === 'error') {
    icon.innerHTML = '<span style="font-size: 2rem;">✗</span>';
  } else if (type === 'warning') {
    icon.innerHTML = '<span style="font-size: 2rem;">!</span>';
  }

  modal.style.display = 'flex';

  okBtn.onclick = () => {
    modal.style.display = 'none';
    if (callback) callback();
  };
}

function hideNotification() {
  document.getElementById('notificationModal').style.display = 'none';
}

function showConfirmation(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmationModal');
  const titleEl = document.getElementById('confirmationTitle');
  const messageEl = document.getElementById('confirmationMessage');
  const confirmBtn = document.getElementById('confirmationConfirmBtn');
  const cancelBtn = document.getElementById('confirmationCancelBtn');

  titleEl.textContent = title;
  messageEl.textContent = message;

  modal.style.display = 'flex';

  confirmBtn.onclick = () => {
    modal.style.display = 'none';
    if (onConfirm) onConfirm();
  };

  cancelBtn.onclick = () => {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  };
}

function hideConfirmation() {
  document.getElementById('confirmationModal').style.display = 'none';
}

function showSuccess(message, callback = null) {
  showNotification('success', 'Success', message, callback);
}

function showError(message, callback = null) {
  showNotification('error', 'Error', message, callback);
}

function showWarning(message, callback = null) {
  showNotification('warning', 'Warning', message, callback);
}


