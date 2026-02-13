/**
 * Restaurant Hours Automation - Type Definitions
 * 
 * This file contains TypeScript-style JSDoc type definitions for the
 * restaurant hours automation feature.
 * 
 * @fileoverview Type definitions for business hours, timezone, and scheduling
 */

/**
 * @typedef {Object} DayHours
 * @property {string} open - Opening time in HH:mm format (24-hour, e.g., "09:00")
 * @property {string} close - Closing time in HH:mm format (24-hour, e.g., "21:00")
 * @property {boolean} closed - Whether the restaurant is closed on this day
 */

/**
 * @typedef {Object} BusinessHours
 * @property {DayHours} monday - Monday hours
 * @property {DayHours} tuesday - Tuesday hours
 * @property {DayHours} wednesday - Wednesday hours
 * @property {DayHours} thursday - Thursday hours
 * @property {DayHours} friday - Friday hours
 * @property {DayHours} saturday - Saturday hours
 * @property {DayHours} sunday - Sunday hours
 */

/**
 * @typedef {Object} NotificationsSent
 * @property {string|null} twoHourWarning - Timestamp of 2-hour warning notification
 * @property {string|null} thirtyMinuteWarning - Timestamp of 30-minute warning notification
 * @property {string} lastResetDate - Date when notifications were last reset (YYYY-MM-DD)
 */

/**
 * @typedef {Object} RestaurantScheduling
 * @property {BusinessHours} businessHours - Business hours for each day of the week
 * @property {string} timezone - IANA timezone (e.g., "Africa/Lagos")
 * @property {boolean} autoScheduleEnabled - Whether automatic scheduling is enabled
 * @property {string|null} lastManualStatusChange - Timestamp of last manual status change
 * @property {string|null} lastAutoStatusChange - Timestamp of last automatic status change
 * @property {NotificationsSent} notificationsSent - Tracking for sent notifications
 */

/**
 * Default business hours (9 AM to 9 PM, open all days)
 * @type {BusinessHours}
 */
const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '21:00', closed: false },
  tuesday: { open: '09:00', close: '21:00', closed: false },
  wednesday: { open: '09:00', close: '21:00', closed: false },
  thursday: { open: '09:00', close: '21:00', closed: false },
  friday: { open: '09:00', close: '21:00', closed: false },
  saturday: { open: '09:00', close: '21:00', closed: false },
  sunday: { open: '09:00', close: '21:00', closed: false }
};

/**
 * Default timezone (West Africa Time - Lagos)
 * @type {string}
 */
const DEFAULT_TIMEZONE = 'Africa/Lagos';

/**
 * Default notification tracking object
 * @type {NotificationsSent}
 */
const DEFAULT_NOTIFICATIONS_SENT = {
  twoHourWarning: null,
  thirtyMinuteWarning: null,
  lastResetDate: new Date().toISOString().split('T')[0]
};

/**
 * Validates a time string in HH:mm format
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTimeFormat(time) {
  if (typeof time !== 'string') return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Validates a DayHours object
 * @param {DayHours} dayHours - Day hours object to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidDayHours(dayHours) {
  if (!dayHours || typeof dayHours !== 'object') return false;
  
  const { open, close, closed } = dayHours;
  
  // Check required fields
  if (typeof closed !== 'boolean') return false;
  
  // If closed, open and close times are optional
  if (closed) return true;
  
  // If not closed, validate time formats
  return isValidTimeFormat(open) && isValidTimeFormat(close);
}

/**
 * Validates a BusinessHours object
 * @param {BusinessHours} businessHours - Business hours object to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidBusinessHours(businessHours) {
  if (!businessHours || typeof businessHours !== 'object') return false;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    if (!isValidDayHours(businessHours[day])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates an IANA timezone string
 * @param {string} timezone - Timezone string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTimezone(timezone) {
  if (typeof timezone !== 'string') return false;
  
  try {
    // Try to create a date with the timezone
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Creates a complete RestaurantScheduling object with defaults
 * @param {Partial<RestaurantScheduling>} partial - Partial scheduling data
 * @returns {RestaurantScheduling} Complete scheduling object
 */
function createRestaurantScheduling(partial = {}) {
  return {
    businessHours: partial.businessHours || DEFAULT_BUSINESS_HOURS,
    timezone: partial.timezone || DEFAULT_TIMEZONE,
    autoScheduleEnabled: partial.autoScheduleEnabled !== undefined ? partial.autoScheduleEnabled : false,
    lastManualStatusChange: partial.lastManualStatusChange || null,
    lastAutoStatusChange: partial.lastAutoStatusChange || null,
    notificationsSent: partial.notificationsSent || DEFAULT_NOTIFICATIONS_SENT
  };
}

module.exports = {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_TIMEZONE,
  DEFAULT_NOTIFICATIONS_SENT,
  isValidTimeFormat,
  isValidDayHours,
  isValidBusinessHours,
  isValidTimezone,
  createRestaurantScheduling
};
