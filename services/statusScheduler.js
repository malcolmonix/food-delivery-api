/**
 * StatusScheduler Service
 * 
 * Core scheduling logic for automatic restaurant status management based on business hours.
 * Handles timezone conversions, overnight hours, and status change calculations.
 * 
 * Requirements: 2.1, 2.2, BR-3.2
 */

/**
 * Get current time in a specific timezone
 * @param {string} timezone - IANA timezone (e.g., "Africa/Lagos")
 * @returns {Date} Current date/time in the specified timezone
 */
function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  
  // Convert to timezone-specific time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dateParts = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  // Create date in the target timezone
  return new Date(
    `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`
  );
}

/**
 * Get day of week name from date
 * @param {Date} date - Date object
 * @returns {string} Day name in lowercase (e.g., "monday")
 */
function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Convert time string to minutes since midnight
 * @param {string} timeStr - Time in HH:mm format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:mm format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Check if current time is within business hours
 * Handles overnight hours (e.g., open 22:00, close 02:00)
 * 
 * @param {Object} businessHours - Business hours object with days
 * @param {string} timezone - IANA timezone
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {boolean} True if should be open, false otherwise
 */
function shouldBeOpen(businessHours, timezone, currentTime = null) {
  if (!businessHours || !timezone) {
    return false;
  }
  
  const now = currentTime || getCurrentTimeInTimezone(timezone);
  const dayName = getDayOfWeek(now);
  const dayHours = businessHours[dayName];
  
  if (!dayHours || dayHours.closed) {
    return false;
  }
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(dayHours.open);
  const closeMinutes = timeToMinutes(dayHours.close);
  
  // BR-3.1: If opening time equals closing time, restaurant is considered closed all day
  if (openMinutes === closeMinutes) {
    return false;
  }
  
  // Handle overnight hours (closing time is before opening time)
  if (closeMinutes < openMinutes) {
    // Restaurant is open from openTime until midnight, OR from midnight until closeTime
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
  
  // Normal hours (same day)
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get the next status change time (opening or closing)
 * 
 * @param {Object} businessHours - Business hours object with days
 * @param {string} timezone - IANA timezone
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {Object} { time: Date, type: 'opening'|'closing', day: string }
 */
function getNextStatusChange(businessHours, timezone, currentTime = null) {
  if (!businessHours || !timezone) {
    return null;
  }
  
  const now = currentTime || getCurrentTimeInTimezone(timezone);
  const currentDayName = getDayOfWeek(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = days.indexOf(currentDayName);
  
  // Check today first
  const todayHours = businessHours[currentDayName];
  
  if (todayHours && !todayHours.closed) {
    const openMinutes = timeToMinutes(todayHours.open);
    const closeMinutes = timeToMinutes(todayHours.close);
    
    // Handle overnight hours
    if (closeMinutes < openMinutes) {
      // If we're before closing time (early morning), closing is next
      if (currentMinutes < closeMinutes) {
        const nextChange = new Date(now);
        nextChange.setHours(Math.floor(closeMinutes / 60), closeMinutes % 60, 0, 0);
        return { time: nextChange, type: 'closing', day: currentDayName };
      }
      // If we're before opening time, opening is next
      if (currentMinutes < openMinutes) {
        const nextChange = new Date(now);
        nextChange.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
        return { time: nextChange, type: 'opening', day: currentDayName };
      }
      // If we're after opening time, closing is tomorrow morning
      const nextChange = new Date(now);
      nextChange.setDate(nextChange.getDate() + 1);
      nextChange.setHours(Math.floor(closeMinutes / 60), closeMinutes % 60, 0, 0);
      return { time: nextChange, type: 'closing', day: days[(currentDayIndex + 1) % 7] };
    }
    
    // Normal hours
    if (currentMinutes < openMinutes) {
      // Before opening today
      const nextChange = new Date(now);
      nextChange.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
      return { time: nextChange, type: 'opening', day: currentDayName };
    }
    
    if (currentMinutes < closeMinutes) {
      // Currently open, closing is next
      const nextChange = new Date(now);
      nextChange.setHours(Math.floor(closeMinutes / 60), closeMinutes % 60, 0, 0);
      return { time: nextChange, type: 'closing', day: currentDayName };
    }
  }
  
  // Look for next opening in the following days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayName = days[nextDayIndex];
    const nextDayHours = businessHours[nextDayName];
    
    if (nextDayHours && !nextDayHours.closed) {
      const openMinutes = timeToMinutes(nextDayHours.open);
      const nextChange = new Date(now);
      nextChange.setDate(nextChange.getDate() + i);
      nextChange.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
      return { time: nextChange, type: 'opening', day: nextDayName };
    }
  }
  
  // No opening found in the next 7 days (restaurant closed all week)
  return null;
}

/**
 * Get time until next status change in milliseconds
 * 
 * @param {Object} businessHours - Business hours object with days
 * @param {string} timezone - IANA timezone
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {number|null} Milliseconds until next change, or null if no change scheduled
 */
function getTimeUntilNextChange(businessHours, timezone, currentTime = null) {
  const nextChange = getNextStatusChange(businessHours, timezone, currentTime);
  
  if (!nextChange) {
    return null;
  }
  
  const now = currentTime || getCurrentTimeInTimezone(timezone);
  return nextChange.time.getTime() - now.getTime();
}

/**
 * Get next opening time for a closed restaurant
 * 
 * @param {Object} businessHours - Business hours object with days
 * @param {string} timezone - IANA timezone
 * @param {Date} currentTime - Current time (optional, defaults to now)
 * @returns {Object|null} { time: Date, day: string, timeString: string } or null
 */
function getNextOpeningTime(businessHours, timezone, currentTime = null) {
  const nextChange = getNextStatusChange(businessHours, timezone, currentTime);
  
  if (!nextChange || nextChange.type !== 'opening') {
    // If next change is closing, look for the opening after that
    const now = currentTime || getCurrentTimeInTimezone(timezone);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = days.indexOf(getDayOfWeek(now));
    
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDayName = days[nextDayIndex];
      const nextDayHours = businessHours[nextDayName];
      
      if (nextDayHours && !nextDayHours.closed) {
        const openMinutes = timeToMinutes(nextDayHours.open);
        const nextOpening = new Date(now);
        nextOpening.setDate(nextOpening.getDate() + i);
        nextOpening.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
        
        return {
          time: nextOpening,
          day: nextDayName,
          timeString: nextDayHours.open
        };
      }
    }
    
    return null;
  }
  
  return {
    time: nextChange.time,
    day: nextChange.day,
    timeString: businessHours[nextChange.day].open
  };
}

/**
 * Format time for display in 12-hour format
 * @param {string} timeStr - Time in HH:mm format
 * @returns {string} Time in 12-hour format (e.g., "9:00 AM")
 */
function formatTime12Hour(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Calculate time remaining until closing in a human-readable format
 * @param {Object} businessHours - Business hours object
 * @param {string} timezone - IANA timezone
 * @param {Date} currentTime - Current time (optional)
 * @returns {Object|null} { hours, minutes, totalMinutes, state } or null
 */
function getTimeUntilClosing(businessHours, timezone, currentTime = null) {
  if (!shouldBeOpen(businessHours, timezone, currentTime)) {
    return null;
  }
  
  const nextChange = getNextStatusChange(businessHours, timezone, currentTime);
  
  if (!nextChange || nextChange.type !== 'closing') {
    return null;
  }
  
  const now = currentTime || getCurrentTimeInTimezone(timezone);
  const msUntilClosing = nextChange.time.getTime() - now.getTime();
  const totalMinutes = Math.floor(msUntilClosing / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Determine state based on time remaining
  let state = 'open';
  if (totalMinutes < 30) {
    state = 'critical';
  } else if (totalMinutes < 120) {
    state = 'warning';
  }
  
  return {
    hours,
    minutes,
    totalMinutes,
    state,
    closingTime: nextChange.time
  };
}

module.exports = {
  getCurrentTimeInTimezone,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
  shouldBeOpen,
  getNextStatusChange,
  getTimeUntilNextChange,
  getNextOpeningTime,
  formatTime12Hour,
  getTimeUntilClosing
};
