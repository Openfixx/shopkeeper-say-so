
// Currency formatters
export const formatCurrency = (amount: number, locale = 'en-IN', currency = 'INR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Unit formatters for different measurement types
export const UNIT_TYPES = {
  WEIGHT: 'weight',
  VOLUME: 'volume',
  PIECE: 'piece',
  LENGTH: 'length',
};

export const UNIT_OPTIONS = {
  [UNIT_TYPES.WEIGHT]: [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'lb', label: 'Pounds (lb)' },
    { value: 'oz', label: 'Ounces (oz)' },
  ],
  [UNIT_TYPES.VOLUME]: [
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'gal', label: 'Gallons (gal)' },
    { value: 'fl oz', label: 'Fluid Ounces (fl oz)' },
  ],
  [UNIT_TYPES.PIECE]: [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'bottle', label: 'Bottle' },
  ],
  [UNIT_TYPES.LENGTH]: [
    { value: 'm', label: 'Meters (m)' },
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'ft', label: 'Feet (ft)' },
    { value: 'in', label: 'Inches (in)' },
  ],
};

// Detect unit type based on a unit string
export const detectUnitType = (unit: string): string => {
  const lowerUnit = unit.toLowerCase();
  
  if (['kg', 'g', 'lb', 'oz', 'pound', 'gram', 'kilogram'].some(u => lowerUnit.includes(u))) {
    return UNIT_TYPES.WEIGHT;
  }
  
  if (['l', 'ml', 'liter', 'litre', 'gal', 'gallon', 'fl oz'].some(u => lowerUnit.includes(u))) {
    return UNIT_TYPES.VOLUME;
  }
  
  if (['m', 'cm', 'ft', 'in', 'meter', 'inch', 'feet', 'foot'].some(u => lowerUnit.includes(u))) {
    return UNIT_TYPES.LENGTH;
  }
  
  return UNIT_TYPES.PIECE;
};
