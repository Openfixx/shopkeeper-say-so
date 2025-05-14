
/**
 * Date Parser
 * Extracts expiry date information from voice commands
 */

// Import date handling libraries if needed
import { addDays, addWeeks, addMonths, addYears, format, parse, isValid } from 'date-fns';

// Define patterns for date extraction
const DATE_PATTERNS = {
  // Explicit date formats
  explicit: [
    // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/,
    // DD Month YYYY or Month DD, YYYY
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{2,4})\b/i,
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/i,
    // DD Month or Month DD
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  ],
  // Relative date formats
  relative: [
    // Next/this week/month/year
    /\b(?:next|this)\s+(day|week|month|year)\b/i,
    // In X days/weeks/months/years
    /\bin\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(days?|weeks?|months?|years?)\b/i,
    // X days/weeks/months/years from now
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(days?|weeks?|months?|years?)\s+from\s+now\b/i,
    // Tomorrow/today
    /\b(tomorrow|today|tonight)\b/i,
    // Next specific day
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  ],
  // Expiry related keywords
  expiry: [
    /\b(?:expir(?:y|ing|es|ed)?|valid\s+(?:until|till)|use\s+by|best\s+before|good\s+(?:until|till)|sell\s+by)\b/i
  ]
};

// Month name to number mapping
const MONTH_MAPPING: Record<string, number> = {
  'jan': 1, 'january': 1,
  'feb': 2, 'february': 2,
  'mar': 3, 'march': 3,
  'apr': 4, 'april': 4,
  'may': 5,
  'jun': 6, 'june': 6,
  'jul': 7, 'july': 7,
  'aug': 8, 'august': 8,
  'sep': 9, 'september': 9,
  'oct': 10, 'october': 10,
  'nov': 11, 'november': 11,
  'dec': 12, 'december': 12
};

// Day name to day of week mapping (0 = Sunday)
const DAY_MAPPING: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

// Number words to numeric values
const NUMBER_MAPPING: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Parse a date string into a standardized format
 * @param text Text containing date information
 * @returns Formatted date string (YYYY-MM-DD) or undefined if parsing fails
 */
export const extractExpiryDate = (text: string): string | undefined => {
  if (!text) return undefined;
  
  // Check if there's an expiry related keyword
  let hasExpiryContext = false;
  for (const pattern of DATE_PATTERNS.expiry) {
    if (pattern.test(text.toLowerCase())) {
      hasExpiryContext = true;
      break;
    }
  }
  
  // If no expiry context is found, return undefined
  if (!hasExpiryContext) return undefined;
  
  // Try to extract explicit dates first
  for (const pattern of DATE_PATTERNS.explicit) {
    const match = text.match(pattern);
    if (match) {
      try {
        let day: number;
        let month: number;
        let year: number | undefined;
        
        // Handle DD/MM/YYYY or MM/DD/YYYY
        if (match[0].includes('/') || match[0].includes('.') || match[0].includes('-')) {
          // Assume DD/MM/YYYY format (international standard)
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = match[3] ? parseInt(match[3]) : undefined;
          
          // Validate and swap if needed based on sensible ranges
          // If first number > 12, assume it's a day (DD/MM format)
          // If second number > 31, assume it's not a day (MM/DD format)
          if (month > 12 && day <= 12) {
            [day, month] = [month, day]; // Swap for MM/DD format
          }
        }
        // Handle DD Month YYYY
        else if (match[2] && MONTH_MAPPING[match[2].toLowerCase()]) {
          day = parseInt(match[1]);
          month = MONTH_MAPPING[match[2].toLowerCase()];
          year = match[3] ? parseInt(match[3]) : undefined;
        }
        // Handle Month DD, YYYY
        else if (match[1] && MONTH_MAPPING[match[1].toLowerCase()]) {
          month = MONTH_MAPPING[match[1].toLowerCase()];
          day = parseInt(match[2]);
          year = match[3] ? parseInt(match[3]) : undefined;
        }
        // Handle DD Month
        else if (match[2] && MONTH_MAPPING[match[2].toLowerCase()]) {
          day = parseInt(match[1]);
          month = MONTH_MAPPING[match[2].toLowerCase()];
        }
        // Handle Month DD
        else if (match[1] && MONTH_MAPPING[match[1].toLowerCase()]) {
          month = MONTH_MAPPING[match[1].toLowerCase()];
          day = parseInt(match[2]);
        }
        else {
          continue; // No valid date pattern
        }
        
        // Default to current year if year is not provided
        if (!year) {
          year = new Date().getFullYear();
          
          // If the month is earlier than the current month, it's likely for next year
          const currentMonth = new Date().getMonth() + 1; // 1-12
          if (month < currentMonth) {
            year += 1;
          }
        } else if (year < 100) {
          // Handle 2-digit years
          year = year < 50 ? 2000 + year : 1900 + year;
        }
        
        // Validate date
        const dateObj = new Date(year, month - 1, day);
        if (isValid(dateObj) && day === dateObj.getDate() && month === dateObj.getMonth() + 1) {
          return format(dateObj, 'yyyy-MM-dd');
        }
      } catch (error) {
        console.error('Error parsing explicit date:', error);
      }
    }
  }
  
  // Try to extract relative dates
  for (const pattern of DATE_PATTERNS.relative) {
    const match = text.match(pattern);
    if (match) {
      try {
        const now = new Date();
        let result: Date;
        
        if (match[0].match(/\bnext\s+(week|month|year)\b/i)) {
          const unit = match[1].toLowerCase();
          if (unit === 'week') {
            result = addWeeks(now, 1);
          } else if (unit === 'month') {
            result = addMonths(now, 1);
          } else {
            result = addYears(now, 1);
          }
        }
        else if (match[0].match(/\bthis\s+(week|month|year)\b/i)) {
          // "This week" generally means the end of the current week
          const unit = match[1].toLowerCase();
          if (unit === 'week') {
            // Set to Sunday (end of week)
            const daysToSunday = 7 - now.getDay();
            result = addDays(now, daysToSunday === 0 ? 7 : daysToSunday);
          } else if (unit === 'month') {
            // Last day of the current month
            result = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          } else {
            // Last day of the year
            result = new Date(now.getFullYear(), 11, 31);
          }
        }
        else if (match[0].match(/\bin\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i)) {
          // "In X days/weeks/months/years"
          let amount = match[1];
          if (isNaN(parseInt(amount))) {
            amount = NUMBER_MAPPING[amount.toLowerCase()].toString();
          }
          
          const unit = match[2].toLowerCase();
          if (unit.startsWith('day')) {
            result = addDays(now, parseInt(amount));
          } else if (unit.startsWith('week')) {
            result = addWeeks(now, parseInt(amount));
          } else if (unit.startsWith('month')) {
            result = addMonths(now, parseInt(amount));
          } else {
            result = addYears(now, parseInt(amount));
          }
        }
        else if (match[0].match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(days?|weeks?|months?|years?)\s+from\s+now\b/i)) {
          // "X days/weeks/months/years from now"
          let amount = match[1];
          if (isNaN(parseInt(amount))) {
            amount = NUMBER_MAPPING[amount.toLowerCase()].toString();
          }
          
          const unit = match[2].toLowerCase();
          if (unit.startsWith('day')) {
            result = addDays(now, parseInt(amount));
          } else if (unit.startsWith('week')) {
            result = addWeeks(now, parseInt(amount));
          } else if (unit.startsWith('month')) {
            result = addMonths(now, parseInt(amount));
          } else {
            result = addYears(now, parseInt(amount));
          }
        }
        else if (match[0].match(/\btomorrow\b/i)) {
          result = addDays(now, 1);
        }
        else if (match[0].match(/\btoday|tonight\b/i)) {
          result = now;
        }
        else if (match[0].match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)) {
          const targetDay = match[1].toLowerCase();
          const targetDayNum = DAY_MAPPING[targetDay];
          const currentDayNum = now.getDay();
          let daysToAdd = targetDayNum - currentDayNum;
          
          // If today is the target day or we've already passed it this week, go to next week
          if (daysToAdd <= 0) {
            daysToAdd += 7;
          }
          
          result = addDays(now, daysToAdd);
        }
        else {
          continue; // No valid relative date pattern
        }
        
        return format(result, 'yyyy-MM-dd');
      } catch (error) {
        console.error('Error parsing relative date:', error);
      }
    }
  }
  
  // If no date was found, return undefined
  return undefined;
};
