// Parse rack number from voice text using Duckling
export async function parseRackNumber(voiceText: string): Promise<number | null> {
  const response = await fetch(
    "https://YOUR-SUPABASE-URL/functions/v1/duckling-parser",
    {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: voiceText }),
    }
  );
  const data = await response.json();
  // Extract the first number (e.g., "seven" → 7)
  return data.find((item: any) => item.type === "number")?.value || null;
}
