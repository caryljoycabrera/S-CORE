// ===== Reports Page Client-Side Logic =====
// Handles filtering, data fetching, and export functionality for the reports page

document.addEventListener('DOMContentLoaded', () => {

  // ==================== DOM Elements ====================
  const datePreset = document.getElementById('date-range-preset');
  const monthlyOptions = document.getElementById('monthly-options');
  const quarterlyOptions = document.getElementById('quarterly-options');
  const customOptions = document.getElementById('custom-date-options');
  
  const applyBtn = document.getElementById('apply-filters-btn');
  const previewBody = document.getElementById('report-preview-body');

  const exportExcelBtn = document.getElementById('export-excel-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');

  // ==================== Event Listeners ====================
  
  /**
   * Show/Hide date options based on preset selection
   */
  datePreset.addEventListener('change', () => {
    // Hide all date options first
    monthlyOptions.style.display = 'none';
    quarterlyOptions.style.display = 'none';
    customOptions.style.display = 'none';

    // Show the selected option
    if (datePreset.value === 'monthly') {
      monthlyOptions.style.display = 'flex';
    } else if (datePreset.value === 'quarterly') {
      quarterlyOptions.style.display = 'flex';
    } else if (datePreset.value === 'custom') {
      customOptions.style.display = 'flex';
    }
  });

  /**
   * Generate Preview Button - Fetches and displays report data
   */
  applyBtn.addEventListener('click', async () => {
    await fetchReportData();
  });

  /**
   * Export Excel Button - Downloads report as Excel file
   */
  exportExcelBtn.addEventListener('click', () => {
    exportReport('excel');
  });

  /**
   * Export PDF Button - Downloads report as PDF file
   */
  exportPdfBtn.addEventListener('click', () => {
    exportReport('pdf');
  });

  // ==================== Data Fetching ====================
  
  /**
   * Fetches report data from the server based on current filters
   */
  async function fetchReportData() {
    // Show loading state
    previewBody.innerHTML = '<tr><td colspan="8" class="loading-state">Loading data</td></tr>';
    
    const params = getFilterParams();
    
    try {
      const response = await fetch(`/api/admin/report-data?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch data');
      }
      
      renderPreviewTable(data.requests || []);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      previewBody.innerHTML = `<tr><td colspan="8" class="empty-state">Failed to load data: ${error.message}</td></tr>`;
    }
  }

  // ==================== Helper Functions ====================
  
  /**
   * Builds URL parameters from current filter selections
   * @returns {URLSearchParams} Query parameters for API request
   */
  function getFilterParams() {
    const params = new URLSearchParams();
    
    // A. Date Range Parameters
    const preset = datePreset.value;
    params.append('datePreset', preset);
    
    if (preset === 'monthly') {
      const month = document.getElementById('month-select').value;
      const year = document.getElementById('month-year').value;
      params.append('month', month);
      params.append('year', year);
    } else if (preset === 'quarterly') {
      const quarter = document.getElementById('quarter-select').value;
      const year = document.getElementById('quarter-year').value;
      params.append('quarter', quarter);
      params.append('year', year);
    } else if (preset === 'custom') {
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    }

    // B. Unit Filter (multi-select)
    const unitFilter = document.getElementById('unit-filter');
    const selectedUnits = Array.from(unitFilter.selectedOptions).map(opt => opt.value);
    
    if (selectedUnits.includes('all') || selectedUnits.length === 0) {
      params.append('unit', 'all');
    } else {
      selectedUnits.forEach(unit => params.append('unit', unit));
    }

    // C. Request Type Filter
    const requestType = document.getElementById('type-filter').value;
    params.append('requestType', requestType);
    
    // D. Status Filter
    const status = document.getElementById('status-filter').value;
    params.append('status', status);
    
    return params;
  }

  /**
   * Renders the report data into the preview table
   * @param {Array} requests - Array of request objects
   */
  function renderPreviewTable(requests) {
    if (!requests || requests.length === 0) {
      previewBody.innerHTML = '<tr><td colspan="8" class="empty-state">No data found for the selected criteria.</td></tr>';
      return;
    }

    let html = '';
    requests.forEach(req => {
      // Determine the organization/department to display
      let displayOrganization = 'N/A';
      if (req.userId) {
        if (req.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(req.userId.affiliation)
            ? req.userId.affiliation.join(', ')
            : (req.userId.affiliation || req.organization || 'N/A');
        } else {
          displayOrganization = Array.isArray(req.userId.studentOrganization)
            ? req.userId.studentOrganization.join(', ')
            : (req.userId.studentOrganization || req.organization || 'N/A');
        }
      } else if (req.organization) {
        displayOrganization = req.organization;
      }

      // Determine completion date (when status changed to Completed or Approved)
      let completionDate = 'N/A';
      if (req.status === 'Completed' || req.status === 'Approved') {
        completionDate = formatDate(req.updatedAt);
      }

      html += `
        <tr>
          <td>${escapeHtml(displayOrganization)}</td>
          <td>${escapeHtml(req.title || 'N/A')}</td>
          <td>${escapeHtml(truncateText(req.description || 'N/A', 100))}</td>
          <td>${escapeHtml(req.assignedUnits || 'Not yet assigned')}</td>
          <td>${formatDate(req.createdAt || req.datetime)}</td>
          <td>${completionDate}</td>
          <td><span class="status-badge status-${sanitizeStatusClass(req.status)}">${escapeHtml(req.status)}</span></td>
          <td>${escapeHtml(req.specificRequestType || '')}</td>
        </tr>
      `;
    });
    
    previewBody.innerHTML = html;
  }

  /**
   * Formats date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Truncates text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Escapes HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitizes status string for CSS class name
   * @param {string} status - Status string
   * @returns {string} Sanitized status class
   */
  function sanitizeStatusClass(status) {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Initiates report export by opening download URL
   * @param {string} format - Export format ('excel' or 'pdf')
   */
  function exportReport(format) {
    const params = getFilterParams();
    const url = `/admin/export/${format}?${params.toString()}`;
    
    // Open in new window to trigger download
    window.open(url, '_blank');
  }

  // ==================== Initialize ====================
  
  /**
   * Set default year values to current year
   */
  const currentYear = new Date().getFullYear();
  document.getElementById('month-year').value = currentYear;
  document.getElementById('quarter-year').value = currentYear;

  // Optional: Auto-load data on page load
  // Uncomment the line below if you want to automatically generate preview on page load
  // fetchReportData();
});
