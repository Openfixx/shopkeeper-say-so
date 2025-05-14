
/**
 * Levenshtein Distance Algorithm
 * 
 * Calculates the minimum number of single-character edits 
 * (insertions, deletions, or substitutions) required to change 
 * one string into another.
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns Distance value
 */
export const levenshtein = (a: string, b: string): number => {
  // Create a matrix of size (a.length+1) x (b.length+1)
  const matrix: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  
  // Fill the first column and row
  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Return the distance
  return matrix[a.length][b.length];
};

/**
 * Calculate similarity between two strings (0 to 1)
 * @param a First string
 * @param b Second string
 * @returns Similarity value (1 = exact match, 0 = completely different)
 */
export const calculateSimilarity = (a: string, b: string): number => {
  if (a.length === 0 && b.length === 0) return 1; // Both empty = perfect match
  if (a.length === 0 || b.length === 0) return 0; // One empty = no match
  
  const distance = levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);
  
  // Convert distance to similarity (1 - normalized distance)
  return 1 - (distance / maxLength);
};

/**
 * Find best match for a string in an array of strings
 * @param target String to find match for
 * @param candidates Array of potential matches
 * @param threshold Minimum similarity threshold (0-1)
 * @returns Best match and its similarity score or null if no match above threshold
 */
export const findBestMatch = (
  target: string, 
  candidates: string[], 
  threshold = 0.6
): { match: string; similarity: number } | null => {
  if (!target || candidates.length === 0) return null;
  
  let bestMatch = '';
  let bestSimilarity = 0;
  
  // Normalize target for comparison
  const normalizedTarget = target.toLowerCase().trim();
  
  // Find best match
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();
    const similarity = calculateSimilarity(normalizedTarget, normalizedCandidate);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }
  
  // Return best match if it's above threshold
  if (bestSimilarity >= threshold) {
    return {
      match: bestMatch,
      similarity: bestSimilarity
    };
  }
  
  return null;
};
