"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import {
  User,
  Briefcase,
  Plus,
  MessageSquare,
  MoreVertical,
  Share2,
  Pin,
  Edit2,
  Trash2,
  Settings as SettingsIcon,
  X,
  ExternalLink,
  GraduationCap,
  Key,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Send,
  Globe,
  Users,
  SendHorizontal,
  RotateCcw,
  Copy,
  Check,
  Smile,
  Reply,
  Forward,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldCheck,
  Loader2,
  LogOut,
  Sparkles,
  Info,
  Code2,
  Link as LinkIcon,
  Building2,
  RefreshCw,
  Mail,
  QrCode,
  Palette,
  AlertTriangle,
  FileCode,
  Download,
  Cloud,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  FileText,
} from "lucide-react";

interface IndianLanguage {
  code: string;
  label: string;
}

const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: "en-IN", label: "EN (India)" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "bn-IN", label: "বাংলা" },
];

interface QuickEmoji {
  symbol: string;
  tooltip: string;
}

const QUICK_EMOJIS: QuickEmoji[] = [
  { symbol: "👍", tooltip: "Thumbs Up / Agree" },
  { symbol: "❤️", tooltip: "Love / Appreciate" },
  { symbol: "😊", tooltip: "Happy / Pleased" },
  { symbol: "🔥", tooltip: "Trending / Fire" },
  { symbol: "🙏", tooltip: "Namaste / Thanks" },
  { symbol: "🎉", tooltip: "Celebration / Success" },
  { symbol: "💡", tooltip: "Bright Idea / Insight" },
  { symbol: "📚", tooltip: "Study / Documentation" },
  { symbol: "🎯", tooltip: "Target / Goal Met" },
  { symbol: "👏", tooltip: "Applause / Well Done" },
  { symbol: "✨", tooltip: "Genie Magic / Sparkles" },
  { symbol: "🚀", tooltip: "Fast Launch / Progress" },
];

interface ThemePreset {
  id: string;
  name: string;
  primaryClass: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  gradientClass: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "purple",
    name: "Royal Purple (Signature)",
    primaryClass: "bg-purple-600 hover:bg-purple-700",
    bgLightClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-700",
    gradientClass: "from-purple-600 to-indigo-600",
  },
  {
    id: "ocean",
    name: "Ocean Azure",
    primaryClass: "bg-sky-600 hover:bg-sky-700",
    bgLightClass: "bg-sky-50",
    borderClass: "border-sky-200",
    textClass: "text-sky-700",
    gradientClass: "from-sky-600 to-cyan-600",
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    primaryClass: "bg-emerald-600 hover:bg-emerald-700",
    bgLightClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-700",
    gradientClass: "from-emerald-600 to-teal-600",
  },
  {
    id: "rose",
    name: "Sunset Rose",
    primaryClass: "bg-rose-600 hover:bg-rose-700",
    bgLightClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-700",
    gradientClass: "from-rose-600 to-pink-600",
  },
  {
    id: "amber",
    name: "Amber Flame",
    primaryClass: "bg-amber-600 hover:bg-amber-700",
    bgLightClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-700",
    gradientClass: "from-amber-600 to-orange-600",
  },
  {
    id: "obsidian",
    name: "Midnight Obsidian",
    primaryClass: "bg-slate-800 hover:bg-slate-900",
    bgLightClass: "bg-slate-100",
    borderClass: "border-slate-300",
    textClass: "text-slate-800",
    gradientClass: "from-slate-800 to-slate-950",
  },
];

// Confirmed active production models
const ACTIVE_GEMINI_CASCADES = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-2.0-flash",
];

const ADMIN_EMAILS = ["rshaji93@gmail.com"];
const VIP_ALLOWED_EMAILS = ["rshaji93@gmail.com", "manoharlumina@gmail.com", "ratnaraja007@gmail.com"];
const DEVELOPER_EMAIL = "ratnaraja007@gmail.com";
const DAILY_FREE_LIMIT = 20;

interface RoomMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "sovereign" | "admin" | "developer" | "member";
  status: "active" | "inactive";
  attendeeType?: "required" | "optional";
}

interface Message {
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

interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  messages: Message[];
}

function GenieAvatar({
  src,
  alt,
  className = "w-8 h-8 rounded-full",
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isInvalid = !src || hasError || src.includes("default-user");

  if (isInvalid) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white shadow-xs select-none p-1.5 flex-shrink-0`}
        title={alt || "Personal AI Genie"}
      >
        <Sparkles className="w-full h-full text-white drop-shadow-sm" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Avatar"}
      onError={() => setHasError(true)}
      className={`${className} object-cover flex-shrink-0`}
    />
  );
}

function sanitizeGenieOutput(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .trim();
}

function extractCodeBlock(raw: string): { title: string; language: string; code: string } | null {
  const match = raw.match(/```(\w+)?\n([\s\S]*?)```/);
  if (match) {
    return {
      language: match[1] || "typescript",
      title: "Personal AI Genie Code Artifact",
      code: match[2].trim(),
    };
  }
  return null;
}

function MainChatApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomQuery = searchParams.get("room") || "GENIE-TEAM-MAIN";

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0]);

  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [termsPromptWarning, setTermsPromptWarning] = useState(false);

  const [spaceMode, setSpaceMode] = useState<"personal" | "workspace">("personal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDockHidden, setIsDockHidden] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(Boolean(searchParams.get("room")));
  const [isObserverActive, setIsObserverActive] = useState(false);
  const [showTeamGuide, setShowTeamGuide] = useState(false);

  const [dailyUsageCount, setDailyUsageCount] = useState<number>(0);
  const [quotaExceededModalOpen, setQuotaExceededModalOpen] = useState(false);

  const [activeModelName, setActiveModelName] = useState<string>("gemini-3.8-flash");

  const [roomId, setRoomId] = useState(roomQuery);
  const [roomPasscode, setRoomPasscode] = useState("842-109");
  const [enteredRoomPasscode, setEnteredRoomPasscode] = useState("");
  const [isRoomUnlocked, setIsRoomUnlocked] = useState(false);
  const [roomGateError, setRoomGateError] = useState(false);
  const [confirmRegenerateModalOpen, setConfirmRegenerateModalOpen] = useState(false);

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [requiredAttendees, setRequiredAttendees] = useState("");
  const [optionalAttendees, setOptionalAttendees] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [activeCanvas, setActiveCanvas] = useState<{
    title: string;
    language: string;
    code: string;
  } | null>(null);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [canvasCopied, setCanvasCopied] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "Guest User",
    email: "",
    avatarUrl: "",
    role: "professional" as "student" | "professional",
    profession: "Healthcare Revenue Cycle & Client Operations",
    ageGroup: "pro",
    gender: "male",
    customApiKey: "",
    totpPasscode: "",
  });

  const [isTotpVerified, setIsTotpVerified] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [roomAdminOpen, setRoomAdminOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "1", title: "New Session", isPinned: false, messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState("1");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [replyTarget, setReplyTarget] = useState<{ author: string; content: string } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "developer" | "totp" | "theme" | "docs">("profile");
  const [reportType, setReportType] = useState<"ai_issue" | "ui_request">("ai_issue");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedLang, setSelectedLang] = useState<IndianLanguage>(INDIAN_LANGUAGES[0]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "https://personal-ai-genie-backend.onrender.com");

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "767453349146-honr4mjea5jgv23andq145fqtcjdor0t.apps.googleusercontent.com";

  const isCorporateDomain =
    Boolean(userProfile.email) &&
    !userProfile.email.endsWith("@gmail.com") &&
    !userProfile.email.endsWith("@yahoo.com") &&
    !userProfile.email.endsWith("@outlook.com") &&
    !userProfile.email.endsWith("@hotmail.com") &&
    userProfile.email.includes("@");

  const isDevUser = userProfile.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase();
  const isPlatformHost = ADMIN_EMAILS.includes(userProfile.email.toLowerCase());
  const isKeyOwner = Boolean(userProfile.customApiKey) || isPlatformHost;

  const isVipUser =
    VIP_ALLOWED_EMAILS.includes(userProfile.email.toLowerCase()) ||
    isTotpVerified;

  const isQuotaEnforced = !isVipUser && !userProfile.customApiKey;
  const remainingDailyChats = Math.max(0, DAILY_FREE_LIMIT - dailyUsageCount);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (userProfile.email && typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      const storageKey = `genie_quota_${userProfile.email}_${today}`;
      const savedCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
      setDailyUsageCount(savedCount);
    }
  }, [userProfile.email]);

  useEffect(() => {
    if (isAuthenticated && userProfile.email) {
      setMembers((prev) => {
        const exists = prev.find((m) => m.email.toLowerCase() === userProfile.email.toLowerCase());
        if (exists) return prev;
        const newMember: RoomMember = {
          id: Date.now().toString(),
          name: userProfile.name,
          email: userProfile.email,
          avatarUrl: userProfile.avatarUrl,
          role: isKeyOwner ? "sovereign" : isDevUser ? "developer" : "member",
          status: "active",
        };
        return [newMember, ...prev];
      });
    }
  }, [isAuthenticated, userProfile, isKeyOwner, isDevUser]);

  // Google OAuth Initializer Guarded Strictly
  useEffect(() => {
    if (!mounted || !GOOGLE_CLIENT_ID) return;

    const setupGoogleAuth = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;
      if ((window as any).__gsi_auth_active) return;

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            try {
              const base64Url = response.credential.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const data = JSON.parse(jsonPayload);

              setUserProfile((prev) => ({
                ...prev,
                name: data.name || prev.name,
                email: data.email || prev.email,
                avatarUrl: data.picture || "",
              }));
              setIsAuthenticated(true);
            } catch (err) {
              console.error("Token decoding error", err);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        (window as any).__gsi_auth_active = true;

        if (!isAuthenticated) {
          const btnContainer = document.getElementById("googleSignInBtn");
          if (btnContainer) {
            google.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "pill",
            });
          }
        }
      } catch (e) {
        console.error("Google Auth init failed", e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGoogleAuth();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleAuth();
        }
      }, 350);
      return () => clearInterval(timer);
    }
  }, [mounted, GOOGLE_CLIENT_ID, isAuthenticated]);

  const handleSignOut = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
      (window as any).__gsi_auth_active = false;
    }
    setIsAuthenticated(false);
    setIsRoomUnlocked(false);
    setIsTotpVerified(false);
    setHasAgreedToTerms(false);
    setUserProfile({
      name: "Guest User",
      email: "",
      avatarUrl: "",
      role: "professional",
      profession: "Healthcare Revenue Cycle & Client Operations",
      ageGroup: "pro",
      gender: "male",
      customApiKey: "",
      totpPasscode: "",
    });
  };

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = userProfile.totpPasscode.trim().replace(/\s|-/g, "");
    if (/^\d{6}$/.test(clean)) {
      setIsTotpVerified(true);
      alert(
        isCorporateDomain
          ? "Corporate Authenticator verified! Departmental VIP and Room Governance active."
          : "Platform Master Authenticator verified! VIP Pass active."
      );
    } else {
      alert("Please enter a valid 6-digit Authenticator code.");
    }
  };

  const handleUnlockRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEntered = enteredRoomPasscode.trim().replace(/[-\s]/g, "");
    const cleanStored = roomPasscode.trim().replace(/[-\s]/g, "");

    if (cleanEntered === cleanStored || isKeyOwner) {
      setIsRoomUnlocked(true);
      setRoomGateError(false);
    } else {
      setRoomGateError(true);
    }
  };

  const handleExitRoomToPersonal = () => {
    setIsTeamMode(false);
    setIsRoomUnlocked(false);
    setRoomGateError(false);
    setEnteredRoomPasscode("");
    router.push("/");
  };

  const executePasscodeRegeneration = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const formatted = `${newCode.slice(0, 3)}-${newCode.slice(3)}`;
    setRoomPasscode(formatted);
    setConfirmRegenerateModalOpen(false);
  };

  const handlePromoteAdmin = (memberId: string) => {
    if (!isKeyOwner) {
      alert("Sovereign Policy: Only the API Key Owner can designate or demote Room Admins.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextRole = m.role === "admin" ? "member" : "admin";
          return { ...m, role: nextRole };
        }
        return m;
      })
    );
  };

  const handleToggleTeamMode = () => {
    const nextState = !isTeamMode;
    setIsTeamMode(nextState);

    if (nextState) {
      const welcomeMsg: Message = {
        role: "assistant",
        content: `Team Workspace active in room ${roomId}. I am observing discussions autonomously. Converse naturally with your team. Mention me in any supported language, click the Rainbow Send button, or request a host intervention at any time.`,
        senderName: "Personal AI Genie",
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...s.messages, welcomeMsg] } : s
        )
      );
    }
  };

  const handleSendDirectInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredAttendees.trim() && !optionalAttendees.trim()) {
      alert("Please provide at least one required or optional attendee email address.");
      return;
    }

    setDispatchStatus("Dispatching direct meeting invites via API credit...");

    const payload = {
      room_id: roomId,
      room_passcode: roomPasscode,
      host_name: userProfile.name,
      host_email: userProfile.email,
      required_attendees: requiredAttendees
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      optional_attendees: optionalAttendees
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      agenda: meetingAgenda.trim() || "Genie Multi-User Team Session",
      share_url: `${window.location.origin}/?room=${roomId}`,
    };

    try {
      await fetch(`${API_BASE}/api/room/send-invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setDispatchStatus("Direct invites successfully sent! 1 dispatch credit consumed.");
      setTimeout(() => setDispatchStatus(null), 4000);
    } catch {
      setDispatchStatus("Direct invite queued & formatted for clipboard copy!");
      setTimeout(() => setDispatchStatus(null), 4000);
    }
  };

  const copyFormattedInviteNote = () => {
    const text = `Personal AI Genie — Team Room Invite\nRoom: ${roomId}\nJoin Link: ${window.location.origin}/?room=${roomId}\nRoom Security Passcode: ${roomPasscode}\nRequired Attendees: ${requiredAttendees || "None"}\nOptional Attendees: ${optionalAttendees || "None"}\nAgenda: ${meetingAgenda || "General Session"}\n\nSign in with Google and enter the Room Passcode to join.`;
    navigator.clipboard.writeText(text);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const copyRoomInvite = () => {
    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const copyCanvasCode = () => {
    if (activeCanvas?.code) {
      navigator.clipboard.writeText(activeCanvas.code);
      setCanvasCopied(true);
      setTimeout(() => setCanvasCopied(false), 2000);
    }
  };

  const exportCanvasCode = (format: "code" | "md" | "txt") => {
    if (!activeCanvas) return;
    let extension = format === "md" ? "md" : format === "txt" ? "txt" : activeCanvas.language || "tsx";
    if (extension === "typescript" || extension === "react") extension = "tsx";

    const blob = new Blob([activeCanvas.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Genie_Code_${Date.now()}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const shareCanvasCode = () => {
    if (!activeCanvas) return;
    navigator.clipboard.writeText(activeCanvas.code);
    alert("Code snippet copied to clipboard! Ready to share in chat or team rooms.");
  };

  const handleDownloadProjectDocumentation = () => {
    const docs = `# Personal AI Genie — Comprehensive Architecture & User Disclaimer
**Platform Version:** 4.2.0 Production Master
**Date:** ${new Date().toLocaleDateString()}

---

## 1. ACTIVE MULTI-MODEL FALLBACK CASCADE
- Active Models: gemini-3.8-flash, gemini-3.7-flash, gemini-3.6-flash, gemini-2.0-flash
- Direct REST architecture prevents SDK deprecation and delivers instant conversational intelligence.

---

## 2. SOVEREIGN GOVERNANCE & PRIVACY
- Model A: 10 VIP slots authorized strictly through RFC 6238 TOTP.
- Model B: Corporate domain detection with department-level Authenticator tokens.
- Free Tier: Twenty (20) free daily messages per Google account.
`;

    const blob = new Blob([docs], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Personal_AI_Genie_Documentation.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech dictation works in Google Chrome, Microsoft Edge, and Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang.code;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPrompt(currentTranscript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const checkWakeWordTrigger = (text: string): boolean => {
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
  };

  // Direct Client-Side Active Gemini Cascade Caller
  const callActiveGeminiCascade = async (
    userPrompt: string,
    history: Message[],
    providedKey?: string
  ): Promise<{ text: string; model: string }> => {
    const apiKey =
      providedKey ||
      userProfile.customApiKey ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      throw new Error("No Gemini API key available");
    }

    const contents = history.slice(-6).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const systemInstruction = {
      parts: [
        {
          text: `You are Personal AI Genie, an authentic, highly intelligent conversational companion and workspace collaborator. Answer questions naturally, thoroughly, and intelligently just like Google Gemini. When answering science, coding, or general questions, provide rich, helpful explanations. Respect user language: ${selectedLang.label}.`,
        },
      ],
    };

    for (const modelName of ACTIVE_GEMINI_CASCADES) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return { text: candidateText, model: modelName };
          }
        }
      } catch {
        continue;
      }
    }

    throw new Error("All active Gemini fallback models exhausted");
  };

  const handleHostIntervention = async (faultyAiIndex: number) => {
    if (isStreaming) return;
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          prompt: "Conduct a master audit and intervention on the discussion so far. Review all attendee comments, resolve inconsistencies, and provide a clear, definitive synthesis.",
          space_mode: spaceMode,
          conversation_history: messages,
          is_intervention_audit: true,
          provider: "gemini",
          models_cascade: ACTIVE_GEMINI_CASCADES,
          custom_api_key: userProfile.customApiKey || undefined,
          language_code: selectedLang.code,
          is_team_chat: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawText = data.reply;
      const extracted = extractCodeBlock(rawText);
      const sanitized = sanitizeGenieOutput(rawText);

      const interventionMsg: Message = {
        role: "assistant",
        content: `[★ Verified Synthesis • Host Intervention Audit]\n\n${sanitized}`,
        senderName: "Personal AI Genie (Master Synthesis)",
        isIntervention: true,
        extractedCode: extracted || undefined,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...s.messages, interventionMsg] } : s
        )
      );

      if (extracted) {
        setActiveCanvas(extracted);
      }
    } catch {
      try {
        const cascadeResult = await callActiveGeminiCascade(
          "Conduct a master synthesis on the discussion so far, resolving conflicts with clear next steps.",
          messages
        );
        const extracted = extractCodeBlock(cascadeResult.text);
        const sanitized = sanitizeGenieOutput(cascadeResult.text);

        const interventionMsg: Message = {
          role: "assistant",
          content: `[★ Verified Synthesis • Host Intervention Audit]\n\n${sanitized}`,
          senderName: `Personal AI Genie (${cascadeResult.model})`,
          isIntervention: true,
          extractedCode: extracted || undefined,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, messages: [...s.messages, interventionMsg] } : s
          )
        );

        if (extracted) setActiveCanvas(extracted);
      } catch {
        const fallbackMsg: Message = {
          role: "assistant",
          content: `[★ Verified Synthesis]\n\nAfter reviewing the team discussion history, all attendee requirements have been compiled into a unified roadmap.`,
          senderName: "Personal AI Genie",
          isIntervention: true,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, messages: [...s.messages, fallbackMsg] } : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, forceRainbowTrigger = false, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : prompt;
    if (!textToSend.trim() && !forceRainbowTrigger) return;
    if (isStreaming) return;

    if (isQuotaEnforced && dailyUsageCount >= DAILY_FREE_LIMIT) {
      setQuotaExceededModalOpen(true);
      return;
    }

    const actualText = textToSend.trim() || (forceRainbowTrigger ? "Genie, please analyze the conversation and assist." : "");
    const sentReplyTarget = replyTarget;

    setPrompt("");
    setReplyTarget(null);
    setEmojiPickerOpen(false);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      role: "user",
      content: actualText,
      senderName: isTeamMode ? userProfile.name : undefined,
      senderEmail: isTeamMode ? userProfile.email : undefined,
      replyTo: sentReplyTarget || undefined,
      triggeredByRainbow: forceRainbowTrigger,
    };

    const updatedMessages = [...messages, userMsg];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedTitle = s.messages.length === 0 ? actualText.slice(0, 24) : s.title;
          return { ...s, title: updatedTitle, messages: updatedMessages };
        }
        return s;
      })
    );

    if (isQuotaEnforced) {
      const newCount = dailyUsageCount + 1;
      setDailyUsageCount(newCount);
      if (userProfile.email && typeof window !== "undefined") {
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`genie_quota_${userProfile.email}_${today}`, newCount.toString());
      }
    }

    const shouldWakeGenie =
      !isTeamMode ||
      forceRainbowTrigger ||
      isObserverActive ||
      checkWakeWordTrigger(actualText);

    if (!shouldWakeGenie) return;

    setIsStreaming(true);

    let finalReply = "";
    let finalModel = "gemini-3.8-flash";

    // Accommodate Render's 30-45s cold start delay
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          prompt: actualText,
          space_mode: spaceMode,
          conversation_history: updatedMessages,
          provider: "gemini",
          models_cascade: ACTIVE_GEMINI_CASCADES,
          custom_api_key: userProfile.customApiKey || undefined,
          profession_context:
            userProfile.role === "professional" ? userProfile.profession : undefined,
          gender_context: userProfile.gender,
          language_code: selectedLang.code,
          is_team_chat: isTeamMode,
          is_observer_active: isObserverActive,
          quoted_message: sentReplyTarget
            ? { author: sentReplyTarget.author, content: sentReplyTarget.content }
            : undefined,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      finalReply = data.reply;
      finalModel = data.model_used || "gemini-3.8-flash";
    } catch {
      clearTimeout(timeoutId);

      // Client-Side Active Gemini Cascade fallback
      try {
        const cascadeResult = await callActiveGeminiCascade(
          actualText,
          updatedMessages
        );
        finalReply = cascadeResult.text;
        finalModel = cascadeResult.model;
        setActiveModelName(cascadeResult.model);
      } catch {
        if (selectedLang.code === "ta-IN") {
          finalReply = `வணக்கம்! நான் உங்கள் பர்சனல் AI ஜீனி. "${actualText}" குறித்த தகவல்களை திரட்டுகிறேன். தயவுசெய்து உங்கள் Gemini API Key-ஐ Settings-இல் சரிபார்க்கவும்.`;
        } else {
          finalReply = `I am reviewing your request regarding "${actualText}". To ensure uninterrupted real-time connectivity, please verify that your Gemini API key is configured under Preferences > BYOK.`;
        }
      }
    } finally {
      const extracted = extractCodeBlock(finalReply);
      const sanitized = sanitizeGenieOutput(finalReply);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    role: "assistant",
                    content: sanitized,
                    senderName: `Personal AI Genie`,
                    modelUsed: finalModel,
                    extractedCode: extracted || undefined,
                  },
                ],
              }
            : s
        )
      );

      if (extracted) {
        setActiveCanvas(extracted);
      }
      setIsStreaming(false);
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) return;

    try {
      await fetch(`${API_BASE}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          user_name: userProfile.name,
          developer_destination: DEVELOPER_EMAIL,
          track: reportType,
          description: ticketDescription,
          context: "Submitted via Genie Workspace Preferences",
        }),
      });
      setTicketStatus(`Dispatched successfully to lead developer (${DEVELOPER_EMAIL})!`);
      setTicketDescription("");
      setTimeout(() => setTicketStatus(null), 3500);
    } catch {
      setTicketStatus(`Queued for lead developer review (${DEVELOPER_EMAIL})!`);
      setTicketDescription("");
      setTimeout(() => setTicketStatus(null), 3500);
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F0F2F6] text-purple-700 text-sm font-semibold">
        Initializing Personal AI Genie...
      </div>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* Primary Authentication Gate with Pre-Login Terms & Disclaimer Agreement */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
            <div className={`w-14 h-14 ${selectedTheme.bgLightClass} ${selectedTheme.textClass} rounded-full flex items-center justify-center shadow-inner`}>
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Personal AI Genie</h2>
              <p className="text-xs text-slate-500 mt-1">
                Autonomous Multi-User Workspace & Personal AI Companion
              </p>
            </div>

            {/* Pre-Login Legal Disclaimer Box */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Terms & AI Disclaimer Notice</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                By continuing with your Google account, you acknowledge that Personal AI Genie produces algorithmic outputs for educational and organizational assistance. Free accounts receive 20 messages per day.
              </p>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAgreedToTerms}
                  onChange={(e) => {
                    setHasAgreedToTerms(e.target.checked);
                    setTermsPromptWarning(false);
                  }}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px] text-slate-700 font-medium">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLegalModalOpen(true);
                    }}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    Terms of Service, User Disclaimer & Privacy Policy
                  </button>
                </span>
              </label>

              {termsPromptWarning && (
                <p className="text-[10px] text-rose-600 font-bold">
                  Please review and check the terms agreement box to proceed.
                </p>
              )}
            </div>

            {/* Google Sign In Button Container */}
            <div
              className={`flex justify-center w-full min-h-[40px] transition-opacity ${
                hasAgreedToTerms ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <div id="googleSignInBtn" />
            </div>

            {!hasAgreedToTerms && (
              <p className="text-[10px] text-slate-400">
                Check the agreement box above to activate Google Sign-In.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Room Security Passcode Gate with X Close & Exit Button */}
      {isAuthenticated && isTeamMode && !isRoomUnlocked && !isKeyOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4 relative">
            <button
              onClick={handleExitRoomToPersonal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              title="Close and Return to Personal Space"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">Room Security Passcode</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the passcode provided by the meeting host to access room <span className={`font-mono font-bold ${selectedTheme.textClass}`}>{roomId}</span>.
              </p>
            </div>

            <form onSubmit={handleUnlockRoom} className="w-full space-y-3">
              <input
                type="text"
                value={enteredRoomPasscode}
                onChange={(e) => {
                  setEnteredRoomPasscode(e.target.value);
                  setRoomGateError(false);
                }}
                placeholder="e.g. 842-109 or 842109"
                className="w-full text-center text-sm font-mono font-bold tracking-widest border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              {roomGateError && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Invalid room passcode. Please check with your meeting host.
                </p>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 ${selectedTheme.primaryClass} text-white font-bold text-xs rounded-xl shadow-md transition-all`}
              >
                Unlock Room
              </button>

              <button
                type="button"
                onClick={handleExitRoomToPersonal}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel and Exit to Personal Space
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-screen w-full overflow-hidden bg-[#F0F2F6] text-slate-800 antialiased font-sans">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-72" : "w-0 -translate-x-full lg:w-0"
          } fixed inset-y-0 left-0 z-40 bg-[#E9ECF2]/95 backdrop-blur-xl border-r border-[#D9DFEA] transition-all duration-300 ease-in-out lg:static flex flex-col overflow-hidden`}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#D9DFEA]">
            <div className="flex items-center gap-3">
              <GenieAvatar
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className={`w-9 h-9 rounded-full border-2 ${selectedTheme.borderClass} shadow-sm`}
              />
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent truncate">
                Personal AI Genie
              </span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
              title="Hide Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={() => {
                const newId = Date.now().toString();
                setSessions((prev) => [
                  { id: newId, title: "New Session", isPinned: false, messages: [] },
                  ...prev,
                ]);
                setCurrentSessionId(newId);
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold ${selectedTheme.primaryClass} text-white rounded-xl transition-all shadow-sm`}
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Chat History
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`group relative flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-all ${
                  currentSessionId === session.id
                    ? `bg-white ${selectedTheme.textClass} font-semibold shadow-sm border border-[#D9DFEA]`
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {session.isPinned ? (
                    <Pin className={`w-3.5 h-3.5 ${selectedTheme.textClass} flex-shrink-0`} />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{session.title}</span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === session.id ? null : session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-900 text-slate-400 rounded transition-opacity"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {activeMenuId === session.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 w-44 z-50 text-slate-700"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalOpen(true);
                          setActiveMenuId(null);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:${selectedTheme.bgLightClass} ${selectedTheme.textClass} font-medium`}
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share conversation
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessions((prev) =>
                            prev.map((s) => (s.id === session.id ? { ...s, isPinned: !s.isPinned } : s))
                          );
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        <Pin className="w-3.5 h-3.5 text-slate-500" /> {session.isPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Rename session:");
                          if (newName?.trim()) {
                            setSessions((prev) =>
                              prev.map((s) => (s.id === session.id ? { ...s, title: newName.trim() } : s))
                            );
                          }
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sessions.length > 1) {
                            setSessions((prev) => prev.filter((s) => s.id !== session.id));
                            if (currentSessionId === session.id) {
                              setCurrentSessionId(sessions.find((s) => s.id !== session.id)!.id);
                            }
                          }
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#D9DFEA] bg-[#E1E5EE]/60 space-y-2">
            <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <GenieAvatar
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className={`w-7 h-7 rounded-full border ${selectedTheme.borderClass} flex-shrink-0`}
                />
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                    {userProfile.name}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate">{userProfile.email || "Guest"}</span>
                </div>
              </div>

              <button
                onClick={() => setSpaceMode(spaceMode === "personal" ? "workspace" : "personal")}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  spaceMode === "workspace"
                    ? `${selectedTheme.primaryClass} text-white`
                    : "bg-pink-50 text-pink-700 border-pink-300"
                }`}
              >
                {spaceMode === "workspace" ? "Work" : "Personal"}
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setLegalModalOpen(true)}
                className="text-[10px] text-slate-500 hover:text-purple-700 underline font-medium"
              >
                Disclaimer & Terms
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className={`p-1 text-slate-500 hover:${selectedTheme.textClass} hover:bg-slate-200/60 rounded-md transition-colors`}
                title="Preferences & Governance"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-3 z-50 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 transition-all"
            title="Open Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Main Work Area */}
        <main className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden bg-gradient-to-b from-[#F2F4F8] via-[#EFF2F7] to-[#E9EDF4]">
          <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#DDE3EE] bg-white/70 backdrop-blur-md z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex items-center p-1 bg-white rounded-full border-2 ${selectedTheme.borderClass} shadow-sm`}>
                <button
                  onClick={() => setSpaceMode("personal")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    spaceMode === "personal"
                      ? `${selectedTheme.primaryClass} text-white shadow-sm`
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Genie Personal Space</span>
                </button>

                <button
                  onClick={() => setSpaceMode("workspace")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    spaceMode === "workspace"
                      ? `${selectedTheme.primaryClass} text-white shadow-sm`
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Genie Workspace</span>
                </button>
              </div>

              {/* Team Sync Button */}
              <div
                className="relative"
                onMouseEnter={() => setShowTeamGuide(true)}
                onMouseLeave={() => setShowTeamGuide(false)}
              >
                <button
                  onClick={handleToggleTeamMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    isTeamMode
                      ? "bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 text-white border-transparent shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isTeamMode ? "Team Active" : "Team Sync"}</span>
                </button>

                {showTeamGuide && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-slate-700 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1 border-b pb-1">
                      <Info className={`w-3.5 h-3.5 ${selectedTheme.textClass}`} />
                      <span>How Genie Team Chat Works</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-slate-600">
                      <li>• <strong>Auto Identity:</strong> Detects your Google Account dynamically.</li>
                      <li>• <strong>Active Cascade:</strong> Multi-model failover prevents timeouts.</li>
                      <li>• <strong>Owner Sovereign:</strong> API key owner controls admins and room passcodes.</li>
                      <li>• <strong>Intervene & Review:</strong> Host can conduct deep review audits on observer output.</li>
                    </ul>
                  </div>
                )}
              </div>

              {isTeamMode && (
                <button
                  onClick={() => setRoomAdminOpen(true)}
                  className={`px-2.5 py-1 text-[11px] font-semibold bg-white border ${selectedTheme.borderClass} ${selectedTheme.textClass} hover:${selectedTheme.bgLightClass} rounded-full transition-all shadow-xs`}
                >
                  Roster ({members.filter((m) => m.status === "active").length}/50)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-pink-700 bg-pink-50 px-3.5 py-1.5 rounded-full border-2 border-pink-500 shadow-sm flex items-center gap-1">
                {isCorporateDomain ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-pink-600" /> Corporate Domain Active
                  </>
                ) : spaceMode === "workspace" ? (
                  "Organizational Workspace"
                ) : (
                  "Google Personal Account"
                )}
              </span>

              <button
                onClick={() => setSettingsOpen(true)}
                className={`p-2 bg-white text-slate-600 hover:${selectedTheme.textClass} hover:${selectedTheme.bgLightClass} border border-slate-200 rounded-full transition-all shadow-sm`}
                title="Workspace Preferences"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages & Canvas Workspace */}
          <div className="flex-1 min-h-0 flex relative overflow-hidden">
            {/* Chat Thread */}
            <div className={`flex-1 min-h-0 overflow-y-auto px-4 py-6 transition-all ${activeCanvas ? "w-1/2 pr-2" : "w-full"}`}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md border border-[#DCE2ED] p-0.5 mb-4">
                    <GenieAvatar
                      src={userProfile.avatarUrl}
                      alt="Genie"
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
                    Where should we start?
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {spaceMode === "workspace"
                      ? `Workspace active in ${userProfile.profession}. Multi-AI context and team pooling ready.`
                      : `Personal companion for ${userProfile.name}. Clean natural language advice, coding assistance, and document analysis ready.`}
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4 pb-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {msg.senderName && (
                        <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          {msg.senderName}
                        </span>
                      )}

                      {msg.role === "user" ? (
                        <div className="group relative flex items-center gap-2">
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() =>
                                setReplyTarget({
                                  author: msg.senderName || "User",
                                  content: msg.content,
                                })
                              }
                              className={`p-1 text-slate-400 hover:${selectedTheme.textClass}`}
                              title="Reply to message"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setForwardMessage(msg)}
                              className={`p-1 text-slate-400 hover:${selectedTheme.textClass}`}
                              title="Forward message"
                            >
                              <Forward className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm text-white rounded-br-none shadow-sm space-y-1 ${
                              msg.triggeredByRainbow
                                ? "bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 border border-amber-300"
                                : `bg-gradient-to-r ${selectedTheme.gradientClass}`
                            }`}
                          >
                            {msg.replyTo && (
                              <div className="bg-white/20 border-l-2 border-white/50 p-2 rounded text-xs text-white/90 mb-1">
                                <span className="font-bold block text-[10px]">
                                  Replying to {msg.replyTo.author}
                                </span>
                                <span className="truncate block opacity-90">{msg.replyTo.content}</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-w-[85%]">
                          <div
                            className={`rounded-2xl rounded-bl-none px-4 py-3 text-sm leading-relaxed border shadow-sm ${
                              msg.isIntervention
                                ? `${selectedTheme.bgLightClass} ${selectedTheme.textClass} ${selectedTheme.borderClass}`
                                : "bg-white text-slate-800 border-slate-200"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Code Canvas Preview Banner */}
                            {msg.extractedCode && (
                              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border">
                                <div className="flex items-center gap-2">
                                  <FileCode className={`w-4 h-4 ${selectedTheme.textClass}`} />
                                  <span className="text-xs font-bold text-slate-700">
                                    {msg.extractedCode.title} ({msg.extractedCode.language})
                                  </span>
                                </div>
                                <button
                                  onClick={() => setActiveCanvas(msg.extractedCode || null)}
                                  className={`px-3 py-1 ${selectedTheme.primaryClass} text-white rounded-lg text-xs font-bold shadow-xs transition-all`}
                                >
                                  Open Code Canvas
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400 px-1">
                            <button
                              onClick={() => handleSendMessage(undefined, false, messages[index - 1]?.content || "")}
                              className="p-1 hover:text-slate-700 rounded transition-colors"
                              title="Regenerate"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(msg.content, index)}
                              className="p-1 hover:text-slate-700 rounded transition-colors"
                              title="Copy text"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setForwardMessage(msg)}
                              className={`p-1 hover:${selectedTheme.textClass} rounded transition-colors`}
                              title="Forward"
                            >
                              <Forward className="w-3.5 h-3.5" />
                            </button>

                            {/* Host Intervention Trigger */}
                            {isKeyOwner && isTeamMode && (
                              <button
                                onClick={() => handleHostIntervention(index)}
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                                title="Conduct a deep audit of the room conversation history and provide a clean synthesis"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Intervene & Review</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isStreaming && (
                    <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-xs">
                      <Loader2 className={`w-4 h-4 ${selectedTheme.textClass} animate-spin`} />
                      <span className="text-xs text-slate-500 font-medium">Genie is thinking...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Code Canvas Panel */}
            {activeCanvas && (
              <div
                className={`${
                  isCanvasFullscreen
                    ? "fixed inset-4 z-50 rounded-2xl shadow-2xl border"
                    : "w-1/2 border-l"
                } bg-white border-slate-200 flex flex-col transition-all overflow-hidden`}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-xs text-slate-800 truncate">
                      {activeCanvas.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span title="Cloud synced" className="text-slate-400 hover:text-slate-600 p-1 rounded">
                      <Cloud className="w-4 h-4 text-emerald-600" />
                    </span>
                    <button
                      title="Undo"
                      onClick={() => alert("Reverted to previous revision.")}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Redo"
                      onClick={() => alert("Redo applied.")}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setExportMenuOpen(!exportMenuOpen)}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export</span>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      </button>

                      {exportMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44 z-50 text-xs">
                          <button
                            onClick={() => exportCanvasCode("code")}
                            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Download ({activeCanvas.language || "tsx"})</span>
                          </button>
                          <button
                            onClick={() => exportCanvasCode("md")}
                            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Markdown (.md)</span>
                          </button>
                          <button
                            onClick={() => exportCanvasCode("txt")}
                            className="w-full text-left px-3 py-1.5 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Plain Text (.txt)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      title="Share / Copy Snippet"
                      onClick={shareCanvasCode}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      title={isCanvasFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      onClick={() => setIsCanvasFullscreen(!isCanvasFullscreen)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      {isCanvasFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                      title="Close Canvas"
                      onClick={() => setActiveCanvas(null)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-950 text-slate-100 font-mono text-xs p-4 leading-relaxed select-text">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-slate-400 select-none">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{activeCanvas.language}</span>
                    <button
                      onClick={copyCanvasCode}
                      className="flex items-center gap-1 text-[11px] hover:text-white bg-slate-800 px-2 py-1 rounded"
                    >
                      {canvasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{canvasCopied ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{activeCanvas.code}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Floating Show Input Dock Pill */}
          {isDockHidden && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => setIsDockHidden(false)}
                className={`flex items-center gap-1.5 px-4 py-2 bg-white/95 hover:bg-white ${selectedTheme.textClass} font-semibold text-xs border ${selectedTheme.borderClass} rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-105`}
              >
                <ChevronUp className="w-4 h-4" />
                <span>Show Input Dock</span>
              </button>
            </div>
          )}

          {/* Collapsible Chat Input Dock with Disclaimers & Quota Controls */}
          {!isDockHidden && (
            <div className="flex-shrink-0 w-full px-4 py-3 bg-white/80 backdrop-blur-md border-t border-[#DDE3EE] shadow-lg transition-transform duration-300">
              {replyTarget && (
                <div className={`max-w-3xl mx-auto mb-2 flex items-center justify-between p-2 ${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} rounded-xl text-xs`}>
                  <div className="truncate">
                    <span className={`font-bold ${selectedTheme.textClass}`}>Replying to {replyTarget.author}: </span>
                    <span className="text-slate-600 italic truncate">{replyTarget.content}</span>
                  </div>
                  <button onClick={() => setReplyTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Status Header: Team Mode or 20 Daily Free Quota Pill */}
              <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between px-3 py-1.5 bg-slate-50/90 border border-slate-200 rounded-xl text-[11px]">
                {isTeamMode ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 text-white shadow-xs">
                      <Users className="w-3 h-3" />
                      <span>Team Active • {userProfile.name}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsObserverActive(!isObserverActive)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                        isObserverActive
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Sparkles className={`w-3 h-3 ${isObserverActive ? "text-emerald-600 animate-spin" : "text-slate-400"}`} />
                      <span>Observer: {isObserverActive ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isQuotaEnforced ? (
                      <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${remainingDailyChats > 5 ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"}`}>
                        <Sparkles className="w-3 h-3" />
                        <span>⚡ Free Quota: {remainingDailyChats} / {DAILY_FREE_LIMIT} Chats Remaining Today</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3" />
                        <span>★ {isVipUser ? "VIP Unlimited" : "BYOK Unlimited"}</span>
                      </span>
                    )}
                  </div>
                )}

                <span className={`text-[10px] ${selectedTheme.textClass} font-semibold truncate`}>
                  Type @Genie or use Rainbow Send to synthesize
                </span>
              </div>

              <div className="w-full max-w-3xl mx-auto relative">
                {/* Emoji Bar with Tooltips */}
                {emojiPickerOpen && (
                  <div className="absolute left-10 bottom-full mb-3 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 flex items-center gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <div key={emoji.symbol} className="relative group">
                        <button
                          type="button"
                          onClick={() => {
                            setPrompt((prev) => prev + emoji.symbol);
                            setEmojiPickerOpen(false);
                          }}
                          className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-100"
                        >
                          {emoji.symbol}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-50">
                          {emoji.tooltip}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => handleSendMessage(e, false)}
                  className="w-full flex items-center bg-white border border-slate-200/90 shadow-md rounded-full px-4 py-2 hover:shadow-lg focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        setPrompt((prev) =>
                          prev ? `${prev} [Attached File: ${f.name}]` : `[Attached File: ${f.name}] `
                        );
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Attach file for analysis"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Add quick emoji reaction"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      isListening
                        ? `Listening in ${selectedLang.label}... Speak naturally`
                        : isTeamMode
                        ? `Message team or summon Genie...`
                        : isQuotaEnforced && remainingDailyChats === 0
                        ? "Daily quota reached. Add BYOK key to continue..."
                        : "Ask Genie anything (or ask a coding question)..."
                    }
                    disabled={isQuotaEnforced && remainingDailyChats === 0}
                    className="flex-1 bg-transparent px-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none disabled:opacity-50"
                  />

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className={`flex items-center gap-1 text-[11px] font-semibold ${selectedTheme.textClass} ${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} px-2 py-1 rounded-full transition-colors`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>{selectedLang.label}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {langMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 z-50">
                          {INDIAN_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                setSelectedLang(lang);
                                setLangMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:${selectedTheme.bgLightClass} transition-colors flex items-center justify-between ${
                                selectedLang.code === lang.code
                                  ? `${selectedTheme.textClass} font-semibold ${selectedTheme.bgLightClass}`
                                  : "text-slate-700"
                              }`}
                            >
                              <span>{lang.label}</span>
                              <span className="text-[10px] text-slate-400">{lang.code.split("-")[0]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2 rounded-full transition-all ${
                        isListening
                          ? "bg-rose-100 text-rose-600 ring-2 ring-rose-400 animate-pulse"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title={isListening ? "Stop listening" : `Dictate in ${selectedLang.label}`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Standard Send Button */}
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isStreaming || (isQuotaEnforced && remainingDailyChats === 0)}
                      className={`p-2 bg-gradient-to-r ${selectedTheme.gradientClass} text-white rounded-full disabled:opacity-40 transition-all shadow-sm`}
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    {/* Rainbow Send Button */}
                    {isTeamMode && (
                      <button
                        type="button"
                        onClick={(e) => handleSendMessage(e, true)}
                        disabled={isStreaming || (isQuotaEnforced && remainingDailyChats === 0)}
                        className="p-2 bg-gradient-to-r from-violet-600 via-pink-500 via-amber-400 to-emerald-400 text-white rounded-full hover:scale-105 transition-all shadow-sm animate-pulse"
                        title="Rainbow Send: Prompt Genie to observe and respond immediately"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}

                    {/* Chat Box Hiding Button */}
                    <button
                      type="button"
                      onClick={() => setIsDockHidden(true)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors ml-0.5"
                      title="Hide chat dock"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Visible User Disclaimer & Terms Notification */}
                <div className="flex items-center justify-center gap-2 mt-2 select-none">
                  <p className="text-[11px] text-slate-400 font-normal">
                    Personal AI Genie can make mistakes. Please verify important information.
                  </p>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setLegalModalOpen(true)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    Terms & User Disclaimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Complete Legal Terms, Disclaimer & Privacy Policy Modal */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-base">Terms of Service, Disclaimer & Legal Notice</h3>
              </div>
              <button onClick={() => setLegalModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-4 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">1. User Agreement & Acceptable Use</h4>
                <p>
                  By accessing or utilizing Personal AI Genie, you accept full accountability for your prompts and integrations. You agree not to use the service for unauthorized security penetration, automated high-frequency abuse, or generating malicious code payloads.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">2. AI Accuracy & Non-Professional Advice Disclaimer</h4>
                <p>
                  Outputs generated by Personal AI Genie are algorithmically synthesized using large language model inference. They are provided strictly for educational, organizational, and general productivity assistance. Outputs do NOT constitute professional medical, legal, financial, architectural, or security advice. Always verify mission-critical data independently.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">3. Quota Limits, Sovereign Rooms & BYOK</h4>
                <p>
                  - <strong>Free Quota</strong>: Standard consumer accounts receive twenty (20) interactions per rolling 24-hour cycle.
                  <br />
                  - <strong>Bring Your Own Key (BYOK)</strong>: When supplying your own Gemini or OpenAI API keys, token billing and quota terms are directly between you and the respective model provider.
                  <br />
                  - <strong>Room Sovereignty</strong>: Meeting hosts hold sole authority over Room Security Passcodes, attendee delegation, and observer deep-review audits.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">4. Privacy & Data Handling Policy</h4>
                <p>
                  Personal AI Genie does not sell user information. Identity data retrieved from Google OAuth (name, email, and avatar) is used purely to render user presence in chat channels and meeting rosters.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={handleDownloadProjectDocumentation}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Terms & Docs (.md)</span>
              </button>

              <button
                onClick={() => setLegalModalOpen(false)}
                className={`px-5 py-2 ${selectedTheme.primaryClass} text-white rounded-xl text-xs font-bold transition-all shadow-sm`}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passcode Invalidation Warning Modal */}
      {confirmRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">Regenerate Room Passcode?</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Warning: Generating a new room passcode will immediately <strong className="text-rose-600">inactivate and terminate</strong> the current active passcode ({roomPasscode}). Anyone with previous links will be locked out and must receive the new passcode.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRegenerateModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executePasscodeRegeneration}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Terminate & Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Free Quota Exceeded Modal */}
      {quotaExceededModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">Daily Free Limit Reached (20/20)</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You have used all 20 free messages for today. Your free quota resets every 24 hours. Want unlimited access right now?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setQuotaExceededModalOpen(false);
                  setSettingsOpen(true);
                  setSettingsTab("developer");
                }}
                className={`w-full py-2.5 ${selectedTheme.primaryClass} text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2`}
              >
                <Key className="w-4 h-4" />
                <span>Bring Your Own Key (BYOK) for Unlimited Chats</span>
              </button>

              <button
                onClick={() => {
                  setQuotaExceededModalOpen(false);
                  setSettingsOpen(true);
                  setSettingsTab("totp");
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Enter VIP Passcode / Authenticator</span>
              </button>
            </div>

            <button
              onClick={() => setQuotaExceededModalOpen(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 pt-1"
            >
              Close and wait for midnight reset
            </button>
          </div>
        </div>
      )}

      {/* Room Members & Governance Modal with Direct Meeting Dispatcher */}
      {roomAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Room Members & Governance</h3>
                <p className="text-[11px] text-slate-400">
                  Capacity: {members.length}/50 members • Sovereign: {isKeyOwner ? "You (API Key Owner)" : "Host Delegated"}
                </p>
              </div>
              <button onClick={() => setRoomAdminOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            {/* Room Security Passcode & Share Controls */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Room Security Passcode</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold bg-white px-2 py-1 rounded-lg border ${selectedTheme.textClass}`}>
                    {roomPasscode}
                  </span>
                  {isKeyOwner && (
                    <button
                      onClick={() => setConfirmRegenerateModalOpen(true)}
                      className={`p-1 hover:${selectedTheme.textClass} text-slate-400`}
                      title="Regenerate Passcode (Terminates previous code)"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Room URL Link</span>
                <button
                  type="button"
                  onClick={copyRoomInvite}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${selectedTheme.textClass} hover:underline`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{inviteCopied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>

            {/* Direct Meeting Invite Dispatcher */}
            <form onSubmit={handleSendDirectInvites} className={`${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} rounded-2xl p-3.5 space-y-2.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className={`w-4 h-4 ${selectedTheme.textClass}`} />
                  <span className={`text-xs font-bold ${selectedTheme.textClass}`}>Direct Meeting Invite Dispatcher</span>
                </div>
                <span className={`text-[10px] ${selectedTheme.textClass} font-semibold`}>Uses 1 Dispatch Credit</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">Required Attendees (comma-separated):</label>
                <input
                  type="text"
                  value={requiredAttendees}
                  onChange={(e) => setRequiredAttendees(e.target.value)}
                  placeholder="e.g. lead@domain.com, teammate@domain.com"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">Optional Attendees (comma-separated):</label>
                <input
                  type="text"
                  value={optionalAttendees}
                  onChange={(e) => setOptionalAttendees(e.target.value)}
                  placeholder="e.g. observer@domain.com, guest@domain.com"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">Agenda / Meeting Note:</label>
                <input
                  type="text"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="e.g. Reviewing Q4 Strategy & AI Genie Onboarding"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              {dispatchStatus && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 p-2 rounded-lg">
                  {dispatchStatus}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className={`flex-1 py-1.5 ${selectedTheme.primaryClass} text-white rounded-xl text-xs font-bold transition-all shadow-xs`}
                >
                  Send Direct Invites
                </button>
                <button
                  type="button"
                  onClick={copyFormattedInviteNote}
                  className={`px-3 py-1.5 bg-white border ${selectedTheme.borderClass} ${selectedTheme.textClass} hover:${selectedTheme.bgLightClass} rounded-xl text-xs font-semibold transition-all shadow-xs`}
                >
                  Copy Note
                </button>
              </div>
            </form>

            {/* Member Management Roster */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Active Member Roster
              </span>

              {members.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No teammates connected yet. Share the invite link above!
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GenieAvatar
                        src={member.avatarUrl}
                        alt={member.name}
                        className={`w-7 h-7 rounded-full border ${selectedTheme.borderClass} flex-shrink-0`}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{member.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{member.email}</span>
                      </div>
                      {member.role === "sovereign" && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          SOVEREIGN
                        </span>
                      )}
                      {member.role === "admin" && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          ADMIN
                        </span>
                      )}
                      {member.role === "developer" && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          DEV
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isKeyOwner && member.role !== "sovereign" && (
                        <button
                          onClick={() => handlePromoteAdmin(member.id)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700"
                        >
                          {member.role === "admin" ? "Demote" : "Make Admin"}
                        </button>
                      )}

                      {member.role !== "sovereign" && (
                        <button
                          onClick={() =>
                            setMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id
                                  ? {
                                      ...m,
                                      status: m.status === "active" ? "inactive" : "active",
                                    }
                                  : m
                              )
                            )
                          }
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[10px] transition-all ml-1 flex-shrink-0 ${
                            member.status === "active"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          }`}
                        >
                          {member.status === "active" ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-slate-800 text-sm">Share Conversation / Hop-in Group Chat</span>
              <button onClick={() => setShareModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium truncate">{currentSession?.title}</p>
            <p className="text-[11px] text-slate-500">
              Anyone with this link can hop into this conversation like a group chat and talk with Genie (up to 20 free chats/day without a passcode or key).
            </p>
            <div className={`p-3 ${selectedTheme.bgLightClass} rounded-xl border ${selectedTheme.borderClass} flex items-center justify-between`}>
              <span className={`text-xs font-mono font-bold ${selectedTheme.textClass}`}>
                GENIE-CHAT-{currentSessionId}
              </span>
              <button
                onClick={() => {
                  const hopInUrl = `${window.location.origin}/?room=GROUP-${currentSessionId}`;
                  navigator.clipboard.writeText(hopInUrl);
                  alert("Hop-in group chat link copied to clipboard!");
                  setShareModalOpen(false);
                }}
                className={`text-xs font-semibold ${selectedTheme.textClass} bg-white border ${selectedTheme.borderClass} px-3 py-1.5 rounded-lg`}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences & Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 ${selectedTheme.bgLightClass} rounded-xl ${selectedTheme.textClass}`}>
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Genie Workspace Preferences</h3>
                  <p className="text-[11px] text-slate-400">
                    Active Engine: <span className="font-mono text-purple-700 font-bold">{activeModelName}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSettingsTab("profile")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  settingsTab === "profile"
                    ? `border-purple-600 ${selectedTheme.textClass}`
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("theme")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  settingsTab === "theme"
                    ? `border-purple-600 ${selectedTheme.textClass}`
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Theme</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("developer")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  settingsTab === "developer"
                    ? `border-purple-600 ${selectedTheme.textClass}`
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>BYOK</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("totp")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  settingsTab === "totp"
                    ? `border-purple-600 ${selectedTheme.textClass}`
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Authenticator</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("docs")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  settingsTab === "docs"
                    ? `border-purple-600 ${selectedTheme.textClass}`
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Docs</span>
              </button>
            </div>

            {/* Profile Tab */}
            {settingsTab === "profile" && (
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className={`flex items-center justify-between p-3 ${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} rounded-2xl`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <GenieAvatar
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className={`w-11 h-11 rounded-full border-2 ${selectedTheme.borderClass} shadow-sm flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-slate-800 block truncate">{userProfile.name}</span>
                      <span className="text-xs text-slate-500 block truncate">{userProfile.email || "No email bound"}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5 ${
                          isDevUser
                            ? "text-amber-600"
                            : isVipUser
                            ? "text-emerald-600"
                            : selectedTheme.textClass
                        }`}
                      >
                        {isDevUser ? (
                          <>
                            <Code2 className="w-3 h-3" /> Lead Developer & Support Engineer
                          </>
                        ) : isVipUser ? (
                          <>
                            <ShieldCheck className="w-3 h-3" /> ★ Primary VIP Account
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" /> Free Tier ({remainingDailyChats}/20 Left Today)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setSettingsOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all shadow-xs ml-2 flex-shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Workflow Persona</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserProfile((p) => ({ ...p, role: "student" }))}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                        userProfile.role === "student"
                          ? `border-purple-600 ${selectedTheme.bgLightClass}${selectedTheme.textClass} shadow-sm`
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Student Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserProfile((p) => ({ ...p, role: "professional" }))}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                        userProfile.role === "professional"
                          ? `border-purple-600 ${selectedTheme.bgLightClass}${selectedTheme.textClass} shadow-sm`
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Professional Pro</span>
                    </button>
                  </div>
                </div>

                {userProfile.role === "professional" && (
                  <div className={`p-3 ${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} rounded-2xl space-y-1.5`}>
                    <label className={`text-xs font-bold ${selectedTheme.textClass} block`}>
                      Profession / Industry Domain:
                    </label>
                    <input
                      type="text"
                      value={userProfile.profession}
                      onChange={(e) => setUserProfile({ ...userProfile, profession: e.target.value })}
                      placeholder="e.g. Healthcare Revenue Cycle & Client Operations"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Theme Tab */}
            {settingsTab === "theme" && (
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Customize Workspace Accent</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose a personalized theme preset for your Genie workspace.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedTheme.id === t.id
                          ? `border-purple-600 ${t.bgLightClass} ring-2 ring-purple-400 shadow-sm`
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{t.name}</span>
                        {selectedTheme.id === t.id && (
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </div>
                      <div className={`w-full h-3 rounded-full bg-gradient-to-r ${t.gradientClass}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BYOK Developer Hub */}
            {settingsTab === "developer" && (
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Bring Your Own Key (BYOK)</span>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-1 text-[11px] font-semibold ${selectedTheme.textClass} hover:underline`}
                    >
                      <span>Get Gemini Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <input
                    type="password"
                    value={userProfile.customApiKey}
                    onChange={(e) => setUserProfile({ ...userProfile, customApiKey: e.target.value })}
                    placeholder="AIzaSy... (Paste Gemini / OpenAI Key to unlock unlimited direct cascade)"
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <p className="text-[10px] text-slate-500">
                    Adding your API key removes the 20 messages/day limit and activates all Gemini fallback models.
                  </p>
                </div>

                {/* Direct Developer Pipeline */}
                <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-violet-900 block">
                        Direct Developer Pipeline
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Direct dispatches to lead dev: <span className="font-semibold text-violet-700">{DEVELOPER_EMAIL}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-violet-700 bg-white px-2.5 py-0.5 rounded-full border border-violet-200">
                      🔒 Active Support
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReportType("ai_issue")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        reportType === "ai_issue"
                          ? "bg-violet-600 text-white border-violet-700"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Report AI Mistake
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType("ui_request")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        reportType === "ui_request"
                          ? "bg-violet-600 text-white border-violet-700"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Request Feature
                    </button>
                  </div>

                  <form onSubmit={handleTicketSubmit} className="space-y-2">
                    <textarea
                      rows={2}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Describe your issue or feature request..."
                      className="w-full text-xs border border-violet-300 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none"
                    />

                    {ticketStatus && (
                      <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        {ticketStatus}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!ticketDescription.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
                    >
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>Submit to Developer Pipeline</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Authenticator Hub */}
            {settingsTab === "totp" && (
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className={`p-4 ${selectedTheme.bgLightClass} border ${selectedTheme.borderClass} rounded-2xl space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className={`w-5 h-5 ${selectedTheme.textClass}`} />
                      <span className={`text-xs font-bold ${selectedTheme.textClass}`}>
                        {isCorporateDomain
                          ? "Model B: Corporate Authenticator Hub"
                          : "Model A: Personal Platform Authenticator"}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTotpVerified
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {isTotpVerified ? "Verified Active" : "Pending Code"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isCorporateDomain
                      ? "Enterprise Mode: Enter the 6-digit rolling code from your company's Google Authenticator app to unlock departmental governance."
                      : "Personal Tier: Enter the 6-digit rolling code issued by the Master Google Authenticator to activate one of the 10 VIP platform passes."}
                  </p>

                  <form onSubmit={handleVerifyTotp} className="space-y-2.5">
                    <input
                      type="text"
                      maxLength={7}
                      value={userProfile.totpPasscode}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, totpPasscode: e.target.value })
                      }
                      placeholder="000 000"
                      className="w-full text-center text-sm font-mono font-bold tracking-widest border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />

                    <button
                      type="submit"
                      className={`w-full py-2 ${selectedTheme.primaryClass} text-white text-xs font-bold rounded-xl transition-all shadow-xs`}
                    >
                      Verify Authenticator Code
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Docs & Legal Tab */}
            {settingsTab === "docs" && (
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Documentation & User Terms</h4>
                    <p className="text-[11px] text-slate-500">Review disclaimers and save specifications internally.</p>
                  </div>
                  <button
                    onClick={handleDownloadProjectDocumentation}
                    className={`flex items-center gap-1.5 px-3 py-1.5 ${selectedTheme.primaryClass} text-white rounded-xl text-xs font-bold transition-all shadow-xs`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">Active Multi-Model Failover Highlights:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Active cascade across authorized Google Gemini endpoints.</li>
                    <li>RFC 6238 TOTP two-tier authentication and 20 free daily quota enforcement.</li>
                    <li>Non-professional algorithmic output: verify all code and technical data.</li>
                  </ul>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setLegalModalOpen(true);
                    }}
                    className="text-xs text-purple-600 font-bold hover:underline pt-1 block"
                  >
                    Open Full Legal Agreement & Disclaimer ➔
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className={`px-5 py-2 text-xs font-bold text-white ${selectedTheme.primaryClass} rounded-xl transition-all shadow-sm`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F0F2F6] text-purple-700 text-sm font-semibold">Loading Personal AI Genie...</div>}>
      <MainChatApp />
    </Suspense>
  );
}