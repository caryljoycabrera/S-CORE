// ===== Archiving Service =====
// Handles automated archiving of stale requests based on SystemSettings rules.
// This service is called by the job scheduler (jobSchedulerService.js) every midnight.

const SystemSettings = require('../models/SystemSettings');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');

/**
 * runArchivingTasks()
 * Pulls day-limit rules from SystemSettings, then finds and archives:
 *   1. Requests with status 'Completed' or 'Approved' older than archiveCompletedAfterDays
 *   2. Requests with status 'For Revision' with no activity for archiveRevisionAfterDays
 */
const runArchivingTasks = async () => {
  console.log('[ArchivingService] Starting archiving tasks...');

  try {
    // --- 1. Load settings ---
    const settings = await SystemSettings.findOne().lean();

    // Use defaults if settings document doesn't exist yet
    const completedAfterDays = (settings && settings.archiveCompletedAfterDays != null)
      ? settings.archiveCompletedAfterDays
      : 30;
    const revisionAfterDays = (settings && settings.archiveRevisionAfterDays != null)
      ? settings.archiveRevisionAfterDays
      : 14;

    console.log(`[ArchivingService] Rules: archive Completed/Approved after ${completedAfterDays} days, For Revision after ${revisionAfterDays} days of inactivity`);

    const now = new Date();

    // --- 2. Calculate cutoff dates ---
    const completedCutoff = new Date(now.getTime() - completedAfterDays * 24 * 60 * 60 * 1000);
    const revisionCutoff  = new Date(now.getTime() - revisionAfterDays  * 24 * 60 * 60 * 1000);

    // --- 3. Build queries ---
    // Completed/Approved: status matches AND updatedAt is past the cutoff
    const completedQuery = {
      status: { $in: ['Completed', 'Approved'] },
      isDeleted: { $ne: true },   // Don't touch already soft-deleted records
      updatedAt: { $lte: completedCutoff }
    };

    // For Revision: status matches AND updatedAt (last activity) is past the cutoff
    const revisionQuery = {
      status: 'For Revision',
      isDeleted: { $ne: true },
      updatedAt: { $lte: revisionCutoff }
    };

    // --- 4. Archive Completed/Approved requests in BOTH collections ---
    // First fetch IDs to update previousStatus per document, then bulk-update
    const archiveUpdate = (prevStatus) => ({
      $set: { status: 'Archived', previousStatus: prevStatus, archivedAt: now, archivedBy: 'system' }
    });

    // Use updateMany with $set that preserves previousStatus using a pipeline-style update
    const archivedCompletedApprovals = await RequestApproval.updateMany(
      completedQuery,
      [{ $set: { previousStatus: '$status', status: 'Archived', archivedAt: now, archivedBy: 'system' } }]
    );

    const archivedCompletedServices = await ServiceRequest.updateMany(
      completedQuery,
      [{ $set: { previousStatus: '$status', status: 'Archived', archivedAt: now, archivedBy: 'system' } }]
    );

    // --- 5. Archive stale For Revision requests in BOTH collections ---
    const archivedRevisionApprovals = await RequestApproval.updateMany(
      revisionQuery,
      [{ $set: { previousStatus: '$status', status: 'Archived', archivedAt: now, archivedBy: 'system' } }]
    );

    const archivedRevisionServices = await ServiceRequest.updateMany(
      revisionQuery,
      [{ $set: { previousStatus: '$status', status: 'Archived', archivedAt: now, archivedBy: 'system' } }]
    );


    // --- 6. Log summary ---
    const totalArchived =
      archivedCompletedApprovals.modifiedCount +
      archivedCompletedServices.modifiedCount +
      archivedRevisionApprovals.modifiedCount +
      archivedRevisionServices.modifiedCount;

    console.log('[ArchivingService] Archiving complete.');
    console.log(`  → Completed/Approved — Approvals: ${archivedCompletedApprovals.modifiedCount}, Services: ${archivedCompletedServices.modifiedCount}`);
    console.log(`  → For Revision       — Approvals: ${archivedRevisionApprovals.modifiedCount},  Services: ${archivedRevisionServices.modifiedCount}`);
    console.log(`  → Total archived this run: ${totalArchived}`);

    return { totalArchived };
  } catch (error) {
    console.error('[ArchivingService] Error during archiving tasks:', error);
    throw error;
  }
};

module.exports = { runArchivingTasks };
