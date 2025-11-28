const mongoose = require('mongoose');
const ReportService = require('./services/reportService');
require('./models/ReportHistory');
require('./models/User');
require('./models/ServiceRequest');
require('./models/RequestApproval');

async function testReportGeneration() {
  try {
    await mongoose.connect('mongodb://localhost:27017/s-core', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to database');

    // Get some test data
    const reportData = await ReportService.generateReport({});
    console.log('Generated report with', reportData.length, 'records');

    // Generate Excel
    const excelBuffer = await ReportService.exportToExcel(reportData, {}, { headerColor: '#10b981' });
    console.log('Generated Excel buffer, size:', excelBuffer.length);

    // Save to ReportHistory manually
    const ReportHistory = mongoose.model('ReportHistory');
    const User = mongoose.model('User');

    // Get an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('Found admin user:', adminUser._id);

    const reportHistory = new ReportHistory({
      reportType: 'report_excel',
      generatedBy: adminUser._id,
      fileName: `test-report-${Date.now()}.xlsx`,
      fileSize: excelBuffer.length,
      filters: {},
      options: { headerColor: '#10b981' },
      recordCount: reportData.length
    });

    // Try saving without fileData first
    console.log('Saving report metadata only...');
    try {
      await reportHistory.save();
      console.log('Report metadata saved successfully with ID:', reportHistory._id);
    } catch (saveError) {
      console.error('Save error:', saveError);
      return;
    }

    // Now try to update with fileData
    console.log('Updating with fileData...');
    try {
      reportHistory.fileData = excelBuffer;
      await reportHistory.save();
      console.log('Report with fileData saved successfully');
    } catch (updateError) {
      console.error('Update error:', updateError);
    }

    // Check total count
    const count = await ReportHistory.countDocuments();
    console.log('Total reports in database:', count);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testReportGeneration();