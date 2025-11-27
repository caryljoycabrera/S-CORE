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
        query.$or = [
          { assignedUnit: { $in: units } },
          { 'assignedTo.unit': { $in: units } }
        ];
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
          .populate('assignedTo', 'fName lName email')
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .lean();

        results = results.concat(
          serviceRequests.map(req => ({
            _id: req._id,
            requestId: req.requestID,
            type: 'Service Request',
            requester: `${req.userId?.fName || ''} ${req.userId?.lName || ''}`,
            requesterId: req.userId?._id,
            unit: req.assignedUnit || 'Unassigned',
            service: req.serviceType || req.title,
            status: req.status,
            dateSubmitted: req.createdAt,
            deadline: req.deadline,
            description: req.description,
            revisionsCount: req.revisions?.length || 0,
            assignedTo: req.assignedTo?.fName + ' ' + req.assignedTo?.lName || 'Unassigned'
          }))
        );
      }

      // Fetch Request Approvals if no specific type or type is RequestApproval
      if (!requestType || requestType === 'RequestApproval') {
        const approvalQuery = { ...query };
        const requestApprovals = await RequestApproval.find(approvalQuery)
          .populate('userId', 'fName lName email')
          .populate('assignedTo', 'fName lName email')
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .lean();

        results = results.concat(
          requestApprovals.map(req => ({
            _id: req._id,
            requestId: req.requestID,
            type: 'Request for Approval',
            requester: `${req.userId?.fName || ''} ${req.userId?.lName || ''}`,
            requesterId: req.userId?._id,
            unit: req.assignedTo?.unit || 'Unassigned',
            service: req.purpose || req.title,
            status: req.status,
            dateSubmitted: req.createdAt,
            deadline: req.deadline,
            description: req.description,
            revisionsCount: req.revisions?.length || 0,
            assignedTo: req.assignedTo?.fName + ' ' + req.assignedTo?.lName || 'Unassigned'
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
        completionRate: 0,
        averageTimeToCompletion: 0
      };

      // Count by status
      records.forEach(record => {
        summary.byStatus[record.status] = (summary.byStatus[record.status] || 0) + 1;
        summary.byType[record.type] = (summary.byType[record.type] || 0) + 1;
        summary.byUnit[record.unit] = (summary.byUnit[record.unit] || 0) + 1;
      });

      // Calculate completion rate
      const completedCount = summary.byStatus['Completed'] || 0;
      summary.completionRate = summary.totalRequests > 0 
        ? Math.round((completedCount / summary.totalRequests) * 100) 
        : 0;

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
   * Export report to CSV format
   * @param {Array} records - Report records
   * @returns {String} - CSV content
   */
  exportToCSV(records) {
    try {
      const headers = [
        'Request ID',
        'Type',
        'Requester',
        'Unit',
        'Service/Purpose',
        'Status',
        'Date Submitted',
        'Deadline',
        'Revisions',
        'Assigned To'
      ];

      let csv = headers.join(',') + '\n';

      if (records && records.length > 0) {
        const rows = records.map(record => [
          record.requestId || '',
          record.type || '',
          record.requester || '',
          record.unit || '',
          record.service || '',
          record.status || '',
          this._formatDate(record.dateSubmitted),
          this._formatDate(record.deadline),
          record.revisionsCount || 0,
          record.assignedTo || ''
        ]);

        rows.forEach(row => {
          csv += row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
        });
      }

      return csv;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export to CSV');
    }
  }

  /**
   * Export report to PDF format (returns HTML that can be converted)
   * @param {Array} records - Report records
   * @param {Object} summary - Report summary
   * @returns {String} - HTML content for PDF
   */
  exportToPDF(records, summary = {}) {
    try {
      const timestamp = new Date().toLocaleString();
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #10b981; }
            .summary { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .summary-item { display: inline-block; margin-right: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #10b981; color: white; }
            tr:nth-child(even) { background: #f9fafb; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>S-CORE System Report</h1>
          <p>Generated: ${timestamp}</p>
      `;

      // Add summary section
      if (Object.keys(summary).length > 0) {
        html += `
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-item">Total Requests: <strong>${summary.totalRequests || 0}</strong></div>
            <div class="summary-item">Completion Rate: <strong>${summary.completionRate || 0}%</strong></div>
        `;
        
        if (summary.byStatus) {
          html += '<div class="summary-item">By Status:<ul>';
          Object.entries(summary.byStatus).forEach(([status, count]) => {
            html += `<li>${status}: ${count}</li>`;
          });
          html += '</ul></div>';
        }
        
        html += '</div>';
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
              <th>Service/Purpose</th>
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
            <td>${record.requestId || ''}</td>
            <td>${record.type || ''}</td>
            <td>${record.requester || ''}</td>
            <td>${record.unit || ''}</td>
            <td>${record.service || ''}</td>
            <td>${record.status || ''}</td>
            <td>${this._formatDate(record.dateSubmitted)}</td>
            <td>${this._formatDate(record.deadline)}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        <div class="footer">
          <p>This is an automatically generated report from S-CORE System.</p>
        </div>
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
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generatePDF(records, summary = {}) {
    try {
      const PDFDocument = require('pdfkit');

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add title
        doc.fontSize(20).text('S-CORE Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add summary if available
        if (Object.keys(summary).length > 0) {
          doc.fontSize(16).text('Summary', { underline: true });
          doc.moveDown();

          if (summary.totalRequests) {
            doc.fontSize(12).text(`Total Requests: ${summary.totalRequests}`);
          }
          if (summary.completionRate) {
            doc.text(`Completion Rate: ${summary.completionRate}%`);
          }

          doc.moveDown();
        }

        // Add table headers
        const tableTop = doc.y;
        const headers = ['Request ID', 'Type', 'Requester', 'Unit', 'Status', 'Date Submitted'];

        doc.fontSize(10);
        headers.forEach((header, i) => {
          doc.text(header, 50 + (i * 80), tableTop, { width: 70, align: 'left' });
        });

        doc.moveDown();

        // Add table rows
        if (records && records.length > 0) {
          records.forEach((record, index) => {
            if (doc.y > 700) { // Check if we need a new page
              doc.addPage();
            }

            const y = doc.y;
            const rowData = [
              record.requestId || '',
              record.type || '',
              record.requester || '',
              record.unit || '',
              record.status || '',
              this._formatDate(record.dateSubmitted)
            ];

            rowData.forEach((data, i) => {
              doc.text(data.toString(), 50 + (i * 80), y, { width: 70, align: 'left' });
            });

            doc.moveDown();
          });
        } else {
          doc.text('No data available', 50, doc.y);
        }

        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text('This is an automatically generated report from S-CORE System.', { align: 'center' });

        doc.end();
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
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
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  /**
   * Get available filters for dropdown
   * @returns {Promise<Object>} - Available filter options
   */
  async getAvailableFilters() {
    try {
      const units = await ServiceRequest.distinct('assignedUnit');
      const statuses = await ServiceRequest.distinct('status');
      
      const approvalStatuses = await RequestApproval.distinct('status');
      const allStatuses = [...new Set([...statuses, ...approvalStatuses])];

      return {
        units: units.filter(u => u && u !== 'Unassigned'),
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
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

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
