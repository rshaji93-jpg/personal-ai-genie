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

export const PLATFORM_OPENROUTER_KEY =
  process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
  "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";

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

  // 1. Direct Google Gemini call
  const executeGeminiCall = async (model: string): Promise<{ text: string; model: string }> => {
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

  // 2. OpenRouter fallback call
  const executeOpenRouterCall = async (): Promise<{ text: string; model: string }> => {
    const messages = [
      { role: "system", content: systemInstructionText },
      ...(history || []).slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PLATFORM_OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (reply && reply.trim()) {
      return { text: reply.trim(), model: "openrouter/gemini" };
    }
    throw new Error("Empty response from OpenRouter");
  };

  // Execution Cascade: Try Google Gemini direct first; if rate-limited or fails, seamlessly fall back to OpenRouter
  try {
    return await executeGeminiCall("gemini-3.8-flash");
  } catch (errGemini) {
    console.warn("Direct Gemini failed (rate-limit/404), seamlessly falling back to OpenRouter:", errGemini);
    try {
      return await executeOpenRouterCall();
    } catch (errRouter) {
      console.error("All AI endpoints failed:", errRouter);
      throw errRouter;
    }
  }
}