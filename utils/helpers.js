// ===== Helper Functions =====
// This module contains utility functions used throughout the application
// Provides reusable functionality for common operations

/**
 * Adds working days to a given date
 * Excludes weekends (Saturday and Sunday) when calculating the result
 *
 * @param {Date} date - The starting date
 * @param {number} days - Number of working days to add
 * @returns {Date} New date with working days added
 *
 * @example
 * // Add 3 working days to current date
 * const deadline = addWorkingDays(new Date(), 3);
 */
function addWorkingDays(date, days) {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    // Move to next day
    result.setDate(result.getDate() + 1);

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
}

module.exports = {
  addWorkingDays
};
