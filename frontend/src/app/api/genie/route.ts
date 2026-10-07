import { NextResponse } from "next/server";

const PLATFORM_GEMINI_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  "AIzaSyAVp5g79X20L_rKg4WQLCOoV3LIGg-i91w";

const PLATFORM_OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ||
  process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
  "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";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, history, languageLabel, customApiKey } = body;

    const geminiKey = customApiKey || PLATFORM_GEMINI_KEY;
    const systemPrompt = `You are Personal AI Genie, an authentic, highly intelligent conversational companion and workspace collaborator. Answer thoroughly, clearly, and directly in ${languageLabel || "English"}. Keep explanations natural, prominent, and helpful.`;

    // 1. Google Gemini Direct REST Caller
    const callGemini = async (model: string): Promise<{ text: string; model: string }> => {
      const contents = (history || []).slice(-4).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: prompt }] });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
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
      if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return { text: text.trim(), model };
      throw new Error(`Empty response from ${model}`);
    };

    // 2. OpenRouter Direct Caller
    const callOpenRouter = async (model: string): Promise<{ text: string; model: string }> => {
      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []).slice(-4).map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: prompt },
      ];

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PLATFORM_OPENROUTER_KEY}`,
          "HTTP-Referer": "https://personal-ai-canvas.vercel.app",
          "X-Title": "Personal AI Genie",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
      if (!res.ok) throw new Error(`OpenRouter ${model} HTTP ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && text.trim()) {
        const shortName = model.includes("/") ? model.split("/")[1] : model;
        return { text: text.trim(), model: `OpenRouter (${shortName})` };
      }
      throw new Error(`Empty response from ${model}`);
    };

    // Race Gemini 2.0, Gemini 1.5, and OpenRouter in parallel
    const result = await Promise.any([
      callGemini("gemini-2.0-flash"),
      callGemini("gemini-1.5-flash"),
      callOpenRouter("google/gemini-2.0-flash-001"),
      callOpenRouter("meta-llama/llama-3.3-70b-instruct"),
    ]);

    return NextResponse.json({ success: true, reply: result.text, model: result.model });
  } catch (err: any) {
    console.error("Genie API Route Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}