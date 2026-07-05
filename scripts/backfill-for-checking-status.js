/**
 * Backfill "For Checking" Status
 *
 * Requests that were resubmitted by the requestor before the 'For Checking'
 * status existed were left at 'status: Pending'. This script finds those
 * stuck records (Pending, not awaiting resubmission, last revision history
 * entry is a requestor response) and moves them to 'For Checking'.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RequestApproval = require('../models/RequestApproval');

async function backfillForCheckingStatus() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully\n');

    const candidates = await RequestApproval.find({
      status: 'Pending',
      awaitingResubmission: false,
      'revisionHistory.0': { $exists: true }
    });

    console.log(`Found ${candidates.length} Pending requests with revision history to check`);

    let updated = 0;
    for (const request of candidates) {
      const lastEntry = request.revisionHistory[request.revisionHistory.length - 1];
      if (lastEntry && lastEntry.status === 'responded') {
        console.log(`  Fixing: ${request._id} - "Pending" -> "For Checking"`);
        request.status = 'For Checking';
        await request.save();
        updated++;
      }
    }

    console.log(`\nUpdated ${updated} approval request(s) to 'For Checking'`);
    console.log('Backfill completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling For Checking status:', error);
    process.exit(1);
  }
}

backfillForCheckingStatus();
