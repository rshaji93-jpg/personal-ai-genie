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

// Built-in failover keys for zero-downtime execution
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

// High-Speed Multi-Provider Race: OpenRouter + Google Gemini Direct
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

  // 1. OpenRouter Direct Runner (Most reliable browser CORS handling)
  const callOpenRouter = async (modelName: string): Promise<{ text: string; model: string }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const messagesPayload = [
        { role: "system", content: systemPrompt },
        ...history.slice(-4).map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userPrompt },
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        const shortName = modelName.includes("/") ? modelName.split("/")[1] : modelName;
        return { text: content.trim(), model: `OpenRouter (${shortName})` };
      }
      throw new Error("Empty OpenRouter text");
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  // 2. Google Gemini REST Direct Runner
  const callGeminiDirect = async (modelName: string): Promise<{ text: string; model: string }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
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
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText && candidateText.trim()) {
        return { text: candidateText.trim(), model: modelName };
      }
      throw new Error("Empty Gemini direct text");
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  // Parallel race: Whichever answers first wins
  const races = [
    callOpenRouter("google/gemini-2.0-flash-001"),
    callOpenRouter("meta-llama/llama-3.3-70b-instruct"),
    callOpenRouter("deepseek/deepseek-chat"),
    callGeminiDirect("gemini-2.0-flash"),
    callGeminiDirect("gemini-1.5-flash"),
  ];

  return await Promise.any(races);
}