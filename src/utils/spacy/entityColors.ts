
/**
 * Entity Color Utilities
 * Functions for styling and displaying NER entities
 */

/**
 * Get entity color based on entity label
 */
export const getEntityColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'PERSON': '#ff5e5e',
    'NORP': '#ffb347',
    'FAC': '#84b6f4',
    'ORG': '#77dd77',
    'GPE': '#fdcae1',
    'LOC': '#84dcc6',
    'PRODUCT': '#a0a0ff',
    'EVENT': '#bc8f8f',
    'WORK_OF_ART': '#d3a4f9',
    'LAW': '#f1e1ff',
    'LANGUAGE': '#98fb98',
    'DATE': '#aec6cf',
    'TIME': '#b39eb5',
    'PERCENT': '#ffe4e1',
    'MONEY': '#98fb98',
    'QUANTITY': '#f0e68c',
    'ORDINAL': '#dda0dd',
    'CARDINAL': '#e6e6fa',
  };

  return colorMap[label] || '#cccccc';
};
