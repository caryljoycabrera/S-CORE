// ===== Archiving Service =====
// Handles automated archiving of stale requests based on SystemSettings rules.
// This service is called by the job scheduler (jobSchedulerService.js) every midnight.

const SystemSettings = require('../models/SystemSettings');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const notificationService = require('./notificationService');

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
    const approvedAfterDays = (settings && settings.archiveApprovedAfterDays != null)
      ? settings.archiveApprovedAfterDays
      : 30;
    const revisionAfterDays = (settings && settings.archiveRevisionAfterDays != null)
      ? settings.archiveRevisionAfterDays
      : 14;

    console.log(`[ArchivingService] Rules: Completed after ${completedAfterDays}d, Approved after ${approvedAfterDays}d, For Revision after ${revisionAfterDays}d`);

    const now = new Date();

    // --- 2. Calculate cutoff dates ---
    const completedCutoff = new Date(now.getTime() - completedAfterDays * 24 * 60 * 60 * 1000);
    const approvedCutoff  = new Date(now.getTime() - approvedAfterDays  * 24 * 60 * 60 * 1000);
    const revisionCutoff  = new Date(now.getTime() - revisionAfterDays  * 24 * 60 * 60 * 1000);

    // --- 3. Build queries ---
    const completedQuery = {
      status: { $regex: /^completed$/i },
      isDeleted: { $ne: true },
      updatedAt: { $lte: completedCutoff }
    };

    const approvedQuery = {
      status: { $regex: /^approved$/i },
      isDeleted: { $ne: true },
      updatedAt: { $lte: approvedCutoff }
    };

    const revisionQuery = {
      status: { $regex: /^for revision$/i },
      isDeleted: { $ne: true },
      updatedAt: { $lte: revisionCutoff }
    };

    // --- Helper to process queries and notifications ---
    const processArchiving = async (Model, query) => {
      // 1. Find all matching elements
      const requests = await Model.find(query);
      if (requests.length === 0) return { modifiedCount: 0 };
      
      const admins = await User.find({ role: 'admin' }, '_id');
      const adminIds = admins.map(a => a._id);

      for (const req of requests) {
        const titleStr = req.title || 'Untitled Request';
        const requestType = Model === RequestApproval ? 'approval' : 'service';
        const requestId = req._id.toString();
        try {
          // Notify User - with modal URL for archived request restoration (user side page)
          const userMessage = `Your request "${titleStr}" was automatically archived by the system. You can request restoration by clicking this notification.`;
          const userUrl = requestType === 'approval' 
            ? `/request-approvals?modal=archived&requestId=${requestId}&type=${requestType}`
            : `/service-requests?modal=archived&requestId=${requestId}&type=${requestType}`;
          if (req.userId) {
            await notificationService.notifySystem(req.userId._id || req.userId, 'Request Automatically Archived', userMessage, 'medium', userUrl);
          }
          
          // Notify Units - with modal URL
          if (req.assignedUnits) {
            const unitMembers = await User.find({ unitTeam: req.assignedUnits, role: 'unit' }, '_id');
            const unitIds = unitMembers.map(u => u._id);
            if (unitIds.length > 0) {
               const unitMessage = `The request "${titleStr}" assigned to your unit was automatically archived by the system. You can request restoration.`;
               const unitUrl = `/unit/task-${requestType}s?modal=archived&requestId=${requestId}&type=${requestType}`;
               await notificationService.notifySystem(unitIds, 'Request Automatically Archived', unitMessage, 'medium', unitUrl);
            }
          }
          
          // Notify Admins - with modal URL
          if (adminIds.length > 0) {
            const adminMessage = `The request "${titleStr}" was automatically archived by the system.`;
            const adminUrl = `/admin/${requestType}s?modal=archived&requestId=${requestId}&type=${requestType}`;
            await notificationService.notifySystem(adminIds, 'Request Automatically Archived', adminMessage, 'medium', adminUrl);
          }
        } catch (err) {
          console.error('[ArchivingService] Error sending notifications:', err);
        }
      }

      // 2. Update them
      return await Model.updateMany(
        query,
        [{ $set: { previousStatus: '$status', status: 'Archived', archivedAt: now, archivedBy: 'system' } }]
      );
    };

    // --- 4. Archive Completed requests in BOTH collections ---
    const archivedCompletedApprovals = await processArchiving(RequestApproval, completedQuery);
    const archivedCompletedServices = await processArchiving(ServiceRequest, completedQuery);

    // --- 5. Archive Approved requests with their own cutoff ---
    const archivedApprovedApprovals = await processArchiving(RequestApproval, approvedQuery);
    const archivedApprovedServices = await processArchiving(ServiceRequest, approvedQuery);

    // --- 6. Archive stale For Revision requests ---
    const archivedRevisionApprovals = await processArchiving(RequestApproval, revisionQuery);
    const archivedRevisionServices = await processArchiving(ServiceRequest, revisionQuery);


    // --- 7. Log summary ---
    const totalArchived =
      archivedCompletedApprovals.modifiedCount +
      archivedCompletedServices.modifiedCount +
      archivedApprovedApprovals.modifiedCount +
      archivedApprovedServices.modifiedCount +
      archivedRevisionApprovals.modifiedCount +
      archivedRevisionServices.modifiedCount;

    console.log('[ArchivingService] Archiving complete.');
    console.log(`  → Completed — Approvals: ${archivedCompletedApprovals.modifiedCount}, Services: ${archivedCompletedServices.modifiedCount}`);
    console.log(`  → Approved  — Approvals: ${archivedApprovedApprovals.modifiedCount}, Services: ${archivedApprovedServices.modifiedCount}`);
    console.log(`  → Revision  — Approvals: ${archivedRevisionApprovals.modifiedCount}, Services: ${archivedRevisionServices.modifiedCount}`);
    console.log(`  → Total archived: ${totalArchived}`);

    return { totalArchived };
  } catch (error) {
    console.error('[ArchivingService] Error during archiving tasks:', error);
    throw error;
  }
};

module.exports = { runArchivingTasks };
