
/**
 * Entity Colors
 * Color mapping for entity highlighting
 */

// Function to get color for entity based on label
export const getEntityColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'PERSON': '#ffadad',
    'ORG': '#ffd6a5',
    'GPE': '#fdffb6',
    'LOC': '#caffbf',
    'PRODUCT': '#9bf6ff',
    'EVENT': '#a0c4ff',
    'WORK_OF_ART': '#bdb2ff',
    'LAW': '#ffc6ff',
    'LANGUAGE': '#fffffc',
    'DATE': '#ffd6a5',
    'TIME': '#caffbf',
    'PERCENT': '#9bf6ff',
    'MONEY': '#a0c4ff',
    'QUANTITY': '#bdb2ff',
    'ORDINAL': '#ffc6ff',
    'CARDINAL': '#fffffc',
    'COMMAND': '#ffadad',
    'POSITION': '#ffd6a5',
    'UNIT': '#fdffb6',
    'EXPIRY': '#caffbf',
    'NORP': '#9bf6ff',
    'FAC': '#a0c4ff',
  };
  
  return colorMap[label] || '#eeeeee';
};
