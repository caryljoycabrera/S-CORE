/* =============================================================================
   REPORTS.JS - JavaScript Functionality for Reports.ejs
   =============================================================================
   Purpose: Interactive features for the S-CORE Admin Reports page
   Connected file: views/Admin/reports.ejs
   Dependencies: alert-handler.js, notifications.js
   ============================================================================= */

/* ==========================================
   REPORT HANDLER
   ========================================== */

const reportHandler = {
  currentData: null,

  /**
   * Validate filter inputs in real-time
   */
  validateFilters() {
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    const dateRangeError = document.getElementById('dateRangeError');
    const startDateInput = document.getElementById('startDateFilter');
    const endDateInput = document.getElementById('endDateFilter');
    const generateBtn = document.getElementById('generatePreviewBtn');
    
    // Reset errors
    dateRangeError.style.display = 'none';
    startDateInput.classList.remove('error');
    endDateInput.classList.remove('error');
    
    let hasError = false;

    // Validate date range only if both dates are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        hasError = true;
        dateRangeError.textContent = 'End date must be after start date';
        dateRangeError.style.display = 'block';
        startDateInput.classList.add('error');
        endDateInput.classList.add('error');
      }
    }

    // Enable/disable generate button based on validation
    if (hasError) {
      generateBtn.disabled = true;
      return false;
    } else {
      generateBtn.disabled = false;
      return true;
    }
  },

  /**
   * Get filter values from form
   */
  getFilters() {
    // Get checked units
    const unitCheckboxes = document.querySelectorAll('input[data-filter=\"unit\"]:checked');
    const units = Array.from(unitCheckboxes)
      .map(cb => cb.value)
      .filter(v => v); // Remove empty values (from "All Units")

    // Get checked statuses
    const statusCheckboxes = document.querySelectorAll('input[data-filter=\"status\"]:checked');
    const statuses = Array.from(statusCheckboxes)
      .map(cb => cb.value)
      .filter(v => v); // Remove empty values (from "All Statuses")

    // Get selected request type
    const requestTypeRadio = document.querySelector('input[name=\"requestType\"]:checked');
    const requestType = requestTypeRadio ? requestTypeRadio.value : '';

    return {
      startDate: document.getElementById('startDateFilter').value,
      endDate: document.getElementById('endDateFilter').value,
      units: units,
      requestType: requestType,
      statuses: statuses,
      sortBy: document.getElementById('sortByFilter').value,
      sortOrder: document.getElementById('sortOrderFilter').value
    };
  },

  /**
   * Generate preview report
   */
  async generatePreview() {
    // Validate filters first
    if (!this.validateFilters()) {
      showAlert('Please fix the date range errors before generating the report', 'error');
      return;
    }

    const loading = document.getElementById('loadingIndicator');
    loading.style.display = 'flex';

    try {
      const filters = this.getFilters();

      const response = await fetch('/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentData = result.data;
        this.displayTable(result.data);
        this.displayStats(result.summary);

        // Enable export buttons
        document.getElementById('exportPdfBtn').disabled = false;
        document.getElementById('exportExcelBtn').disabled = false;

        showAlert(`Report generated with ${result.recordCount || 0} records`, 'success');
      } else {
        showAlert(result.message || 'Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      showAlert('An error occurred while generating the report', 'error');
    } finally {
      loading.style.display = 'none';
    }
  },

  /**
   * Display table data
   */
  displayTable(data) {
    const tbody = document.getElementById('reportTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr class="no-data-row"><td colspan="10" style="text-align: center; padding: 2rem;">No records found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(record => {
      const dateSubmitted = this.formatDate(record.dateSubmitted);
      const deadline = this.formatDate(record.deadline);
      const statusClass = (record.status || '').toLowerCase().replace(/\s+/g, '-');

      return `
        <tr>
          <td><strong>${this.escapeHtml(record.requestId || 'N/A')}</strong></td>
          <td>${this.escapeHtml(record.type || 'N/A')}</td>
          <td>${this.escapeHtml(record.requester || 'N/A')}</td>
          <td>${this.escapeHtml(record.unit || 'N/A')}</td>
          <td>${this.escapeHtml(record.requestName || 'N/A')}</td>
          <td>
            <span class="status-badge status-${statusClass}">
              ${this.escapeHtml(record.status || 'N/A')}
            </span>
          </td>
          <td>${dateSubmitted}</td>
          <td>${deadline}</td>
          <td>${record.revisions || 0}</td>
          <td>${record.finalRemarks ? this.escapeHtml(record.finalRemarks) : ''}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Display statistics
   */
  displayStats(summary) {
    if (!summary) return;

    document.getElementById('reportStats').style.display = 'block';
    document.getElementById('statTotal').textContent = summary.totalRequests || 0;
    document.getElementById('statCompletionRate').textContent = (summary.completionRate || 0) + '%';
    document.getElementById('statPending').textContent = (summary.byStatus && summary.byStatus['Pending']) || 0;
    document.getElementById('statInProgress').textContent = (summary.byStatus && summary.byStatus['In Progress']) || 0;
  },

  /**
   * Clear all filters
   */
  clearFilters() {
    // Clear date fields
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    document.getElementById('datePresetFilter').value = '';
    
    // Reset unit checkboxes - check "All Units" and uncheck others
    document.getElementById('allUnitsCheckbox').checked = true;
    document.querySelectorAll('input[data-filter="unit"]').forEach(cb => {
      if (cb.id !== 'allUnitsCheckbox') cb.checked = false;
    });
    if (typeof updateDropdownText === 'function') updateDropdownText('unit');
    
    // Reset request type
    const requestTypeFilter = document.getElementById('requestTypeFilter');
    if (requestTypeFilter) requestTypeFilter.value = '';
    
    // Reset status checkboxes - check "All Statuses" and uncheck others
    document.getElementById('allStatusesCheckbox').checked = true;
    document.querySelectorAll('input[data-filter="status"]').forEach(cb => {
      if (cb.id !== 'allStatusesCheckbox') cb.checked = false;
    });
    if (typeof updateDropdownText === 'function') updateDropdownText('status');
    
    // Reset sort options
    document.getElementById('sortByFilter').value = 'createdAt';
    document.getElementById('sortOrderFilter').value = 'desc';
    
    // Clear validation errors
    const dateRangeError = document.getElementById('dateRangeError');
    if (dateRangeError) dateRangeError.style.display = 'none';
    document.getElementById('startDateFilter').classList.remove('error');
    document.getElementById('endDateFilter').classList.remove('error');
    const generateBtn = document.getElementById('generatePreviewBtn');
    if (generateBtn) generateBtn.disabled = false;
    
    // Clear table
    document.getElementById('reportTableBody').innerHTML = '<tr class="no-data-row"><td colspan="10" style="text-align: center; padding: 2rem;">Click "Generate Preview" to load data</td></tr>';
    document.getElementById('reportStats').style.display = 'none';
    document.getElementById('exportPdfBtn').disabled = true;
    document.getElementById('exportExcelBtn').disabled = true;
  },

  /**
   * Export to PDF (downloads the file)
   */
  async exportPDF() {
    if (!this.currentData || this.currentData.length === 0) {
      showAlert('No data to export', 'error');
      return;
    }

    const filters = this.getFilters();
    const loading = document.getElementById('loadingIndicator');
    const exportBtn = document.getElementById('exportPdfBtn');
    const originalText = exportBtn.innerHTML;

    loading.style.display = 'flex';
    exportBtn.innerHTML = 'Downloading...';

    try {
      const fileName = document.getElementById('pdfFileName').value || 's-core-report';
      const title = document.getElementById('pdfTitle').value || 'S-CORE Analytics Report';
      const description = document.getElementById('pdfDescription').value || '';
      const headerColor = document.getElementById('pdfHeaderColor').value || '#10b981';
      const headerTextsColor = document.getElementById('pdfHeaderTextsColor').value || '#ffffff';
      const paperSize = document.getElementById('pdfPaperSize').value || 'A4';
      const orientation = document.getElementById('pdfOrientation').value || 'portrait';
      
      const response = await fetch('/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...filters, format: 'pdf', fileName, title, description, headerColor, headerTextsColor, paperSize, orientation })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      exportBtn.innerHTML = 'Success';
      showAlert('PDF report downloaded successfully', 'success');

      // Reset button text after 3 seconds
      setTimeout(() => {
        exportBtn.innerHTML = originalText;
      }, 3000);

    } catch (error) {
      console.error('Error exporting PDF report:', error);
      showAlert('Failed to export PDF report', 'error');
      exportBtn.innerHTML = originalText;
    } finally {
      loading.style.display = 'none';
    }
  },

  /**
   * Export to Excel (downloads the file)
   */
  async exportExcel() {
    if (!this.currentData || this.currentData.length === 0) {
      showAlert('No data to export', 'error');
      return;
    }

    const filters = this.getFilters();
    const loading = document.getElementById('loadingIndicator');
    const exportBtn = document.getElementById('exportExcelBtn');
    const originalText = exportBtn.innerHTML;

    loading.style.display = 'flex';
    exportBtn.innerHTML = 'Downloading...';

    try {
      const fileName = document.getElementById('pdfFileName').value || 's-core-report';
      const title = document.getElementById('pdfTitle').value || 'S-CORE Analytics Report';
      const description = document.getElementById('pdfDescription').value || '';
      const headerColor = document.getElementById('pdfHeaderColor').value || '#10b981';
      const headerTextsColor = document.getElementById('pdfHeaderTextsColor').value || '#ffffff';
      
      const response = await fetch('/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...filters, format: 'excel', fileName, title, description, headerColor, headerTextsColor })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      exportBtn.innerHTML = 'Success';
      showAlert('Excel report downloaded successfully', 'success');

      // Reset button text after 3 seconds
      setTimeout(() => {
        exportBtn.innerHTML = originalText;
      }, 3000);

    } catch (error) {
      console.error('Error exporting Excel report:', error);
      showAlert('Failed to export Excel report', 'error');
      exportBtn.innerHTML = originalText;
    } finally {
      loading.style.display = 'none';
    }
  },

  /**
   * Format date for display (Month Day, Year format)
   */
  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  /**
   * Escapes HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

/* ==========================================
   EVENT LISTENERS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Generate Preview Button
  const generatePreviewBtn = document.getElementById('generatePreviewBtn');
  if (generatePreviewBtn) {
    generatePreviewBtn.addEventListener('click', () => {
      reportHandler.generatePreview();
    });
  }

  // Clear Filters Button
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      reportHandler.clearFilters();
    });
  }

  // Export PDF Button
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      reportHandler.exportPDF();
    });
  }

  // Export Excel Button
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      reportHandler.exportExcel();
    });
  }

  // Date Preset Quick Select
  const datePresetFilter = document.getElementById('datePresetFilter');
  if (datePresetFilter) {
    datePresetFilter.addEventListener('change', (e) => {
      const days = parseInt(e.target.value);
      if (days) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);

        document.getElementById('startDateFilter').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDateFilter').value = endDate.toISOString().split('T')[0];
        
        // Validate after setting dates
        reportHandler.validateFilters();
      }
    });
  }

  // Sidebar hover
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) {
    sidebar.addEventListener('mouseenter', function() {
      this.classList.add('expanded');
    });
    sidebar.addEventListener('mouseleave', function() {
      this.classList.remove('expanded');
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById('adminMenuToggle');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('mobile-active');
    });
  }

  // Dropdown toggle
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdownMenu = document.getElementById('dropdownMenu');
  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
  }

  // Header color change listener for preview
  const headerColorInput = document.getElementById('pdfHeaderColor');
  if (headerColorInput) {
    headerColorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      const tableHeaders = document.querySelectorAll('.report-table th');
      tableHeaders.forEach(th => {
        th.style.backgroundColor = color;
      });
    });
  }

  // Header text color change listener for preview
  const headerTextsColorInput = document.getElementById('pdfHeaderTextsColor');
  if (headerTextsColorInput) {
    headerTextsColorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      const tableHeaders = document.querySelectorAll('.report-table th');
      tableHeaders.forEach(th => {
        th.style.color = color;
      });
    });
  }
});

// Close dropdown on outside click
window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-wrapper')) {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
});

/* ==========================================
   TAB MANAGEMENT
   ========================================== */

const tabManager = {
  init() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      console.log('Adding click listener for tab:', button.dataset.tab);
      button.addEventListener('click', () => {
        console.log('Tab button clicked:', button.dataset.tab);
        this.switchTab(button.dataset.tab);
      });
    });

    // Remove loading history on init - load only when tab is clicked
    // this.loadHistory();
  },

  switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    console.log('Active tab contents:', document.querySelectorAll('.tab-content.active'));

    // Load history if switching to history tab
    if (tabName === 'history') {
      console.log('Loading history for history tab');
      this.loadHistory();
    }
  },

  async loadHistory(page = 1) {
    const loadingRow = `
      <tr class="no-data-row">
        <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
          Loading report history...
        </td>
      </tr>
    `;
    document.getElementById('historyTableBody').innerHTML = loadingRow;

    try {
      const params = new URLSearchParams({ page, limit: 20 });
      // Only fetch non-deleted reports for main history
      params.append('includeDeleted', 'false');

      console.log('Loading history with params:', params.toString());
      const response = await fetch(`/admin/reports/history?${params}`);
      console.log('History fetch response status:', response.status);
      const result = await response.json();
      console.log('History fetch result:', result);

      if (result.success) {
        console.log('Rendering', result.reports.length, 'reports');
        this.renderHistory(result.reports, result.pagination);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      document.getElementById('historyTableBody').innerHTML = `
        <tr class="no-data-row">
          <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">
            Error loading history: ${error.message}
          </td>
        </tr>
      `;
    }
  },

  renderHistory(reports, pagination) {
    console.log('renderHistory called with', reports.length, 'reports');
    if (!reports || reports.length === 0) {
      console.log('No reports to render');
      document.getElementById('historyTableBody').innerHTML = `
        <tr class="no-data-row">
          <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
            No reports found
          </td>
        </tr>
      `;
      document.getElementById('historyPagination').style.display = 'none';
      return;
    }

    console.log('Building rows for reports');
    const rows = reports.map(report => {
      console.log('Processing report:', report._id, report.fileName);
      const generatedDate = report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A';
      const sizeKB = report.fileSize ? Math.round(report.fileSize / 1024) : 'N/A';

      // Only show active (non-deleted) reports
      const actions = `
        <div class="history-actions" style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
          <div class="download-dropdown" style="position: relative;">
            <button class="btn-small btn-download" onclick="event.stopPropagation(); toggleDownloadMenu(this);" style="display: flex; align-items: center; gap: 4px;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
              </svg>
            </button>
            <div class="download-menu" style="display: none; position: absolute; left: 0; top: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 140px; z-index: 1000; margin-top: 4px; overflow: hidden;">
              <button class="download-option" onclick="event.stopPropagation(); tabManager.downloadReport('${report._id}'); closeAllDownloadMenus();" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: none; background: white; text-align: left; cursor: pointer; font-size: 0.875rem; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">
                <svg width="16" height="16" fill="#dc2626" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <text x="7" y="17" font-size="7" fill="white">PDF</text>
                </svg>
                <span>PDF</span>
              </button>
              <button class="download-option" onclick="event.stopPropagation(); tabManager.downloadReportAsExcel('${report._id}'); closeAllDownloadMenus();" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: none; background: white; text-align: left; cursor: pointer; font-size: 0.875rem; border-top: 1px solid #e5e7eb; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">
                <svg width="16" height="16" fill="#16a34a" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <text x="6" y="17" font-size="7" fill="white">XLS</text>
                </svg>
                <span>Excel</span>
              </button>
            </div>
          </div>
          <button class="btn-small btn-copy" onclick="tabManager.duplicateReport('${report._id}')" title="Make a copy">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
            </svg>
            Copy
          </button>
          <button class="btn-small btn-info" onclick="tabManager.viewReport('${report._id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            View/Edit
          </button>
          <button class="btn-small btn-delete" onclick="tabManager.deleteReport('${report._id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      `;

      return `
        <tr>
          <td>${this.escapeHtml(report.fileName || 'N/A')}</td>
          <td>${generatedDate}</td>
          <td>${report.recordCount || 'N/A'}</td>
          <td>${report.fileSize ? Math.round(report.fileSize / 1024) + ' KB' : 'N/A'}</td>
          <td>
            ${actions}
          </td>
        </tr>
      `;
    }).join('');

    console.log('Setting table body HTML, rows length:', rows.length);
    document.getElementById('historyTableBody').innerHTML = rows;

    // Update pagination
    if (pagination.pages > 1) {
      document.getElementById('historyPagination').style.display = 'flex';
      document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.pages}`;
      document.getElementById('prevPageBtn').disabled = pagination.page <= 1;
      document.getElementById('nextPageBtn').disabled = pagination.page >= pagination.pages;
    } else {
      document.getElementById('historyPagination').style.display = 'none';
    }
  },

  async downloadReport(id) {
    try {
      const response = await fetch(`/admin/reports/download/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`; // Will be overridden by server
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showAlert('Report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      showAlert('Failed to download report', 'error');
    }
  },

  async downloadReportAsExcel(id) {
    try {
      const response = await fetch(`/admin/reports/history/${id}/download-excel`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showAlert('Excel report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      showAlert('Failed to download Excel report', 'error');
    }
  },

  async duplicateReport(id) {
    try {
      const response = await fetch(`/admin/reports/duplicate/${id}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report duplicated successfully', 'success');
        this.loadHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error duplicating report:', error);
      showAlert('Failed to duplicate report', 'error');
    }
  },

  async deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/admin/reports/history/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report deleted successfully', 'success');
        this.loadHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      showAlert('Failed to delete report', 'error');
    }
  },

  async restoreReport(id) {
    if (!confirm('Are you sure you want to restore this report?')) {
      return;
    }

    try {
      const response = await fetch(`/admin/reports/history/${id}/restore`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report restored successfully', 'success');
        this.loadHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error restoring report:', error);
      showAlert('Failed to restore report', 'error');
    }
  },

  async hardDeleteReport(id) {
    if (!confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/admin/reports/history/${id}/hard`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report permanently deleted successfully', 'success');
        this.loadHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error permanently deleting report:', error);
      showAlert('Failed to permanently delete report', 'error');
    }
  },

  async viewReport(id) {
    try {
      const response = await fetch(`/admin/reports/history/${id}/details`);
      const result = await response.json();

      if (result.success) {
        this.displayReportDetails(result.report);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      showAlert('Failed to load report details', 'error');
    }
  },

  displayReportDetails(report) {
    // Store current report for editing
    this.currentReport = report;

    // Populate report info with correct IDs
    document.getElementById('reportFileName').textContent = report.fileName || 'N/A';
    document.getElementById('reportType').textContent = 
      report.reportType === 'report_pdf' ? 'PDF Report' : 
      report.reportType === 'report_excel' ? 'Excel Report' : 'N/A';
    document.getElementById('reportGeneratedAt').textContent = 
      report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A';
    
    // Properly handle admin name fetching - check all possible field combinations
    let adminName = 'N/A';
    if (report.generatedBy) {
      // Check if generatedBy is populated as an object
      if (typeof report.generatedBy === 'object') {
        if (report.generatedBy.fName || report.generatedBy.lName) {
          adminName = `${report.generatedBy.fName || ''} ${report.generatedBy.lName || ''}`.trim();
        } else if (report.generatedBy.firstName || report.generatedBy.lastName) {
          adminName = `${report.generatedBy.firstName || ''} ${report.generatedBy.lastName || ''}`.trim();
        } else if (report.generatedBy.name) {
          adminName = report.generatedBy.name;
        }
      } else {
        // If generatedBy is just an ID, show the ID
        adminName = `Admin (ID: ${report.generatedBy})`;
      }
    }
    document.getElementById('reportGeneratedBy').textContent = adminName;
    
    document.getElementById('reportRecordCount').textContent = report.recordCount || 'N/A';
    document.getElementById('reportFileSize').textContent = 
      report.fileSize ? Math.round(report.fileSize / 1024) + ' KB' : 'N/A';

    // Populate settings display fields (these show when not editing)
    const displayFileName = report.options?.fileName || report.fileName || 's-core-report';
    const displayTitle = report.options?.title || 'S-CORE Analytics Report';
    const displayDescription = report.options?.description || '';
    const displayColor = report.options?.headerColor || '#10b981';
    const displayTextsColor = report.options?.headerTextsColor || '#ffffff';
    const displayPaper = report.options?.paperSize || 'A4';
    const displayOrientation = report.options?.orientation || 'portrait';
    
    document.getElementById('viewFileNameDisplay').value = displayFileName;
    document.getElementById('viewTitleDisplay').value = displayTitle;
    document.getElementById('viewDescriptionDisplay').value = displayDescription;
    document.getElementById('viewHeaderColorDisplay').value = displayColor;
    document.getElementById('viewHeaderTextsColorDisplay').value = displayTextsColor;
    document.getElementById('viewPaperSizeDisplay').value = displayPaper;
    document.getElementById('viewOrientationDisplay').value = displayOrientation;

    // Also populate edit fields so they're ready when user clicks edit
    document.getElementById('editFileName').value = displayFileName;
    document.getElementById('editTitle').value = displayTitle;
    document.getElementById('editDescription').value = displayDescription;
    document.getElementById('editHeaderColor').value = displayColor;
    document.getElementById('editHeaderTextsColor').value = displayTextsColor;
    document.getElementById('editPaperSize').value = displayPaper;
    document.getElementById('editOrientation').value = displayOrientation;

    // Show viewer, hide edit mode
    document.getElementById('reportViewer').style.display = 'block';
    document.getElementById('reportSettingsDisplay').style.display = 'block';
    document.getElementById('reportSettingsEdit').style.display = 'none';

    // Load and display report data
    console.log('Report object:', report);
    console.log('Report has reportData?', !!report.reportData);
    console.log('reportData length:', report.reportData ? report.reportData.length : 0);
    
    if (report.reportData && report.reportData.length > 0) {
      console.log('Calling displayReportData with', report.reportData.length, 'records');
      this.displayReportData(report.reportData);
    } else {
      console.log('No reportData found, showing message instead');
      this.showReportDataMessage(report);
    }

    // Apply the header colors to the preview table
    const tableHeaders = document.querySelectorAll('#viewReportTable thead th');
    tableHeaders.forEach(th => {
      th.style.backgroundColor = displayColor;
      th.style.color = displayTextsColor;
    });

    // Scroll to viewer
    document.getElementById('reportViewer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  showReportDataMessage(report) {
    // Since the report is already generated, we can't display the actual data
    // Show a helpful message instead
    const tbody = document.getElementById('viewReportTableBody');
    const recordCount = report.recordCount || 0;
    
    tbody.innerHTML = `
      <tr class="no-data-row">
        <td colspan="10" style="text-align: center; padding: 2rem;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <div>
              <p style="margin: 0; font-weight: 600; color: #111827; font-size: 1rem;">This report contains ${recordCount} record${recordCount !== 1 ? 's' : ''}</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 0.875rem;">Download the file to view the complete report data</p>
            </div>
            <button onclick="tabManager.downloadReport('${report._id}')" class="btn-export btn-excel" style="margin-top: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download Report
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  async loadReportData(report) {
    // This method is deprecated - we now show a message instead
    this.showReportDataMessage(report);
  },

  displayReportData(data) {
    const tbody = document.getElementById('viewReportTableBody');

    console.log('displayReportData called with:', data);
    console.log('Data length:', data ? data.length : 0);
    if (data && data.length > 0) {
      console.log('First record sample:', data[0]);
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr class="no-data-row">
          <td colspan="10" style="text-align: center; padding: 2rem; color: #6b7280;">
            No records found in this report
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(record => {
      // Handle different possible field names from the database
      const recordId = record.requestId || (record._id ? record._id.toString().slice(-6) : 'N/A');
      const type = record.type || 'Service Request';
      const requester = record.requester || 'N/A';
      const unit = record.unit || 'N/A';
      const requestName = record.requestName || record.serviceName || 'N/A';
      const status = record.status || 'N/A';
      const dateSubmitted = record.dateSubmitted ? this.formatDate(record.dateSubmitted) : 'N/A';
      const deadline = record.deadline ? this.formatDate(record.deadline) : 'N/A';
      const revisions = record.revisionCount || record.revisions || 0;
      const finalRemarks = record.finalRemarks || record.finalRemark || '';

      return `
        <tr>
          <td>${this.escapeHtml(recordId)}</td>
          <td>${this.escapeHtml(type)}</td>
          <td>${this.escapeHtml(requester)}</td>
          <td>${this.escapeHtml(unit)}</td>
          <td>${this.escapeHtml(requestName)}</td>
          <td><span class="status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}">${this.escapeHtml(status)}</span></td>
          <td>${dateSubmitted}</td>
          <td>${deadline}</td>
          <td>${revisions}</td>
          <td>${finalRemarks ? this.escapeHtml(finalRemarks) : ''}</td>
        </tr>
      `;
    }).join('');
  },

  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  showEditModal(report) {
    // This is now replaced by inline editing
    this.displayReportDetails(report);
    this.toggleEditMode();
  },

  toggleEditMode() {
    const isEditing = document.getElementById('reportSettingsEdit').style.display === 'flex' || 
                     document.getElementById('reportSettingsEdit').style.display === 'block';
    
    if (isEditing) {
      // Cancel edit - show display mode
      document.getElementById('reportSettingsDisplay').style.display = 'block';
      document.getElementById('reportSettingsEdit').style.display = 'none';
    } else {
      // Enter edit mode
      const report = this.currentReport;
      document.getElementById('editFileName').value = report.options?.fileName || report.fileName || '';
      document.getElementById('editTitle').value = report.options?.title || '';
      document.getElementById('editDescription').value = report.options?.description || '';
      document.getElementById('editHeaderColor').value = report.options?.headerColor || '#10b981';
      document.getElementById('editHeaderTextsColor').value = report.options?.headerTextsColor || '#ffffff';
      document.getElementById('editPaperSize').value = report.options?.paperSize || 'A4';
      document.getElementById('editOrientation').value = report.options?.orientation || 'portrait';

      document.getElementById('reportSettingsDisplay').style.display = 'none';
      document.getElementById('reportSettingsEdit').style.display = 'block';
    }
  },

  async saveReportMetadata(id) {
    const fileName = document.getElementById('editFileName').value;
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const headerColor = document.getElementById('editHeaderColor').value;
    const headerTextsColor = document.getElementById('editHeaderTextsColor').value;
    const paperSize = document.getElementById('editPaperSize').value;
    const orientation = document.getElementById('editOrientation').value;

    try {
      const response = await fetch(`/admin/reports/history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, title, description, headerColor, headerTextsColor, paperSize, orientation, regenerate: true })
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report updated and regenerated successfully', 'success');
        
        // Update the current report object
        if (this.currentReport) {
          this.currentReport.options = {
            ...this.currentReport.options,
            fileName,
            title,
            description,
            headerColor,
            headerTextsColor,
            paperSize,
            orientation
          };
        }
        
        // Update display fields
        document.getElementById('viewFileNameDisplay').value = fileName;
        document.getElementById('viewTitleDisplay').value = title;
        document.getElementById('viewDescriptionDisplay').value = description;
        document.getElementById('viewHeaderColorDisplay').value = headerColor;
        document.getElementById('viewHeaderTextsColorDisplay').value = headerTextsColor;
        document.getElementById('viewPaperSizeDisplay').value = paperSize;
        document.getElementById('viewOrientationDisplay').value = orientation;
        
        // Switch back to display mode
        this.toggleEditMode();
        
        // Refresh the history list to show updated data
        this.loadHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving report metadata:', error);
      showAlert('Failed to update report metadata', 'error');
    }
  },

  initializeReportViewer() {
    // Close viewer button
    const closeBtn = document.getElementById('closeViewerBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('reportViewer').style.display = 'none';
      });
    }

    // Edit button
    const editBtn = document.getElementById('editReportBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.toggleEditMode();
      });
    }

    // Save edit button
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', () => {
        if (this.currentReport) {
          this.saveReportMetadata(this.currentReport._id);
        }
      });
    }

    // Duplicate report button
    const duplicateReportBtn = document.getElementById('duplicateReportBtn');
    if (duplicateReportBtn) {
      duplicateReportBtn.addEventListener('click', () => {
        if (this.currentReport) {
          this.duplicateReport(this.currentReport._id);
        }
      });
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        this.toggleEditMode();
      });
    }

    // Add color picker live preview
    const editColorInput = document.getElementById('editHeaderColor');
    if (editColorInput) {
      editColorInput.addEventListener('input', (e) => {
        // Update the visual preview immediately as user picks colors
        const viewReportTable = document.querySelector('#viewReportTable thead th');
        if (viewReportTable) {
          document.querySelectorAll('#viewReportTable thead th').forEach(th => {
            th.style.backgroundColor = e.target.value;
          });
        }
      });
    }

    // Add header text color preview
    const editTextsColorInput = document.getElementById('editHeaderTextsColor');
    if (editTextsColorInput) {
      editTextsColorInput.addEventListener('input', (e) => {
        const viewReportTable = document.querySelector('#viewReportTable thead th');
        if (viewReportTable) {
          document.querySelectorAll('#viewReportTable thead th').forEach(th => {
            th.style.color = e.target.value;
          });
        }
      });
    }

    // Download PDF button in history
    const downloadPdfFromHistoryBtn = document.getElementById('downloadPdfFromHistoryBtn');
    if (downloadPdfFromHistoryBtn) {
      downloadPdfFromHistoryBtn.addEventListener('click', () => {
        if (this.currentReport) {
          this.downloadReport(this.currentReport._id);
        }
      });
    }

    // Download Excel button in history
    const downloadExcelFromHistoryBtn = document.getElementById('downloadExcelFromHistoryBtn');
    if (downloadExcelFromHistoryBtn) {
      downloadExcelFromHistoryBtn.addEventListener('click', () => {
        if (this.currentReport) {
          this.downloadReportAsExcel(this.currentReport._id);
        }
      });
    }

    // Reset edit button
    const resetEditBtn = document.getElementById('resetEditBtn');
    if (resetEditBtn) {
      resetEditBtn.addEventListener('click', () => {
        if (this.currentReport) {
          // Reset to original values from currentReport
          const originalFileName = this.currentReport.options?.fileName || this.currentReport.fileName || 's-core-report';
          const originalTitle = this.currentReport.options?.title || 'S-CORE Analytics Report';
          const originalDescription = this.currentReport.options?.description || '';
          const originalColor = this.currentReport.options?.headerColor || '#10b981';
          const originalTextsColor = this.currentReport.options?.headerTextsColor || '#ffffff';
          const originalPaper = this.currentReport.options?.paperSize || 'A4';
          const originalOrientation = this.currentReport.options?.orientation || 'portrait';

          document.getElementById('editFileName').value = originalFileName;
          document.getElementById('editTitle').value = originalTitle;
          document.getElementById('editDescription').value = originalDescription;
          document.getElementById('editHeaderColor').value = originalColor;
          document.getElementById('editHeaderTextsColor').value = originalTextsColor;
          document.getElementById('editPaperSize').value = originalPaper;
          document.getElementById('editOrientation').value = originalOrientation;

          // Update preview table colors
          document.querySelectorAll('#viewReportTable thead th').forEach(th => {
            th.style.backgroundColor = originalColor;
            th.style.color = originalTextsColor;
          });

          showAlert('Settings reset to original values', 'info');
        }
      });
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  tabManager.init();
  tabManager.initializeReportViewer();

  // Initialize default date range (Last 90 Days)
  const datePresetFilter = document.getElementById('datePresetFilter');
  if (datePresetFilter && datePresetFilter.value === '90') {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);
    
    document.getElementById('startDateFilter').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDateFilter').value = endDate.toISOString().split('T')[0];
  }

  // Real-time date validation
  const startDateInput = document.getElementById('startDateFilter');
  const endDateInput = document.getElementById('endDateFilter');
  
  if (startDateInput) {
    startDateInput.addEventListener('change', () => reportHandler.validateFilters());
    startDateInput.addEventListener('input', () => reportHandler.validateFilters());
  }
  
  if (endDateInput) {
    endDateInput.addEventListener('change', () => reportHandler.validateFilters());
    endDateInput.addEventListener('input', () => reportHandler.validateFilters());
  }

  // Multi-select dropdown handlers
  setupMultiSelectDropdown('unit', 'unitDropdownTrigger', 'unitDropdownMenu', 'unitDropdownText');
  setupMultiSelectDropdown('status', 'statusDropdownTrigger', 'statusDropdownMenu', 'statusDropdownText');

  // Initialize checkbox "All" handlers for units
  const allUnitsCheckbox = document.getElementById('allUnitsCheckbox');
  if (allUnitsCheckbox) {
    allUnitsCheckbox.addEventListener('change', function() {
      if (this.checked) {
        document.querySelectorAll('input[data-filter="unit"]').forEach(cb => {
          if (cb.id !== 'allUnitsCheckbox') cb.checked = false;
        });
        updateDropdownText('unit');
      }
    });
  }

  // Unit checkboxes - uncheck "All" when individual selected
  document.querySelectorAll('input[data-filter="unit"]').forEach(cb => {
    if (cb.id !== 'allUnitsCheckbox') {
      cb.addEventListener('change', function() {
        if (this.checked) {
          allUnitsCheckbox.checked = false;
        }
        // If no units are selected, auto-check "All Units"
        const anyChecked = Array.from(document.querySelectorAll('input[data-filter="unit"]')).some(c => c.checked);
        if (!anyChecked) {
          allUnitsCheckbox.checked = true;
        }
        updateDropdownText('unit');
      });
    }
  });

  // Initialize checkbox "All" handlers for statuses
  const allStatusesCheckbox = document.getElementById('allStatusesCheckbox');
  if (allStatusesCheckbox) {
    allStatusesCheckbox.addEventListener('change', function() {
      if (this.checked) {
        document.querySelectorAll('input[data-filter="status"]').forEach(cb => {
          if (cb.id !== 'allStatusesCheckbox') cb.checked = false;
        });
        updateDropdownText('status');
      }
    });
  }

  // Status checkboxes - uncheck "All" when individual selected
  document.querySelectorAll('input[data-filter="status"]').forEach(cb => {
    if (cb.id !== 'allStatusesCheckbox') {
      cb.addEventListener('change', function() {
        if (this.checked) {
          allStatusesCheckbox.checked = false;
        }
        // If no statuses are selected, auto-check "All Statuses"
        const anyChecked = Array.from(document.querySelectorAll('input[data-filter="status"]')).some(c => c.checked);
        if (!anyChecked) {
          allStatusesCheckbox.checked = true;
        }
        updateDropdownText('status');
      });
    }
  });

  // History event listeners
  document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
    tabManager.loadHistory();
  });

  // View Deleted Reports Button
  document.getElementById('viewDeletedBtn').addEventListener('click', () => {
    openDeletedReportsModal();
  });

  document.getElementById('prevPageBtn').addEventListener('click', () => {
    const currentPage = parseInt(document.getElementById('pageInfo').textContent.split(' ')[1]);
    if (currentPage > 1) {
      tabManager.loadHistory(currentPage - 1);
    }
  });

  document.getElementById('nextPageBtn').addEventListener('click', () => {
    const pageText = document.getElementById('pageInfo').textContent;
    const currentPage = parseInt(pageText.split(' ')[1]);
    const totalPages = parseInt(pageText.split(' ')[3]);
    if (currentPage < totalPages) {
      tabManager.loadHistory(currentPage + 1);
    }
  });
});

/**
 * Toggle description field visibility
 */
function toggleDescription() {
  const descriptionRow = document.getElementById('descriptionRow');
  const toggleBtn = document.querySelector('.description-toggle-btn');
  
  if (descriptionRow.style.display === 'none') {
    descriptionRow.style.display = 'flex';
    toggleBtn.classList.add('expanded');
  } else {
    descriptionRow.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
}

/**
 * Toggle view description in Report History
 */
function toggleViewDescription() {
  const descriptionRow = document.getElementById('viewDescriptionRow');
  const toggleBtn = document.querySelector('#reportSettingsDisplay .description-toggle-btn');
  
  if (descriptionRow.style.display === 'none') {
    descriptionRow.style.display = 'flex';
    toggleBtn.classList.add('expanded');
  } else {
    descriptionRow.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
}

/**
 * Toggle edit description in Report History
 */
function toggleEditDescription() {
  const descriptionRow = document.getElementById('editDescriptionRow');
  const toggleBtn = document.querySelector('#reportSettingsEdit .description-toggle-btn');
  
  if (descriptionRow.style.display === 'none') {
    descriptionRow.style.display = 'flex';
    toggleBtn.classList.add('expanded');
  } else {
    descriptionRow.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
}

/**
 * Reset export settings to default values
 */
function resetExportSettings() {
  // Reset all form inputs to default values
  document.getElementById('pdfFileName').value = 's-core-report';
  document.getElementById('pdfTitle').value = 'S-CORE Analytics Report';
  document.getElementById('pdfDescription').value = '';
  document.getElementById('pdfHeaderColor').value = '#10b981';
  document.getElementById('pdfHeaderTextsColor').value = '#ffffff';
  document.getElementById('pdfPaperSize').value = 'A4';
  document.getElementById('pdfOrientation').value = 'portrait';
  
  // Update preview table headers to default colors
  const tableHeaders = document.querySelectorAll('.report-table th');
  tableHeaders.forEach(th => {
    th.style.backgroundColor = '#10b981';
    th.style.color = '#ffffff';
  });
  
  // Collapse description if expanded
  const descriptionRow = document.getElementById('descriptionRow');
  const toggleBtn = document.querySelector('.description-toggle-btn');
  if (descriptionRow && descriptionRow.style.display !== 'none') {
    descriptionRow.style.display = 'none';
    toggleBtn.classList.remove('expanded');
  }
}

/**
 * Toggle download menu for a report row
 */
function toggleDownloadMenu(button) {
  const menu = button.nextElementSibling;
  const isOpen = menu.style.display === 'block';
  
  // Close all other menus first
  closeAllDownloadMenus();
  
  // Toggle this menu
  if (!isOpen) {
    menu.style.display = 'block';
  }
}

/**
 * Close all download dropdown menus
 */
function closeAllDownloadMenus() {
  document.querySelectorAll('.download-menu').forEach(menu => {
    menu.style.display = 'none';
  });
}

/**
 * Open deleted reports modal
 */
async function openDeletedReportsModal() {
  const modal = document.getElementById('deletedReportsModal');
  modal.style.display = 'flex';
  
  // Load deleted reports
  try {
    console.log('Fetching deleted reports with params: includeDeleted=true&deletedOnly=true');
    const response = await fetch('/admin/reports/history?includeDeleted=true&deletedOnly=true');
    const data = await response.json();
    
    console.log('Deleted reports response:', data);
    console.log('Number of deleted reports:', data.reports ? data.reports.length : 0);
    
    if (data.success && data.reports) {
      renderDeletedReports(data.reports);
    } else {
      throw new Error(data.message || 'Failed to load deleted reports');
    }
  } catch (error) {
    console.error('Error loading deleted reports:', error);
    showAlert('Failed to load deleted reports', 'error');
  }
}

/**
 * Close deleted reports modal
 */
function closeDeletedReportsModal() {
  document.getElementById('deletedReportsModal').style.display = 'none';
}

/**
 * Render deleted reports in modal table
 */
function renderDeletedReports(reports) {
  const tbody = document.getElementById('deletedReportsTableBody');
  
  if (!reports || reports.length === 0) {
    tbody.innerHTML = `
      <tr class="no-data-row">
        <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style="margin: 0; font-weight: 600;">No deleted reports</p>
            <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">All reports are active</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rows = reports.map(report => {
    const generatedDate = report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A';
    const deletedDate = report.deletedAt ? new Date(report.deletedAt).toLocaleString() : 'N/A';
    
    return `
      <tr>
        <td>${tabManager.escapeHtml(report.fileName || 'N/A')}</td>
        <td>${generatedDate}</td>
        <td>${report.recordCount || 'N/A'}</td>
        <td>${report.fileSize ? Math.round(report.fileSize / 1024) + ' KB' : 'N/A'}</td>
        <td>${deletedDate}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn-small btn-restore" onclick="restoreReportFromModal('${report._id}')" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Restore
            </button>
            <button class="btn-small btn-delete" onclick="hardDeleteReportFromModal('${report._id}')" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete Forever
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = rows;
}

/**
 * Restore report from deleted modal
 */
async function restoreReportFromModal(id) {
  if (!confirm('Are you sure you want to restore this report?')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/reports/history/${id}/restore`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('✓ Report restored successfully', 'success');
      openDeletedReportsModal(); // Refresh the modal
      tabManager.loadHistory(); // Refresh main history
    } else {
      throw new Error(data.message || 'Failed to restore report');
    }
  } catch (error) {
    console.error('Error restoring report:', error);
    showAlert('✗ Failed to restore report', 'error');
  }
}

/**
 * Permanently delete report from modal
 */
async function hardDeleteReportFromModal(id) {
  if (!confirm('Are you sure you want to PERMANENTLY delete this report? This action cannot be undone!')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/reports/history/${id}/hard`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('✓ Report permanently deleted', 'success');
      openDeletedReportsModal(); // Refresh the modal
    } else {
      throw new Error(data.message || 'Failed to delete report');
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    showAlert('✗ Failed to delete report', 'error');
  }
}

/**
 * Restore all deleted reports
 */
async function restoreAllReports() {
  if (!confirm('Are you sure you want to restore ALL deleted reports?')) {
    return;
  }
  
  try {
    // Show loading indicator
    const loadingAlert = document.createElement('div');
    loadingAlert.id = 'bulkLoadingAlert';
    loadingAlert.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; display: flex; align-items: center; gap: 12px;';
    loadingAlert.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Restoring reports...';
    document.body.appendChild(loadingAlert);
    
    const response = await fetch('/admin/reports/history?includeDeleted=true&deletedOnly=true');
    const data = await response.json();
    
    if (!data.success || !data.reports || data.reports.length === 0) {
      document.body.removeChild(loadingAlert);
      showAlert('No deleted reports to restore', 'info');
      return;
    }
    
    const reportIds = data.reports.map(r => r._id);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of reportIds) {
      try {
        const restoreResponse = await fetch(`/admin/reports/history/${id}/restore`, {
          method: 'POST'
        });
        const restoreData = await restoreResponse.json();
        if (restoreData.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    
    document.body.removeChild(loadingAlert);
    
    if (successCount > 0) {
      showAlert(`✓ Successfully restored ${successCount} report(s)${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
      openDeletedReportsModal();
      tabManager.loadHistory();
    } else {
      showAlert('✗ Failed to restore reports', 'error');
    }
  } catch (error) {
    const loadingAlert = document.getElementById('bulkLoadingAlert');
    if (loadingAlert) document.body.removeChild(loadingAlert);
    console.error('Error restoring all reports:', error);
    showAlert('✗ Failed to restore reports', 'error');
  }
}

/**
 * Permanently delete all deleted reports
 */
async function deleteAllReportsPermanently() {
  if (!confirm('⚠️ WARNING: Are you sure you want to PERMANENTLY delete ALL deleted reports?\n\nThis action CANNOT be undone!')) {
    return;
  }
  
  if (!confirm('This is your final warning. All deleted reports will be permanently removed. Continue?')) {
    return;
  }
  
  try {
    // Show loading indicator
    const loadingAlert = document.createElement('div');
    loadingAlert.id = 'bulkLoadingAlert';
    loadingAlert.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; display: flex; align-items: center; gap: 12px;';
    loadingAlert.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Deleting reports permanently...';
    document.body.appendChild(loadingAlert);
    
    const response = await fetch('/admin/reports/history?includeDeleted=true&deletedOnly=true');
    const data = await response.json();
    
    if (!data.success || !data.reports || data.reports.length === 0) {
      document.body.removeChild(loadingAlert);
      showAlert('No deleted reports to remove', 'info');
      return;
    }
    
    const reportIds = data.reports.map(r => r._id);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of reportIds) {
      try {
        const deleteResponse = await fetch(`/admin/reports/history/${id}/hard`, {
          method: 'DELETE'
        });
        const deleteData = await deleteResponse.json();
        if (deleteData.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    
    document.body.removeChild(loadingAlert);
    
    if (successCount > 0) {
      showAlert(`✓ Successfully deleted ${successCount} report(s) permanently${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
      openDeletedReportsModal();
    } else {
      showAlert('✗ Failed to delete reports', 'error');
    }
  } catch (error) {
    const loadingAlert = document.getElementById('bulkLoadingAlert');
    if (loadingAlert) document.body.removeChild(loadingAlert);
    console.error('Error deleting all reports:', error);
    showAlert('✗ Failed to delete reports', 'error');
  }
}

// Close dropdown menus when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.download-dropdown')) {
    closeAllDownloadMenus();
  }
  
  // Close multi-select dropdowns when clicking outside
  if (!event.target.closest('.multi-select-dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.style.display = 'none';
    });
    document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
      trigger.classList.remove('open');
    });
  }
});

/**
 * Setup multi-select dropdown functionality
 */
function setupMultiSelectDropdown(filterType, triggerId, menuId, textId) {
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  
  if (trigger && menu) {
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
      });
      document.querySelectorAll('.dropdown-trigger').forEach(t => {
        if (t !== trigger) t.classList.remove('open');
      });
      
      // Toggle this dropdown
      if (isOpen) {
        menu.style.display = 'none';
        trigger.classList.remove('open');
      } else {
        menu.style.display = 'block';
        trigger.classList.add('open');
      }
    });
    
    // Prevent dropdown from closing when clicking inside
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
}

/**
 * Update dropdown trigger text based on selections
 */
function updateDropdownText(filterType) {
  const allCheckbox = filterType === 'unit' ? 
    document.getElementById('allUnitsCheckbox') : 
    document.getElementById('allStatusesCheckbox');
  const dropdownText = filterType === 'unit' ? 
    document.getElementById('unitDropdownText') : 
    document.getElementById('statusDropdownText');
  
  if (!dropdownText) return;
  
  if (allCheckbox && allCheckbox.checked) {
    dropdownText.textContent = filterType === 'unit' ? 'All Units' : 'All Statuses';
  } else {
    const checked = Array.from(document.querySelectorAll(`input[data-filter="${filterType}"]:checked`))
      .filter(cb => cb.value) // Filter out empty values
      .map(cb => cb.nextElementSibling.textContent);
    
    if (checked.length === 0) {
      dropdownText.textContent = filterType === 'unit' ? 'All Units' : 'All Statuses';
    } else {
      dropdownText.textContent = checked.join(', ');
    }
  }
}

