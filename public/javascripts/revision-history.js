/**
 * Revision History Module
 * Shared functions for displaying revision history across all pages
 */

/**
 * Load and display revision history for a request
 * @param {string} requestId - The request ID to load history for
 */
async function loadRevisionHistory(requestId) {
    const historySection = document.getElementById('revisionHistorySection');
    const historyContainer = document.getElementById('revisionHistoryContainer');
    
    if (!historyContainer) return;
    
    try {
        const response = await fetch(`/api/revision-history/${requestId}`);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Revision history API returned non-JSON response');
            // Keep section visible - it will show empty state
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available</p>';
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.revisions && result.revisions.length > 0) {
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '';
            
            result.revisions.forEach((revision, index) => {
                const entry = createRevisionEntry(revision, index, result.revisions.length);
                historyContainer.appendChild(entry);
            });
        } else {
            // Show section but with empty state message
            if (historySection) historySection.style.display = 'block';
            historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">No revision history available</p>';
        }
    } catch (error) {
        // Show section with error message instead of hiding
        console.error('Error loading revision history:', error);
        if (historySection) historySection.style.display = 'block';
        historyContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 2rem 0;">Unable to load revision history</p>';
    }
}

/**
 * Create a revision entry DOM element
 * @param {Object} revision - Revision data object
 * @param {number} index - Index in the revisions array
 * @param {number} total - Total number of revisions
 * @returns {HTMLElement} The revision entry element
 */
function createRevisionEntry(revision, index, total) {
    const entry = document.createElement('div');
    entry.className = `revision-entry ${revision.type}`;
    
    let iconSvg = '';
    let typeLabel = '';
    
    if (revision.type === 'initial') {
        typeLabel = 'Initial Submission';
        iconSvg = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>`;
    } else if (revision.type === 'revoked') {
        typeLabel = 'Approval Revoked';
        iconSvg = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`;
    } else if (revision.type === 'resubmitted') {
        typeLabel = 'Resubmission';
        iconSvg = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
        </svg>`;
    }
    
    const timestamp = new Date(revision.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    entry.innerHTML = `
        <div class="revision-icon">${iconSvg}</div>
        <div class="revision-header">
            <div>
                <h4 class="revision-title">${typeLabel}</h4>
                <div class="revision-meta">
                    <span class="revision-timestamp">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${timestamp}
                    </span>
                    ${revision.by ? `<span class="revision-by">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${escapeHtml(revision.by)}
                    </span>` : ''}
                </div>
            </div>
        </div>
        ${revision.description ? `<div class="revision-description">${escapeHtml(revision.description)}</div>` : ''}
        ${revision.files && revision.files.length > 0 ? `
            <div class="revision-files">
                <div class="revision-files-header">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    ${revision.files.length} file(s) attached
                </div>
                <div class="revision-files-grid">
                    ${revision.files.map(file => createRevisionFileCard(file)).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    return entry;
}

/**
 * Create a file card for a revision file
 * @param {Object|string} file - File data object or filename string
 * @returns {string} HTML string for the file card
 */
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
                    <div class="revision-file-name" title="${escapeHtml(file)}">
                        ${escapeHtml(file)}
                    </div>
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
                <div class="revision-file-name" title="${escapeHtml(displayName)}">
                    ${escapeHtml(displayName)}
                </div>
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
