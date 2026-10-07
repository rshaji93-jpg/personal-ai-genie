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

export const PLATFORM_GEMINI_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  "AIzaSyAVp5g79X20L_rKg4WQLCOoV3LIGg-i91w";

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
  const systemInstructionText = `You are Personal AI Genie, a helpful, intelligent collaborator. Respond clearly, thoroughly, and helpfully in ${selectedLangLabel || "English"}.`;

  const contents = (history || []).slice(-6).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  contents.push({ role: "user", parts: [{ text: userPrompt }] });

  const payload = {
    contents,
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const executeGeminiCall = async (model: string): Promise<{ text: string; model: string }> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini ${model} HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && candidateText.trim()) {
      return { text: candidateText.trim(), model };
    }
    throw new Error(`Empty response from ${model}`);
  };

  // Primary: gemini-2.5-flash -> Fallback 1: gemini-2.0-flash -> Fallback 2: gemini-1.5-flash
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      return await executeGeminiCall(model);
    } catch (err) {
      console.warn(`Model ${model} failed, trying next...`, err);
      lastError = err;
    }
  }

  console.error("All Gemini endpoints failed:", lastError);
  throw lastError;
}