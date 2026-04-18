// ========================================
// SHARED DATA ARRAYS
// File: public/javascripts/shared-data.js
// Purpose: Centralized data arrays accessible across all pages
// Data is now fetched from database via API
// ========================================

// Initialize with empty arrays - will be populated from API
let affiliationsArray = [];
let studentOrgsArray = [];
let unitsArray = [];
let requestStatusesArray = [];

// Fetch system data from API
(async function loadSystemData() {
  try {
    const response = await fetch('/api/system-data');
    const result = await response.json();
    
    if (result.success) {
      affiliationsArray = result.data.offices || [];
      studentOrgsArray = result.data.organizations || [];
      unitsArray = result.data.units || [];
      requestStatusesArray = result.data.requestStatuses || [];
      
      // Make available globally
      window.affiliationsArray = affiliationsArray;
      window.studentOrgsArray = studentOrgsArray;
      window.unitsArray = unitsArray;
      window.requestStatusesArray = requestStatusesArray;
      
      console.log('[Shared Data] ✅ Loaded from configuration:');
      console.log('   - Organizations:', studentOrgsArray.length);
      console.log('   - Offices:', affiliationsArray.length);
      console.log('   - Units:', unitsArray.length);
      console.log('   - Request Statuses:', requestStatusesArray.length);
      
      // Dispatch event to notify that data is loaded
      window.dispatchEvent(new Event('systemDataLoaded'));
    } else {
      console.warn('[Shared Data] ⚠️ API response unsuccessful');
      window.affiliationsArray = affiliationsArrayFallback;
      window.studentOrgsArray = studentOrgsArrayFallback;
      window.unitsArray = unitsArrayFallback;
      window.requestStatusesArray = requestStatusesArrayFallback;
    }
  } catch (error) {
    console.error('[Shared Data] ❌ Failed to load system data from API:', error);
    console.warn('[Shared Data] Using empty fallback arrays. Please configure via Admin > Configuration.');
    // Use empty fallback arrays
    window.affiliationsArray = affiliationsArrayFallback;
    window.studentOrgsArray = studentOrgsArrayFallback;
    window.unitsArray = unitsArrayFallback;
    window.requestStatusesArray = requestStatusesArrayFallback;
  }
})();

// ========================================
// MINIMAL FALLBACK DATA
// These are only used if the API fails to load
// All data should be configured via Admin > Configuration page
// ========================================
const affiliationsArrayFallback = [];
const studentOrgsArrayFallback = [];
const unitsArrayFallback = [];
const requestStatusesArrayFallback = [];

// Initialize global variables immediately (will be populated by async function)
window.affiliationsArray = affiliationsArray;
window.studentOrgsArray = studentOrgsArray;
window.unitsArray = unitsArray;
window.requestStatusesArray = requestStatusesArray;

console.log('[Shared Data] 📦 Module loaded - fetching data from API...');
