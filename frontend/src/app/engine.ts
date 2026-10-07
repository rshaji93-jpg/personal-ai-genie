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

// Built-in failover keys for zero-downtime client execution
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

// Parallel race across Google Gemini Direct and OpenRouter endpoints
export async function callActiveGeminiCascade(
  userPrompt: string,
  history: Message[],
  selectedLangLabel: string,
  providedKey?: string
): Promise<{ text: string; model: string }> {
  const geminiKey =
    providedKey ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    PLATFORM_GEMINI_KEY;

  const openRouterKey =
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
    PLATFORM_OPENROUTER_KEY;

  const systemPrompt = `You are Personal AI Genie, an authentic, highly intelligent conversational companion and workspace collaborator. Answer thoroughly, clearly, and directly in ${selectedLangLabel}. Keep explanations prominent, helpful, and natural.`;

  // 1. Google Gemini Native Fast Caller
  const callGoogleDirect = async (modelName: string): Promise<{ text: string; model: string }> => {
    const abortCtrl = new AbortController();
    const timer = setTimeout(() => abortCtrl.abort(), 6000);
    try {
      const contents = history.slice(-4).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: userPrompt }] });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          signal: abortCtrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );
      clearTimeout(timer);
      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return { text: text.trim(), model: modelName };
      throw new Error("Empty Gemini response");
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // 2. OpenRouter Fast Caller
  const callOpenRouterDirect = async (modelName: string): Promise<{ text: string; model: string }> => {
    const abortCtrl = new AbortController();
    const timer = setTimeout(() => abortCtrl.abort(), 6000);
    try {
      const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...history.slice(-4).map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userPrompt },
      ];

      const origin = typeof window !== "undefined" ? window.location.origin : "https://personal-ai-canvas.vercel.app";
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: abortCtrl.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": origin,
          "X-Title": "Personal AI Genie",
        },
        body: JSON.stringify({
          model: modelName,
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && text.trim()) {
        const shortName = modelName.split("/")[1] || modelName;
        return { text: text.trim(), model: `OpenRouter (${shortName})` };
      }
      throw new Error("Empty OpenRouter response");
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // Race 4 endpoints in parallel (whichever arrives first is used)
  const parallelRaces = [
    callGoogleDirect("gemini-2.0-flash"),
    callGoogleDirect("gemini-1.5-flash"),
    callOpenRouterDirect("google/gemini-2.0-flash-001"),
    callOpenRouterDirect("meta-llama/llama-3.3-70b-instruct"),
  ];

  return await Promise.any(parallelRaces);
}