/* =============================================================================
   ADMINPAGE.JS - JavaScript Functionality for Adminpage.ejs
   =============================================================================
   Purpose: Interactive features for the S-CORE Admin Dashboard page
   Connected file: views/Admin/adminpage.ejs
   Depended on: jQuery (if used), calendar functions, notification system
   ============================================================================= */

/* ==========================================
   UI INTERACTION FUNCTIONS
   ========================================== */

/* Dropdown toggle for user menu */
function toggleDropdown() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/* Close dropdown when clicking outside */
document.addEventListener("click", function (event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (!toggle.contains(event.target)) {
    menu.style.display = "none";
  }
});

/* Add hover animations for action cards */
document.querySelectorAll('.action-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px) scale(1.02)';
  });

  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

/* ==========================================
   CALENDAR FUNCTIONALITY
   ========================================== */

(function() {
  /* Calendar element references */
  const calendar = document.getElementById('calendar-standalone');
  const monthYear = document.getElementById('calendar-month-year');
  const prevBtn = document.getElementById('calendar-prev-month');
  const nextBtn = document.getElementById('calendar-next-month');
  const maximizeBtn = document.getElementById('calendar-maximize');

  /* Modal element references */
  const modal = document.getElementById('calendar-modal');
  const modalCalendar = document.getElementById('calendar-modal-grid');
  const modalMonthYear = document.getElementById('calendar-modal-month-year');
  const modalPrevBtn = document.getElementById('calendar-modal-prev-month');
  const modalNextBtn = document.getElementById('calendar-modal-next-month');
  const minimizeBtn = document.getElementById('calendar-minimize');

  /* Deadline details modal elements */
  const deadlineModal = document.getElementById('deadline-details-modal');
  const deadlineList = document.getElementById('deadline-list');
  const deadlineDate = document.getElementById('deadline-details-date');
  const backToCalendarBtn = document.getElementById('back-to-calendar');
  const closeDeadlineDetailsBtn = document.getElementById('close-deadline-details');

  /* State variables */
  let currentDate = new Date();
  let deadlinesData = {};
  let detailedDeadlinesData = {};

  /* Check if required elements exist */
  if (!calendar || !monthYear || !prevBtn || !nextBtn) {
    console.error('Required calendar elements not found');
    return;
  }

  /* Fetch deadline data from server */
  async function fetchDeadlines() {
    try {
      const response = await fetch('/api/deadlines', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const responseText = await response.text();

        try {
          deadlinesData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing deadlines JSON:', parseError);
          deadlinesData = {};
        }
      } else {
        console.error('Failed to fetch deadlines, status:', response.status);
        deadlinesData = {};
      }
    } catch (error) {
      console.error('Network error fetching deadlines:', error);
      deadlinesData = {};
    }
  }

  /* Determine CSS classes for deadline indicators */
  function getDeadlineClasses(dateStr) {
    const deadlines = deadlinesData[dateStr];
    if (!deadlines) {
      return '';
    }

    const hasApprovals = deadlines.approvals > 0;
    const hasServices = deadlines.services > 0;

    if (hasApprovals && hasServices) {
      return 'has-mixed-deadlines';
    } else if (hasApprovals) {
      return 'has-approval-deadline';
    } else if (hasServices) {
      return 'has-service-deadline';
    }

    return '';
  }

  /* Get total count of deadlines for a date */
  function getDeadlineCount(dateStr) {
    const deadlines = deadlinesData[dateStr];
    if (!deadlines) return 0;
    return deadlines.approvals + deadlines.services;
  }

  /* Create HTML for deadline indicator badges */
  function createDeadlineIndicators(dateStr) {
    const deadlines = deadlinesData[dateStr];
    if (!deadlines) return '';

    const hasApprovals = deadlines.approvals > 0;
    const hasServices = deadlines.services > 0;

    if (hasApprovals && hasServices) {
      let badges = '';
      if (deadlines.approvals > 0) {
        badges += `<span class="deadline-badge approval">${deadlines.approvals}</span>`;
      }
      if (deadlines.services > 0) {
        badges += `<span class="deadline-badge service">${deadlines.services}</span>`;
      }
      return `<div class="deadline-indicators">${badges}</div>`;
    } else if (hasApprovals) {
      return `<div class="deadline-indicators"><span class="deadline-badge approval">${deadlines.approvals}</span></div>`;
    } else if (hasServices) {
      return `<div class="deadline-indicators"><span class="deadline-badge service">${deadlines.services}</span></div>`;
    }

    return '';
  }

  /* Render calendar for given date and target elements */
  function renderCalendar(date, targetElement, targetMonthYear) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    // Set month and year in header
    targetMonthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    // Build days grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day calendar-empty"></div>';
    }

    // Days of the month - All dates are clickable
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const deadlineClasses = getDeadlineClasses(dateStr);
      const deadlineIndicators = createDeadlineIndicators(dateStr);

      let className = 'calendar-day';
      if (isToday) className += ' calendar-today';
      if (deadlineClasses) className += ' ' + deadlineClasses;

      // Make ALL dates clickable
      html += `<div class="${className}" data-date="${dateStr}" style="cursor: pointer;">${day}${deadlineIndicators}</div>`;
    }

    targetElement.innerHTML = html;

    // Add click event listeners to ALL calendar days (excluding empty cells)
    targetElement.querySelectorAll('.calendar-day:not(.calendar-empty)').forEach(dayElement => {
      const dateStr = dayElement.getAttribute('data-date');

      if (dateStr) {
        dayElement.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          showDeadlineDetails(dateStr);
        });

        // Visual feedback for all clickable days
        dayElement.addEventListener('mouseenter', function() {
          if (!this.classList.contains('calendar-today')) {
            this.style.backgroundColor = '#e8f5e9';
          }
        });

        dayElement.addEventListener('mouseleave', function() {
          if (!this.classList.contains('calendar-today')) {
            this.style.backgroundColor = '';
          }
        });
      }
    });
  }

  /* Update both calendar views (embedded and modal) */
  function updateBothCalendars() {
    renderCalendar(currentDate, calendar, monthYear);
    if (modal.classList.contains('active')) {
      renderCalendar(currentDate, modalCalendar, modalMonthYear);
    }
  }

  /* Show deadline details modal for selected date */
  async function showDeadlineDetails(dateStr) {
    // Hide calendar modal if it's open
    if (modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }

    // Show loading state
    const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (deadlineDate) {
      deadlineDate.textContent = formattedDate;
    }

    if (deadlineList) {
      deadlineList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">Loading deadline details...</div>';
    }

    // Show the deadline details modal immediately
    if (deadlineModal) {
      deadlineModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    try {
      const response = await fetch(`/api/deadlines/${dateStr}/details`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const deadlineData = await response.json();

        // Check if we have any deadlines
        if (deadlineData && deadlineData.totalCount > 0) {
          renderDeadlineItems(deadlineData);
        } else {
          // Show empty state
          if (deadlineList) {
            deadlineList.innerHTML = `
              <div class="deadline-empty-state">
                <div class="deadline-empty-state-icon">
                  <svg width="40" height="40" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div class="deadline-empty-state-text">No deadlines for this date</div>
                <div class="deadline-empty-state-subtext">There are no pending deadlines on this date.</div>
              </div>
            `;
          }
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error loading deadline details:', error);
      if (deadlineList) {
        deadlineList.innerHTML = `
          <div class="deadline-empty-state">
            <div class="deadline-empty-state-icon">
            <svg width="40" height="40" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
          </div>
            <div class="deadline-empty-state-text">Error loading deadlines</div>
            <div class="deadline-empty-state-subtext">Please try again later. Error: ${error.message}</div>
          </div>
        `;
      }
    }
  }

  /* Render deadline items in modal */
  function renderDeadlineItems(data) {
    if (!deadlineList || !data) {
      console.error('Missing deadline list element or data');
      return;
    }

    let html = '';

    const hasApprovals = data.approvals && Array.isArray(data.approvals) && data.approvals.length > 0;
    const hasServices = data.services && Array.isArray(data.services) && data.services.length > 0;

    if (!hasApprovals && !hasServices) {
      html = `
        <div class="deadline-empty-state">
          <div class="deadline-empty-state-icon">📅</div>
          <div class="deadline-empty-state-text">No deadlines for this date</div>
          <div class="deadline-empty-state-subtext">There are no pending deadlines on this date.</div>
        </div>
      `;
    } else {
      // Render approval requests
      if (hasApprovals) {
        data.approvals.forEach(item => {
          const truncatedDescription = item.description && item.description.length > 150
            ? item.description.substring(0, 150) + '...'
            : item.description || 'No description available';

          const createdDate = new Date(item.createdAt || item.datetime).toLocaleDateString();
          const deadlineDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
          const organization = item.displayOrganization || item.organization || 'N/A';

          // Extract user information
          const userName = item.userId ? `${item.userId.fName} ${item.userId.lName}` : 'Unknown User';
          const userType = item.userId?.userType === 'student' ? 'Student' : 'Non-Student';

          html += `
            <div class="deadline-item">
              <div class="deadline-item-header">
                <h3 class="deadline-item-title">${item.title || 'Untitled Request'}</h3>
                <span class="deadline-item-type approval">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="m21,12c0,4.97 -4.03,9 -9,9s-9,-4.03 -9,-9 4.03,-9 9,-9c1.86,0 3.58,0.57 5.01,1.53"/>
                  </svg>
                  Approval Request
                </span>
              </div>
              <p class="deadline-item-description">${truncatedDescription}</p>
              <div class="deadline-item-meta">
                <span>Submitted by: <strong>${userName}</strong> (${userType})</span>
                <span>Organization: ${organization}</span>
                <span>Created: ${createdDate}</span>
                <span>Deadline: ${deadlineDate}</span>
              </div>
              <div class="deadline-item-actions">
                <a href="/admin/approvals?openModalId=${item._id}" class="deadline-action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </a>
              </div>
            </div>
          `;
        });
      }

      // Render service requests
      if (hasServices) {
        data.services.forEach(item => {
          const truncatedDescription = item.description && item.description.length > 150
            ? item.description.substring(0, 150) + '...'
            : item.description || 'No description available';

          const createdDate = new Date(item.createdAt || item.datetime).toLocaleDateString();
          const deadlineDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
          const organization = item.displayOrganization || item.organization || 'N/A';

          // Extract user information
          const userName = item.userId ? `${item.userId.fName} ${item.userId.lName}` : 'Unknown User';
          const userType = item.userId?.userType === 'student' ? 'Student' : 'Non-Student';

          html += `
            <div class="deadline-item">
              <div class="deadline-item-header">
                <h3 class="deadline-item-title">${item.title || 'Untitled Request'}</h3>
                <span class="deadline-item-type service">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                  Service Request
                </span>
              </div>
              <p class="deadline-item-description">${truncatedDescription}</p>
              <div class="deadline-item-meta">
                <span>Submitted by: <strong>${userName}</strong> (${userType})</span>
                <span>Organization: ${organization}</span>
                <span>Created: ${createdDate}</span>
                <span>Deadline: ${deadlineDate}</span>
              </div>
              <div class="deadline-item-actions">
                <a href="/admin/services?openModalId=${item._id}" class="deadline-action-btn service">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </a>
              </div>
            </div>
          `;
        });
      }
    }

    deadlineList.innerHTML = html;
  }

  /* ==========================================
     EVENT LISTENERS AND INITIALIZATION
     ========================================== */

  /* Navigation event listeners for main calendar */
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateBothCalendars();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateBothCalendars();
    });
  }

  /* Navigation event listeners for modal calendar */
  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateBothCalendars();
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateBothCalendars();
    });
  }

  /* Maximize/Minimize functionality */
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (modal) {
        modal.classList.add('active');
        renderCalendar(currentDate, modalCalendar, modalMonthYear);
        document.body.style.overflow = 'hidden';
      }
    });
  }

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* Deadline details modal controls */
  if (backToCalendarBtn) {
    backToCalendarBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (deadlineModal) {
        deadlineModal.classList.remove('active');
      }
      if (modal) {
        modal.classList.add('active');
      }
    });
  }

  if (closeDeadlineDetailsBtn) {
    closeDeadlineDetailsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (deadlineModal) {
        deadlineModal.classList.remove('active');
      }
      document.body.style.overflow = '';
    });
  }

  /* Close modals when clicking outside */
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  if (deadlineModal) {
    deadlineModal.addEventListener('click', function(e) {
      if (e.target === deadlineModal) {
        deadlineModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (deadlineModal && deadlineModal.classList.contains('active')) {
        deadlineModal.classList.remove('active');
        document.body.style.overflow = '';
      } else if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateBothCalendars();
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateBothCalendars();
    }
  });

  /* Initialize the calendar */
  async function initCalendar() {
    await fetchDeadlines();
    updateBothCalendars();
  }

  initCalendar();
})();

/* Toggle guidelines visibility */
function toggleGuidelines() {
  const content = document.getElementById('guidelinesContent');
  const toggle = document.getElementById('guidelinesToggle');

  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    toggle.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      content.classList.add('active');
    }, 10);
  } else {
    content.classList.remove('active');
    toggle.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
  }
}

/* ==========================================
   NOTIFICATION SYSTEM FUNCTIONALITY
   ========================================== */

(function() {
  /* Notification system variables */
  const notificationBell = document.getElementById('notificationBell');
  const notificationBadge = document.getElementById('notificationBadge');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationList = document.getElementById('notificationList');
  let previousNotificationCount = 0;
  let notificationCheckInterval;

  /* Check if required notification elements exist */
  if (!notificationBell || !notificationBadge || !notificationDropdown || !notificationList) {
    console.error('Required notification elements not found');
    return;
  }

  /* Fetch notification data from server */
  async function fetchNotifications() {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          updateNotificationDisplay(data);
        } catch (parseError) {
          console.error('Error parsing notifications JSON:', parseError);
        }
      } else if (response.status === 401) {
        // Unauthorized - stop polling
        if (notificationCheckInterval) {
          clearInterval(notificationCheckInterval);
        }
      } else {
        console.error('Failed to fetch notifications, status:', response.status);
      }
    } catch (error) {
      console.error('Network error fetching notifications:', error);
    }
  }

  /* Update notification display with data */
  function updateNotificationDisplay(data) {
      const totalCount = data.totalCount || 0;
      const unreadCount = data.unreadCount || 0;
      const currentTime = new Date();

      // Update badge count with unread count
      if (unreadCount > 0) {
        notificationBadge.style.display = 'flex';
        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        notificationBell.classList.add('has-unread'); // Add visual indicator

        // Check if this is a new notification
        if (totalCount > previousNotificationCount && previousNotificationCount > 0) {
          // Trigger bell ring animation
          triggerNotificationRing();
        }

        previousNotificationCount = totalCount;
      } else {
        notificationBadge.style.display = 'none';
        notificationBadge.textContent = '0';
        previousNotificationCount = 0;
      }

      // Update dropdown list
      if (data.notifications && data.notifications.length > 0) {
        const notificationsHtml = data.notifications
          .slice(0, 10) // Limit to 10 most recent
          .map(notification => renderNotificationItem(notification, currentTime))
          .join('');

        notificationList.innerHTML = notificationsHtml;
      } else {
        notificationList.innerHTML = `
          <div class="notification-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13.5,2 13.5,9 20.5,9"/>
            </svg>
            <p>No pending requests</p>
          </div>
        `;
      }
    }

    /* Render individual notification item */
    function renderNotificationItem(notification, currentTime) {
      const userName = notification.userName || 'Unknown User';
      const userType = notification.userType === 'student' ? 'Student' : 'Employee';

      let typeClass, typeText, priorityColor;

      if (notification.type === 'approval') {
        typeClass = 'approval';
        typeText = 'Approval Request';
        priorityColor = '#3b82f6';
      } else if (notification.type === 'service') {
        typeClass = 'service';
        typeText = 'Service Request';
        priorityColor = '#f97316';
      }

      // Calculate relative time
      const timeDiff = currentTime - new Date(notification.createdAt);
      const timeText = formatRelativeTime(timeDiff);

      const truncatedDescription = notification.description && notification.description.length > 80
        ? notification.description.substring(0, 80) + '...'
        : notification.description || 'No description available';

      // Create the notification item with click handler
      const itemId = `notification-${notification._id}-${notification.type}`;
      return `
        <div class="notification-item" id="${itemId}" data-notification-id="${notification._id}" data-type="${notification.type}">
          <span class="notification-item-type ${typeClass}" style="border-color: ${priorityColor}; color: ${priorityColor};">
            ${typeText}
          </span>
          <h4 class="notification-item-title" style="cursor: pointer;" onclick="handleNotificationClick('${notification._id}', '${notification.type}')">
            ${notification.title || 'Untitled Request'}
          </h4>
          <p class="notification-item-description">${truncatedDescription}</p>
          <div class="notification-item-meta">
            <span class="notification-item-user">${userName}</span>
            <span class="notification-item-time">${timeText}</span>
          </div>
        </div>
      `;
    }

    /* Format relative time */
    function formatRelativeTime(diffMs) {
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    }

    /* Handle notification item click */
    window.handleNotificationClick = function(id, type) {
      // Navigate to appropriate page with modal open
      const url = type === 'approval'
        ? `/admin/approvals?openModalId=${id}`
        : `/admin/services?openModalId=${id}`;
      window.location.href = url;
    };

    /* Trigger bell ringing animation */
    function triggerNotificationRing() {
      notificationBell.classList.add('ring');
      setTimeout(() => {
        notificationBell.classList.remove('ring');
      }, 600);
    }

    /* Toggle notification dropdown */
    window.toggleNotificationDropdown = function() {
      const isOpen = notificationDropdown.style.display !== 'none';

      if (isOpen) {
        closeNotificationDropdown();
      } else {
        openNotificationDropdown();
      }
    };

    /* Open notification dropdown */
    function openNotificationDropdown() {
      // Close other dropdowns
      closeDropdowns();

      // Position and show dropdown
      notificationDropdown.style.display = 'block';
      notificationBell.classList.add('active');

      // Refresh notifications
      fetchNotifications();
    };

    /* Close notification dropdown */
    window.closeNotificationDropdown = function() {
      notificationDropdown.style.display = 'none';
      notificationBell.classList.remove('active');
    };

    /* Close all dropdowns */
    function closeDropdowns() {
      const dropdownMenu = document.getElementById('dropdownMenu');
      if (dropdownMenu) dropdownMenu.style.display = 'none';
      closeNotificationDropdown();
    }

    /* Click outside to close dropdowns */
    document.addEventListener('click', function(event) {
      // Close notification dropdown when clicking outside
      if (!notificationBell.contains(event.target) && !notificationDropdown.contains(event.target)) {
        closeNotificationDropdown();
      }

      // Close user dropdown when clicking outside
      const toggle = document.querySelector('.dropdown-toggle');
      const menu = document.getElementById('dropdownMenu');
      if (menu && toggle && !toggle.contains(event.target) && menu.style.display === 'block') {
        menu.style.display = 'none';
      }
    });

    /* Keyboard navigation */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeNotificationDropdown();
      }
    });

    /* Initialize notification system */
    function initNotifications() {
      // Initial load
      fetchNotifications();

      // Start periodic updates (every 30 seconds)
      notificationCheckInterval = setInterval(fetchNotifications, 30000);

      // Handle page visibility changes
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          // Page is hidden, reduce polling frequency
          if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
            notificationCheckInterval = setInterval(fetchNotifications, 120000); // 2 minutes
          }
        } else {
          // Page is visible, resume normal polling
          if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
          }
          notificationCheckInterval = setInterval(fetchNotifications, 30000); // 30 seconds

          // Immediate fetch when returning to page
          fetchNotifications();
        }
      });
    }

    /* Initialize when DOM is ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
      initNotifications();
    }
  })();
