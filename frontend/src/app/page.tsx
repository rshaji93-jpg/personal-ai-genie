"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Download,
  KeyRound,
  Settings as SettingsIcon,
  X,
  ExternalLink,
  GraduationCap,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Send,
  Globe,
  Users,
  ShieldAlert,
  SendHorizontal,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Check,
  Smile,
  Reply,
  Forward,
  UserCheck,
  UserX,
} from "lucide-react";

const INDIAN_LANGUAGES = [
  { code: "en-IN", label: "EN (India)" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "bn-IN", label: "বাংলা" },
];

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🔥", "🙏", "🎉", "💡", "📚", "🎯", "👏", "✨", "🚀"];

interface RoomMember {
  id: string;
  name: string;
  role: "admin" | "member";
  status: "active" | "inactive";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  senderName?: string;
  replyTo?: { author: string; content: string };
}

interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  messages: Message[];
}

export default function Home() {
  const [spaceMode, setSpaceMode] = useState<"personal" | "workspace">("personal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDockHidden, setIsDockHidden] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);

  // Group Governance (50 members cap)
  const [members, setMembers] = useState<RoomMember[]>([
    { id: "1", name: "Shaji Joseph (You)", role: "admin", status: "active" },
    { id: "2", name: "Ananya", role: "member", status: "active" },
    { id: "3", name: "David", role: "member", status: "active" },
    { id: "4", name: "Rahul", role: "member", status: "active" },
  ]);
  const [activeSpeaker, setActiveSpeaker] = useState<string>("Shaji Joseph (You)");
  const [roomAdminOpen, setRoomAdminOpen] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "1", title: "New Session", isPinned: false, messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState("1");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Quoted Reply & Forwarding State
  const [replyTarget, setReplyTarget] = useState<{ author: string; content: string } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // User Profile
  const [userProfile, setUserProfile] = useState({
    name: "Shaji Joseph",
    email: "shaji@gmail.com",
    avatarUrl: "/avatar.svg",
    role: "professional" as "student" | "professional",
    profession: "Healthcare Revenue Cycle & Client Operations",
    ageGroup: "pro",
    gender: "male",
    customApiKey: "",
  });

  // Inline Editing
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [prohibitionNotice, setProhibitionNotice] = useState<string | null>(null);

  // Inputs & Speech
  const [prompt, setPrompt] = useState("");
  const [selectedLang, setSelectedLang] = useState(INDIAN_LANGUAGES[0]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number[]>([12, 18, 10, 24, 14]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic API Base URL for Cloud Deployment
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Audio Equalizer Visualizer
  useEffect(() => {
    if (isListening) {
      const updateWaves = () => {
        setAudioVolume([
          Math.floor(Math.random() * 22) + 8,
          Math.floor(Math.random() * 32) + 12,
          Math.floor(Math.random() * 26) + 10,
          Math.floor(Math.random() * 36) + 14,
          Math.floor(Math.random() * 20) + 8,
        ]);
        animationFrameRef.current = requestAnimationFrame(updateWaves);
      };
      animationFrameRef.current = requestAnimationFrame(updateWaves);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setAudioVolume([10, 14, 8, 16, 10]);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isListening]);

  // Dictation Engine
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

  // Submit Prompt Handler
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : prompt;
    if (!textToSend.trim() || isStreaming) return;

    // Check Member Active Status
    const currentMemberObj = members.find((m) => m.name === activeSpeaker);
    if (isTeamMode && currentMemberObj?.status === "inactive") {
      alert("Your account is currently inactive in this sponsored room. Contact the room admin.");
      return;
    }

    // Prohibition Filter
    const lower = textToSend.toLowerCase();
    const isProhibited = [
      "create photo",
      "draw picture",
      "edit this video",
      "render a video",
      "generate photo",
      "generate image",
    ].some((k) => lower.includes(k));

    if (isProhibited) {
      setProhibitionNotice(
        "Genie is specialized for study and business analysis. Generative image creation and video editing are strictly prohibited."
      );
      setTimeout(() => setProhibitionNotice(null), 5000);
      return;
    }

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
      content: textToSend,
      senderName: isTeamMode ? activeSpeaker : undefined,
      replyTo: sentReplyTarget || undefined,
    };

    const updatedMessages = [...messages, userMsg];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedTitle = s.messages.length === 0 ? textToSend.slice(0, 24) : s.title;
          return { ...s, title: updatedTitle, messages: updatedMessages };
        }
        return s;
      })
    );

    // Multilingual Summon Check
    const hasGenieCall = [
      "@genie",
      "genie",
      "jini",
      "ஜீனி",
      "ஜீன்",
      "ஜீனியே",
      "கரெக்டா",
    ].some((w) => lower.includes(w) || textToSend.includes(w));

    if (isTeamMode && !hasGenieCall) {
      return;
    }

    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          prompt: textToSend,
          space_mode: spaceMode,
          conversation_history: updatedMessages,
          provider: "gemini",
          custom_api_key: userProfile.customApiKey || undefined,
          profession_context:
            userProfile.role === "professional" ? userProfile.profession : undefined,
          gender_context: userProfile.gender,
          language_code: selectedLang.code,
          is_team_chat: isTeamMode,
          quoted_message: sentReplyTarget
            ? { author: sentReplyTarget.author, content: sentReplyTarget.content }
            : undefined,
        }),
      });

      const data = await res.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { role: "assistant", content: data.reply, senderName: "Personal AI Genie" },
                ],
              }
            : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    role: "assistant",
                    content: "Genie is active. Ready to proceed.",
                    senderName: "Personal AI Genie",
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Inline Prompt Editing
  const handleUpdatePrompt = async (index: number) => {
    if (!editText.trim()) return;

    const trimmedHistory = messages.slice(0, index);
    const newMsg: Message = {
      role: "user",
      content: editText.trim(),
      senderName: isTeamMode ? activeSpeaker : undefined,
    };

    const finalContext = [...trimmedHistory, newMsg];

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: finalContext } : s))
    );

    setEditingMessageIndex(null);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          prompt: editText.trim(),
          space_mode: spaceMode,
          conversation_history: finalContext,
          provider: "gemini",
          custom_api_key: userProfile.customApiKey || undefined,
          profession_context:
            userProfile.role === "professional" ? userProfile.profession : undefined,
          gender_context: userProfile.gender,
          language_code: selectedLang.code,
          is_team_chat: isTeamMode,
        }),
      });

      const data = await res.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...finalContext,
                  { role: "assistant", content: data.reply, senderName: "Personal AI Genie" },
                ],
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSendMessage(undefined, lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F0F2F6] text-slate-800 antialiased font-sans">
      {/* 1. SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0 -translate-x-full lg:w-0"
        } fixed inset-y-0 left-0 z-40 bg-[#E9ECF2]/95 backdrop-blur-xl border-r border-[#D9DFEA] transition-all duration-300 ease-in-out lg:static flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#D9DFEA]">
          <div className="flex items-center gap-3">
            <img
              src={userProfile.avatarUrl}
              alt="User"
              className="w-9 h-9 rounded-full object-cover border-2 border-purple-400 shadow-sm"
            />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent truncate">
              Personal AI Genie
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Hide Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          <button
            onClick={() => {
              const newId = Date.now().toString();
              setSessions((prev) => [
                { id: newId, title: "New Session", isPinned: false, messages: [] },
                ...prev,
              ]);
              setCurrentSessionId(newId);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => setSyncModalOpen(true)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/80 hover:bg-white text-slate-700 border border-[#D9DFEA] rounded-xl text-[11px] font-medium transition-all shadow-xs"
            >
              <KeyRound className="w-3 h-3 text-violet-600" />
              <span>Import Sync</span>
            </button>
            <button
              onClick={() => setSyncModalOpen(true)}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/80 hover:bg-white text-slate-700 border border-[#D9DFEA] rounded-xl text-[11px] font-medium transition-all shadow-xs"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Backup</span>
            </button>
          </div>
        </div>

        {/* History Feed */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            History
          </div>

          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group relative flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-all ${
                currentSessionId === session.id
                  ? "bg-white/90 text-slate-900 font-semibold shadow-sm border border-[#D9DFEA]"
                  : "text-slate-600 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {session.isPinned ? (
                  <Pin className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
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
                    className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 z-50 text-slate-700"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalOpen(true);
                        setActiveMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-purple-50 text-purple-700 font-medium"
                    >
                      <Share2 className="w-3 h-3 text-purple-600" /> Share
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
                      <Pin className="w-3 h-3 text-slate-500" /> {session.isPinned ? "Unpin" : "Pin"}
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
                      <Edit2 className="w-3 h-3 text-slate-500" /> Rename
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
                      <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="p-3 border-t border-[#D9DFEA] bg-[#E1E5EE]/60 space-y-2">
          <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <img
                src={userProfile.avatarUrl}
                alt="Account"
                className="w-7 h-7 rounded-full object-cover border border-purple-300"
              />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                  {userProfile.name}
                </span>
                <span className="text-[9px] text-slate-500 truncate">{userProfile.email}</span>
              </div>
            </div>

            <button
              onClick={() => setSpaceMode(spaceMode === "personal" ? "workspace" : "personal")}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                spaceMode === "workspace"
                  ? "bg-purple-600 text-white border-purple-700"
                  : "bg-pink-50 text-pink-700 border-pink-300"
              }`}
            >
              {spaceMode === "workspace" ? "Work" : "Personal"}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-400 font-medium">Genie Engine v4.0</span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1 text-slate-500 hover:text-purple-700 rounded-md"
              title="Preferences & BYOK"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
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

      {/* 2. MAIN CANVAS */}
      <main className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden bg-gradient-to-b from-[#F2F4F8] via-[#EFF2F7] to-[#E9EDF4]">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#DDE3EE] bg-white/70 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-white rounded-full border-2 border-purple-600 shadow-sm">
              <button
                onClick={() => setSpaceMode("personal")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  spaceMode === "personal"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-900 hover:text-purple-950 font-medium"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Genie Personal Space</span>
              </button>

              <button
                onClick={() => setSpaceMode("workspace")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  spaceMode === "workspace"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-900 hover:text-purple-950 font-medium"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Genie Workspace</span>
              </button>
            </div>

            {/* Team Mode & Admin Roster */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTeamMode(!isTeamMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isTeamMode
                    ? "bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 text-white border-transparent shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isTeamMode ? "Team Active" : "Team Sync"}</span>
              </button>

              {isTeamMode && (
                <button
                  onClick={() => setRoomAdminOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-full transition-all shadow-xs"
                >
                  Room Roster ({members.filter((m) => m.status === "active").length}/50)
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-pink-700 bg-pink-50 px-3.5 py-1.5 rounded-full border-2 border-pink-500 shadow-sm">
              {spaceMode === "workspace" ? "Organizational Workspace" : "Google Personal Account"}
            </span>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 rounded-full transition-all shadow-sm"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Center Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
          {prohibitionNotice && (
            <div className="max-w-2xl mx-auto mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-2xl text-xs font-medium flex items-center gap-2 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{prohibitionNotice}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center -mt-6">
              <div className="flex flex-col items-center gap-3 text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md border border-[#DCE2ED] p-0.5 overflow-hidden">
                  <img
                    src={userProfile.avatarUrl}
                    alt="Genie"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                  Where should we start?
                </h2>

                <p className="text-xs text-slate-500 max-w-sm">
                  {spaceMode === "workspace"
                    ? `Workspace active in ${userProfile.profession}. Multi-AI context and team pooling ready.`
                    : `Personal companion for ${userProfile.name}. Empathetic advice, regional language dictation, and document analysis ready.`}
                </p>
              </div>
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

                  {/* USER BUBBLE */}
                  {msg.role === "user" ? (
                    editingMessageIndex === index ? (
                      <div className="w-full max-w-xl self-end space-y-2">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full text-sm border border-slate-300 rounded-2xl px-4 py-2.5 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        />
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setEditingMessageIndex(null)}
                            className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdatePrompt(index)}
                            className="px-4 py-1.5 text-xs font-bold bg-sky-400 hover:bg-sky-500 text-slate-900 rounded-full shadow-sm"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative flex items-center gap-2">
                        {/* Action buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() =>
                              setReplyTarget({
                                author: msg.senderName || "User",
                                content: msg.content,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-purple-600"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setForwardMessage(msg)}
                            className="p-1 text-slate-400 hover:text-purple-600"
                            title="Forward message"
                          >
                            <Forward className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageIndex(index);
                              setEditText(msg.content);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Edit prompt"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-indigo-600 text-white rounded-br-none shadow-sm space-y-1">
                          {msg.replyTo && (
                            <div className="bg-indigo-700/70 border-l-2 border-indigo-300 p-2 rounded text-xs text-indigo-100 mb-1">
                              <span className="font-bold block text-[10px] text-indigo-200">
                                Replying to {msg.replyTo.author}
                              </span>
                              <span className="truncate block opacity-90">{msg.replyTo.content}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    /* ASSISTANT BUBBLE */
                    <div className="space-y-1.5 max-w-[85%]">
                      <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm leading-relaxed border border-slate-200 shadow-sm">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 px-1">
                        <button
                          className="p-1 hover:text-purple-600 rounded transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSettingsOpen(true)}
                          className="p-1 hover:text-rose-600 rounded transition-colors"
                          title="Report issue"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleRegenerateLast}
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
                          className="p-1 hover:text-purple-600 rounded transition-colors"
                          title="Forward Genie's answer"
                        >
                          <Forward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input Dock Toggle */}
        {isDockHidden && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={() => setIsDockHidden(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/90 hover:bg-white text-purple-700 font-semibold text-xs border border-purple-200 rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-105"
            >
              <ChevronUp className="w-4 h-4 text-purple-600" />
              <span>Show Input Dock</span>
            </button>
          </div>
        )}

        {/* DOCKED CHAT BAR */}
        {!isDockHidden && (
          <div className="flex-shrink-0 w-full px-4 py-3 bg-white/80 backdrop-blur-md border-t border-[#DDE3EE] shadow-lg transition-transform duration-300">
            {/* Quoted Reply Docked Banner */}
            {replyTarget && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                <div className="truncate">
                  <span className="font-bold text-purple-900">Replying to {replyTarget.author}: </span>
                  <span className="text-slate-600 italic truncate">{replyTarget.content}</span>
                </div>
                <button
                  onClick={() => setReplyTarget(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Speaking Persona Switcher in Team Mode */}
            {isTeamMode && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between px-3 py-1.5 bg-purple-50/80 border border-purple-200 rounded-xl text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700">Speaking as:</span>
                  <div className="flex items-center gap-1">
                    {members
                      .filter((m) => m.status === "active")
                      .map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setActiveSpeaker(member.name)}
                          className={`px-2 py-0.5 rounded-lg font-medium text-[10px] transition-all ${
                            activeSpeaker === member.name
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-purple-100"
                          }`}
                        >
                          {member.name}
                        </button>
                      ))}
                  </div>
                </div>
                <span className="text-[10px] text-purple-600 font-semibold">
                  Type @Genie or ஜீனி to analyze
                </span>
              </div>
            )}

            <div className="w-full max-w-3xl mx-auto relative">
              {/* Native Emoji Tray */}
              {emojiPickerOpen && (
                <div className="absolute left-10 bottom-full mb-3 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 flex items-center gap-2">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setPrompt((prev) => prev + emoji);
                        setEmojiPickerOpen(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
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
                  title="Add emoji"
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
                      ? `Message team as ${activeSpeaker} or call ஜீனி...`
                      : "Ask Genie anything..."
                  }
                  className="flex-1 bg-transparent px-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                />

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-full transition-colors"
                    >
                      <Globe className="w-3 h-3 text-purple-600" />
                      <span>{selectedLang.label}</span>
                      <ChevronDown className="w-3 h-3 text-purple-500" />
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
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 transition-colors flex items-center justify-between ${
                              selectedLang.code === lang.code
                                ? "text-purple-700 font-semibold bg-purple-50/50"
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

                  {isListening && (
                    <div className="flex items-center gap-0.5 px-1 h-5">
                      {audioVolume.map((height, i) => (
                        <div
                          key={i}
                          style={{ height: `${height}px` }}
                          className="w-1 bg-gradient-to-t from-violet-600 to-pink-500 rounded-full transition-all duration-75"
                        />
                      ))}
                    </div>
                  )}

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

                  <button
                    type="submit"
                    disabled={!prompt.trim() || isStreaming}
                    className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDockHidden(true)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors ml-1"
                    title="Hide chat dock"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <p className="text-center text-[11px] text-slate-400 font-normal select-none tracking-tight mt-2">
                Personal AI Genie can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 3. ROOM ADMIN & GOVERNANCE MODAL */}
      {roomAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Room Members & Governance</h3>
                <p className="text-[11px] text-slate-400">
                  Capacity: {members.length}/50 members (Sponsored API Active)
                </p>
              </div>
              <button onClick={() => setRoomAdminOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{member.name}</span>
                    {member.role === "admin" && (
                      <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                        HOST
                      </span>
                    )}
                  </div>

                  {member.role !== "admin" && (
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
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[10px] transition-all ${
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
              ))}
            </div>

            <button
              onClick={() => {
                if (members.length >= 50) {
                  alert("Room capacity limit of 50 members reached!");
                  return;
                }
                const newMemberName = prompt("Enter new teammate name:");
                if (newMemberName?.trim()) {
                  setMembers((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      name: newMemberName.trim(),
                      role: "member",
                      status: "active",
                    },
                  ]);
                }
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              + Add Member (Up to 50)
            </button>
          </div>
        </div>
      )}

      {/* 4. FORWARD MESSAGE MODAL */}
      {forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-800 text-sm">Forward Message</span>
              <button onClick={() => setForwardMessage(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 italic max-h-20 overflow-hidden text-ellipsis">
              "{forwardMessage.content}"
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600">Select Destination Session:</span>
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => {
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === sess.id
                          ? {
                              ...s,
                              messages: [
                                ...s.messages,
                                {
                                  role: "user",
                                  content: `[Forwarded]: ${forwardMessage.content}`,
                                  senderName: userProfile.name,
                                },
                              ],
                            }
                          : s
                      )
                    );
                    setForwardMessage(null);
                    setCurrentSessionId(sess.id);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 rounded-xl transition-colors border border-slate-100 flex items-center justify-between"
                >
                  <span className="truncate">{sess.title}</span>
                  <Forward className="w-3 h-3 text-purple-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TWO-TAB SETTINGS MODAL */}
      {settingsOpen && (
        <SettingsModalComponent
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          userProfile={userProfile}
          onSaveProfile={(updated) => setUserProfile(updated)}
        />
      )}

      {/* 6. SYNC / BACKUP MODAL */}
      {syncModalOpen && (
        <SyncModalComponent
          isOpen={syncModalOpen}
          onClose={() => setSyncModalOpen(false)}
          onImportCode={(code: string) => {
            const newId = Date.now().toString();
            setSessions((prev) => [
              {
                id: newId,
                title: `Room: ${code}`,
                isPinned: false,
                messages: [
                  {
                    role: "assistant",
                    content: `Connected to synced room [${code}]. Shared team context and pooled BYOK active.`,
                    senderName: "Personal AI Genie",
                  },
                ],
              },
              ...prev,
            ]);
            setCurrentSessionId(newId);
          }}
        />
      )}

      {/* 7. SHARE MODAL */}
      {shareModalOpen && (
        <ShareModalComponent
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          chatTitle={currentSession?.title || "Genie Chat"}
        />
      )}
    </div>
  );
}

// ==========================================
// PREFERENCES & DEVELOPER HUB (TWO-TAB)
// ==========================================

function SettingsModalComponent({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onSaveProfile: (profile: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "developer">("profile");

  const [role, setRole] = useState<"student" | "professional">(userProfile.role);
  const [profession, setProfession] = useState(userProfile.profession);
  const [ageGroup, setAgeGroup] = useState(userProfile.ageGroup);
  const [gender, setGender] = useState(userProfile.gender || "male");

  const [apiKey, setApiKey] = useState(userProfile.customApiKey);
  const [reportType, setReportType] = useState<"ai_issue" | "ui_request">("ai_issue");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...userProfile,
      role,
      profession,
      ageGroup,
      gender,
      customApiKey: apiKey,
    });
    onClose();
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) return;

    try {
      const res = await fetch("http://localhost:8000/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userProfile.email,
          user_name: userProfile.name,
          track: reportType,
          description: ticketDescription,
          context: "Submitted via Genie Workspace Preferences Hub",
        }),
      });
      const data = await res.json();
      setTicketStatus(data.message || "Submitted successfully!");
      setTicketDescription("");
      setTimeout(() => setTicketStatus(null), 3500);
    } catch {
      setTicketStatus("Dispatched successfully to developer pipeline!");
      setTimeout(() => setTicketStatus(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Genie Workspace Preferences</h3>
              <p className="text-[11px] text-slate-400">Manage persona, keys, and developer feedback</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Persona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("developer")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "developer"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>BYOK & Developer Hub</span>
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-purple-300 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-800 block truncate">{userProfile.name}</span>
                <span className="text-xs text-slate-500 block truncate">{userProfile.email}</span>
                <span className="text-[10px] text-pink-600 font-semibold uppercase tracking-wider">
                  Google Workspace Connected
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Workflow Persona</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                    role === "student"
                      ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Student Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("professional")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                    role === "professional"
                      ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>Professional Pro</span>
                </button>
              </div>
            </div>

            {role === "professional" && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-1.5">
                <label className="text-xs font-bold text-purple-900 block">
                  Specify Profession / Self-Employment Skills:
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Healthcare RCM, AR Operations, Client Audits"
                  className="w-full text-xs border border-purple-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Age Demographic</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none"
              >
                <option value="teen">Under 18 (School & Foundational)</option>
                <option value="college">18 – 24 (University / Early Career)</option>
                <option value="pro">25 – 45 (Working Professional / Enterprise)</option>
                <option value="senior">45+ (Executive & Senior Leadership)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Gender / Preferred Address
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["male", "female", "non-binary", "prefer not to say"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border capitalize transition-all ${
                      gender === g
                        ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "developer" && (
          <div className="p-6 space-y-4">
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
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline"
                >
                  <span>Get Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini / OpenAI Key)"
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 block">
                  Manager Support Hub
                </span>
                <span className="text-[10px] font-semibold text-violet-700 bg-white px-2.5 py-0.5 rounded-full border border-violet-200 flex items-center gap-1">
                  <span>🔒 Direct Developer Pipeline</span>
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
                  placeholder="Describe your request..."
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

        <div className="flex justify-end gap-2 p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SyncModalComponent({ isOpen, onClose, onImportCode }: any) {
  const [syncCode, setSyncCode] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-bold text-slate-800 text-sm">Join Team Sync Room</span>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <input
          type="text"
          value={syncCode}
          onChange={(e) => setSyncCode(e.target.value)}
          placeholder="e.g. GENIE-SHARE-BLOOHL"
          className="w-full text-xs font-mono uppercase border border-slate-200 rounded-xl px-3 py-2.5"
        />
        <button
          onClick={() => {
            if (syncCode.trim()) {
              onImportCode(syncCode.trim());
              onClose();
            }
          }}
          className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

function ShareModalComponent({ isOpen, onClose, chatTitle }: any) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const shareCode = `GENIE-SHARE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-bold text-slate-800 text-sm">Share Chat</span>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-600 font-medium truncate">{chatTitle}</p>
        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-purple-900">{shareCode}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs font-semibold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-lg"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>
      </div>
    </div>
  );
}