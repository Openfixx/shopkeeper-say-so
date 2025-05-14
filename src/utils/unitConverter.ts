/**
 * Unit Converter Utility
 * 
 * This utility helps with converting between different units and
 * normalizing units for consistent representation.
 */

// Define conversion rates between different units
const CONVERSION_RATES = {
  // Weight
  kg: {
    g: 1000
  },
  g: {
    kg: 0.001
  },
  
  // Volume
  l: {
    ml: 1000
  },
  ml: {
    l: 0.001
  },
  
  // Others have no direct conversion
};

/**
 * Converts a value from one unit to another if possible
 * 
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number|null} The converted value or null if conversion not possible
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  // No conversion needed if units are the same
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Normalize units
  const normalizedFromUnit = normalizeSingularUnit(fromUnit);
  const normalizedToUnit = normalizeSingularUnit(toUnit);
  
  // Check if conversion is possible
  if (
    CONVERSION_RATES[normalizedFromUnit] && 
    CONVERSION_RATES[normalizedFromUnit][normalizedToUnit] !== undefined
  ) {
    return value * CONVERSION_RATES[normalizedFromUnit][normalizedToUnit];
  }
  
  return null; // Conversion not possible
}

/**
 * Normalizes a unit to singular form
 * 
 * @param {string} unit - The unit to normalize
 * @returns {string} The normalized singular unit
 */
export function normalizeSingularUnit(unit: string): string {
  // Convert to lowercase and remove trailing 's'
  const normalized = unit.toLowerCase().trim();
  
  if (normalized.endsWith('s')) {
    return normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Gets the most appropriate unit for a value
 * 
 * @param {number} value - The value to check
 * @param {string} currentUnit - The current unit
 * @returns {object} The adjusted value and unit
 */
export function getAppropriateUnit(value: number, currentUnit: string): { value: number; unit: string } {
  const unit = normalizeSingularUnit(currentUnit);
  
  // Convert small kg values to grams
  if (unit === 'kg' && value < 1) {
    return {
      value: value * 1000,
      unit: 'g'
    };
  }
  
  // Convert large grams to kg
  if (unit === 'g' && value >= 1000) {
    return {
      value: value / 1000,
      unit: 'kg'
    };
  }
  
  // Convert small liters to ml
  if (unit === 'l' && value < 1) {
    return {
      value: value * 1000,
      unit: 'ml'
    };
  }
  
  // Convert large ml to liters
  if (unit === 'ml' && value >= 1000) {
    return {
      value: value / 1000,
      unit: 'l'
    };
  }
  
  // No conversion needed
  return { value, unit };
}

/**
 * Format a value with its unit for display
 * 
 * @param {number} value - The value to format
 * @param {string} unit - The unit
 * @returns {string} The formatted value with unit
 */
export function formatValueWithUnit(value: number, unit: string): string {
  const { value: adjustedValue, unit: adjustedUnit } = getAppropriateUnit(value, unit);
  
  // Format the number
  const formattedValue = adjustedValue % 1 === 0 
    ? adjustedValue.toString() 
    : adjustedValue.toFixed(2);
  
  // Add the unit
  return `${formattedValue} ${adjustedUnit}`;
}

/**
 * Gets a user-friendly display name for a unit
 * 
 * @param {string} unit - The normalized unit
 * @returns {string} The display name
 */
export function getUnitDisplayName(unit: string): string {
  const unitMap: Record<string, string> = {
    'kg': 'kg',
    'g': 'g',
    'l': 'liters',
    'ml': 'ml',
    'packet': 'packets',
    'bottle': 'bottles',
    'can': 'cans',
    'piece': 'pieces',
    'box': 'boxes',
    'dozen': 'dozen'
  };
  
  return unitMap[unit] || unit;
}
