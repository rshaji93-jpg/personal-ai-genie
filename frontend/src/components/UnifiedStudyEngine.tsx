"use client";

import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Share2, 
  FileText, 
  Check, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  X, 
  ShieldCheck,
  UploadCloud 
} from "lucide-react";

interface UnifiedEngineProps {
  onInjectPrompt: (prompt: string) => void;
  userEmail?: string;
}

export default function UnifiedStudyEngine({
  onInjectPrompt,
  userEmail = "",
}: UnifiedEngineProps) {
  // VIP System State
  const [isVip, setIsVip] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [vipMessage, setVipMessage] = useState("");

  // Offline / Network State (Phase 5)
  const [isOnline, setIsOnline] = useState(true);

  // Share Modal State (Phase 3)
  const [shareCopied, setShareCopied] = useState(false);

  // File Intelligence State (Phase 4)
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);

  // Initialize VIP & Online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check VIP via Storage or Academic Domain
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

  // VIP Voucher Claim
  const handleClaimVip = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ["GENIE-VIP-2026", "STUDENT-PRO-VIP", "GENIE-RESEARCH", "VIP-PASS-99"];
    if (validCodes.includes(voucherInput.trim().toUpperCase())) {
      setIsVip(true);
      localStorage.setItem("genie_vip_unlocked", "true");
      setVipMessage("VIP Pass activated successfully! Unlimited quota unlocked.");
      setTimeout(() => {
        setVipModalOpen(false);
        setVipMessage("");
      }, 1500);
    } else {
      setVipMessage("Invalid Voucher Code. Try: STUDENT-PRO-VIP");
    }
  };

  // Phase 3: Share Study Session Link
  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}?session=${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Phase 4: Document Parser & Study Flashcard Generator
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
      {/* VIP Status Pill */}
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

        {/* Phase 5 Offline Indicator */}
        {!isOnline && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-[10px]">
            <WifiOff className="w-3 h-3" />
            <span>Offline (Read Cache)</span>
          </span>
        )}
      </div>

      {/* Collaboration and Document Actions */}
      <div className="flex items-center gap-2">
        {/* Phase 4 Document Analyzer */}
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

        {/* Phase 3 Share Room */}
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

      {/* VIP Activation Modal */}
      {vipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="font-bold text-slate-800 text-base">VIP Unlimited License</h3>
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
              VIP unlocks unlimited Pro model tokens, multi-document batch analysis, and prioritized response generation.
            </p>

            <form onSubmit={handleClaimVip} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Voucher / Passcode Key
                </label>
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="e.g. STUDENT-PRO-VIP"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              {vipMessage && (
                <p className={`text-[11px] font-semibold ${isVip ? "text-emerald-600" : "text-rose-600"}`}>
                  {vipMessage}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  Activate License
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherInput("STUDENT-PRO-VIP");
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Use Student Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
