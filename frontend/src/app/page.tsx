"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Plus, 
  User, 
  Briefcase, 
  Code, 
  Search, 
  FileText, 
  GraduationCap, 
  BookOpen, 
  HelpCircle,
  RotateCcw,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  X,
  Paperclip,
  ImageIcon,
  Download,
  FileCheck,
  Settings,
  ArrowRight,
  BookmarkCheck,
  Lock,
  MessageCircleQuestion,
  SendHorizontal
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  image?: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  mode: "professional" | "student";
  messages: Message[];
  updatedAt: number;
}

interface UserProfile {
  name: string;
  age: number;
  is_student: boolean;
  profession: string;
  grade_class: string;
  interests: string;
  onboarded: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://personal-ai-canvas.onrender.com";

export default function PersonalAICanvas() {
  const [mode, setMode] = useState<"professional" | "student">("professional");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  // WhatsApp Gate & Access State
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [manualTokenInput, setManualTokenInput] = useState("");

  // In-App Issue Reporting Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("Bug / Error");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: "User",
    age: 21,
    is_student: false,
    profession: "Senior Process Executive",
    grade_class: "",
    interests: "Technology & AI Operations",
    onboarded: false,
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Chat thread messages
  const [profMessages, setProfMessages] = useState<Message[]>([]);
  const [studentMessages, setStudentMessages] = useState<Message[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Attachments & Drawers
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMessages = mode === "professional" ? profMessages : studentMessages;

  // 1. Gatekeeper: Validate token & device
  useEffect(() => {
    let deviceId = localStorage.getItem("canvas_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("canvas_device_id", deviceId);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("invite");
    const storedToken = localStorage.getItem("canvas_invite_token");
    const activeToken = tokenFromUrl || storedToken;

    if (activeToken) {
      fetch(`${BACKEND_URL}/api/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          invite_token: activeToken, 
          token: activeToken, 
          passcode: activeToken, 
          device_id: deviceId 
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Invite quota reached or invalid link.");
          return res.json();
        })
        .then(() => {
          setInviteToken(activeToken);
          localStorage.setItem("canvas_invite_token", activeToken);
          setAccessDenied(false);
        })
        .catch((err) => {
          setAccessDenied(true);
          setAccessError(err.message || "Access blocked.");
        });
    } else {
      setAccessDenied(true);
      setAccessError("A valid private invite link or passcode is required to access this canvas.");
    }
  }, []);

  // 2. Profile & Session Initialization
  useEffect(() => {
    const savedProfile = localStorage.getItem("canvas_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        if (parsed.is_student) setMode("student");
      } catch (e) {
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(true);
    }

    const savedSessionsRaw = localStorage.getItem("canvas_all_sessions");
    const activeSessionId = localStorage.getItem("canvas_active_session_id");

    if (savedSessionsRaw) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(savedSessionsRaw);
        setSessions(parsedSessions);

        if (parsedSessions.length > 0) {
          setShowResumeBanner(true);
          const toRestore = parsedSessions.find((s) => s.id === activeSessionId) || parsedSessions[0];
          setCurrentSessionId(toRestore.id);
          setMode(toRestore.mode);

          if (toRestore.mode === "professional") {
            setProfMessages(toRestore.messages);
          } else {
            setStudentMessages(toRestore.messages);
          }
        } else {
          initNewSession(mode);
        }
      } catch (e) {
        initNewSession(mode);
      }
    } else {
      initNewSession(mode);
    }
  }, []);

  const saveProfileData = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem("canvas_user_profile", JSON.stringify(updated));
    setShowOnboarding(false);
    if (updated.is_student) setMode("student");
    else setMode("professional");
  };

  const initNewSession = (sessionMode: "professional" | "student") => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      mode: sessionMode,
      messages: [],
      updatedAt: Date.now(),
    };
    setCurrentSessionId(newId);
    if (sessionMode === "professional") {
      setProfMessages([]);
    } else {
      setStudentMessages([]);
    }
    setSessions((prev) => [newSession, ...prev]);
    localStorage.setItem("canvas_active_session_id", newId);
  };

  // 3. Auto-save chats to localStorage
  useEffect(() => {
    if (!currentSessionId) return;

    setSessions((prevSessions) => {
      const existing = prevSessions.find((s) => s.id === currentSessionId);
      const firstUserMsg = currentMessages.find((m) => m.sender === "user");
      const title = firstUserMsg 
        ? firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "")
        : existing?.title || "New Conversation";

      const updated = prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            title,
            mode,
            messages: currentMessages,
            updatedAt: Date.now(),
          };
        }
        return session;
      });

      localStorage.setItem("canvas_all_sessions", JSON.stringify(updated));
      localStorage.setItem("canvas_active_session_id", currentSessionId);
      return updated;
    });
  }, [currentMessages, mode, currentSessionId]);

  // 4. Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [currentMessages, loading]);

  // 5. Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech error:", err);
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDoc = (text: string, title: string = "Extracted_Notes") => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>Export</title><style>body{font-family:Arial,sans-serif;line-height:1.6;padding:24px;}</style></head><body>";
    const footer = "</body></html>";
    const formattedContent = text.replace(/\n/g, "<br/>");
    const sourceHTML = header + `<h2>Personal AI Canvas — ${profile.name}'s Notes</h2><hr/><br/>` + formattedContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_Printable.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setSelectedFile({
        base64: base64String,
        mimeType: file.type || "image/jpeg",
        name: file.name
      });
      setMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMode(session.mode);
    if (session.mode === "professional") {
      setProfMessages(session.messages);
    } else {
      setStudentMessages(session.messages);
    }
    localStorage.setItem("canvas_active_session_id", session.id);
    setShowResumeBanner(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem("canvas_all_sessions", JSON.stringify(updated));

    if (sessionId === currentSessionId) {
      if (updated.length > 0) {
        selectSession(updated[0]);
      } else {
        initNewSession(mode);
      }
    }
  };

  const handleSaveAndArchiveCurrent = () => {
    if (currentMessages.length > 0) {
      const firstMsg = currentMessages.find((m) => m.sender === "user")?.text || "Saved Chat";
      const archiveTitle = `Archived: ${firstMsg.slice(0, 24)}...`;
      
      const updated = sessions.map((s) => 
        s.id === currentSessionId ? { ...s, title: archiveTitle, updatedAt: Date.now() } : s
      );
      setSessions(updated);
      localStorage.setItem("canvas_all_sessions", JSON.stringify(updated));
    }
    initNewSession(mode);
    setShowResumeBanner(false);
  };

  const handleStartFresh = () => {
    initNewSession(mode);
    setShowResumeBanner(false);
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || inputValue;
    if ((!textToSend.trim() && !selectedFile) || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend || (selectedFile ? `Attached: ${selectedFile.name}` : ""),
      image: selectedFile ? `data:${selectedFile.mimeType};base64,${selectedFile.base64}` : undefined,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      sender: "assistant",
      text: "",
      timestamp: Date.now(),
    };

    if (mode === "professional") {
      setProfMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    } else {
      setStudentMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    }

    const filePayload = selectedFile ? { ...selectedFile } : null;
    setSelectedFile(null);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          role_mode: mode,
          message: textToSend,
          image_base64: filePayload ? filePayload.base64 : null,
          image_mime_type: filePayload ? filePayload.mimeType : "image/jpeg",
          invite_token: inviteToken,
          device_id: localStorage.getItem("canvas_device_id")
        }),
      });

      if (!response.body) throw new Error("ReadableStream not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        const updateMessageList = (prev: Message[]) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
          );

        if (mode === "professional") {
          setProfMessages(updateMessageList);
        } else {
          setStudentMessages(updateMessageList);
        }
      }
    } catch (err) {
      const errorFallback = (prev: Message[]) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: "Error: Could not reach assistant engine. Check internet or server status." }
            : msg
        );
      if (mode === "professional") setProfMessages(errorFallback);
      else setStudentMessages(errorFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPasscode = () => {
    const devId = localStorage.getItem("canvas_device_id") || "dev_manual";
    fetch(`${BACKEND_URL}/api/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        invite_token: manualTokenInput.trim(), 
        token: manualTokenInput.trim(), 
        passcode: manualTokenInput.trim(), 
        device_id: devId 
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid passcode or limit reached.");
        return res.json();
      })
      .then(() => {
        setInviteToken(manualTokenInput.trim());
        localStorage.setItem("canvas_invite_token", manualTokenInput.trim());
        setAccessDenied(false);
      })
      .catch((err) => {
        alert(err.message || "Failed to authenticate invite.");
      });
  };

  const handleInAppReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setReportSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: profile.name,
          device_id: localStorage.getItem("canvas_device_id") || "dev_unknown",
          role_mode: mode,
          category: reportCategory,
          description: reportDescription.trim()
        }),
      });

      if (!res.ok) throw new Error("Failed to send report");

      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportDescription("");
        setReportModalOpen(false);
      }, 1600);
    } catch (err: any) {
      alert("Could not submit feedback: " + (err.message || "Unknown error"));
    } finally {
      setReportSubmitting(false);
    }
  };

  // ACCESS DENIED MODAL (If unauthorized)
  if (accessDenied && !inviteToken) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[#7ec5f9] via-[#bce3f9] to-[#f4f7d8] p-4">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Private Circle Access</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {accessError}
          </p>
          <div className="pt-2 space-y-2">
            <input
              type="text"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              placeholder="Enter WhatsApp Passcode"
              className="w-full text-center px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
            />
            <button
              onClick={handleManualPasscode}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Verify Passcode
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Friends & Family Beta</span>
            <button
              type="button"
              onClick={() => {
                setReportCategory("Access / Passcode Issue");
                setReportModalOpen(true);
              }}
              className="text-sky-600 hover:underline flex items-center gap-1"
            >
              <MessageCircleQuestion className="w-3.5 h-3.5" /> Need Help?
            </button>
          </div>
        </div>

        {/* In-App Report Dialog inside Lock screen */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Submit In-App Feedback</h3>
                <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe your issue or question..."
                className="w-full h-28 p-3 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
              />
              <button
                onClick={handleInAppReportSubmit}
                disabled={reportSubmitting || !reportDescription.trim()}
                className="w-full py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
              >
                {reportSuccess ? "Sent to Admin!" : reportSubmitting ? "Submitting..." : "Send Feedback"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const professionalChips = [
    { label: "Scan target job openings", icon: Briefcase },
    { label: "Review & debug code block", icon: Code },
    { label: "Analyze RCM / operational workflow", icon: Search },
    { label: "Draft professional follow-up", icon: FileText },
  ];

  const studentChips = [
    { label: "Create 5-question practice quiz", icon: HelpCircle },
    { label: "Explain a complex topic simply", icon: BookOpen },
    { label: "Build a 7-day study timetable", icon: GraduationCap },
    { label: "Generate concept flashcards", icon: Sparkles },
  ];

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-b from-[#7ec5f9] via-[#bce3f9] to-[#f4f7d8]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,application/pdf" 
        className="hidden" 
      />

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-800">Welcome to Personal AI Canvas</h2>
            </div>
            <p className="text-xs text-slate-500">
              Customize your personal assistant. The agent calibrates all quizzes, code reviews, and explanations directly to your profile.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Your Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Shaji"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Your Age</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => {
                      const ageNum = parseInt(e.target.value) || 18;
                      setProfile({
                        ...profile,
                        age: ageNum,
                        is_student: ageNum < 18 ? true : profile.is_student,
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Primary Role</label>
                  <select
                    value={profile.is_student ? "student" : "professional"}
                    onChange={(e) => setProfile({ ...profile, is_student: e.target.value === "student" })}
                    className="w-full mt-1 px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500 bg-white"
                  >
                    <option value="professional">Professional / Work</option>
                    <option value="student">Student / Academic</option>
                  </select>
                </div>
              </div>

              {profile.is_student ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700">Specific Class / Grade / Degree</label>
                  <input
                    type="text"
                    value={profile.grade_class}
                    onChange={(e) => setProfile({ ...profile, grade_class: e.target.value })}
                    placeholder="e.g. 12th Grade CBSE, Computer Science, MBBS"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700">Current Profession / Domain</label>
                  <input
                    type="text"
                    value={profile.profession}
                    onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                    placeholder="e.g. Senior Process Executive / Healthcare Ops"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700">Key Interests & Focus Topics</label>
                <input
                  type="text"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  placeholder="e.g. RCM Operations, Python, Machine Learning"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                />
              </div>

              <button
                onClick={() => saveProfileData({ ...profile, onboarded: true })}
                className="w-full mt-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                Launch My Personalized Canvas <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Feedback & Issue Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-800">Report Issue / Feedback</h3>
              </div>
              <button 
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Submit any bugs, feature requests, or questions. This posts directly into the admin channel.
            </p>

            <form onSubmit={handleInAppReportSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Feedback Type</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-sky-500 bg-white"
                >
                  <option value="Bug / Error">Bug / Something Broke</option>
                  <option value="Feature Idea">Suggestion / Feature Idea</option>
                  <option value="Mobile Layout">Mobile Display Issue</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Explain what happened or what you'd like improved..."
                  className="w-full mt-1 p-3 text-xs border border-slate-200 rounded-xl focus:outline-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportDescription.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {reportSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> Submitted!
                    </>
                  ) : reportSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <SendHorizontal className="w-3.5 h-3.5" /> Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Left Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <h2 className="font-semibold text-sm text-slate-800 tracking-tight">Saved Chats</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              handleStartFresh();
              setSidebarOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Start New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">No saved sessions yet</div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                    isActive
                      ? "bg-sky-100/90 text-sky-900 border border-sky-200 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-6">
                    <span className={`w-2 h-2 rounded-full ${s.mode === "professional" ? "bg-sky-500" : "bg-emerald-500"}`} />
                    <span className="truncate">{s.title || "Untitled Chat"}</span>
                  </div>

                  <button
                    onClick={(e) => deleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 p-1 rounded-md text-slate-400 transition-all absolute right-2"
                    title="Close and delete chat"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate max-w-[120px] font-medium">{profile.name} ({profile.is_student ? profile.grade_class || "Student" : profile.profession})</span>
          </div>
          <button 
            onClick={() => setShowOnboarding(true)}
            className="text-slate-400 hover:text-sky-600 transition-colors p-1"
            title="Edit Profile & Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col justify-between p-3 sm:p-6 transition-all duration-300 w-full overflow-hidden">
        <header className="flex justify-between items-center max-w-5xl w-full mx-auto gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-sm border border-white/60 transition-all"
              title="Open Chat History"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" /> : <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />}
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="text-[#0284c7] w-5 h-5 sm:w-6 sm:h-6" />
              <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate">
                Personal AI Canvas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-2.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm border border-white/60 text-xs font-medium flex items-center gap-1 transition-all"
              title="Report issue or send in-app feedback"
            >
              <MessageCircleQuestion className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Report</span>
            </button>

            <div className="bg-white/70 backdrop-blur-md p-0.5 sm:p-1 rounded-full flex shadow-sm border border-white/50">
              <button
                onClick={() => setMode("professional")}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
                  mode === "professional"
                    ? "bg-[#0284c7] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pro
              </button>
              <button
                onClick={() => setMode("student")}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
                  mode === "student"
                    ? "bg-[#0284c7] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Student
              </button>
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
              title="Edit Profile"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Three-Option Resume & Save Banner */}
        {showResumeBanner && currentMessages.length > 0 && (
          <div className="max-w-2xl w-full mx-auto my-2 bg-white/95 backdrop-blur-md border border-sky-200 rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2">
            <span>Previous <strong>{mode}</strong> session detected.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResumeBanner(false)}
                className="bg-sky-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-sky-700 transition-colors shadow-xs"
              >
                Resume
              </button>
              <button
                onClick={handleSaveAndArchiveCurrent}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> Archive
              </button>
              <button
                onClick={handleStartFresh}
                className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Fresh
              </button>
            </div>
          </div>
        )}

        {/* Chat Stream Section */}
        <section 
          ref={chatContainerRef}
          className="flex-1 max-w-4xl w-full mx-auto my-2 sm:my-4 overflow-y-auto max-h-[65vh] pr-1 sm:pr-2 space-y-3 sm:space-y-4 scroll-smooth"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-500 py-12">
              <div>
                <Sparkles className="w-9 h-9 sm:w-10 sm:h-10 text-sky-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700">
                  Welcome back, {profile.name}!
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto px-4">
                  {mode === "professional"
                    ? `Workspace tailored for ${profile.profession || "professionals"}. Ask for code reviews, domain advice, or upload documents.`
                    : `Study workspace tailored for ${profile.grade_class || "students"}. Upload book notes to extract printable sheets or generate practice tests.`}
                </p>
              </div>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
                
                {msg.sender === "user" ? (
                  <div className="max-w-[85%] sm:max-w-[78%] px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl rounded-br-none bg-[#0284c7] text-white text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap space-y-2">
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Uploaded document" 
                        className="rounded-lg max-h-48 object-cover border border-white/30" 
                      />
                    )}
                    <div>{msg.text}</div>
                  </div>
                ) : (
                  <div className="relative group max-w-[90%] sm:max-w-[85%] bg-white/95 text-slate-800 border border-white/60 rounded-2xl rounded-bl-none p-3.5 sm:p-5 shadow-sm">
                    <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed pr-12 sm:pr-16">
                      {msg.text || (loading ? "..." : "")}
                    </div>
                    
                    {msg.text && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadDoc(msg.text, `${profile.name}_Notes`)}
                          className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all opacity-80 hover:opacity-100"
                          title="Download Printable Document"
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all opacity-80 hover:opacity-100"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && currentMessages.length > 0 && currentMessages[currentMessages.length - 1].sender === "user" && (
            <div className="flex gap-2 sm:gap-3 justify-start items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-500 text-white flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="bg-white/90 text-slate-500 text-xs px-3 sm:px-4 py-2 rounded-2xl shadow-sm italic">
                Personalizing response for {profile.name}...
              </div>
            </div>
          )}
        </section>

        {/* Footer Input */}
        <footer className="max-w-4xl w-full mx-auto space-y-2 sm:space-y-3 relative">
          <div className="hidden sm:flex flex-wrap justify-center gap-2">
            {(mode === "professional" ? professionalChips : studentChips).map(
              (chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.label)}
                    className="bg-white/80 hover:bg-white text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/60 transition-all hover:scale-102"
                  >
                    <Icon className="w-3.5 h-3.5 text-sky-600" />
                    {chip.label}
                  </button>
                );
              }
            )}
          </div>

          {menuOpen && (
            <div className="absolute bottom-20 left-2 sm:left-4 z-50 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-2 w-52 sm:w-56 space-y-1 animate-fadeIn">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
              >
                <Paperclip className="w-4 h-4 text-sky-600" />
                Upload files / Docs
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Scan Book Page / Notes (OCR)
              </button>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center gap-2 bg-white/90 border border-sky-300 px-3 py-1.5 rounded-xl text-xs text-sky-800 w-fit shadow-sm">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-0.5 hover:bg-sky-100 rounded-full text-slate-500 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/80 p-2 sm:p-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedFile 
                  ? "Describe what to extract or format..."
                  : mode === "professional"
                  ? `Ask for code reviews, advice for ${profile.profession}...`
                  : `Ask for study guides, quizzes for ${profile.grade_class || "your subjects"}...`
              }
              className="w-full bg-transparent px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />

            <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  title="Upload & Tools"
                  className={`p-1.5 rounded-lg transition-all ${
                    menuOpen 
                      ? "bg-sky-100 text-sky-700" 
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md truncate max-w-[110px] sm:max-w-none">
                  {mode === "professional" ? "Developer Copilot" : "Study Architect"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-full transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Start Voice Input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || (!inputValue.trim() && !selectedFile)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    (inputValue.trim() || selectedFile) && !loading
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-[10px] sm:text-[11px] text-slate-600">
            <span>Private Circle Active • Access granted for {profile.name}</span>
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-sky-700 hover:underline font-medium"
            >
              Report Issue
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}