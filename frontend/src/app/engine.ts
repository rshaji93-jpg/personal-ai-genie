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

export const ACTIVE_GEMINI_CASCADES = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-2.0-flash",
];

export function checkWakeWordTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  const triggers = [
    "@genie", "genie", "jini", "jeeni",
    "ஜீனி", "ஜீனியே", "கரெக்டா",
    "जीनी", "हे जीनी", "बताओ जीनी", "suno genie",
    "జీనీ", "చెప్పు జీనీ",
    "ജീനി", "പറയൂ ജീനി",
    "ಜೀನಿ", "ಹೇಳು ಜೀನಿ",
    "জিনি", "বলো জিনি",
  ];
  return triggers.some((t) => lower.includes(t.toLowerCase()) || text.includes(t));
}

export async function callActiveGeminiCascade(
  userPrompt: string,
  history: Message[],
  selectedLangLabel: string,
  providedKey?: string
): Promise<{ text: string; model: string }> {
  // First attempt via internal server route (bypasses CORS restrictions)
  try {
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

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.reply) {
        return { text: data.reply, model: data.model };
      }
    }
  } catch {
    // If the internal route fails, fall back to direct browser racing
  }

  // Direct client fallback using the 3.8 / 3.7 / 3.6 cascade
  const geminiKey = providedKey || PLATFORM_GEMINI_KEY;
  const systemPrompt = `You are Personal AI Genie, an authentic conversational companion and workspace collaborator. Answer thoroughly and clearly in ${selectedLangLabel}.`;

  const callDirectModel = async (modelName: string): Promise<{ text: string; model: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const contents = (history || []).slice(-4).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: userPrompt }] });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
          }),
        }
      );
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Model ${modelName} error`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return { text: text.trim(), model: modelName };
      throw new Error("Empty text");
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  return await Promise.any(
    ACTIVE_GEMINI_CASCADES.map((model) => callDirectModel(model))
  );
}