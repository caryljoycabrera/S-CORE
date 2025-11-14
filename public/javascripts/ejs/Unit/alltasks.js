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

    const revokeApprovalBtn = document.getElementById('revokeApprovalBtn');
    if (revokeApprovalBtn) {
        revokeApprovalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[DEBUG] Revoke button clicked');
            revokeApproval();
        });
    }

    const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
    if (confirmRevokeBtn) {
        confirmRevokeBtn.addEventListener('click', submitRevokeApproval);
    }

    const cancelRevokeBtn = document.getElementById('cancelRevokeBtn');
    if (cancelRevokeBtn) {
        cancelRevokeBtn.addEventListener('click', hideRevokeForm);
    }

    // Revision history integrated action buttons
    const approveAfterRevisionBtn = document.getElementById('approveAfterRevisionBtn');
    if (approveAfterRevisionBtn) {
        approveAfterRevisionBtn.addEventListener('click', approveRequest);
    }

    const requestAnotherRevisionBtn = document.getElementById('requestAnotherRevisionBtn');
    if (requestAnotherRevisionBtn) {
        requestAnotherRevisionBtn.addEventListener('click', showRevisionForm);
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
    const approvalStatusIndicator = document.getElementById('approvalStatusIndicator');
    const approvalActionButtons = document.getElementById('approvalActionButtons');
    
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
        
        // Check if request is already approved
        if (status.toLowerCase() === 'approved') {
            if (approvalStatusIndicator) approvalStatusIndicator.style.display = 'block';
            if (approvalActionButtons) approvalActionButtons.style.display = 'none';
            
            // Re-attach revoke button event listener to ensure it works
            const revokeBtn = document.getElementById('revokeApprovalBtn');
            if (revokeBtn) {
                // Remove any existing listeners by cloning
                const newRevokeBtn = revokeBtn.cloneNode(true);
                revokeBtn.parentNode.replaceChild(newRevokeBtn, revokeBtn);
                // Add fresh listener
                newRevokeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[DEBUG] Revoke button clicked (re-attached)');
                    revokeApproval();
                });
            }
        } else {
            if (approvalStatusIndicator) approvalStatusIndicator.style.display = 'none';
            if (approvalActionButtons) approvalActionButtons.style.display = 'flex';
        }
    } else if (requestType === 'service') {
        if (approvalActionsPanel) approvalActionsPanel.style.display = 'none';
        if (serviceActionsPanel) serviceActionsPanel.style.display = 'block';
    }

    // Load team conversation messages
    loadConversation(requestId);

    // Load revision history
    loadRevisionHistory(requestId);

    // Display modal
    const modal = document.getElementById('requestDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Function: loadRevisionHistory
async function loadRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    console.log('[Revision History] Loading for request:', requestId);
    console.log('[Revision History] Section element:', historySection);
    console.log('[Revision History] Container element:', historyContainer);
    
    if (!historyContainer) {
        console.warn('[Revision History] Container not found!');
        return;
    }
    
    try {
        const response = await fetch(`/api/revision-history/${requestId}`);
        console.log('[Revision History] Response status:', response.status);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('[Revision History] API returned non-JSON response');
            if (historySection) historySection.style.display = 'none';
            return;
        }
        
        const result = await response.json();
        console.log('[Revision History] API Response:', result);
        console.log('[Revision History] Revisions count:', result.revisions?.length || 0);
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            console.log('[Revision History] Showing section with', result.revisions.length, 'revisions');
            
            // Show the revision history section
            if (historySection) {
                historySection.style.display = 'block';
                console.log('[Revision History] Section display set to block');
            }
            
            // Clear container
            historyContainer.innerHTML = '';
            
            // Render each revision entry with enumeration
            result.revisions.forEach((revision, index) => {
                console.log('[Revision History] Rendering revision', index, ':', revision.type);
                const entry = createRevisionEntry(revision, index, result.revisions.length);
                historyContainer.appendChild(entry);
            });
            
            console.log('[Revision History] All revisions rendered');
            
            // Show action buttons within revision history
            const revisionHistoryActions = document.getElementById('revisionHistoryActions');
            if (revisionHistoryActions) {
                revisionHistoryActions.style.display = 'flex';
            }
            
            // Hide the regular approval actions panel since we have revision history
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            if (approvalActionsPanel) {
                approvalActionsPanel.style.display = 'none';
            }
        } else {
            console.log('[Revision History] No revisions to display');
            // Hide section if no revisions or not an approval request
            if (historySection) historySection.style.display = 'none';
            
            // Show the regular approval actions panel
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            if (approvalActionsPanel) {
                approvalActionsPanel.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('[Revision History] Error loading:', error);
        // Silently hide section on error (common for service requests)
        if (historySection) historySection.style.display = 'none';
    }
}

// Function: createRevisionEntry
function createRevisionEntry(revision, index, total) {
    const entry = document.createElement('div');
    
    // Determine if this is a unit action (revision/revoke) or requestor action (initial/resubmit)
    const isUnitAction = revision.type === 'revision' || revision.type === 'revoked';
    const isRequestorAction = revision.type === 'initial' || revision.type === 'resubmitted';
    
    entry.className = `revision-conversation-item ${isUnitAction ? 'unit-message' : 'requestor-message'}`;
    
    // Format detailed timestamp
    const date = new Date(revision.timestamp);
    const fullTimestamp = date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const shortTimestamp = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get relative time
    const now = new Date();
    const diffMs = now - date;
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
    } else if (revision.type === 'revoked') {
        typeLabel = 'Approval Revoked - Revision Required';
        badgeClass = 'badge-revoked';
    } else if (revision.type === 'resubmitted') {
        typeLabel = 'Resubmitted for Review';
        badgeClass = 'badge-resubmitted';
    } else {
        typeLabel = 'Revision Requested';
        badgeClass = 'badge-revision';
    }
    
    const isLast = index === total - 1;
    
    // Calculate revision/resubmission numbers
    let revisionNumber = 0;
    let resubmissionNumber = 0;
    for (let i = 0; i <= index; i++) {
        // This would need the full array, so we'll use index + 1 as approximation
        if (revision.type === 'revision' || revision.type === 'revoked') {
            revisionNumber = index; // Will be corrected in next iteration
        } else if (revision.type === 'resubmitted') {
            resubmissionNumber = index;
        }
    }
    
    // Determine status indicator for unit messages
    let statusIndicator = '';
    if (isUnitAction && isLast) {
        statusIndicator = `
            <div class="status-indicator waiting">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Waiting for Requestor Response</span>
            </div>
        `;
    } else if (isRequestorAction && isLast) {
        statusIndicator = `
            <div class="status-indicator review">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Under Unit Review</span>
            </div>
        `;
    }
    
    entry.innerHTML = `
        <div class="conversation-timeline-line ${isLast ? 'last-item' : ''}"></div>
        <div class="revision-number-badge ${isUnitAction ? 'unit-number' : 'requestor-number'}">
            #${index + 1}
        </div>
        <div class="conversation-message-bubble ${isUnitAction ? 'unit-bubble' : 'requestor-bubble'}">
            <div class="message-header-row">
                <div class="message-sender-info">
                    <div class="sender-details">
                        <span class="sender-name">${revision.by || 'Unknown'}</span>
                        <span class="sender-role">${isUnitAction ? 'Unit Team' : 'Requestor'}</span>
                    </div>
                </div>
                <span class="message-badge ${badgeClass}">${typeLabel}</span>
            </div>
            
            <div class="message-timestamp-row">
                <span class="timestamp-full" title="${fullTimestamp}">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    ${fullTimestamp}
                </span>
                <span class="timestamp-relative">${relativeTime}</span>
            </div>
            
            ${revision.description ? `
                <div class="message-content-section">
                    <div class="content-label">${isUnitAction ? 'Unit Feedback:' : 'Submission Details:'}</div>
                    <div class="content-text">${escapeHtml(revision.description)}</div>
                </div>
            ` : ''}
            
            ${revision.files && revision.files.length > 0 ? `
                <div class="message-attachments-section">
                    <div class="attachments-header">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span class="attachments-count">${revision.files.length} file${revision.files.length > 1 ? 's' : ''} attached</span>
                    </div>
                    <div class="attachments-grid">
                        ${revision.files.map(file => createRevisionFileCard(file)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${statusIndicator}
        </div>
    `;
    
    return entry;
}

// Function: createRevisionFileCard
function createRevisionFileCard(file) {
    // Handle different file object formats
    const filename = file.filename || file.path || file.name || file;
    
    // If file is just a string (simple filename), use it directly
    if (typeof file === 'string') {
        const ext = file.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isPDF = ext === 'pdf';
        
        let iconColor = '#64748b';
        if (isImage) iconColor = '#059669';
        else if (isPDF) iconColor = '#dc2626';
        else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
        else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
        
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
                </div>
                <div class="revision-file-actions">
                    <a href="/uploads/${file}" download="${escapeHtml(file)}" class="revision-file-btn" title="Download">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </a>
                </div>
            </div>
        `;
    }
    
    // Handle file objects
    const ext = filename.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPDF = ext === 'pdf';
    
    let iconColor = '#64748b';
    if (isImage) iconColor = '#059669';
    else if (isPDF) iconColor = '#dc2626';
    else if (['doc', 'docx'].includes(ext)) iconColor = '#2563eb';
    else if (['xls', 'xlsx'].includes(ext)) iconColor = '#16a34a';
    
    const displayName = file.originalname || file.name || filename;
    
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
                <div class="revision-file-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</div>
                <div class="revision-file-size">${ext.toUpperCase()}</div>
            </div>
            <div class="revision-file-actions">
                ${isPDF ? `
                    <button class="revision-file-btn" onclick="viewPdf('/uploads/${file.filename}', '${escapeHtml(file.originalname || file.filename)}')" title="View PDF">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                ` : ''}
                ${isImage ? `
                    <button class="revision-file-btn" onclick="viewImage('/uploads/${file.filename}', '${escapeHtml(file.originalname || file.filename)}')" title="View Image">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                ` : ''}
                <a href="/uploads/${file.filename}" download="${escapeHtml(file.originalname || file.filename)}" class="revision-file-btn" title="Download">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </a>
            </div>
        </div>
    `;
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
function approveRequest() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Show approval confirmation modal
    showApprovalConfirmationModal();
}

function showApprovalConfirmationModal() {
    console.log('[DEBUG] Creating approval confirmation modal');
    
    // Remove any existing modal first
    const existingModal = document.querySelector('.confirmation-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal-overlay';
    modal.setAttribute('id', 'approvalConfirmationModal');
    modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 1000000 !important;';
    
    modal.innerHTML = `
        <div class="confirmation-modal" style="background: white !important; border-radius: 12px !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important; max-width: 450px !important; width: 90% !important; overflow: visible !important; position: relative !important; z-index: 1000001 !important; max-height: auto !important;">
            <div class="confirmation-header" style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 1rem 1.25rem; text-align: center; color: white;">
                <svg width="32" height="32" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24" style="margin-bottom: 0.25rem;">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="8 12 11 15 16 9"/>
                </svg>
                <h2 style="margin: 0; font-size: 1.125rem; font-weight: 700;">Approve Request</h2>
            </div>
            <div class="confirmation-body" style="padding: 1.25rem;">
                <p style="margin: 0 0 0.375rem 0; font-size: 0.875rem; color: #334155; line-height: 1.4;">Are you sure you want to approve this request?</p>
                <p class="confirmation-note" style="font-size: 0.75rem; color: #64748b; font-style: italic; margin: 0;">This action will notify the requestor and all administrators.</p>
            </div>
            <div class="confirmation-actions" style="padding: 0.875rem 1.25rem; background: #f8fafc; display: flex; gap: 0.625rem; justify-content: flex-end; border-top: 1px solid #e2e8f0;">
                <button class="confirmation-btn confirmation-btn-cancel" onclick="window.closeConfirmationModal()" style="padding: 0.5rem 1rem; border: none; border-radius: 6px; font-weight: 600; font-size: 0.8125rem; cursor: pointer; background: #e2e8f0; color: #475569;">Cancel</button>
                <button class="confirmation-btn confirmation-btn-confirm" onclick="window.confirmApproveRequest()" style="padding: 0.5rem 1rem; border: none; border-radius: 6px; font-weight: 600; font-size: 0.8125rem; cursor: pointer; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">Approve Request</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('[DEBUG] Modal appended to body, element:', modal);
    
    // Force reflow to ensure styles are applied
    modal.offsetHeight;
    
    // Debug computed styles
    const computedStyles = window.getComputedStyle(modal);
    console.log('[DEBUG] Approval modal computed styles:', {
        display: computedStyles.display,
        position: computedStyles.position,
        zIndex: computedStyles.zIndex,
        visibility: computedStyles.visibility,
        opacity: computedStyles.opacity,
        pointerEvents: computedStyles.pointerEvents
    });
}

async function confirmApproveRequest() {
    console.log('[DEBUG] Confirming approval');
    window.closeConfirmationModal();
    
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
            
            // Update modal UI immediately
            const approvalStatusIndicator = document.getElementById('approvalStatusIndicator');
            const approvalActionButtons = document.getElementById('approvalActionButtons');
            const revisionHistorySection = document.getElementById('revisionHistorySection');
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            const modalStatus = document.getElementById('modalStatus');
            
            if (approvalStatusIndicator) approvalStatusIndicator.style.display = 'block';
            if (approvalActionButtons) approvalActionButtons.style.display = 'none';
            if (revisionHistorySection) revisionHistorySection.style.display = 'none';
            if (approvalActionsPanel) approvalActionsPanel.style.display = 'none';
            if (modalStatus) {
                modalStatus.textContent = 'APPROVED';
                modalStatus.className = 'status-badge approved';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'APPROVED';
                    statusCell.className = 'status approved';
                }
            }
        } else {
            showErrorMessage(result.message || 'Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('An error occurred while approving the request');
    }
}

// Function: revokeApproval
function revokeApproval() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    // Show revoke approval form
    const revokeForm = document.getElementById('revokeApprovalForm');
    if (revokeForm) {
        revokeForm.style.display = 'block';
    }
}

// Function: hideRevokeForm
function hideRevokeForm() {
    const revokeForm = document.getElementById('revokeApprovalForm');
    if (revokeForm) {
        revokeForm.style.display = 'none';
    }

    const revokeReasonText = document.getElementById('revokeReasonText');
    if (revokeReasonText) {
        revokeReasonText.value = '';
    }
}

// Function: submitRevokeApproval
async function submitRevokeApproval() {
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }

    const reasonText = document.getElementById('revokeReasonText');
    const reason = reasonText ? reasonText.value.trim() : '';
    
    try {
        const response = await fetch(`/unit/task/revoke-approval/${currentRequestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason || '' })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showSuccessMessage('Approval revoked. Status changed to For Revision.');
            
            // Hide revoke form and approval indicator
            hideRevokeForm();
            
            // Update modal UI immediately
            const approvalStatusIndicator = document.getElementById('approvalStatusIndicator');
            const revisionHistorySection = document.getElementById('revisionHistorySection');
            const approvalActionsPanel = document.getElementById('approvalActionsPanel');
            const modalStatus = document.getElementById('modalStatus');
            const revokeApprovalForm = document.getElementById('revokeApprovalForm');
            
            if (approvalStatusIndicator) approvalStatusIndicator.style.display = 'none';
            if (revokeApprovalForm) revokeApprovalForm.style.display = 'none';
            if (approvalActionsPanel) approvalActionsPanel.style.display = 'none';
            if (modalStatus) {
                modalStatus.textContent = 'FOR REVISION';
                modalStatus.className = 'status-badge for-revision';
            }
            
            // Reload revision history to show the revocation
            if (currentRequestId) {
                loadRevisionHistory(currentRequestId);
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR REVISION';
                    statusCell.className = 'status for-revision';
                }
            }
        } else {
            showErrorMessage(result.message || 'Failed to revoke approval');
        }
    } catch (error) {
        console.error('Error revoking approval:', error);
        showErrorMessage('An error occurred while revoking the approval');
    }
}

// Global function to close confirmation modal
window.closeConfirmationModal = function() {
    const modal = document.querySelector('.confirmation-modal-overlay');
    if (modal) {
        modal.remove();
    }
};

window.confirmApproveRequest = confirmApproveRequest;

// Function: showRevisionForm
function showRevisionForm() {
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.style.display = 'block';
        
        // Scroll the form into view smoothly
        setTimeout(() => {
            revisionForm.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
            
            // Focus on the textarea
            const revisionComments = document.getElementById('revisionComments');
            if (revisionComments) {
                revisionComments.focus();
            }
        }, 100);
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
            
            // Clear and hide revision form
            document.getElementById('revisionComments').value = '';
            clearAllRevisionFiles();
            hideRevisionForm();
            
            // Reload revision history to show the new revision
            await loadRevisionHistory(currentRequestId);
            
            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'FOR REVISION';
                modalStatus.className = 'status-badge for-revision';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR REVISION';
                    statusCell.className = 'status for-revision';
                }
            }
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

            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'FOR CHECKING';
                modalStatus.className = 'status-badge for-checking';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'FOR CHECKING';
                    statusCell.className = 'status for-checking';
                }
            }
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
            
            // Update modal status
            const modalStatus = document.getElementById('modalStatus');
            if (modalStatus) {
                modalStatus.textContent = 'COMPLETED';
                modalStatus.className = 'status-badge completed';
            }
            
            // Update table row status in background without reload
            const tableRow = document.querySelector(`tr[data-request-id="${currentRequestId}"]`);
            if (tableRow) {
                const statusCell = tableRow.querySelector('.status');
                if (statusCell) {
                    statusCell.textContent = 'COMPLETED';
                    statusCell.className = 'status completed';
                }
            }
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
                // Skip revision-related messages (they appear in revision history instead)
                const content = message.content || '';
                if (content.includes('Revision Request') || 
                    content.includes('REVISION REQUEST') ||
                    content.includes('Approval Revoked') || 
                    content.includes('APPROVAL REVOKED') ||
                    content.includes('RESUBMITTED') ||
                    content.includes('Revision Required')) {
                    return; // Skip this message
                }
                
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
            // Reload conversation to show the new message
            loadTeamConversation(currentRequestId);

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

// Expose helper functions globally for createMessageElement
window.escapeHtml = escapeHtml;
window.formatText = formatText;

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
    const isOwnMessage = window.currentUserRole && msg.senderRole === window.currentUserRole;
    
    // Role-based styling (matching Admin)
    let roleClass = 'user-message';
    let roleColor = '#e0f2fe'; // Light blue for users
    
    if (isOwnMessage) {
        roleClass = 'own-message';
        roleColor = '#ffffff'; // White for own messages (matches Admin)
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
    
    // Build read receipts display
    let readReceiptsHTML = '';
    if (msg.readBy && msg.readBy.length > 0 && isOwnMessage) {
        const readers = msg.readBy
            .filter(r => r.userId && r.userId.fName)
            .map(r => `${r.userId.fName} ${r.userId.lName}`)
            .join(', ');
        if (readers) {
            readReceiptsHTML = `
                <div class="message-read-receipt">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Seen by ${readers}</span>
                </div>
            `;
        }
    }
    
    div.innerHTML = `
        <div class="unit-message-bubble ${roleClass}">
            <div class="message-header">
                <strong>${window.escapeHtml(msg.senderName || 'Unknown')} <span style="font-size: 0.75rem; opacity: 0.7;">(${msg.senderRole})</span></strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${window.formatText(msg.content || '')}</div>
            ${attachmentsHTML}
            ${readReceiptsHTML}
        </div>
    `;
    
    return div;
}

async function sendTeamMessage() {
    const input = document.getElementById('teamMessageInput');
    const content = input ? input.value.trim() : '';
    
    if (!content && chatFiles.length === 0) {
        showErrorMessage('Please enter a message or select a file');
        return;
    }
    
    if (!currentRequestId) {
        showErrorMessage('No request selected');
        return;
    }
    
    try {
        console.log('[AllTasks] Sending message with', chatFiles.length, 'files');
        let response;
        
        if (chatFiles.length > 0) {
            // Send with file attachments using FormData
            const formData = new FormData();
            formData.append('content', content || '');
            
            // Append all files with 'chatFiles' field name
            chatFiles.forEach(file => {
                formData.append('chatFiles', file);
            });
            
            console.log('[AllTasks] FormData prepared with chatFiles field');
            
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
        console.log('[AllTasks] Message sent successfully');
        if (input) input.value = '';
        clearAllChatFiles();
        // Reload conversation to show new message
        await loadTeamConversation(currentRequestId);
        console.log('[AllTasks] Conversation reloaded');
    } catch (error) {
        console.error('[AllTasks] Error sending message:', error);
        showErrorMessage('Failed to send message: ' + error.message);
    }
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
    // Text formatting buttons for revision
    const formatBtns = document.querySelectorAll('.revision-format-toolbar .format-btn[data-format]');
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            applyRevisionFormat(format);
        });
    });

    // Text formatting buttons for revoke approval
    const revokeFormatBtns = document.querySelectorAll('.revision-format-toolbar .format-btn[data-revoke-format]');
    revokeFormatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.getAttribute('data-revoke-format');
            applyRevokeFormat(format);
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

// Define globally so it can be accessed from EJS keyboard shortcuts
window.applyRevisionFormat = function(format) {
    const textarea = document.getElementById('revisionComments');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText) {
        alert('Please select text to format');
        return;
    }
    
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
};

// Create local alias for consistency
function applyRevisionFormat(format) {
    window.applyRevisionFormat(format);
}

// Apply formatting to revoke reason textarea
window.applyRevokeFormat = function(format) {
    const textarea = document.getElementById('revokeReasonText');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText) {
        // If no text selected, just focus the textarea
        textarea.focus();
        return;
    }
    
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
};

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

