const mongoose = require('mongoose');
require('./models/ReportHistory');

async function checkReports() {
  try {
    await mongoose.connect('mongodb://localhost:27017/s-core', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const ReportHistory = mongoose.model('ReportHistory');
    const count = await ReportHistory.countDocuments();
    console.log('Total ReportHistory documents:', count);

    const activeCount = await ReportHistory.countDocuments({ isDeleted: false });
    console.log('Active ReportHistory documents:', activeCount);

    if (activeCount > 0) {
      const reports = await ReportHistory.find({ isDeleted: false })
        .limit(5)
        .select('reportType generatedAt fileName recordCount')
        .lean();
      console.log('Sample reports:', JSON.stringify(reports, null, 2));
    } else {
      console.log('No active reports found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkReports();