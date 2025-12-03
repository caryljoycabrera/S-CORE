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
   * Get filter values from form
   */
  getFilters() {
    const statuses = Array.from(document.getElementById('statusFilter').selectedOptions)
      .map(opt => opt.value)
      .filter(v => v);
    const units = Array.from(document.getElementById('unitFilter').selectedOptions)
      .map(opt => opt.value)
      .filter(v => v);

    return {
      startDate: document.getElementById('startDateFilter').value,
      endDate: document.getElementById('endDateFilter').value,
      units: units,
      requestType: document.getElementById('requestTypeFilter').value,
      statuses: statuses,
      sortBy: document.getElementById('sortByFilter').value,
      sortOrder: document.getElementById('sortOrderFilter').value
    };
  },

  /**
   * Generate preview report
   */
  async generatePreview() {
    const loading = document.getElementById('loadingIndicator');
    loading.style.display = 'flex';

    try {
      const filters = this.getFilters();

      // Validate date range if both dates are provided
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (start > end) {
          showAlert('Start date must be before end date', 'error');
          loading.style.display = 'none';
          return;
        }
      }

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
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    document.getElementById('datePresetFilter').value = '';
    document.getElementById('unitFilter').selectedIndex = 0;
    document.getElementById('requestTypeFilter').value = '';
    document.getElementById('statusFilter').selectedIndex = 0;
    document.getElementById('sortByFilter').value = 'createdAt';
    document.getElementById('sortOrderFilter').value = 'desc';
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
      const paperSize = document.getElementById('pdfPaperSize').value || 'A4';
      const orientation = document.getElementById('pdfOrientation').value || 'portrait';
      
      const response = await fetch('/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...filters, format: 'pdf', fileName, title, description, headerColor, paperSize, orientation })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `s-core-report-${new Date().toISOString().split('T')[0]}.pdf`;
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
      
      const response = await fetch('/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...filters, format: 'excel', fileName, title, description, headerColor })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `s-core-report-${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
          Loading report history...
        </td>
      </tr>
    `;
    document.getElementById('historyTableBody').innerHTML = loadingRow;

    try {
      const typeFilter = document.getElementById('historyTypeFilter').value;
      const showDeleted = document.getElementById('showDeletedFilter').checked;
      const params = new URLSearchParams({ page, limit: 20 });
      if (typeFilter) params.append('type', typeFilter);
      if (showDeleted) params.append('includeDeleted', 'true');

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
          <td colspan="6" style="text-align: center; padding: 2rem; color: #dc2626;">
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
          <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
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
      const typeLabel = report.reportType === 'report_pdf' ? 'PDF' : report.reportType === 'report_excel' ? 'Excel' : 'N/A';
      const generatedDate = report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A';
      const sizeKB = report.fileSize ? Math.round(report.fileSize / 1024) : 'N/A';
      const isDeleted = report.isDeleted;

      let actions = '';
      if (isDeleted) {
        actions = `
          <button class="btn-small btn-restore" onclick="tabManager.restoreReport('${report._id}')">
            Restore
          </button>
          <button class="btn-small btn-delete" onclick="tabManager.hardDeleteReport('${report._id}')">
            Hard Delete
          </button>
        `;
      } else {
        actions = `
          <button class="btn-small btn-download" onclick="tabManager.downloadReport('${report._id}')">
            Download
          </button>
          <button class="btn-small btn-info" onclick="tabManager.viewReport('${report._id}')">
            View/Edit
          </button>
          <button class="btn-small btn-delete" onclick="tabManager.deleteReport('${report._id}')">
            Delete
          </button>
        `;
      }

      const rowClass = isDeleted ? 'deleted-report' : '';

      return `
        <tr class="${rowClass}">
          <td>${typeLabel}</td>
          <td>${this.escapeHtml(report.fileName || 'N/A')}</td>
          <td>${generatedDate}</td>
          <td>${report.recordCount || 'N/A'}</td>
          <td>${report.fileSize ? Math.round(report.fileSize / 1024) + ' KB' : 'N/A'}</td>
          <td class="history-actions">
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

    // Populate report info
    document.getElementById('viewFileName').textContent = report.fileName || 'N/A';
    document.getElementById('viewReportType').textContent = 
      report.reportType === 'report_pdf' ? 'PDF Report' : 
      report.reportType === 'report_excel' ? 'Excel Report' : 'N/A';
    document.getElementById('viewGeneratedAt').textContent = 
      report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A';
    document.getElementById('viewGeneratedBy').textContent = 
      report.generatedBy ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : 'N/A';
    document.getElementById('viewRecordCount').textContent = report.recordCount || 'N/A';
    document.getElementById('viewFileSize').textContent = 
      report.fileSize ? Math.round(report.fileSize / 1024) + ' KB' : 'N/A';

    // Populate settings display fields (these show when not editing)
    const displayFileName = report.options?.fileName || report.fileName || 's-core-report';
    const displayTitle = report.options?.title || 'S-CORE Analytics Report';
    const displayDescription = report.options?.description || '';
    const displayColor = report.options?.headerColor || '#10b981';
    const displayPaper = report.options?.paperSize || 'A4';
    const displayOrientation = report.options?.orientation || 'portrait';
    
    document.getElementById('viewFileNameDisplay').value = displayFileName;
    document.getElementById('viewTitleDisplay').value = displayTitle;
    document.getElementById('viewDescriptionDisplay').value = displayDescription;
    document.getElementById('viewHeaderColorDisplay').value = displayColor;
    document.getElementById('viewPaperSizeDisplay').value = displayPaper;
    document.getElementById('viewOrientationDisplay').value = displayOrientation;

    // Also populate edit fields so they're ready when user clicks edit
    document.getElementById('editFileName').value = displayFileName;
    document.getElementById('editTitle').value = displayTitle;
    document.getElementById('editDescription').value = displayDescription;
    document.getElementById('editHeaderColor').value = displayColor;
    document.getElementById('editPaperSize').value = displayPaper;
    document.getElementById('editOrientation').value = displayOrientation;

    // Show viewer, hide edit mode
    document.getElementById('reportViewer').style.display = 'block';
    document.getElementById('reportSettingsDisplay').style.display = 'flex';
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
      const finalRemarks = record.finalRemarks || record.finalRemark || 'N/A';

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
          <td>${this.escapeHtml(finalRemarks)}</td>
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
      document.getElementById('reportSettingsDisplay').style.display = 'flex';
      document.getElementById('reportSettingsEdit').style.display = 'none';
    } else {
      // Enter edit mode
      const report = this.currentReport;
      document.getElementById('editTitle').value = report.options?.title || '';
      document.getElementById('editHeaderColor').value = report.options?.headerColor || '#4CAF50';
      document.getElementById('editPaperSize').value = report.options?.paperSize || 'A4';
      document.getElementById('editOrientation').value = report.options?.orientation || 'portrait';

      document.getElementById('reportSettingsDisplay').style.display = 'none';
      document.getElementById('reportSettingsEdit').style.display = 'flex';
    }
  },

  async saveReportMetadata(id) {
    const fileName = document.getElementById('editFileName').value;
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const headerColor = document.getElementById('editHeaderColor').value;
    const paperSize = document.getElementById('editPaperSize').value;
    const orientation = document.getElementById('editOrientation').value;

    try {
      const response = await fetch(`/admin/reports/history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, title, description, headerColor, paperSize, orientation })
      });

      const result = await response.json();

      if (result.success) {
        showAlert('Report metadata updated successfully', 'success');
        
        // Update the current report object
        if (this.currentReport) {
          this.currentReport.options = {
            ...this.currentReport.options,
            fileName,
            title,
            description,
            headerColor,
            paperSize,
            orientation
          };
        }
        
        // Update display fields
        document.getElementById('viewFileNameDisplay').value = fileName;
        document.getElementById('viewTitleDisplay').value = title;
        document.getElementById('viewDescriptionDisplay').value = description;
        document.getElementById('viewHeaderColorDisplay').value = headerColor;
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

  // History event listeners
  document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
    tabManager.loadHistory();
  });

  document.getElementById('historyTypeFilter').addEventListener('change', () => {
    tabManager.loadHistory();
  });

  document.getElementById('showDeletedFilter').addEventListener('change', () => {
    tabManager.loadHistory();
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
