/**
 * Report Service
 * Handles report generation, filtering, and data processing
 */

const ServiceRequest = require('../models/ServiceRequest');
const RequestApproval = require('../models/RequestApproval');
const User = require('../models/User');

class ReportService {
  /**
   * Generate filtered report data
   * @param {Object} filters - Filter criteria
   * @param {Date} filters.startDate - Start date
   * @param {Date} filters.endDate - End date
   * @param {Array<String>} filters.units - Array of unit names
   * @param {String} filters.requestType - Type of request (ServiceRequest or RequestApproval)
   * @param {Array<String>} filters.statuses - Array of statuses
   * @param {String} filters.sortBy - Sort field (default: createdAt)
   * @param {String} filters.sortOrder - asc or desc (default: desc)
   * @returns {Promise<Array>} - Array of report records
   */
  async generateReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        units,
        requestType,
        statuses,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      let query = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDateObj;
        }
      }

      // Unit filter - can apply to Service Request assigned unit or Approval assigned to
      if (units && units.length > 0) {
        query.assignedUnits = { $in: units };
      }

      // Status filter
      if (statuses && statuses.length > 0) {
        query.status = { $in: statuses };
      }

      let results = [];

      // Fetch Service Requests if no specific type or type is ServiceRequest
      if (!requestType || requestType === 'ServiceRequest') {
        const serviceRequests = await ServiceRequest.find(query)
          .populate('userId', 'fName lName email')
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .lean();

        results = results.concat(
          await Promise.all(serviceRequests.map(async req => {
            // Get final remarks for completed/approved requests (only from unit responses)
            let finalRemarks = '';
            if ((req.status === 'Completed' || req.status === 'Approved') && req.revisionHistory && req.revisionHistory.length > 0) {
              // Find the last response notes from unit users only
              for (const rev of req.revisionHistory.slice().reverse()) {
                if (rev.responseNotes && rev.responseNotes.trim() && rev.respondedBy) {
                  const responder = await User.findById(rev.respondedBy);
                  if (responder && responder.role === 'unit') {
                    finalRemarks = rev.responseNotes.trim();
                    break; // Take the most recent unit response
                  }
                }
              }
            }

            return {
              _id: req._id,
              requestId: req._id.toString().slice(-6),
              type: 'Service Request',
              requester: `${req.userId?.fName || ''} ${req.userId?.lName || ''}`,
              requesterId: req.userId?._id,
              unit: req.assignedUnits || 'Unassigned',
              requestName: req.serviceType || req.title,
              status: req.status,
              dateSubmitted: req.createdAt,
              deadline: req.deadline,
              description: req.description,
              revisions: req.revisionHistory?.length || 0,
              finalRemarks: finalRemarks
            };
          }))
        );
      }

      // Fetch Request Approvals if no specific type or type is RequestApproval
      if (!requestType || requestType === 'RequestApproval') {
        const approvalQuery = { ...query };
        const requestApprovals = await RequestApproval.find(approvalQuery)
          .populate('userId', 'fName lName email')
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .lean();

        results = results.concat(
          await Promise.all(requestApprovals.map(async req => {
            // Get final remarks for completed/approved requests (only from unit responses)
            let finalRemarks = '';
            if ((req.status === 'Approved') && req.revisionHistory && req.revisionHistory.length > 0) {
              // Find the last response notes from unit users only
              for (const rev of req.revisionHistory.slice().reverse()) {
                if (rev.responseNotes && rev.responseNotes.trim() && rev.respondedBy) {
                  const responder = await User.findById(rev.respondedBy);
                  if (responder && responder.role === 'unit') {
                    finalRemarks = rev.responseNotes.trim();
                    break; // Take the most recent unit response
                  }
                }
              }
            }

            return {
              _id: req._id,
              requestId: req._id.toString().slice(-6),
              type: 'Request for Approval',
              requester: `${req.userId?.fName || ''} ${req.userId?.lName || ''}`,
              requesterId: req.userId?._id,
              unit: req.assignedUnits || 'Unassigned',
              requestName: req.purpose || req.title,
              status: req.status,
              dateSubmitted: req.createdAt,
              deadline: req.deadline,
              description: req.description,
              revisions: req.revisionHistory?.length || 0,
              finalRemarks: finalRemarks
            };
          }))
        );
      }

      // Sort all results if fetched both types
      if (!requestType) {
        results.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return results;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Get summary statistics for report
   * @param {Object} filters - Same filters as generateReport
   * @returns {Promise<Object>} - Statistics object
   */
  async getReportSummary(filters = {}) {
    try {
      const records = await this.generateReport(filters);

      const summary = {
        totalRequests: records.length,
        byStatus: {},
        byType: {},
        byUnit: {},
        averageTimeToCompletion: 0
      };

      // Count by status
      records.forEach(record => {
        summary.byStatus[record.status] = (summary.byStatus[record.status] || 0) + 1;
        summary.byType[record.type] = (summary.byType[record.type] || 0) + 1;
        summary.byUnit[record.unit] = (summary.byUnit[record.unit] || 0) + 1;
      });

      // Calculate average time to completion
      const completedRecords = records.filter(r => r.status === 'Completed');
      if (completedRecords.length > 0) {
        const totalTime = completedRecords.reduce((sum, record) => {
          // Assume we need completedAt field for this
          // For now, use deadline difference
          if (record.deadline) {
            return sum + (new Date(record.deadline) - new Date(record.dateSubmitted));
          }
          return sum;
        }, 0);
        summary.averageTimeToCompletion = Math.round(totalTime / completedRecords.length / (1000 * 60 * 60 * 24)); // days
      }

      return summary;
    } catch (error) {
      console.error('Error generating report summary:', error);
      throw new Error('Failed to generate report summary');
    }
  }

  /**
   * Export report to Excel format
   * @param {Array} records - Report records
   * @param {Object} summary - Report summary
   * @param {Object} options - Excel options (headerColor)
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  async exportToExcel(records, summary = {}, options = {}) {
    try {
      console.log('Starting Excel export for', records.length, 'records');
      const ExcelJS = require('exceljs');

      const { headerColor = '#10b981', title = 'S-CORE Analytics Report' } = options;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('S-CORE Report');

      // Set page setup
      worksheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      };

      // Add title with styling
      worksheet.mergeCells('A1:J1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerColor.replace('#', 'FF') }
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 30;

      // Add generation timestamp
      worksheet.mergeCells('A2:J2');
      const timestampCell = worksheet.getCell('A2');
      timestampCell.value = `Generated: ${this._formatHeaderDate(new Date())}`;
      timestampCell.font = { size: 10, italic: true };
      timestampCell.alignment = { horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      // Add summary section after timestamp
      if (records && records.length > 0) {
        worksheet.addRow([]); // Empty row

        // Summary header
        const summaryHeader = worksheet.addRow(['Report Summary']);
        summaryHeader.font = { bold: true, size: 12 };
        summaryHeader.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColor.replace('#', 'FF') }
        };
        summaryHeader.getCell(1).font = { color: { argb: 'FFFFFFFF' } };

        // Summary data
        const summary = await this.getReportSummary({}); // Get summary for all records
        worksheet.addRow(['Total Requests', summary.totalRequests || 0]);
        if (summary.byStatus && Object.keys(summary.byStatus).length > 0) {
          worksheet.addRow(['Status Breakdown', '']);
          Object.entries(summary.byStatus).forEach(([status, count]) => {
            worksheet.addRow([status, count]);
          });
        }
      }

      worksheet.addRow([]); // Empty row

      // Add headers
      const headers = [
        'Request ID',
        'Type',
        'Requester',
        'Unit',
        'Request Name',
        'Status',
        'Date Submitted',
        'Deadline',
        'Revisions',
        'Final Remarks'
      ];

      const headerRow = worksheet.addRow(headers);

      // Style headers
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerColor.replace('#', 'FF') }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.height = 30; // Increased from 25 to 30 for better text fit

      // Add data rows with alternating colors
      if (records && records.length > 0) {
        records.forEach((record, index) => {
          const row = worksheet.addRow([
            record.requestId || 'N/A',
            record.type || 'N/A',
            record.requester || 'N/A',
            record.unit || 'N/A',
            record.requestName || 'N/A',
            record.status || 'N/A',
            record.dateSubmitted ? this._formatDate(record.dateSubmitted) : 'N/A',
            record.deadline ? this._formatDate(record.deadline) : 'N/A',
            record.revisions || 0,
            record.finalRemarks || ''
          ]);

          // Alternate row colors
          if (index % 2 === 1) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }
            };
          }

          // Align cells appropriately with text wrapping
          row.alignment = { vertical: 'middle', wrapText: true };
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // Request ID
          row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // Status
          row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // Revisions
        });
      }

      // Set column widths for better readability and text wrapping
      worksheet.columns = [
        { width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } } }, // Request ID
        { width: 18, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Type
        { width: 20, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Requester
        { width: 15, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Unit
        { width: 30, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Request Name
        { width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } } }, // Status
        { width: 15, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Date Submitted
        { width: 12, style: { alignment: { vertical: 'middle', wrapText: true } } }, // Deadline
        { width: 10, style: { alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } } }, // Revisions
        { width: 60, style: { alignment: { vertical: 'middle', wrapText: true } } }  // Final Remarks - increased width
      ];

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      return workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel');
    }
  }

  /**
   * Export report to PDF format (returns HTML that can be converted)
   * @param {Array} records - Report records
   * @param {Object} summary - Report summary
   * @param {Object} options - Options like title, headerColor
   * @returns {String} - HTML content for PDF
   */
  exportToPDF(records, summary = {}, options = {}) {
    try {
      const timestamp = this._formatHeaderDate(new Date());
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(title)}</h1>
          <p>Generated: ${timestamp}</p>
      `;

      // Add summary section
      if (Object.keys(summary).length > 0) {
        html += `
          <h2>Report Summary</h2>
          <p>Total Requests: ${summary.totalRequests || 0}</p>
        `;
        
        if (summary.byStatus) {
          html += `<p>Status Breakdown: `;
          Object.entries(summary.byStatus).forEach(([status, count]) => {
            html += `${this.escapeHtml(status)}: ${count}, `;
          });
          html = html.slice(0, -2); // Remove last comma
          html += `</p>`;
        }
      }

      // Add table
      html += `
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Requester</th>
              <th>Unit</th>
              <th>Request Name</th>
              <th>Status</th>
              <th>Date Submitted</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
      `;

      records.forEach(record => {
        html += `
          <tr>
            <td>${this.escapeHtml(record.requestId || '')}</td>
            <td>${this.escapeHtml(record.type || '')}</td>
            <td>${this.escapeHtml(record.requester || '')}</td>
            <td>${this.escapeHtml(record.unit || '')}</td>
            <td>${this.escapeHtml(record.service || '')}</td>
            <td>${this.escapeHtml(record.status || '')}</td>
            <td>${this.escapeHtml(this._formatDate(record.dateSubmitted))}</td>
            <td>${this.escapeHtml(this._formatDate(record.deadline))}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  }

  /**
   * Generate PDF buffer using PDFKit
   * @param {Array} records - Report records
   * @param {Object} summary - Report summary
   * @param {String} orientation - 'portrait' or 'landscape'
   * @param {Object} options - PDF options (title, headerColor, paperSize)
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generatePDF(records, summary = {}, orientation = 'landscape', options = {}) {
    try {
      console.log('Starting PDF export for', records.length, 'records using PDFKit');
      const PDFDocument = require('pdfkit');

      const { title = 'S-CORE Analytics Report', headerColor = '#10b981', paperSize = 'A4' } = options;

      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ size: paperSize, layout: orientation, margin: 50 });
          const buffers = [];

          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            console.log('PDF generated successfully with PDFKit, buffer size:', pdfBuffer.length);
            resolve(pdfBuffer);
          });

          // Title without background
          doc.fillColor('black').fontSize(24).text(title, { align: 'center' });
          doc.moveDown(1.5);

          // Timestamp
          doc.fillColor('black').fontSize(12).text(`Generated: ${this._formatHeaderDate(new Date())}`, { align: 'center' });
          doc.moveDown(1.5);

          // Summary
          if (Object.keys(summary).length > 0) {
            doc.fontSize(16).text('Report Summary', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Total Requests: ${summary.totalRequests || 0}`);
            if (summary.byStatus) {
              const statusText = Object.entries(summary.byStatus).map(([status, count]) => `${status}: ${count}`).join(', ');
              doc.text(`Status Breakdown: ${statusText}`);
            }
            doc.moveDown(2);
          }

          // Calculate dynamic column widths based on content
          const headers = [
            'Request ID', 'Type', 'Requester', 'Unit', 'Request Name', 'Status', 'Date Submitted', 'Deadline', 'Revisions', 'Final Remarks'
          ];

          const sampleData = records.slice(0, Math.min(10, records.length)); // Sample first 10 records for width calculation
          const allData = [headers, ...sampleData.map(record => [
            record.requestId || '',
            record.type || '',
            record.requester || '',
            record.unit || '',
            record.requestName || '',
            record.status || '',
            this._formatDate(record.dateSubmitted),
            this._formatDate(record.deadline),
            record.revisions || '',
            record.finalRemarks || ''
          ])];

          const colWidths = [80, 60, 90, 60, 130, 60, 80, 60, 60, 160]; // Improved widths for better fit
          const startX = 50; // Left margin matching document margin
          const pageWidth = doc.page.width - 100; // Account for left and right margins
          const totalWidth = colWidths.reduce((a, b) => a + b, 0);
          if (totalWidth > pageWidth) {
            const scale = pageWidth / totalWidth;
            colWidths.forEach((w, i) => colWidths[i] = Math.floor(w * scale));
          }
          const tableTop = doc.y;

          // Header row with background
          doc.rect(startX, tableTop - 2, colWidths.reduce((a, b) => a + b, 0), 30).fill(headerColor);
          doc.fillColor('white').fontSize(10);
          let currentX = startX;
          headers.forEach((header, i) => {
            doc.text(header, currentX + 4, tableTop + 4, { width: colWidths[i] - 8, align: 'center' });
            currentX += colWidths[i];
          });
          doc.moveDown(2);

          // Data rows
          doc.fillColor('black').fontSize(10); // Larger font for data
          const alignments = ['center', 'left', 'left', 'left', 'left', 'center', 'left', 'left', 'center', 'left']; // Match Excel alignments
          records.forEach((record, rowIndex) => {
            const rowData = [
              record.requestId || '',
              record.type || '',
              record.requester || '',
              record.unit || '',
              record.requestName || '',
              record.status || '',
              this._formatDate(record.dateSubmitted),
              this._formatDate(record.deadline),
              record.revisions || '',
              record.finalRemarks || ''
            ];

            let maxHeight = 16; // Minimum height
            rowData.forEach((cell, i) => {
              const height = doc.heightOfString(cell, { width: colWidths[i] - 8 });
              maxHeight = Math.max(maxHeight, height);
            });

            // Check if we need a new page before drawing the row
            if (doc.y + maxHeight + 6 > doc.page.height - 60) {
              doc.addPage();
              doc.y = 60;
            }

            const rowY = doc.y;

            // Alternate row background
            if (rowIndex % 2 === 1) {
              doc.rect(startX, rowY, colWidths.reduce((a, b) => a + b, 0), maxHeight + 6).fill('#f9fafb');
            }

            currentX = startX;
            rowData.forEach((cell, i) => {
              doc.fillColor('black').text(cell, currentX + 4, rowY + 3, { width: colWidths[i] - 8, align: alignments[i] });
              currentX += colWidths[i];
            });

            doc.y = rowY + maxHeight + 6; // Move down by max height plus padding
          });

          // Footer at the bottom of the page
          // Removed footer text as requested

          doc.end();

        } catch (error) {
          console.error('Error generating PDF with PDFKit:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate HTML report for display
   * @param {Array} records - Report records
   * @param {Object} summary - Statistics object
   * @returns {String} - HTML content
   */
  generateHTML(records, summary = {}) {
    try {
      let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>S-CORE Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
    h1 { color: #10b981; text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; }
    .summary { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px solid #d1fae5; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1); }
    .summary h2 { color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: bold; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
    .summary-item { margin: 8px 0; padding: 8px 12px; background: white; border-radius: 6px; border-left: 4px solid #10b981; font-size: 14px; }
    .summary-item strong { color: #047857; }
    table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden; }
    th, td { border: 1px solid #e5e7eb; padding: 12px 8px; text-align: left; vertical-align: top; }
    th { background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 15px 8px; }
    tr:nth-child(even) { background: #f9fafb; }
    tr:hover { background: #f3f4f6; transition: background-color 0.2s ease; }
    .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; display: inline-block; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-in-progress, .status-in-review { background: #bfdbfe; color: #1e40af; }
    .status-completed, .status-done { background: #d1fae5; color: #065f46; }
    .status-rejected, .status-cancelled { background: #fecaca; color: #dc2626; }
  </style>
</head>
<body>
  <h1>S-CORE Analytics Report</h1>
  <p><strong>Generated:</strong> ${this._formatHeaderDate(new Date())}</p>
`;

      if (Object.keys(summary).length > 0) {
        html += `
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Requests:</strong> ${summary.totalRequests || 0}</p>
  </div>
`;
      }

      html += `
  <table>
    <thead>
      <tr>
        <th>Request ID</th>
        <th>Type</th>
        <th>Requester</th>
        <th>Unit</th>
        <th>Request Name</th>
        <th>Status</th>
        <th>Date Submitted</th>
        <th>Deadline</th>
        <th>Revisions</th>
        <th>Final Remarks</th>
      </tr>
    </thead>
    <tbody>
`;

      if (records && records.length > 0) {
        records.forEach(record => {
          const dateSubmitted = record.dateSubmitted ? new Date(record.dateSubmitted).toLocaleDateString() : 'N/A';
          const deadline = record.deadline ? new Date(record.deadline).toLocaleDateString() : 'N/A';
          const statusClass = (record.status || '').toLowerCase().replace(/\s+/g, '-');

          html += `
      <tr>
        <td>${this.escapeHtml(record.requestId || 'N/A')}</td>
        <td>${this.escapeHtml(record.type || 'N/A')}</td>
        <td>${this.escapeHtml(record.requester || 'N/A')}</td>
        <td>${this.escapeHtml(record.unit || 'N/A')}</td>
        <td>${this.escapeHtml(record.service || 'N/A')}</td>
        <td><span class="status-badge status-${statusClass}">${this.escapeHtml(record.status || 'N/A')}</span></td>
        <td>${dateSubmitted}</td>
        <td>${deadline}</td>
        <td>${record.revisionsCount || 0}</td>
        <td>${this.escapeHtml(record.finalRemarks || 'N/A')}</td>
      </tr>
`;
        });
      } else {
        html += `<tr><td colspan="10" style="text-align: center;">No data available</td></tr>`;
      }

      html += `
    </tbody>
  </table>
</body>
</html>`;

      return html;
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw new Error('Failed to generate HTML report');
    }
  }

  /**
   * Helper function to format dates
   * @param {Date|String} date - Date to format
   * @returns {String} - Formatted date
   */
  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  }

  /**
   * Format date for headers (Month Day format)
   * @param {Date} date - Date to format
   * @returns {String} - Formatted date string
   */
  _formatHeaderDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  /**
   * Escape HTML characters to prevent XSS
   * @param {String} text - Text to escape
   * @returns {String} - Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get available filters for dropdown
   * @returns {Promise<Object>} - Available filter options
   */
  async getAvailableFilters() {
    try {
      const units = await ServiceRequest.distinct('assignedUnits');
      const approvalUnits = await RequestApproval.distinct('assignedUnits');
      const allUnits = [...new Set([...units, ...approvalUnits])];
      const statuses = await ServiceRequest.distinct('status');
      const approvalStatuses = await RequestApproval.distinct('status');
      const allStatuses = [...new Set([...statuses, ...approvalStatuses])];

      return {
        units: allUnits.filter(u => u && u !== 'Not yet assigned'),
        statuses: allStatuses.sort(),
        requestTypes: ['ServiceRequest', 'RequestApproval'],
        dateRangePresets: [
          { label: 'Last 7 days', days: 7 },
          { label: 'Last 30 days', days: 30 },
          { label: 'Last 90 days', days: 90 },
          { label: 'Last year', days: 365 }
        ]
      };
    } catch (error) {
      console.error('Error fetching available filters:', error);
      return {
        units: [],
        statuses: [],
        requestTypes: [],
        dateRangePresets: []
      };
    }
  }

  /**
   * Get comprehensive analytics data
   * @returns {Promise<Object>} - Analytics summary
   */
  async getAnalytics() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Total requests (service + approval)
      const totalServiceRequests = await ServiceRequest.countDocuments();
      const totalApprovalRequests = await RequestApproval.countDocuments();
      const totalRequests = totalServiceRequests + totalApprovalRequests;

      // Requests by status
      const serviceByStatus = await ServiceRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const approvalByStatus = await RequestApproval.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Requests by unit
      const requestsByUnit = await ServiceRequest.aggregate([
        { $group: { _id: '$assignedUnit', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Recent activity (last 30 days)
      const recentRequests = await ServiceRequest.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Completion rate
      const completedService = await ServiceRequest.countDocuments({ status: 'completed' });
      const completedApprovals = await RequestApproval.countDocuments({ status: 'completed' });
      const completionRate = totalRequests > 0 ? 
        Math.round((completedService + completedApprovals) / totalRequests * 100) : 0;

      // Average time to completion
      const completedWithTime = await ServiceRequest.find({ 
        status: 'completed',
        completedAt: { $exists: true }
      }).select('createdAt completedAt');

      let avgTimeToCompletion = 0;
      if (completedWithTime.length > 0) {
        const totalTime = completedWithTime.reduce((sum, req) => {
          if (req.completedAt) {
            return sum + (req.completedAt - req.createdAt);
          }
          return sum;
        }, 0);
        avgTimeToCompletion = Math.round(totalTime / completedWithTime.length / (1000 * 60 * 60 * 24)); // days
      }

      // User activity
      const totalUsers = await User.countDocuments();
      const activeUsers = await ServiceRequest.distinct('requesterId').then(ids => ids.length);

      // Requests trend (last 90 days)
      const trendData = await ServiceRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: ninetyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        summary: {
          totalRequests,
          totalServiceRequests,
          totalApprovalRequests,
          recentRequests,
          completionRate: completionRate + '%',
          avgTimeToCompletion: avgTimeToCompletion + ' days',
          totalUsers,
          activeUsers
        },
        byStatus: {
          service: serviceByStatus,
          approval: approvalByStatus
        },
        byUnit: requestsByUnit,
        trend: trendData,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw error;
    }
  }

  /**
   * Get request type performance analytics
   * @returns {Promise<Object>} - Performance data by request type
   */
  async getRequestTypeAnalytics() {
    try {
      const performance = await ServiceRequest.aggregate([
        {
          $group: {
            _id: '$specificRequestType',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            }
          }
        },
        { $sort: { total: -1 } }
      ]);

      return performance.map(item => ({
        requestType: item._id,
        total: item.total,
        completed: item.completed,
        pending: item.pending,
        inProgress: item.inProgress,
        completionRate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
      }));
    } catch (error) {
      console.error('Error generating request type analytics:', error);
      return [];
    }
  }

  /**
   * Get unit performance metrics
   * @returns {Promise<Object>} - Unit performance data
   */
  async getUnitAnalytics() {
    try {
      const unitData = await ServiceRequest.aggregate([
        {
          $match: { assignedUnit: { $exists: true, $ne: null } }
        },
        {
          $group: {
            _id: '$assignedUnit',
            totalRequests: { $sum: 1 },
            completedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { totalRequests: -1 } }
      ]);

      return unitData.map(unit => ({
        unit: unit._id,
        totalRequests: unit.totalRequests,
        completedRequests: unit.completedRequests,
        completionRate: Math.round((unit.completedRequests / unit.totalRequests) * 100),
        avgRating: unit.avgRating ? unit.avgRating.toFixed(1) : 'N/A'
      }));
    } catch (error) {
      console.error('Error generating unit analytics:', error);
      return [];
    }
  }

  /**
   * Get user activity analytics
   * @returns {Promise<Object>} - User activity data
   */
  async getUserAnalytics() {
    try {
      const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeUsers = await ServiceRequest.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: '$requesterId',
            requestCount: { $sum: 1 },
            lastRequestDate: { $max: '$createdAt' }
          }
        },
        { $sort: { requestCount: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        }
      ]);

      return activeUsers.map(user => ({
        userId: user._id,
        userName: user.userInfo.length > 0 ? 
          `${user.userInfo[0].fName} ${user.userInfo[0].lName}` : 'Unknown',
        requestCount: user.requestCount,
        lastRequestDate: user.lastRequestDate
      }));
    } catch (error) {
      console.error('Error generating user analytics:', error);
      return [];
    }
  }

  /**
   * Generate PDF from analytics dashboard data
   * @param {Object} analyticsData - Analytics data from dashboard
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateAnalyticsPDF(analyticsData) {
    try {
      const puppeteer = require('puppeteer');

      return new Promise(async (resolve, reject) => {
        try {
          // Launch browser
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          const page = await browser.newPage();

          // Set content
          let htmlContent;
          if (analyticsData.printHTML) {
            // Use the HTML content sent from frontend
            htmlContent = analyticsData.printHTML;
          } else {
            // Fallback to simple text-based PDF
            htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>S-CORE Analytics Report</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  h1 { color: #333; }
                  h2 { color: #666; margin-top: 30px; }
                  .kpi { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
                </style>
              </head>
              <body>
                <h1>S-CORE Analytics Report</h1>
                <p><strong>Generated:</strong> ${this._formatHeaderDate(new Date())}</p>

                ${analyticsData.kpis ? `
                  <h2>Key Performance Indicators</h2>
                  ${Object.entries(analyticsData.kpis).map(([key, value]) =>
                    `<div class="kpi"><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}</div>`
                  ).join('')}
                ` : ''}

                ${analyticsData.filters ? `
                  <h2>Applied Filters</h2>
                  ${Object.entries(analyticsData.filters).map(([key, value]) =>
                    `<div><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</div>`
                  ).join('')}
                ` : ''}

                ${analyticsData.charts ? `
                  <h2>Available Charts</h2>
                  ${Object.entries(analyticsData.charts).map(([key, chart]) =>
                    `<div><strong>${chart.title}:</strong> ${chart.description}</div>`
                  ).join('')}
                ` : ''}
              </body>
              </html>
            `;
          }

          await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

          // Generate PDF
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20px',
              right: '20px',
              bottom: '20px',
              left: '20px'
            }
          });

          await browser.close();
          resolve(pdfBuffer);

        } catch (error) {
          console.error('Error generating analytics PDF with puppeteer:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating analytics PDF:', error);
      throw new Error('Failed to generate analytics PDF');
    }
  }

}

module.exports = new ReportService();
