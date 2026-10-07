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
  // Normalize Render backend URL (strip any trailing slashes)
  const rawBackendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://personal-ai-genie.onrender.com";
  const backendBase = rawBackendUrl.replace(/\/+$/, "");

  // Convert history format to match FastAPI backend schema
  const conversation_history = (history || []).slice(-6).map((msg) => ({
    role: msg.role,
    content: msg.content,
    senderName: msg.senderName,
    senderEmail: msg.senderEmail,
  }));

  try {
    const res = await fetch(`${backendBase}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userPrompt,
        conversation_history,
        custom_api_key: providedKey || undefined,
        space_mode: "personal",
        language_code: "en-IN",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (data.reply) {
      return {
        text: data.reply,
        model: data.model_used || "genie-backend",
      };
    }
    throw new Error("Empty reply received from backend");
  } catch (backendError) {
    console.error("Backend /api/chat error:", backendError);
    throw backendError;
  }
}