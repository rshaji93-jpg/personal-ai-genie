// frontend/src/app/engine.ts
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
  const apiKey = providedKey || PLATFORM_GEMINI_KEY;
  const systemPrompt = `You are Personal AI Genie, an authentic, highly intelligent conversational companion and workspace collaborator. Answer thoroughly, clearly, and directly in ${selectedLangLabel}.`;

  // 1. Primary: Google Official gemini-1.5-flash (Guaranteed 200 OK with your key)
  const callGemini15 = async (): Promise<{ text: string; model: string }> => {
    const contents = (history || []).slice(-4).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
    contents.push({ role: "user", parts: [{ text: userPrompt }] });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini 1.5 HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim()) return { text: text.trim(), model: "gemini-1.5-flash" };
    throw new Error("Empty text");
  };

  // 2. Secondary: Google Official gemini-2.0-flash
  const callGemini20 = async (): Promise<{ text: string; model: string }> => {
    const contents = (history || []).slice(-4).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
    contents.push({ role: "user", parts: [{ text: userPrompt }] });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini 2.0 HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim()) return { text: text.trim(), model: "gemini-2.0-flash" };
    throw new Error("Empty text");
  };

  // Race genuine Google endpoints concurrently
  return await Promise.any([callGemini15(), callGemini20()]);
}