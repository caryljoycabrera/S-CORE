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
  
  // Auto-apply filters when date range changes
  debouncedApplyFilters();
});

// Auto-apply filters for real-time updates
document.getElementById('unitFilter').addEventListener('change', debouncedApplyFilters);
document.getElementById('requestTypeFilter').addEventListener('change', debouncedApplyFilters);
document.getElementById('statusFilter').addEventListener('change', debouncedApplyFilters);
document.getElementById('customStartDate').addEventListener('change', debouncedApplyFilters);
document.getElementById('customEndDate').addEventListener('change', debouncedApplyFilters);

// Reset Filters
document.getElementById('resetFilters').addEventListener('click', resetAnalyticsFilters);

// Debounce function to limit API calls
let filterTimeout;
function debouncedApplyFilters() {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    applyAnalyticsFilters();
  }, 500); // Wait 500ms after user stops changing filters
}

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
      updateDashboardWithFilters(data, filterData);
      
      // Update Request Volume chart with filtered data
      if (typeof loadVolumeData === 'function') {
        loadVolumeData(filterData);
      } else {
        console.log('loadVolumeData not available yet for main filters');
        window.pendingVolumeFilters = filterData;
      }
    } else {
      alert('Error applying filters: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error applying filters:', error);
    alert('Error applying filters. Please try again.');
  });
}

function resetAnalyticsFilters() {
  // Clear any pending filter timeout
  clearTimeout(filterTimeout);
  
  // Reset all filter values
  document.getElementById('dateRangeFilter').value = 'monthly';
  document.getElementById('unitFilter').selectedIndex = 0;
  document.getElementById('requestTypeFilter').value = 'all';
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('customDateRange').style.display = 'none';
  document.getElementById('customDateRangeEnd').style.display = 'none';
  document.getElementById('customStartDate').value = '';
  document.getElementById('customEndDate').value = '';
  
  // Apply filters immediately with reset values
  applyAnalyticsFilters();
}

// Automatically apply monthly filter on page load
function applyMonthlyFilterOnLoad() {
  // Set the date range filter to monthly
  document.getElementById('dateRangeFilter').value = 'monthly';
  
  // Ensure other filters are at default values
  document.getElementById('unitFilter').selectedIndex = 0;
  document.getElementById('requestTypeFilter').value = 'all';
  document.getElementById('statusFilter').value = 'all';
  
  // Hide custom date range if visible
  document.getElementById('customDateRange').style.display = 'none';
  document.getElementById('customDateRangeEnd').style.display = 'none';
  
  // Apply the monthly filter
  applyAnalyticsFilters();
}

function updateDashboardWithFilters(data, filters = {}) {
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
  
  // Update response time
  document.getElementById('kpi-response-time').innerHTML = `<span class="kpi-number">${data.kpis.avgResponseTime}</span><span class="kpi-unit">${data.kpis.responseTimeUnit}</span>`;
  
  // Update overdue tasks
  document.getElementById('kpi-overdue-tasks').textContent = data.kpis.overdue;
  
  // Update active requests
  document.getElementById('kpi-active-requests').textContent = data.kpis.activeRequests;
  
  // Update Charts
  updateTopRequestorsChart(data.charts.topRequestors);
  updateActiveWorkloadChart(data.charts.unitWorkload);
  updateTurnaroundByUnitChart(data.charts.turnaroundByUnit);
  updateTotalWorkloadChart(data.charts.totalWorkload);
  updateResponseTimeByUnitChart(data.charts.responseTimeByUnit);
  
  // Show and update filtered results section
  showFilteredResults(data);
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
let topRequestorsChart, activeWorkloadChart, turnaroundByUnitChart, totalWorkloadChart, responseTimeByUnitChart;
let filteredStatusChart, filteredTypeChart;

document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  loadAnalyticsData();
  
  // Automatically apply monthly filter on page load
  setTimeout(() => {
    applyMonthlyFilterOnLoad();
  }, 500); // Small delay to ensure charts are initialized
});

function initializeCharts() {
  // Top Requestors Pie Chart
  const topRequestorsCtx = document.getElementById('topRequestorsChart').getContext('2d');
  topRequestorsChart = new Chart(topRequestorsCtx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#ec4899',
          '#14b8a6'
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

  // Active Workload by Unit Bar Chart
  const activeWorkloadCtx = document.getElementById('activeWorkloadChart').getContext('2d');
  activeWorkloadChart = new Chart(activeWorkloadCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Active Tasks',
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4'
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
      labels: [],
      datasets: [{
        label: 'Avg. Days',
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4'
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

  // Total Workload by Unit Bar Chart
  const totalWorkloadCtx = document.getElementById('totalWorkloadChart').getContext('2d');
  totalWorkloadChart = new Chart(totalWorkloadCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Total Requests',
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4'
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
              return `Total Requests: ${context.parsed.y}`;
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
              return value;
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

  // Response Time by Unit Bar Chart
  const responseTimeByUnitCtx = document.getElementById('responseTimeByUnitChart').getContext('2d');
  responseTimeByUnitChart = new Chart(responseTimeByUnitCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Avg. Hours',
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ],
        borderColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4'
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
              return `Avg. Response: ${context.parsed.y} hours`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Response Time (Hours)',
            font: {
              family: 'Inter',
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter'
            },
            callback: function(value) {
              return value + ' hrs';
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

  // Filtered Status Distribution Donut Chart
  const filteredStatusCtx = document.getElementById('filteredStatusChart').getContext('2d');
  filteredStatusChart = new Chart(filteredStatusCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#f59e0b', // Pending
          '#3b82f6', // In Progress
          '#ef4444', // Revision
          '#10b981', // Completed
          '#8b5cf6', // Approved
          '#06b6d4', // Rejected
          '#14b8a6'  // Cancelled
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
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Filtered Request Type Distribution Pie Chart
  const filteredTypeCtx = document.getElementById('filteredTypeChart').getContext('2d');
  filteredTypeChart = new Chart(filteredTypeCtx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#3b82f6', // Approval
          '#10b981'  // Service
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
          position: 'bottom',
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
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/* ============================================
   LOAD DATA FROM APIS
   ============================================ */

function loadAnalyticsData() {
  // Load all chart data in parallel
  Promise.all([
    fetch('/admin/analytics-data/top-requestors').then(r => r.json()),
    fetch('/admin/analytics-data/active-workload').then(r => r.json()),
    fetch('/admin/analytics-data/turnaround-by-unit').then(r => r.json()),
    fetch('/admin/analytics-data/total-workload').then(r => r.json()),
    fetch('/admin/analytics-data/response-time-by-unit').then(r => r.json())
  ])
  .then(([topReq, workload, turnaround, totalWorkload, responseTime]) => {
    // Update charts with fetched data
    if (topReq.success) updateTopRequestorsChart(topReq);
    if (workload.success) updateActiveWorkloadChart(workload);
    if (turnaround.success) updateTurnaroundByUnitChart(turnaround);
    if (totalWorkload.success) updateTotalWorkloadChart(totalWorkload);
    if (responseTime.success) updateResponseTimeByUnitChart(responseTime);
  })
  .catch(error => console.error('Error loading analytics data:', error));
}

/* ============================================
   CHART UPDATE FUNCTIONS
   ============================================ */

function updateTopRequestorsChart(data) {
  if (!data || !topRequestorsChart) return;

  // Handle both object format (from API) and array format (from initial load)
  let labels = [];
  let chartData = [];

  if (typeof data === 'object' && !Array.isArray(data)) {
    // Convert object to arrays
    const entries = Object.entries(data);
    labels = entries.map(([org]) => org);
    chartData = entries.map(([, count]) => count);
  } else {
    // Handle array format
    labels = data.labels || [];
    chartData = data.data || [];
  }

  // If no data, show empty state with a single slice
  if (labels.length === 0 || chartData.length === 0 || chartData.every(val => val === 0)) {
    labels = ['No Data Available'];
    chartData = [1]; // Use 1 to show the slice, but we'll style it differently
    topRequestorsChart.data.datasets[0].backgroundColor = ['#f3f4f6'];
    topRequestorsChart.data.datasets[0].borderColor = ['#d1d5db'];
  } else {
    // Reset colors for normal data
    topRequestorsChart.data.datasets[0].backgroundColor = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#06b6d4',
      '#ec4899',
      '#14b8a6'
    ];
    topRequestorsChart.data.datasets[0].borderColor = '#ffffff';
  }

  topRequestorsChart.data.labels = labels;
  topRequestorsChart.data.datasets[0].data = chartData;
  topRequestorsChart.update();
}

function updateRequestVolumeChart(data) {
  if (!data || !requestVolumeChart) return;
  
  requestVolumeChart.data.labels = data.labels || [];
  requestVolumeChart.data.datasets[0].data = data.approvals || [];
  requestVolumeChart.data.datasets[1].data = data.services || [];
  requestVolumeChart.update();
}

function updateActiveWorkloadChart(data) {
  if (!activeWorkloadChart) return;
  
  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    activeWorkloadChart.data.labels = ['No Data'];
    activeWorkloadChart.data.datasets[0].data = [1];
    activeWorkloadChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    activeWorkloadChart.options.plugins.legend.display = false;
  } else {
    // Show actual data
    activeWorkloadChart.data.labels = data.labels;
    activeWorkloadChart.data.datasets[0].data = data.data;
    activeWorkloadChart.data.datasets[0].backgroundColor = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    activeWorkloadChart.options.plugins.legend.display = true;
  }
  activeWorkloadChart.update();
}

function updateTurnaroundByUnitChart(data) {
  if (!turnaroundByUnitChart) return;
  
  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    turnaroundByUnitChart.data.labels = ['No Data'];
    turnaroundByUnitChart.data.datasets[0].data = [1];
    turnaroundByUnitChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    turnaroundByUnitChart.options.plugins.legend.display = false;
  } else {
    // Show actual data
    turnaroundByUnitChart.data.labels = data.labels;
    turnaroundByUnitChart.data.datasets[0].data = data.data;
    turnaroundByUnitChart.data.datasets[0].backgroundColor = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    turnaroundByUnitChart.options.plugins.legend.display = true;
  }
  turnaroundByUnitChart.update();
}

function updateTotalWorkloadChart(data) {
  if (!totalWorkloadChart) return;
  
  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    totalWorkloadChart.data.labels = ['No Data'];
    totalWorkloadChart.data.datasets[0].data = [1];
    totalWorkloadChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    totalWorkloadChart.options.plugins.legend.display = false;
  } else {
    // Show actual data
    totalWorkloadChart.data.labels = data.labels;
    totalWorkloadChart.data.datasets[0].data = data.data;
    totalWorkloadChart.data.datasets[0].backgroundColor = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    totalWorkloadChart.options.plugins.legend.display = true;
  }
  totalWorkloadChart.update();
}

function updateResponseTimeByUnitChart(data) {
  if (!responseTimeByUnitChart) return;

  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    responseTimeByUnitChart.data.labels = ['No Data'];
    responseTimeByUnitChart.data.datasets[0].data = [1];
    responseTimeByUnitChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    responseTimeByUnitChart.options.plugins.legend.display = false;
    responseTimeByUnitChart.options.scales.y.title.text = 'Response Time';
    responseTimeByUnitChart.options.plugins.tooltip.callbacks.label = function(context) {
      return `Avg. Response: ${context.parsed.y} hours`;
    };
    responseTimeByUnitChart.options.scales.y.ticks.callback = function(value) {
      return value + ' hrs';
    };
  } else {
    // Process data to convert hours to days if needed
    const processedData = data.data.map(hours => {
      if (hours >= 24) {
        return Math.round((hours / 24) * 10) / 10; // Convert to days with 1 decimal place
      }
      return hours;
    });

    // Determine if we should show days or hours
    const maxValue = Math.max(...data.data);
    const useDays = maxValue >= 24;

    // Show actual data
    responseTimeByUnitChart.data.labels = data.labels;
    responseTimeByUnitChart.data.datasets[0].data = processedData;
    responseTimeByUnitChart.data.datasets[0].backgroundColor = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    responseTimeByUnitChart.options.plugins.legend.display = true;

    // Update y-axis title and tooltip based on unit
    responseTimeByUnitChart.options.scales.y.title.text = useDays ? 'Response Time (Days)' : 'Response Time (Hours)';

    // Update tooltip to show correct unit
    responseTimeByUnitChart.options.plugins.tooltip.callbacks.label = function(context) {
      const value = context.parsed.y;
      const unit = useDays ? 'days' : 'hours';
      return `${context.label}: ${value} ${unit}`;
    };

    // Update y-axis ticks to show correct unit
    responseTimeByUnitChart.options.scales.y.ticks.callback = function(value) {
      const unit = useDays ? ' days' : ' hrs';
      return value + unit;
    };
  }
  responseTimeByUnitChart.update();
}

function updateFilteredStatusChart(data) {
  if (!filteredStatusChart) return;
  
  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    filteredStatusChart.data.labels = ['No Data'];
    filteredStatusChart.data.datasets[0].data = [1];
    filteredStatusChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    filteredStatusChart.options.plugins.legend.display = false;
  } else {
    // Show actual data
    filteredStatusChart.data.labels = data.labels;
    filteredStatusChart.data.datasets[0].data = data.data;
    
    // Status color mapping
    const statusColorMap = {
      'Pending': '#fbbf24',
      'In Progress': '#3b82f6',
      'For Revision': '#f59e0b',
      'Completed': '#10b981',
      'Approved': '#10b981',
      'Rejected': '#ef4444',
      'Cancelled': '#9ca3af',
      'Queued': '#0ea5e9',
      'For Checking': '#a855f7',
      'Draft': '#9ca3af'
    };
    
    filteredStatusChart.data.datasets[0].backgroundColor = data.labels.map(label => statusColorMap[label] || '#9ca3af');
    filteredStatusChart.options.plugins.legend.display = true;
  }
  filteredStatusChart.update();
}

function updateFilteredTypeChart(data) {
  if (!filteredTypeChart) return;
  
  if (!data || !data.labels || !data.data || data.data.length === 0) {
    // Show empty state
    filteredTypeChart.data.labels = ['No Data'];
    filteredTypeChart.data.datasets[0].data = [1];
    filteredTypeChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    filteredTypeChart.options.plugins.legend.display = false;
  } else {
    // Show actual data
    filteredTypeChart.data.labels = data.labels;
    filteredTypeChart.data.datasets[0].data = data.data;
    filteredTypeChart.data.datasets[0].backgroundColor = [
      '#3b82f6', // Approval
      '#10b981'  // Service
    ];
    filteredTypeChart.options.plugins.legend.display = true;
  }
  filteredTypeChart.update();
}

/* ============================================
   FILTERED RESULTS SECTION
   ============================================ */

function showFilteredResults(data) {
  const section = document.getElementById('filteredResultsSection');
  const countElement = document.getElementById('filtered-count');
  
  // Always show the filtered results section
  section.style.display = 'block';
  
  if (data.filtered && data.filtered.requests && data.filtered.requests.length > 0) {
    countElement.textContent = data.filtered.requests.length;
    
    // Update filtered charts
    updateFilteredStatusChart(data.filtered.statusBreakdown);
    updateFilteredTypeChart(data.filtered.typeBreakdown);
    
    // Populate filtered table
    populateFilteredRequestsTable(data.filtered.requests);
  } else {
    countElement.textContent = '0';
    
    // Show empty state for charts
    updateFilteredStatusChart(null);
    updateFilteredTypeChart(null);
    
    // Show empty table message
    populateFilteredRequestsTable([]);
  }
}

function populateFilteredRequestsTable(requests) {
  const tbody = document.getElementById('filteredRequestsTbody');
  
  if (!requests || requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No requests match the current filters. Try adjusting your filter criteria.</td></tr>';
    return;
  }
  
  tbody.innerHTML = requests.map(request => {
    const statusClass = request.status ? request.status.toLowerCase().replace(/\s+/g, '-') : 'unknown';
    const typeClass = request.requestType ? request.requestType.toLowerCase() : 'unknown';
    
    return `
      <tr>
        <td>${(request._id || '').toString().slice(-8).toUpperCase()}</td>
        <td>${request.title || request.description || 'No title'}</td>
        <td>
          <span class="type-badge ${typeClass}">${request.specificRequestType || (request.requestType === 'service' ? 'SERVICE' : 'APPROVAL')}</span>
        </td>
        <td>${request.requester || request.userId?.fName + ' ' + request.userId?.lName || 'Unknown'}</td>
        <td>${request.unit || request.assignedUnits || 'Unassigned'}</td>
        <td>
          <span class="status-badge ${statusClass}">${request.status || 'Unknown'}</span>
        </td>
        <td>${request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</td>
        <td>
          <a href="/admin/${request.requestType === 'service' ? 'services' : 'approvals'}?id=${request._id}" class="btn-view">View</a>
        </td>
      </tr>
    `;
  }).join('');
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
