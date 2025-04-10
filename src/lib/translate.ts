const HINDI_MAP: Record<string, string> = {
  "चीनी": "sugar",
  "नमक": "salt",
  "तेल": "oil",
  "अटा": "flour",
  "दाल": "lentils"
};

export const translate = (text: string) => {
  return text.split(' ').map(word => HINDI_MAP[word] || word).join(' ');
};
