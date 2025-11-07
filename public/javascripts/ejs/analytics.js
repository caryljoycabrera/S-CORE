/* ============================================
   ANALYTICS PAGE JAVASCRIPT
   ============================================ */

// Toggle custom date range visibility
document.getElementById('dateRangeFilter').addEventListener('change', function() {
  const customDateRange = document.getElementById('customDateRange');
  const customDateRangeEnd = document.getElementById('customDateRangeEnd');
  
  if (this.value === 'custom') {
    customDateRange.style.display = 'flex';
    customDateRangeEnd.style.display = 'flex';
  } else {
    customDateRange.style.display = 'none';
    customDateRangeEnd.style.display = 'none';
  }
});

// Apply Filters
document.getElementById('applyFilters').addEventListener('click', applyAnalyticsFilters);

// Reset Filters
document.getElementById('resetFilters').addEventListener('click', resetAnalyticsFilters);

function applyAnalyticsFilters() {
  const dateRange = document.getElementById('dateRangeFilter').value;
  const units = Array.from(document.getElementById('unitFilter').selectedOptions).map(opt => opt.value);
  const requestType = document.getElementById('requestTypeFilter').value;
  const status = document.getElementById('statusFilter').value;
  
  let customStartDate = null;
  let customEndDate = null;
  
  if (dateRange === 'custom') {
    customStartDate = document.getElementById('customStartDate').value;
    customEndDate = document.getElementById('customEndDate').value;
    
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates for custom range');
      return;
    }
  }
  
  const filterData = {
    dateRange,
    units,
    requestType,
    status,
    customStartDate,
    customEndDate
  };
  
  // Show loading state
  showLoadingState();
  
  // Send filter request to backend
  fetch('/api/admin/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(filterData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateDashboardWithFilters(data.data);
    } else {
      alert('Error applying filters: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error applying filters:', error);
    alert('Error applying filters. Please try again.');
  })
  .finally(() => {
    hideLoadingState();
  });
}

function resetAnalyticsFilters() {
  document.getElementById('dateRangeFilter').value = 'monthly';
  document.getElementById('unitFilter').selectedIndex = 0;
  document.getElementById('requestTypeFilter').value = 'all';
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('customDateRange').style.display = 'none';
  document.getElementById('customDateRangeEnd').style.display = 'none';
  document.getElementById('customStartDate').value = '';
  document.getElementById('customEndDate').value = '';
  
  // Reload page to reset all data
  window.location.reload();
}

function updateDashboardWithFilters(data) {
  // Update KPIs
  document.getElementById('kpi-total-requests').textContent = data.kpis.totalRequests;
  
  const avgTurnaround = document.getElementById('kpi-avg-turnaround');
  avgTurnaround.innerHTML = `<span class="kpi-number">${data.kpis.avgTurnaround}</span><span class="kpi-unit">days</span>`;
  
  document.getElementById('kpi-pending-assignment').textContent = data.kpis.pendingAssignment;
  document.getElementById('kpi-in-revision').textContent = data.kpis.inRevision;
  
  // Calculate and update completion rate
  const completionRate = data.kpis.totalRequests > 0 
    ? Math.round((data.kpis.completed / data.kpis.totalRequests) * 100) 
    : 0;
  document.getElementById('kpi-completion-rate').innerHTML = `<span class="kpi-number">${completionRate}</span><span class="kpi-unit">%</span>`;
  
  // Update response time (placeholder - can be calculated from actual data)
  document.getElementById('kpi-response-time').innerHTML = `<span class="kpi-number">4.2</span><span class="kpi-unit">hrs</span>`;
  
  // Update Charts
  updateTopRequestorsChart(data.charts.topRequestors);
  updateRequestVolumeChart(data.charts.requestVolume);
  updateActiveWorkloadChart(data.charts.unitWorkload);
  updateTurnaroundByUnitChart(data.charts.turnaroundByUnit);
  updateCurrentStatusChart(data.charts.statusBreakdown);
  
  // Update Quick Stats
  document.getElementById('stat-completion-rate').textContent = completionRate + '%';
  document.getElementById('stat-response-time').textContent = '4.2 hrs';
  document.getElementById('stat-overdue').textContent = data.kpis.overdue || 0;
}

function showLoadingState() {
  // Add loading overlay or spinner
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  overlay.innerHTML = '<div style="color: white; font-size: 1.5rem;">Loading...</div>';
  document.body.appendChild(overlay);
}

function hideLoadingState() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/* ============================================
   CHART INITIALIZATION
   ============================================ */

// Initialize all charts on page load
let topRequestorsChart, requestVolumeChart, activeWorkloadChart, turnaroundByUnitChart, currentStatusChart;

document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  loadRevisionHotspot();
});

function initializeCharts() {
  // Top Requestors Pie Chart
  const topRequestorsCtx = document.getElementById('topRequestorsChart').getContext('2d');
  topRequestorsChart = new Chart(topRequestorsCtx, {
    type: 'pie',
    data: {
      labels: ['CAFA', 'CS', 'COE', 'CAS', 'CEA', 'CON', 'CBA'],
      datasets: [{
        data: [25, 20, 18, 15, 12, 7, 3],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#ec4899'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Request Volume Over Time Line Chart
  const requestVolumeCtx = document.getElementById('requestVolumeChart').getContext('2d');
  requestVolumeChart = new Chart(requestVolumeCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Approval Requests',
          data: [30, 35, 40, 38, 42, 45, 50, 48, 52, 55, 60, 58],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Service Requests',
          data: [20, 22, 25, 28, 30, 32, 35, 33, 38, 40, 42, 45],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter'
            }
          }
        }
      }
    }
  });

  // Active Workload by Unit Bar Chart
  const activeWorkloadCtx = document.getElementById('activeWorkloadChart').getContext('2d');
  activeWorkloadChart = new Chart(activeWorkloadCtx, {
    type: 'bar',
    data: {
      labels: ['Social Media', 'Graphics', 'Multimedia', 'Public Relations'],
      datasets: [{
        label: 'Active Tasks',
        data: [15, 22, 18, 12],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6'
        ],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 11
            }
          }
        }
      }
    }
  });

  // Turnaround Time by Unit Bar Chart
  const turnaroundByUnitCtx = document.getElementById('turnaroundByUnitChart').getContext('2d');
  turnaroundByUnitChart = new Chart(turnaroundByUnitCtx, {
    type: 'bar',
    data: {
      labels: ['Social Media', 'Graphics', 'Multimedia', 'Public Relations'],
      datasets: [{
        label: 'Avg. Days',
        data: [2.5, 3.2, 2.8, 2.1],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6'
        ],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return `Avg. Turnaround: ${context.parsed.y} days`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter'
            },
            callback: function(value) {
              return value + ' days';
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 11
            }
          }
        }
      }
    }
  });

  // Current Status Donut Chart
  const currentStatusCtx = document.getElementById('currentStatusChart').getContext('2d');
  currentStatusChart = new Chart(currentStatusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'For Revision', 'Completed', 'Approved'],
      datasets: [{
        data: [15, 22, 8, 40, 15],
        backgroundColor: [
          '#f59e0b',
          '#3b82f6',
          '#ef4444',
          '#10b981',
          '#8b5cf6'
        ],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/* ============================================
   CHART UPDATE FUNCTIONS
   ============================================ */

function updateTopRequestorsChart(data) {
  if (!data || !topRequestorsChart) return;
  
  topRequestorsChart.data.labels = data.labels;
  topRequestorsChart.data.datasets[0].data = data.values;
  topRequestorsChart.update();
}

function updateRequestVolumeChart(data) {
  if (!data || !requestVolumeChart) return;
  
  requestVolumeChart.data.labels = data.labels;
  requestVolumeChart.data.datasets[0].data = data.approvals;
  requestVolumeChart.data.datasets[1].data = data.services;
  requestVolumeChart.update();
}

function updateActiveWorkloadChart(data) {
  if (!data || !activeWorkloadChart) return;
  
  activeWorkloadChart.data.labels = data.labels;
  activeWorkloadChart.data.datasets[0].data = data.values;
  activeWorkloadChart.update();
}

function updateTurnaroundByUnitChart(data) {
  if (!data || !turnaroundByUnitChart) return;
  
  turnaroundByUnitChart.data.labels = data.labels;
  turnaroundByUnitChart.data.datasets[0].data = data.values;
  turnaroundByUnitChart.update();
}

function updateCurrentStatusChart(data) {
  if (!data || !currentStatusChart) return;
  
  currentStatusChart.data.labels = data.labels;
  currentStatusChart.data.datasets[0].data = data.values;
  currentStatusChart.update();
}

/* ============================================
   REVISION HOTSPOT TABLE
   ============================================ */

function loadRevisionHotspot() {
  fetch('/api/admin/revision-hotspot')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        populateRevisionHotspotTable(data.data);
      } else {
        showRevisionHotspotError('Failed to load revision data');
      }
    })
    .catch(error => {
      console.error('Error loading revision hotspot:', error);
      showRevisionHotspotError('Error loading revision data');
    });
}

function populateRevisionHotspotTable(requests) {
  const tbody = document.getElementById('revision-hotspot-tbody');
  
  if (!requests || requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-empty">No requests with revisions found</td></tr>';
    return;
  }
  
  tbody.innerHTML = requests.map(request => `
    <tr>
      <td>${request.title || 'N/A'}</td>
      <td>
        <span class="type-badge ${request.type}">${request.type === 'approval' ? 'Approval' : 'Service'}</span>
      </td>
      <td>${request.requester}</td>
      <td>${request.unit || 'Unassigned'}</td>
      <td><span class="revision-count major">${request.majorRevisions}</span></td>
      <td><span class="revision-count minor">${request.minorRevisions}</span></td>
      <td><span class="revision-count total">${request.totalRevisions}</span></td>
      <td><span class="status-badge ${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span></td>
      <td>
        <a href="/admin/${request.type === 'approval' ? 'approvals' : 'services'}?id=${request._id}" class="btn-view">View</a>
      </td>
    </tr>
  `).join('');
}

function showRevisionHotspotError(message) {
  const tbody = document.getElementById('revision-hotspot-tbody');
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty">${message}</td></tr>`;
}

// Dropdown toggle function
function toggleDropdown() {
  const dropdown = document.getElementById('dropdownMenu');
  dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.onclick = function(event) {
  if (!event.target.matches('.dropdown-toggle') && !event.target.closest('.dropdown-toggle')) {
    const dropdowns = document.getElementsByClassName('dropdown-menu');
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};
