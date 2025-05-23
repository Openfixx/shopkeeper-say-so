
/**
 * Levenshtein Distance calculation
 * Used for fuzzy matching of product names
 */

export const levenshtein = (a: string, b: string): number => {
  if (!a || !b) return 0;
  
  const dp: number[][] = Array(a.length+1).fill(0).map(() => Array(b.length+1).fill(0));
  for (let i=0; i<=a.length; i++) dp[i][0] = i;
  for (let j=0; j<=b.length; j++) dp[0][j] = j;
  for (let i=1; i<=a.length; i++){
    for (let j=1; j<=b.length; j++){
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1].toLowerCase()===b[j-1].toLowerCase() ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
};
