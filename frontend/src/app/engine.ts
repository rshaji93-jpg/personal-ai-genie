export interface Message {
  role: "user" | "assistant";
  content: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: { author: string; content: string };
  triggeredByRainbow?: boolean;
  isIntervention?: boolean;
  modelUsed?: string;
  extractedCode?: {
    title: string;
    language: string;
    code: string;
  };
}

export const PLATFORM_GEMINI_KEY = "AIzaSyAVp5g79X20L_rKg4WQLCOoV3LIGg-i91w";
export const PLATFORM_OPENROUTER_KEY = "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";

export function checkWakeWordTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  const triggers = [
    "@genie", "genie", "jini", "jeeni",
    "ஜீனி", "ஜீனியே", "கரெக்டா",
    "जीनी", "हे जीनी", "बता오 जीनी", "suno genie",
    "జీనీ", "చెప్పు జీనీ",
    "ജീനി", "പറയൂ ജീനി",
    "ಜೀನಿ", "ಹೇಳು ಜೀನಿ",
    "জিনি", "বলো জিনি",
  ];
  return triggers.some((t) => lower.includes(t.toLowerCase()) || text.includes(t));
}

// Calls our native server-side Next.js route (Bypasses all client CORS restrictions)
export async function callActiveGeminiCascade(
  userPrompt: string,
  history: Message[],
  selectedLangLabel: string,
  providedKey?: string
): Promise<{ text: string; model: string }> {
  const response = await fetch("/api/genie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: userPrompt,
      history,
      languageLabel: selectedLangLabel,
      customApiKey: providedKey || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Edge Route Error: ${response.status}`);
  }

  const data = await response.json();
  if (data.success && data.reply) {
    return { text: data.reply, model: data.model };
  }

  throw new Error(data.error || "Failed to generate output");
}