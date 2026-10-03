"use client";

import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://personal-ai-canvas.onrender.com";

// ⚠️ Put your WhatsApp number here (country code + number, no + sign)
const ADMIN_WHATSAPP_NUMBER = "919941692622";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function PersonalAICanvas() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<boolean>(true);
  const [deviceId, setDeviceId] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to open WhatsApp with prefilled message
  const reportIssueViaWhatsApp = (context: string) => {
    const text = encodeURIComponent(
      `Hi! I'm using the AI Canvas and ran into an issue:\n\n[Details]: ${context}\n[Device]: ${deviceId || "unknown"}`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  // Set up persistent device identifier
  useEffect(() => {
    let id = localStorage.getItem("canvas_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("canvas_device_id", id);
    }
    setDeviceId(id);
  }, []);

  // Handle URL token or cached token verification
  useEffect(() => {
    if (!deviceId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("invite");
    const storedToken = localStorage.getItem("canvas_invite_token");
    const activeToken = tokenFromUrl || storedToken;

    if (activeToken) {
      verifyTokenRequest(activeToken);
    }
  }, [deviceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const verifyTokenRequest = async (tokenToTest: string) => {
    setVerifying(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: tokenToTest.trim(),
          token: tokenToTest.trim(),
          passcode: tokenToTest.trim(),
          device_id: deviceId,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid passcode or invite limit reached.");
      }

      setInviteToken(tokenToTest.trim());
      localStorage.setItem("canvas_invite_token", tokenToTest.trim());
      setAccessDenied(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify access.");
      setAccessDenied(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    verifyTokenRequest(passcode.trim());
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newHistory = [...messages, { role: "user" as const, content: userText }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-invite-token": inviteToken || "",
        },
        body: JSON.stringify({
          prompt: userText,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                aiText += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "model", content: aiText };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "⚠️ Error contacting AI: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // If passcode not unlocked yet, render gate modal
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Private Circle Access</h1>
          <p className="text-sm text-slate-400 mb-6">
            A valid private WhatsApp invite link or passcode is required to access this canvas.
          </p>

          <form onSubmit={handleManualPasscodeSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter WhatsApp Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-center tracking-widest font-mono"
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition duration-200"
            >
              {verifying ? "Verifying..." : "Verify Passcode"}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg p-2.5 space-y-2">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => reportIssueViaWhatsApp(`Passcode failed: ${errorMessage}`)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium inline-block"
              >
                Report this issue to Admin on WhatsApp →
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <span>Beta v1.0</span>
            <button
              type="button"
              onClick={() => reportIssueViaWhatsApp("Need help with login/passcode")}
              className="text-slate-400 hover:text-white transition"
            >
              Need help?
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active AI Canvas UI
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">✨</span>
          <span className="font-semibold text-lg text-white">Personal AI Canvas</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => reportIssueViaWhatsApp("Feedback from inside Canvas session")}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
          >
            💬 Report Issue
          </button>
          <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono">
            ✓ Connected
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-medium text-white mb-2">Welcome to AI Canvas</h2>
            <p className="text-sm max-w-sm">Ask questions, brainstorm ideas, or generate text in real-time.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-slate-800 bg-slate-900/40">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition text-sm"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}