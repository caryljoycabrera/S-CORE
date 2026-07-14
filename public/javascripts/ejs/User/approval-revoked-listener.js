// ===== Approval Revoked Real-Time Listener (requestor side) =====
// When a unit revokes an approval, the server emits 'approvalRevoked' to the
// requestor's socket. This listener updates the page in place so the requestor
// immediately sees the "For Revision" status and the "Resubmit Your Request"
// form — no reload needed. Revision history is re-fetched from the API, which
// returns the full timeline (including the new revocation entry), so no
// history is ever lost.
(function attachApprovalRevokedListener(attempts) {
  attempts = attempts || 0;

  const system = window.notificationSystem;
  const socket = system && system.socket;

  // The notification system creates its socket on DOMContentLoaded; retry
  // briefly until it exists.
  if (!socket) {
    if (attempts < 100) {
      setTimeout(function () { attachApprovalRevokedListener(attempts + 1); }, 300);
    }
    return;
  }

  socket.on('approvalRevoked', function (data) {
    if (!data || !data.requestId) return;

    const requestId = String(data.requestId);
    const newStatus = data.newStatus || 'For Revision';
    const statusClass = newStatus.toLowerCase().replace(/\s+/g, '-');

    // 1) Update the table row so the status badge is fresh and reopening the
    //    modal passes the "For Revision" check that reveals the resubmit form
    const row = document.querySelector('tr[data-id="' + requestId + '"]');
    if (row) {
      row.dataset.status = newStatus;
      const statusCell = row.querySelector('.status-badge');
      if (statusCell) {
        statusCell.textContent = newStatus;
        statusCell.className = 'status-badge ' + statusClass;
      }
    }

    // 2) Tell the page script (which owns the modal state) to refresh the
    //    open details modal in place — it re-renders the revision history and
    //    reveals the resubmission form for "For Revision" status
    window.dispatchEvent(new CustomEvent('approval-revoked', {
      detail: { requestId: requestId, newStatus: newStatus }
    }));

    // 3) Let the requestor know what just happened
    if (typeof window.showAlert === 'function') {
      window.showAlert(
        'A unit revoked its approval of your request. The status is now "For Revision" — please review the feedback and resubmit.',
        'warning'
      );
    }
  });
})();
