"use client";

import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Share2, 
  Check, 
  WifiOff, 
  X, 
  ShieldCheck,
  UploadCloud,
  KeyRound
} from "lucide-react";

interface UnifiedEngineProps {
  onInjectPrompt: (prompt: string) => void;
  userEmail?: string;
}

// Minimal RFC 6238 TOTP Validator (Browser Web Crypto API)
async function verifyTotpCode(inputCode: string, secretBase32: string): Promise<boolean> {
  try {
    const cleanCode = inputCode.replace(/\s|-/g, "").trim();
    if (cleanCode.length !== 6) return false;

    // Base32 decoding
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    const cleanSecret = secretBase32.replace(/[\s=]/g, "").toUpperCase();
    for (let i = 0; i < cleanSecret.length; i++) {
      const val = base32chars.indexOf(cleanSecret.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, "0");
    }
    const keyBytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < keyBytes.length; i++) {
      keyBytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );

    // Check current step (30s) plus skew window (-30s to +30s)
    const epochSeconds = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(epochSeconds / 30);

    for (const step of [currentStep, currentStep - 1, currentStep + 1]) {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(4, step, false);

      const hmac = await window.crypto.subtle.sign("HMAC", cryptoKey, buffer);
      const hmacBytes = new Uint8Array(hmac);
      const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
      const binary =
        ((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff);

      const computedOtp = (binary % 1000000).toString().padStart(6, "0");
      if (computedOtp === cleanCode) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("TOTP verification error", err);
    return false;
  }
}

export default function UnifiedStudyEngine({
  onInjectPrompt,
  userEmail = "",
}: UnifiedEngineProps) {
  // Master Google Authenticator Base32 Secret
  const MASTER_TOTP_SECRET = "JBSWY3DPEHPK3PXP"; 

  const [isVip, setIsVip] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [totpInput, setTotpInput] = useState("");
  const [vipMessage, setVipMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const storedVip = localStorage.getItem("genie_vip_unlocked") === "true";
    const isAcademic =
      userEmail.endsWith(".edu") ||
      userEmail.endsWith(".ac.in") ||
      userEmail.endsWith(".res.in");

    if (storedVip || isAcademic) {
      setIsVip(true);
      localStorage.setItem("genie_vip_unlocked", "true");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userEmail]);

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVipMessage("");

    const isValid = await verifyTotpCode(totpInput, MASTER_TOTP_SECRET);

    if (isValid) {
      setIsVip(true);
      localStorage.setItem("genie_vip_unlocked", "true");
      setVipMessage("Google Authenticator verified! VIP Pass activated.");
      setTimeout(() => {
        setVipModalOpen(false);
        setVipMessage("");
      }, 1500);
    } else {
      setVipMessage("Invalid Authenticator code. Check your Google Authenticator app.");
    }
    setIsVerifying(false);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}?session=${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingDoc(true);
    try {
      const text = await file.text();
      const snippet = text.slice(0, 3000);
      const flashcardPrompt = `Please review this academic document ("${file.name}"):\n\n"""\n${snippet}\n"""\n\n1. Provide a 3-bullet revision summary.\n2. Extract 3 key flashcards (Question & Answer format).\n3. Formulate one sample exam problem with step-by-step solution.`;
      onInjectPrompt(flashcardPrompt);
    } catch {
      alert("Could not read text file. Please upload a .txt or .md lecture handout.");
    } finally {
      setIsProcessingDoc(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 mb-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVipModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold shadow-xs transition-all border ${
            isVip
              ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-300 hover:border-amber-400"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
          }`}
        >
          <Crown className={`w-3.5 h-3.5 ${isVip ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
          <span>{isVip ? "VIP Unlimited Active" : "Get VIP Pass"}</span>
        </button>

        {!isOnline && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-[10px]">
            <WifiOff className="w-3 h-3" />
            <span>Offline (Read Cache)</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 rounded-full font-semibold cursor-pointer shadow-xs transition-all">
          <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
          <span>{isProcessingDoc ? "Analyzing..." : "Notes to Flashcards"}</span>
          <input
            type="file"
            accept=".txt,.md,.json,.csv"
            className="hidden"
            onChange={handleDocumentUpload}
            disabled={isProcessingDoc}
          />
        </label>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 rounded-full font-semibold shadow-xs transition-all"
          title="Share Session Link"
        >
          {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-indigo-600" />}
          <span>{shareCopied ? "Link Copied!" : "Share Room"}</span>
        </button>
      </div>

      {vipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-base">Google Authenticator VIP</h3>
              </div>
              <button
                type="button"
                onClick={() => setVipModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter the live 6-digit rolling code from your Google Authenticator app to activate VIP Unlimited.
            </p>

            <form onSubmit={handleVerifyTotp} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  6-Digit Rolling Code
                </label>
                <input
                  type="text"
                  maxLength={7}
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value)}
                  placeholder="000 000"
                  className="w-full text-center tracking-widest text-base font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              {vipMessage && (
                <p className={`text-[11px] font-semibold text-center ${isVip ? "text-emerald-600" : "text-rose-600"}`}>
                  {vipMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isVerifying || totpInput.trim().length < 6}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifying ? "Verifying Token..." : "Verify & Unlock VIP"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
