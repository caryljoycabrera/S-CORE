// Global Variables
let currentRequestId = null;
let currentRequestType = null;
let selectedFiles = [];
let revisionFiles = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all event listeners
    initializeEventListeners();
    initializeTableFilters();
    initializeRevisionFeatures();
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
    const approveBtn = document.getElementById('approveBtn');
    if (approveBtn) {
        approveBtn.addEventListener('click', approveRequest);
    }

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

    // Service actions
    const deliverablesFileInput = document.getElementById('deliverablesFileInput');
    if (deliverablesFileInput) {
        deliverablesFileInput.addEventListener('change', handleFileInputChange);
    }

    const uploadDeliverablesBtn = document.getElementById('uploadDeliverablesBtn');
    if (uploadDeliverablesBtn) {
        uploadDeliverablesBtn.addEventListener('click', uploadDeliverables);
    }

    const completeServiceBtn = document.getElementById('completeServiceBtn');
    if (completeServiceBtn) {
        completeServiceBtn.addEventListener('click', completeServiceRequest);
    }

    // Message sending
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

function initializeTableFilters() {
    const filterInputs = {
        title: document.getElementById('filterTitle'),
        type: document.getElementById('filterType'),
        status: document.getElementById('filterStatus'),
        requestor: document.getElementById('filterRequestor'),
        dateFrom: document.getElementById('filterDateFrom'),
        dateTo: document.getElementById('filterDateTo')
    };

    // Add event listeners to all filter inputs
    Object.values(filterInputs).forEach(input => {
        if (input) {
            input.addEventListener('input', applyTableFilters);
            input.addEventListener('change', applyTableFilters);
        }
    });
}

function applyTableFilters() {
    const filters = {
        title: document.getElementById('filterTitle')?.value.toLowerCase() || '',
        type: document.getElementById('filterType')?.value.toLowerCase() || '',
        status: document.getElementById('filterStatus')?.value.toLowerCase() || '',
        requestor: document.getElementById('filterRequestor')?.value.toLowerCase() || '',
        dateFrom: document.getElementById('filterDateFrom')?.value || '',
        dateTo: document.getElementById('filterDateTo')?.value || ''
    };

    const tableRows = document.querySelectorAll('.requests-table tbody tr');
    
    tableRows.forEach(row => {
        const title = row.getAttribute('data-title')?.toLowerCase() || '';
        const type = row.getAttribute('data-request-type')?.toLowerCase() || '';
        const status = row.getAttribute('data-status')?.toLowerCase() || '';
        const requestor = row.getAttribute('data-requestor')?.toLowerCase() || '';
        const dateSubmitted = row.getAttribute('data-date-submitted') || '';

        let showRow = true;

        // Apply filters
        if (filters.title && !title.includes(filters.title)) {
            showRow = false;
        }
        if (filters.type && type !== filters.type) {
            showRow = false;
        }
        if (filters.status && status !== filters.status) {
            showRow = false;
        }
        if (filters.requestor && !requestor.includes(filters.requestor)) {
            showRow = false;
        }
        if (filters.dateFrom && dateSubmitted < filters.dateFrom) {
            showRow = false;
        }
        if (filters.dateTo && dateSubmitted > filters.dateTo) {
            showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    });
}

function clearAllFilters() {
    document.getElementById('filterTitle').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterRequestor').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    
    applyTableFilters();
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
    document.getElementById('modalStatus').textContent = status.toUpperCase();
    document.getElementById('modalDescription').textContent = description;

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
            document.getElementById('modalDeadline').textContent = 'Not specified';
        }
    } else if (requestType === 'service') {
        if (deadlineField) deadlineField.style.display = 'none';
        if (serviceTypeField) serviceTypeField.style.display = 'block';
        if (serviceType || specificRequestType) {
            document.getElementById('modalServiceType').textContent = serviceType || specificRequestType;
        } else {
            document.getElementById('modalServiceType').textContent = 'Not specified';
        }
    }

    // Show files if they exist
    try {
        const files = JSON.parse(filesJson);
        const filesSection = document.getElementById('filesSection');
        const filesContainer = document.getElementById('modalFiles');
        if (files && files.length > 0) {
            filesContainer.innerHTML = '';
            createEnhancedFilePreview(files, filesContainer);
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
            createEnhancedFilePreview(deliverables, deliverablesContainer);
            if (deliverablesSection) deliverablesSection.style.display = 'block';
        } else {
            if (deliverablesSection) deliverablesSection.style.display = 'none';
        }
    } catch (e) {
        console.error('Error parsing deliverables:', e);
        const deliverablesSection = document.getElementById('deliverablesSection');
        if (deliverablesSection) deliverablesSection.style.display = 'none';
    }

    // Show appropriate action panels
    const approvalActionsPanel = document.getElementById('approvalActionsPanel');
    const serviceActionsPanel = document.getElementById('serviceActionsPanel');
    
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
    
    if (requestType === 'approval') {
        if (approvalActionsPanel) approvalActionsPanel.style.display = 'block';
        if (serviceActionsPanel) serviceActionsPanel.style.display = 'none';
    } else if (requestType === 'service') {
        if (approvalActionsPanel) approvalActionsPanel.style.display = 'none';
        if (serviceActionsPanel) serviceActionsPanel.style.display = 'block';
    }

    // Load team conversation messages
    loadConversation(requestId);

    // Display modal
    const modal = document.getElementById('requestDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
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
async function approveRequest() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    if (!confirm('Are you sure you want to approve this request?')) {
        return;
    }

    try {
        const response = await fetch(`/unit/task/approve/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Request approved successfully');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showErrorMessage(result.message || 'Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('An error occurred while approving the request');
    }
}

// Function: showRevisionForm
function showRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'block';
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
            
            // Clear revision form
            document.getElementById('revisionComments').value = '';
            clearAllRevisionFiles();
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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

            // Reload deliverables section
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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
            setTimeout(() => {
                window.location.reload();
            }, 1500);
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

        const messagesContainer = document.getElementById('conversationMessages');
        if (!messagesContainer) return;

        if (response.ok && result.success && result.messages) {
            messagesContainer.innerHTML = '';
            
            if (result.messages.length === 0) {
                messagesContainer.innerHTML = '<p class="no-messages">No messages yet. Start the conversation!</p>';
                return;
            }

            result.messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.senderRole === 'unit' ? 'message-unit' : 'message-user'}`;
                
                const senderName = message.senderName || (message.senderRole === 'unit' ? 'Unit Member' : 'Requestor');
                const timestamp = formatDate(message.timestamp);
                
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${senderName}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">${escapeHtml(message.content)}</div>
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
        const messagesContainer = document.getElementById('conversationMessages');
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

    const messageInput = document.getElementById('messageInput');
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
            // Append message to UI
            const messagesContainer = document.getElementById('conversationMessages');
            if (messagesContainer) {
                // Remove "no messages" placeholder if it exists
                const noMessages = messagesContainer.querySelector('.no-messages');
                if (noMessages) {
                    noMessages.remove();
                }

                const messageDiv = document.createElement('div');
                messageDiv.className = 'message message-unit';
                
                const senderName = result.message.senderName || 'Unit Member';
                const timestamp = formatDate(result.message.timestamp);
                
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${senderName}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">${escapeHtml(messageText)}</div>
                `;
                
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

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
                        <div class="empty-icon">💭</div>
                        <p>No team discussion yet</p>
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
    console.log('[AllTasks] Message comparison details:', {
        'msg.senderRole': msg.senderRole,
        'typeof msg.senderRole': typeof msg.senderRole,
        'window.currentUserRole': window.currentUserRole,
        'typeof window.currentUserRole': typeof window.currentUserRole,
        'strict comparison (===)': msg.senderRole === window.currentUserRole,
        'loose comparison (==)': msg.senderRole == window.currentUserRole
    });
    
    const isOwnMessage = window.currentUserRole && msg.senderRole === window.currentUserRole;
    
    console.log('[AllTasks] Creating message:', {
        senderRole: msg.senderRole,
        currentUserRole: window.currentUserRole,
        isOwnMessage: isOwnMessage,
        alignment: isOwnMessage ? 'RIGHT' : 'LEFT',
        willAddClass: isOwnMessage ? 'message-right' : 'message-left'
    });
    
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
    
    div.innerHTML = `
        <div class="unit-message-bubble ${roleClass}" style="background: ${roleColor};">
            <div class="message-header">
                <strong>${escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${formatText(msg.content || '')}</div>
            ${attachmentsHTML}
        </div>
    `;
    
    return div;
}

function sendTeamMessage() {
    const input = document.getElementById('teamMessageInput');
    if (!input || !currentRequestId) return;

    const content = input.value.trim();
    if (!content) {
        showErrorMessage('Please enter a message');
        return;
    }

    fetch(`/api/conversation/${currentRequestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: content,
            senderRole: 'unit'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            input.value = '';
            loadTeamConversation(currentRequestId);
        } else {
            showErrorMessage(data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showErrorMessage('Failed to send message');
    });
}

function clearConversationInput() {
    const input = document.getElementById('teamMessageInput');
    if (input) input.value = '';
    
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
        openChatBtn.addEventListener('click', openTeamConversationModal);
    }

    // Send team message button
    const sendTeamBtn = document.getElementById('sendTeamMessageBtn');
    if (sendTeamBtn) {
        sendTeamBtn.addEventListener('click', sendTeamMessage);
    }

    // Enter key to send
    const teamInput = document.getElementById('teamMessageInput');
    if (teamInput) {
        teamInput.addEventListener('keypress', function(e) {
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
function createEnhancedFilePreview(allFiles, previewContainer) {
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
              <div class="file-type-enhanced">${ext.toUpperCase()} File</div>
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
    // Text formatting buttons
    const formatBtns = document.querySelectorAll('.revision-format-toolbar .format-btn[data-format]');
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            applyRevisionFormat(format);
        });
    });

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

function applyRevisionFormat(format) {
    const textarea = document.getElementById('revisionComments');
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
        case 'bullet':
            const lines = selectedText.split('\n');
            formattedText = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
            newCursorPos = start + formattedText.length;
            break;
    }

    textarea.value = beforeText + formattedText + afterText;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
}

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

// Update sendTeamMessage to include files
function sendTeamMessage() {
    console.log('[AllTasks] Send team message triggered');
    const input = document.getElementById('teamMessageInput');
    if (!input || !currentRequestId) {
        console.error('[AllTasks] Missing input or request ID:', {
            input: !!input,
            currentRequestId
        });
        return;
    }

    const content = input.value.trim();
    console.log('[AllTasks] Message content:', content || '(empty)');
    console.log('[AllTasks] Files to send:', chatFiles.length);
    
    if (!content && chatFiles.length === 0) {
        console.warn('[AllTasks] No content or files');
        showErrorMessage('Please enter a message or attach files');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('senderRole', 'unit');
    
    // Add files if any
    chatFiles.forEach((file, index) => {
        console.log(`[AllTasks] Appending file ${index + 1}:`, file.name);
        formData.append('chatFiles', file);
    });

    console.log('[AllTasks] Sending to:', `/api/conversation/${currentRequestId}/message`);
    fetch(`/api/conversation/${currentRequestId}/message`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('[AllTasks] Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('[AllTasks] Response data:', data);
        if (data.success) {
            console.log('[AllTasks] Message sent successfully');
            input.value = '';
            clearAllChatFiles();
            loadTeamConversation(currentRequestId);
        } else {
            console.error('[AllTasks] Server error:', data);
            showErrorMessage(data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        console.error('[AllTasks] Error sending message:', error);
        console.error('[AllTasks] Error stack:', error.stack);
        showErrorMessage('Failed to send message');
    });
}

// This duplicate function has been removed - the correct createMessageElement function is already defined earlier in the file at line 920

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

// Initialize chat file features when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChatFileFeatures();
    
    // Add keyboard shortcuts for team message input
    const teamMessageInput = document.getElementById('teamMessageInput');
    if (teamMessageInput) {
        console.log('[AllTasks] Team message input found, attaching keyboard shortcuts');
        
        teamMessageInput.addEventListener('keydown', function(e) {
            // Ctrl+B or Cmd+B for bold
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                console.log('[AllTasks] Keyboard shortcut: Bold (Ctrl+B)');
                applyChatFormat('bold');
                return false;
            }
            // Ctrl+I or Cmd+I for italic
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                console.log('[AllTasks] Keyboard shortcut: Italic (Ctrl+I)');
                applyChatFormat('italic');
                return false;
            }
            // Ctrl+U or Cmd+U for underline
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                console.log('[AllTasks] Keyboard shortcut: Underline (Ctrl+U)');
                applyChatFormat('underline');
                return false;
            }
        });
    } else {
        console.error('[AllTasks] Team message input element not found!');
    }
});

