// Announcements Manager
const announcementsManager = {
  currentDate: new Date('<%= new Date().toISOString() %>'),
  announcements: [], // Empty by default - will be populated from backend in future
  
  init() {
    this.loadAnnouncements();
  },
  
  loadAnnouncements() {
    const container = document.getElementById('announcements-content');
    if (!container) return;
    
    // Filter announcements that are still valid (posted within last 30 days)
    const validAnnouncements = this.announcements.filter(announcement => {
      const postedDate = new Date(announcement.date);
      const daysDiff = Math.floor((this.currentDate - postedDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30;
    });
    
    if (validAnnouncements.length === 0) {
      // Show "no announcements" message (already in HTML)
      return;
    }
    
    // If there are announcements, render them
    container.innerHTML = validAnnouncements.map(announcement => this.renderAnnouncement(announcement)).join('');
  },
  
  renderAnnouncement(announcement) {
    const iconType = announcement.type || 'default';
    const iconClass = iconType === 'success' ? 'success' : iconType === 'info' ? 'info' : '';
    const icons = {
      default: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
      success: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
    };
    
    return `
      <div class="announcement-item">
        <div class="announcement-icon ${iconClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${icons[iconType]}
          </svg>
        </div>
        <div class="announcement-text">
          <h4>${announcement.title}</h4>
          <p>${announcement.message}</p>
          <span class="announcement-date">${this.getTimeAgo(announcement.date)}</span>
        </div>
      </div>
    `;
  },
  
  getTimeAgo(date) {
    const postedDate = new Date(date);
    const daysDiff = Math.floor((this.currentDate - postedDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Posted today';
    if (daysDiff === 1) return 'Posted 1 day ago';
    if (daysDiff < 7) return `Posted ${daysDiff} days ago`;
    if (daysDiff < 14) return 'Posted 1 week ago';
    if (daysDiff < 30) return `Posted ${Math.floor(daysDiff / 7)} weeks ago`;
    return 'Posted over a month ago';
  }
};

// Header Dropdown Manager
const headerDropdown = {
  menu: null,
  isOpen: false,
  
  init() {
    this.menu = document.getElementById("dropdownMenu");
  },
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },
  
  open() {
    if (this.menu) {
      this.menu.style.display = "block";
      this.isOpen = true;
    }
  },
  
  close() {
    if (this.menu) {
      this.menu.style.display = "none";
      this.isOpen = false;
    }
  }
};

function toggleDropdown() {
  if (!headerDropdown.menu) {
    headerDropdown.init();
  }
  headerDropdown.toggle();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  headerDropdown.init();
  announcementsManager.init(); // Initialize announcements
});

// Close dropdown if clicking outside
document.addEventListener("click", function (event) {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.getElementById("dropdownMenu");
  if (!toggle.contains(event.target)) {
    headerDropdown.close();
  }
});

// Add hover animations for action cards
document.querySelectorAll('.action-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

// Enhanced calendar with user-specific deadlines - FIXED API CALLS
(function() {
  const calendar = document.getElementById('calendar-standalone');
  const monthYear = document.getElementById('calendar-month-year');
  const prevBtn = document.getElementById('calendar-prev-month');
  const nextBtn = document.getElementById('calendar-next-month');
  const maximizeBtn = document.getElementById('calendar-maximize');
  
  // Modal elements
  const modal = document.getElementById('calendar-modal');
  const modalCalendar = document.getElementById('calendar-modal-grid');
  const modalMonthYear = document.getElementById('calendar-modal-month-year');
  const modalPrevBtn = document.getElementById('calendar-modal-prev-month');
  const modalNextBtn = document.getElementById('calendar-modal-next-month');
  const minimizeBtn = document.getElementById('calendar-minimize');

  // Deadline details modal elements
  const deadlineModal = document.getElementById('deadline-details-modal');
  const deadlineList = document.getElementById('deadline-list');
  const deadlineDate = document.getElementById('deadline-details-date');
  const backToCalendarBtn = document.getElementById('back-to-calendar');
  const closeDeadlineDetailsBtn = document.getElementById('close-deadline-details');

  if (!calendar || !monthYear || !prevBtn || !nextBtn) {
    console.error('Calendar elements not found');
    return;
  }

  let currentDate = new Date();
  let deadlinesData = {};

  // FIXED: Fetch unit-specific deadlines data from server
  async function fetchDeadlines() {
    try {
      console.log('Fetching unit deadlines from /api/unit-deadlines...');
      const response = await fetch('/api/unit-deadlines', {
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
          console.log('Unit deadlines data received:', deadlinesData);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          deadlinesData = {};
        }
      } else {
        console.error('Failed to fetch unit deadlines, status:', response.status);
        deadlinesData = {};
      }
    } catch (error) {
      console.error('Network error fetching unit deadlines:', error);
      deadlinesData = {};
    }
  }

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

  function createDeadlineIndicators(dateStr) {
    const deadlines = deadlinesData[dateStr];
    if (!deadlines) return '';
    
    const hasApprovals = deadlines.approvals > 0;
    const hasServices = deadlines.services > 0;
    
      let badges = '';
      if (hasApprovals) {
        badges += `<span class='calendar-date-badge approval'>${deadlines.approvals}</span>`;
      }
      if (hasServices) {
        badges += `<span class='calendar-date-badge service'>${deadlines.services}</span>`;
      }
      return badges;
  }

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

    // Days of the month - MAKE ALL DATES CLICKABLE
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
      html += `<div class="${className}" data-date="${dateStr}" style="cursor: pointer;">
        <span class="calendar-date-number">${day}</span>
        ${deadlineIndicators}
      </div>`;
    }

    targetElement.innerHTML = html;
    
    // Add click event listeners to ALL calendar days (excluding empty cells)
    targetElement.querySelectorAll('.calendar-day:not(.calendar-empty)').forEach(dayElement => {
      const dateStr = dayElement.getAttribute('data-date');
      
      if (dateStr) {
        dayElement.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log(`Clicked on date: ${dateStr}`);
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

  function updateBothCalendars() {
    renderCalendar(currentDate, calendar, monthYear);
    if (modal.classList.contains('active')) {
      renderCalendar(currentDate, modalCalendar, modalMonthYear);
    }
  }

  // FIXED: Show unit-specific deadline details modal
  async function showDeadlineDetails(dateStr) {
    console.log(`Showing unit deadline details for ${dateStr}`);
    
    // Hide calendar modal if it's open
    if (modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
    
    // Show loading state
    const date = new Date(dateStr + 'T12:00:00');
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (deadlineDate) {
      deadlineDate.textContent = formattedDate;
    }
     
    // Update the modal title
    const modalTitle = document.querySelector('#deadline-details-modal .deadline-details-title');
    if (modalTitle) {
      modalTitle.textContent = 'Unit Tasks';
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
      console.log(`Fetching unit details for date: ${dateStr}`);
      // FIXED: Use correct API endpoint for unit-specific deadlines
      const response = await fetch(`/api/unit-deadlines/${dateStr}/details`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const deadlineData = await response.json();
        console.log('Received unit deadline data:', deadlineData);
        
        if (deadlineData && deadlineData.totalCount > 0) {
          renderUnitDeadlineItems(deadlineData);
        } else {
          if (deadlineList) {
            deadlineList.innerHTML = `
              <div class="no-deadlines">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>No tasks for this date</p>
                <span>Your unit has no pending tasks on this date.</span>
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
          <div class="no-deadlines">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
            <p>Error loading tasks</p>
            <span>Please try again later.</span>
          </div>
        `;
      }
    }
  }

  // UPDATED: Render unit deadline items with navigation to specific pages
  function renderUnitDeadlineItems(data) {
    if (!deadlineList) return;
    
    let html = '';
    
    // Render approval requests (filter out completed/rejected/archived)
    if (data.approvalRequests && data.approvalRequests.length > 0) {
      const activeApprovals = data.approvalRequests.filter(request => 
        !['Approved', 'Rejected', 'Archived', 'Completed'].includes(request.status)
      );
      
      activeApprovals.forEach(request => {
        html += `
          <div class="deadline-item approval-deadline">
            <div class="deadline-item-header">
              <h3 class="deadline-item-title">${escapeHtml(request.title)}</h3>
              <span class="deadline-item-type approval">Approval</span>
            </div>
            <div class="deadline-item-info">
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Requester: ${escapeHtml(request.requester)}</span>
              </div>
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Deadline: ${new Date(request.deadline).toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                })}</span>
              </div>
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <span>Status: ${escapeHtml(request.status)}</span>
              </div>
            </div>
            <div class="deadline-item-actions">
              <button class="deadline-action-btn approval-btn" onclick="window.location.href='/unit/task-approvals'">
                View Task
              </button>
            </div>
          </div>
        `;
      });
    }
    
    // Render service requests (filter out completed/rejected/archived)
    if (data.serviceRequests && data.serviceRequests.length > 0) {
      const activeServices = data.serviceRequests.filter(request => 
        !['Completed', 'Rejected', 'Archived'].includes(request.status)
      );
      
      activeServices.forEach(request => {
        html += `
          <div class="deadline-item service-deadline">
            <div class="deadline-item-header">
              <h3 class="deadline-item-title">${escapeHtml(request.title)}</h3>
              <span class="deadline-item-type service">Service</span>
            </div>
            <div class="deadline-item-info">
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Requester: ${escapeHtml(request.requester)}</span>
              </div>
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Deadline: ${new Date(request.deadline).toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                })}</span>
              </div>
              <div class="deadline-item-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <span>Status: ${escapeHtml(request.status)}</span>
              </div>
            </div>
            <div class="deadline-item-actions">
              <button class="deadline-action-btn service-btn" onclick="window.location.href='/unit/task-services'">
                View Task
              </button>
            </div>
          </div>
        `;
      });
    }
    
    deadlineList.innerHTML = html;
  }
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  function renderUserDeadlineItems(data) {
    console.log('Rendering user request items:', data);
    
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
          <div class="deadline-empty-state-text">No requests for this date</div>
          <div class="deadline-empty-state-subtext">You have no requests on this date.</div>
        </div>
      `;
    } else {
      // Render user's approval requests with status
      if (hasApprovals) {
        data.approvals.forEach(item => {
          const truncatedDescription = item.description && item.description.length > 150 
            ? item.description.substring(0, 150) + '...' 
            : item.description || 'No description available';
          
          const createdDate = new Date(item.createdAt || item.datetime).toLocaleDateString();
          const deadlineDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
          const organization = item.displayOrganization || item.organization || 'N/A';
          const dateTypeLabel = item.dateType === 'deadline' ? 'Deadline' : 'Submitted';
          const statusClass = item.status ? item.status.toLowerCase().replace(/\s+/g, '') : 'unknown';
          
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
                <span>Organization: <strong>${organization}</strong></span>
                <span>Submitted: ${createdDate}</span>
                ${item.deadline ? `<span>Deadline: ${deadlineDate}</span>` : ''}
                <span>Status: <strong><span class="status-badge ${statusClass}">${item.status}</span></strong></span>
                <span>Date Type: <strong>${dateTypeLabel}</strong></span>
              </div>
              <div class="deadline-item-actions">
                <button class="deadline-action-btn" onclick="navigateToRequest('${item._id}', 'approval')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          `;
        });
      }
      
      // Render user's service requests with status
      if (hasServices) {
        data.services.forEach(item => {
          const truncatedDescription = item.description && item.description.length > 150 
            ? item.description.substring(0, 150) + '...' 
            : item.description || 'No description available';
          
          const createdDate = new Date(item.createdAt || item.datetime).toLocaleDateString();
          const deadlineDate = item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline';
          const organization = item.displayOrganization || item.organization || 'N/A';
          const dateTypeLabel = item.dateType === 'deadline' ? 'Deadline' : 'Submitted';
          const statusClass = item.status ? item.status.toLowerCase().replace(/\s+/g, '') : 'unknown';
          
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
                <span>Organization: <strong>${organization}</strong></span>
                <span>Submitted: ${createdDate}</span>
                ${item.deadline ? `<span>Deadline: ${deadlineDate}</span>` : ''}
                <span>Status: <strong><span class="status-badge ${statusClass}">${item.status}</span></strong></span>
                <span>Date Type: <strong>${dateTypeLabel}</strong></span>
              </div>
              <div class="deadline-item-actions">
                <button class="deadline-action-btn service" onclick="navigateToRequest('${item._id}', 'service')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          `;
        });
      }
    }
    
    deadlineList.innerHTML = html;
  }

  // Initialize calendar
  async function initCalendar() {
    console.log('Initializing unit calendar...');
    await fetchDeadlines();
    updateBothCalendars();
    console.log('Unit calendar initialization complete');
  }

  // Navigation event listeners for main calendar
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

  // Navigation event listeners for modal calendar
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

  // Maximize/Minimize functionality
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

  // Deadline details modal controls
  if (backToCalendarBtn) {
    backToCalendarBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (deadlineModal) {
        deadlineModal.classList.remove('active');
      }
      if (modal) {
        modal.classList.add('active');
        // Re-render the modal calendar to ensure it's visible
        renderCalendar(currentDate, modalCalendar, modalMonthYear);
        // Body overflow remains hidden since we're staying in modal mode
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

  // Close modals when clicking outside
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

  // Keyboard navigation
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

  // Initialize the calendar
  initCalendar();
})();

// FIXED: Function to navigate to request details with auto-modal opening
window.navigateToRequest = function(requestId, type) {
  console.log(`Navigating to ${type} request: ${requestId}`);
  
  // Close the deadline modal
  if (document.getElementById('deadline-details-modal')) {
    document.getElementById('deadline-details-modal').classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Navigate to the appropriate page with the request ID as a URL parameter
  if (type === 'approval') {
    window.location.href = `/request-approvals?openModalId=${requestId}`;
  } else if (type === 'service') {
    window.location.href = `/service-requests?openModalId=${requestId}`;
  }
};

function toggleGuidelines() {
  const content = document.getElementById('guidelinesContent');
  const toggle = document.getElementById('guidelinesToggle');
  
  if (content.style.display === 'none') {
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

// Auto-open modal if openModalId is in URL - ENHANCED FOR BOTH REQUEST TYPES
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const openModalId = urlParams.get('openModalId');
  
  if (openModalId) {
    console.log(`Auto-opening modal for request: ${openModalId}`);
    
    // Wait for page to fully load
    setTimeout(() => {
      // Find the row with the matching ID
      const targetRow = document.querySelector(`[data-id="${openModalId}"]`);
      if (targetRow) {
        console.log(`Found target row for ID: ${openModalId}`);
        // Simulate clicking the row to open the details modal
        targetRow.click();
        
        // Clean up URL after opening modal
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.warn(`No row found with ID: ${openModalId}`);
      }
    }, 1000); // Increased delay to ensure everything is loaded
  }
});

// Filter Activity Cards Function
function filterActivity() {
  // Get the search term
  const filter = document.getElementById('activitySearchInput').value.toLowerCase();

  // Get all activity cards
  const cards = document.querySelectorAll('.activity-grid .activity-card');
  
  cards.forEach(card => {
    // Get the text from the title (h4) and description (p)
    const title = card.querySelector('h4').textContent || "";
    const description = card.querySelector('p').textContent || "";
    
    // Check if the title or description includes the search term
    if (title.toLowerCase().indexOf(filter) > -1 || description.toLowerCase().indexOf(filter) > -1) {
      card.style.display = ""; // Show the card
    } else {
      card.style.display = "none"; // Hide the card
    }
  });
}

// Keyboard shortcut for search (press "/" to focus search bar)
document.addEventListener('keydown', function(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    const searchInput = document.getElementById('activitySearchInput');
    if (searchInput) {
      searchInput.focus();
    }
  }
});

// Sidebar hover effect for desktop - HANDLED BY unit-navbar.js
// Removed duplicate sidebar handling to prevent conflicts with unit-navbar.js

// Mobile Navigation Setup - HANDLED BY unit-navbar.js
// Removed duplicate mobile navigation to prevent conflicts with unit-navbar.js
// All sidebar functionality is now in unit-navbar.js

/**
 * View Task Details
 * Opens the appropriate task page based on task type
 */
function viewTaskDetails(taskId, taskType) {
  if (taskType === 'service') {
    window.location.href = `/unit/task-services?id=${taskId}`;
  } else if (taskType === 'approval') {
    window.location.href = `/unit/task-approvals?id=${taskId}`;
  }
}

// ==========================================
// CHART.JS - TASK BREAKDOWN PIE CHART
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  const chartCanvas = document.getElementById('taskBreakdownChart');
  if (!chartCanvas) return;

  // Check if taskBreakdownData is available
  if (typeof taskBreakdownData === 'undefined') {
    console.warn('taskBreakdownData not found');
    return;
  }

  // Status-based color scheme
  const statusColors = {
    'Pending': '#fbbf24',           // Amber - waiting to start
    'In Review': '#3b82f6',         // Blue - being reviewed
    'Needs Revision': '#9ca3af',    // Gray - needs changes
    'Approved': '#10b981',          // Green - approved
    'Overdue': '#ef4444',           // Red - past deadline
    'No Active Tasks': '#e5e7eb'    // Light gray - placeholder
  };

  // Map labels to colors
  const chartColors = taskBreakdownData.labels.map(label => 
    statusColors[label] || '#6b7280'
  );

  // Create pie chart with enhanced styling
  const chart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels: taskBreakdownData.labels,
      datasets: [{
        data: taskBreakdownData.data,
        backgroundColor: chartColors,
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          onClick: function(e, legendItem, legend) {
            const index = legendItem.index;
            const chart = legend.chart;
            const meta = chart.getDatasetMeta(0);
            
            // Toggle visibility
            meta.data[index].hidden = !meta.data[index].hidden;
            
            // Update legend item style with strikethrough
            const legendElement = legend.legendItems[index].text;
            if (meta.data[index].hidden) {
              legendItem.text = legendItem.text;
              legendItem.fontStyle = 'strikethrough';
            } else {
              legendItem.fontStyle = 'normal';
            }
            
            chart.update();
          },
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter, sans-serif',
              weight: '500'
            },
            usePointStyle: true,
            pointStyle: 'circle',
            borderWidth: 0,
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const meta = chart.getDatasetMeta(0);
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  const isHidden = meta.data[i].hidden;
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: 'transparent',
                    lineWidth: 0,
                    hidden: isHidden,
                    fontStyle: isHidden ? 'strikethrough' : 'normal',
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: {
            size: 14,
            family: 'Inter, sans-serif',
            weight: '600'
          },
          bodyFont: {
            size: 13,
            family: 'Inter, sans-serif'
          },
          padding: 14,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return ` ${label}: ${value} tasks (${percentage}%)`;
            },
            afterLabel: function(context) {
              // Add completion rate info if available
              if (taskBreakdownData.completionRate !== undefined) {
                return `Overall Completion: ${taskBreakdownData.completionRate}%`;
              }
              return '';
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }
  });

  // Add completion rate display below chart if available
  if (taskBreakdownData.completionRate !== undefined) {
    const chartCard = chartCanvas.closest('.chart-card');
    if (chartCard && !chartCard.querySelector('.chart-stats')) {
      const statsDiv = document.createElement('div');
      statsDiv.className = 'chart-stats';
      statsDiv.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Completion Rate:</span>
          <span class="stat-value">${taskBreakdownData.completionRate}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Active Tasks:</span>
          <span class="stat-value">${taskBreakdownData.totalActive || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completed:</span>
          <span class="stat-value">${taskBreakdownData.totalCompleted || 0}</span>
        </div>
      `;
      chartCard.appendChild(statsDiv);
    }
  }
});

// ==========================================
// REQUESTER ANALYTICS BAR CHART
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  const requesterCanvas = document.getElementById('requesterChart');
  if (!requesterCanvas) return;

  // Check if requesterComplianceData is available
  if (typeof requesterComplianceData === 'undefined' || !requesterComplianceData || requesterComplianceData.length === 0) {
    console.warn('requesterComplianceData not found or empty');
    return;
  }

  // Function to create smart abbreviation for organization names
  function abbreviateOrgName(orgName) {
    if (orgName.length <= 30) return orgName;
    
    // Check if it has parentheses with acronym
    const acronymMatch = orgName.match(/\(([A-Z]+)\)/);
    if (acronymMatch) {
      return acronymMatch[1];
    }
    
    // Check if it has commas (multiple orgs)
    if (orgName.includes(',')) {
      const parts = orgName.split(',');
      if (parts.length > 1) {
        return parts[0].trim().substring(0, 25) + '...';
      }
    }
    
    // Just truncate with ellipsis
    return orgName.substring(0, 27) + '...';
  }

  // Prepare data for stacked bar chart
  const fullOrgNames = requesterComplianceData.map(item => item.organization);
  const organizations = requesterComplianceData.map(item => abbreviateOrgName(item.organization));
  const onTimeData = requesterComplianceData.map(item => item.onTime);
  const pendingData = requesterComplianceData.map(item => item.pending);
  const overdueData = requesterComplianceData.map(item => item.overdue);

  // Create horizontal stacked bar chart (vertical bars, horizontal data)
  const requesterChart = new Chart(requesterCanvas, {
    type: 'bar',
    data: {
      labels: organizations,
      datasets: [
        {
          label: 'On-Time',
          data: onTimeData,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Pending',
          data: pendingData,
          backgroundColor: '#eab308',
          borderColor: '#ca9a04',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Overdue',
          data: overdueData,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: 'y', // This makes the bars horizontal (vertical orientation)
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: '#f3f4f6',
            borderDash: [3, 3]
          },
          ticks: {
            font: {
              size: 11,
              family: 'Inter, sans-serif'
            },
            color: '#6b7280',
            precision: 0
          },
          title: {
            display: true,
            text: 'Number of Requests',
            font: {
              size: 12,
              family: 'Inter, sans-serif',
              weight: '600'
            },
            color: '#1e3a5f'
          }
        },
        y: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              family: 'Inter, sans-serif',
              weight: '500'
            },
            color: '#6b7280',
            autoSkip: false
          }
        }
      },
      plugins: {
        legend: {
          display: false // Using custom legend
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: {
            size: 13,
            family: 'Inter, sans-serif',
            weight: '600'
          },
          bodyFont: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: function(context) {
              // Show full organization name in tooltip
              return fullOrgNames[context[0].dataIndex];
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.x || 0;
              return ` ${label}: ${value} request${value !== 1 ? 's' : ''}`;
            },
            afterBody: function(context) {
              // Calculate total for this organization
              const dataIndex = context[0].dataIndex;
              const total = onTimeData[dataIndex] + pendingData[dataIndex] + overdueData[dataIndex];
              const complianceRate = requesterComplianceData[dataIndex].complianceRate;
              return `\nTotal: ${total}\nCompliance: ${complianceRate}%`;
            }
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }
  });

  // Add clickable legend functionality
  const legendItems = document.querySelectorAll('.legend-item-custom');
  legendItems.forEach((item, index) => {
    item.addEventListener('click', function() {
      const meta = requesterChart.getDatasetMeta(index);
      
      // Toggle dataset visibility
      meta.hidden = !meta.hidden;
      
      // Toggle disabled class for visual feedback
      this.classList.toggle('disabled');
      
      // Update chart
      requesterChart.update();
    });
  });
});

// ==========================================
// TASK TIMELINE - LINE CHART
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  const timelineCanvas = document.getElementById('taskTimelineChart');
  if (!timelineCanvas) return;

  // Check if taskTimeline data is available
  if (typeof taskTimeline === 'undefined' || !taskTimeline || taskTimeline.length === 0) {
    console.log('No task timeline data available');
    return;
  }

  const labels = taskTimeline.map(d => d.date);
  const newTasksData = taskTimeline.map(d => d.newTasks);
  const completedData = taskTimeline.map(d => d.completed);

  new Chart(timelineCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'New Tasks',
          data: newTasksData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Completed',
          data: completedData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter, sans-serif',
              weight: '500'
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: {
            size: 13,
            family: 'Inter, sans-serif',
            weight: '600'
          },
          bodyFont: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          padding: 12,
          cornerRadius: 6
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: {
              size: 11,
              family: 'Inter, sans-serif'
            },
            color: '#6b7280'
          },
          grid: {
            color: '#f3f4f6',
            borderDash: [3, 3]
          }
        },
        x: {
          ticks: {
            font: {
              size: 11,
              family: 'Inter, sans-serif'
            },
            color: '#6b7280'
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }
  });
});
