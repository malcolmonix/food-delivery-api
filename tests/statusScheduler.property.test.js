/**
 * Property-Based Tests for StatusScheduler Service
 * 
 * Feature: restaurant-hours-automation
 * Property 4: Scheduled Status Changes
 * Validates: Requirements 2.1, 2.2
 * 
 * These tests verify universal properties that should hold true across all inputs.
 * Minimum 100 iterations per property test.
 * 
 * NOTE: Requires fast-check library
 * Install with: npm install --save-dev fast-check
 */

const fc = require('fast-check');
const {
  shouldBeOpen,
  getNextStatusChange,
  getTimeUntilNextChange,
  timeToMinutes,
  minutesToTime,
  getDayOfWeek
} = require('../services/statusScheduler');

// Arbitraries (generators) for property-based testing

/**
 * Generate valid time string in HH:mm format
 */
const timeStringArbitrary = () => {
  return fc.tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 })
  ).map(([hours, minutes]) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  });
};

/**
 * Generate valid DayHours object
 */
const dayHoursArbitrary = () => {
  return fc.record({
    open: timeStringArbitrary(),
    close: timeStringArbitrary(),
    closed: fc.boolean()
  });
};

/**
 * Generate valid BusinessHours object
 */
const businessHoursArbitrary = () => {
  return fc.record({
    monday: dayHoursArbitrary(),
    tuesday: dayHoursArbitrary(),
    wednesday: dayHoursArbitrary(),
    thursday: dayHoursArbitrary(),
    friday: dayHoursArbitrary(),
    saturday: dayHoursArbitrary(),
    sunday: dayHoursArbitrary()
  });
};

/**
 * Generate a date within a reasonable range
 */
const dateArbitrary = () => {
  return fc.date({
    min: new Date('2026-01-01'),
    max: new Date('2026-12-31')
  });
};

// Property Tests

describe('StatusScheduler - Property-Based Tests', () => {
  
  // Property 4: Scheduled Status Changes
  describe('Property 4: Scheduled Status Changes', () => {
    
    test('shouldBeOpen returns consistent results for the same input', () => {
      fc.assert(
        fc.property(
          businessHoursArbitrary(),
          fc.constant('Africa/Lagos'),
          dateArbitrary(),
          (businessHours, timezone, currentTime) => {
            // Property: Calling shouldBeOpen multiple times with same inputs returns same result
            const result1 = shouldBeOpen(businessHours, timezone, currentTime);
            const result2 = shouldBeOpen(businessHours, timezone, currentTime);
            
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('shouldBeOpen returns false for closed days', () => {
      fc.assert(
        fc.property(
          businessHoursArbitrary(),
          fc.constant('Africa/Lagos'),
          dateArbitrary(),
          (businessHours, timezone, currentTime) => {
            const dayName = getDayOfWeek(currentTime);
            
            // If the day is marked as closed, shouldBeOpen must return false
            if (businessHours[dayName].closed) {
              const result = shouldBeOpen(businessHours, timezone, currentTime);
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('time conversion is reversible', () => {
      fc.assert(
        fc.property(
          timeStringArbitrary(),
          (timeStr) => {
            // Property: Converting time to minutes and back should yield the same time
            const minutes = timeToMinutes(timeStr);
            const converted = minutesToTime(minutes);
            
            expect(converted).toBe(timeStr);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('getNextStatusChange always returns a future time or null', () => {
      fc.assert(
        fc.property(
          businessHoursArbitrary(),
          fc.constant('Africa/Lagos'),
          dateArbitrary(),
          (businessHours, timezone, currentTime) => {
            // Skip invalid dates
            if (isNaN(currentTime.getTime())) {
              return;
            }
            
            const nextChange = getNextStatusChange(businessHours, timezone, currentTime);
            
            if (nextChange !== null) {
              // Next change time must be in the future
              expect(nextChange.time.getTime()).toBeGreaterThanOrEqual(currentTime.getTime());
              
              // Type must be either 'opening' or 'closing'
              expect(['opening', 'closing']).toContain(nextChange.type);
              
              // Day must be a valid day name
              const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              expect(validDays).toContain(nextChange.day);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('getTimeUntilNextChange is non-negative or null', () => {
      fc.assert(
        fc.property(
          businessHoursArbitrary(),
          fc.constant('Africa/Lagos'),
          dateArbitrary(),
          (businessHours, timezone, currentTime) => {
            // Skip invalid dates
            if (isNaN(currentTime.getTime())) {
              return;
            }
            
            const timeUntil = getTimeUntilNextChange(businessHours, timezone, currentTime);
            
            if (timeUntil !== null) {
              // Time until next change must be non-negative
              expect(timeUntil).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('status changes occur at scheduled boundaries', () => {
      fc.assert(
        fc.property(
          fc.record({
            open: timeStringArbitrary(),
            close: timeStringArbitrary(),
            closed: fc.constant(false)
          }),
          fc.constant('Africa/Lagos'),
          (dayHours, timezone) => {
            // Create business hours with same hours every day
            const businessHours = {
              monday: dayHours,
              tuesday: dayHours,
              wednesday: dayHours,
              thursday: dayHours,
              friday: dayHours,
              saturday: dayHours,
              sunday: dayHours
            };
            
            const openMinutes = timeToMinutes(dayHours.open);
            const closeMinutes = timeToMinutes(dayHours.close);
            
            // Skip if overnight hours (more complex to test)
            if (closeMinutes < openMinutes) {
              return;
            }
            
            // Test at opening time
            const openingTime = new Date('2026-02-03T00:00:00');
            openingTime.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
            
            const isOpenAtOpening = shouldBeOpen(businessHours, timezone, openingTime);
            expect(isOpenAtOpening).toBe(true);
            
            // Test one minute before opening
            const beforeOpening = new Date(openingTime);
            beforeOpening.setMinutes(beforeOpening.getMinutes() - 1);
            
            const isOpenBeforeOpening = shouldBeOpen(businessHours, timezone, beforeOpening);
            expect(isOpenBeforeOpening).toBe(false);
            
            // Test at closing time (should be closed)
            const closingTime = new Date('2026-02-03T00:00:00');
            closingTime.setHours(Math.floor(closeMinutes / 60), closeMinutes % 60, 0, 0);
            
            const isOpenAtClosing = shouldBeOpen(businessHours, timezone, closingTime);
            expect(isOpenAtClosing).toBe(false);
            
            // Test one minute before closing (should be open)
            const beforeClosing = new Date(closingTime);
            beforeClosing.setMinutes(beforeClosing.getMinutes() - 1);
            
            const isOpenBeforeClosing = shouldBeOpen(businessHours, timezone, beforeClosing);
            expect(isOpenBeforeClosing).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('overnight hours are handled correctly', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 18, max: 23 }), // Opening hour (evening)
            fc.integer({ min: 1, max: 6 })     // Closing hour (morning) - must be > 0
          ),
          fc.constant('Africa/Lagos'),
          ([openHour, closeHour], timezone) => {
            const dayHours = {
              open: `${String(openHour).padStart(2, '0')}:00`,
              close: `${String(closeHour).padStart(2, '0')}:00`,
              closed: false
            };
            
            const businessHours = {
              monday: dayHours,
              tuesday: dayHours,
              wednesday: dayHours,
              thursday: dayHours,
              friday: dayHours,
              saturday: dayHours,
              sunday: dayHours
            };
            
            // Test during opening hour (should be open)
            const openingTime = new Date('2026-02-03T00:00:00');
            openingTime.setHours(openHour, 0, 0, 0);
            const isOpenAtOpening = shouldBeOpen(businessHours, timezone, openingTime);
            expect(isOpenAtOpening).toBe(true);
            
            // Test during early morning before closing (should be open)
            const morningTime = new Date('2026-02-03T02:00:00');
            const isOpenMorning = shouldBeOpen(businessHours, timezone, morningTime);
            
            if (closeHour > 2) {
              expect(isOpenMorning).toBe(true);
            } else {
              expect(isOpenMorning).toBe(false);
            }
            
            // Test during afternoon (should be closed)
            const afternoonTime = new Date('2026-02-03T14:00:00');
            const isOpenAfternoon = shouldBeOpen(businessHours, timezone, afternoonTime);
            expect(isOpenAfternoon).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Edge Cases and Invariants', () => {
    
    test('shouldBeOpen handles null/undefined inputs gracefully', () => {
      expect(shouldBeOpen(null, 'Africa/Lagos')).toBe(false);
      expect(shouldBeOpen(undefined, 'Africa/Lagos')).toBe(false);
      expect(shouldBeOpen({}, null)).toBe(false);
      expect(shouldBeOpen({}, undefined)).toBe(false);
    });
    
    test('getNextStatusChange handles all-closed week', () => {
      const allClosedHours = {
        monday: { open: '09:00', close: '21:00', closed: true },
        tuesday: { open: '09:00', close: '21:00', closed: true },
        wednesday: { open: '09:00', close: '21:00', closed: true },
        thursday: { open: '09:00', close: '21:00', closed: true },
        friday: { open: '09:00', close: '21:00', closed: true },
        saturday: { open: '09:00', close: '21:00', closed: true },
        sunday: { open: '09:00', close: '21:00', closed: true }
      };
      
      const result = getNextStatusChange(allClosedHours, 'Africa/Lagos', new Date());
      expect(result).toBeNull();
    });
    
    test('time conversion handles edge cases', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
      expect(timeToMinutes('12:00')).toBe(720);
      
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(1439)).toBe('23:59');
      expect(minutesToTime(720)).toBe('12:00');
    });
  });
});

// Export for use in other test files
module.exports = {
  timeStringArbitrary,
  dayHoursArbitrary,
  businessHoursArbitrary,
  dateArbitrary
};
