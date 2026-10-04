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
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  X,
  Paperclip,
  Download,
  FileCheck,
  Settings,
  ArrowRight,
  Lock,
  Layers,
  MessageSquareQuote,
  UploadCloud,
  Building2,
  Globe2,
  LogOut,
  AlertTriangle,
  RotateCcw,
  Trash2
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

interface SuggestionChip {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
  text?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function RichTextContent({ content, onExpand }: { content: string; onExpand: () => void }) {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : "code";
          const codeBody = hasLang ? lines.slice(1).join("\n") : lines.join("\n");
          const snippetId = `snippet_${idx}`;

          return (
            <div key={idx} className="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-md">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 text-[11px] font-mono text-slate-300 border-b border-slate-700">
                <span className="uppercase text-[10px] tracking-wide font-semibold text-sky-400">{lang}</span>
                <button
                  type="button"
                  onClick={() => copyCode(codeBody, snippetId)}
                  className="flex items-center gap-1 hover:text-white transition-colors p-1"
                >
                  {copiedSnippet === snippetId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] sm:text-xs font-mono leading-relaxed text-sky-100">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        return (
          <span key={idx} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}

      {content.length > 30 && content.length < 350 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onExpand}
            className="text-[11px] font-medium text-sky-600 hover:text-sky-800 flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 transition-all hover:scale-102"
          >
            <Layers className="w-3.5 h-3.5" /> Expand to In-Depth Notes
          </button>
        </div>
      )}
    </div>
  );
}

export default function PersonalAICanvas() {
  const [mode, setMode] = useState<"professional" | "student">("professional");
  const [conversationalStyle, setConversationalStyle] = useState<"chat" | "document">("chat");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  // Hydration protection flag to prevent saving empty state on reload
  const isHydratedRef = useRef(false);

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"personal" | "workspace">("personal");
  const [manualPasscodeInput, setManualPasscodeInput] = useState("");
  const [googleInputEmail, setGoogleInputEmail] = useState("");

  // Server error and auto-reload state
  const [serverErrorModal, setServerErrorModal] = useState<{ show: boolean; message: string; countdown: number }>({
    show: false,
    message: "",
    countdown: 5,
  });
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rate limit cooldown timer
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);

  // Profile
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

  // Messages
  const [profMessages, setProfMessages] = useState<Message[]>([]);
  const [studentMessages, setStudentMessages] = useState<Message[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Recording & Multilingual Translation state
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTranslatingAudio, setIsTranslatingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Tool Drawer & Modals
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const currentMessages = mode === "professional" ? profMessages : studentMessages;

  // 1. Initial Gatekeeper Validation
  useEffect(() => {
    let deviceId = localStorage.getItem("canvas_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("canvas_device_id", deviceId);
    }

    const savedPasscode = localStorage.getItem("canvas_family_passcode");
    const savedEmail = localStorage.getItem("canvas_google_email");

    if (savedEmail) {
      setGoogleEmail(savedEmail);
      setAuthenticated(true);
    } else if (savedPasscode) {
      fetch(`${BACKEND_URL}/api/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: savedPasscode, device_id: deviceId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then(() => setAuthenticated(true))
        .catch(() => {
          localStorage.removeItem("canvas_family_passcode");
          setAuthenticated(false);
        });
    } else {
      setAuthenticated(false);
    }
  }, []);

  // 2. Hydrate Profile and ALL Chat Sessions safely from localStorage
  useEffect(() => {
    // A. Profile Restoration
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

    // B. Chat History & Sessions Restoration
    const savedSessionsRaw = localStorage.getItem("canvas_all_sessions");
    const activeSessionId = localStorage.getItem("canvas_active_session_id");

    if (savedSessionsRaw) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(savedSessionsRaw);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          setSessions(parsedSessions);

          const toRestore = parsedSessions.find((s) => s.id === activeSessionId) || parsedSessions[0];
          setCurrentSessionId(toRestore.id);
          setMode(toRestore.mode);

          if (toRestore.mode === "professional") {
            setProfMessages(toRestore.messages || []);
          } else {
            setStudentMessages(toRestore.messages || []);
          }
          isHydratedRef.current = true;
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved sessions:", e);
      }
    }

    // If no existing sessions, initialize a fresh one
    const initialId = "session_" + Date.now();
    const freshSession: ChatSession = {
      id: initialId,
      title: "New Conversation",
      mode: "professional",
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions([freshSession]);
    setCurrentSessionId(initialId);
    localStorage.setItem("canvas_all_sessions", JSON.stringify([freshSession]));
    localStorage.setItem("canvas_active_session_id", initialId);
    isHydratedRef.current = true;
  }, []);

  // 3. Persistent Auto-Save Hook (Protected against blank overwrites)
  useEffect(() => {
    if (!isHydratedRef.current || !currentSessionId) return;

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

  const saveProfileData = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem("canvas_user_profile", JSON.stringify(updated));
    setShowOnboarding(false);
    if (updated.is_student) setMode("student");
    else setMode("professional");
  };

  const handleStartNewChat = () => {
    const newId = "session_" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      mode: mode,
      messages: [],
      updatedAt: Date.now(),
    };
    setCurrentSessionId(newId);
    if (mode === "professional") {
      setProfMessages([]);
    } else {
      setStudentMessages([]);
    }
    setSessions((prev) => [newSession, ...prev]);
    localStorage.setItem("canvas_active_session_id", newId);
    setSidebarOpen(false);
  };

  const handleEndThisChat = () => {
    if (!confirm("Are you sure you want to end and clear this active chat session?")) return;
    
    // Clear active messages
    if (mode === "professional") {
      setProfMessages([]);
    } else {
      setStudentMessages([]);
    }

    // Reset current session title and content
    setSessions((prevSessions) => {
      const updated = prevSessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: "New Conversation", messages: [], updatedAt: Date.now() }
          : s
      );
      localStorage.setItem("canvas_all_sessions", JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Trigger Internal Server Error Modal with Countdown Auto-Reload
  const triggerServerError = (errorText: string) => {
    setServerErrorModal({
      show: true,
      message: errorText || "Internal server error occurred or backend connection was dropped.",
      countdown: 5,
    });

    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);

    let counter = 5;
    retryIntervalRef.current = setInterval(() => {
      counter -= 1;
      setServerErrorModal((prev) => ({ ...prev, countdown: counter }));

      if (counter <= 0) {
        if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
        window.location.reload();
      }
    }, 1000);
  };

  // 5. Room-Wide Multilingual Audio Recording & Translation
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // captures all voices in the room clearly
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateWave);
      };
      updateWave();

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        stream.getTracks().forEach((track) => track.stop());
        setAudioLevel(0);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          setIsTranslatingAudio(true);
          try {
            const res = await fetch(`${BACKEND_URL}/api/translate-speech`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audio_base64: base64Audio,
                mime_type: mimeType.split(";")[0],
              }),
            });
            if (!res.ok) {
              triggerServerError(`Speech translation failed (${res.status}). Server unavailable.`);
              return;
            }
            const data = await res.json();
            if (data.text) {
              setInputValue((prev) => (prev ? `${prev} ${data.text}` : data.text));
            }
          } catch (err: any) {
            console.error("Audio translation error:", err);
            triggerServerError("Failed to connect to backend voice engine.");
          } finally {
            setIsTranslatingAudio(false);
          }
        };
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Microphone permission denied or not supported.");
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // 6. Scroll tracking
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [currentMessages, loading]);

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

  const handleExportBackup = () => {
    const backupData = JSON.stringify(sessions, null, 2);
    const blob = new Blob([backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canvas_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedSessions = JSON.parse(reader.result as string);
        if (Array.isArray(importedSessions) && importedSessions.length > 0) {
          setSessions(importedSessions);
          localStorage.setItem("canvas_all_sessions", JSON.stringify(importedSessions));
          selectSession(importedSessions[0]);
          alert("Sessions restored successfully!");
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setSelectedFile({
        base64: base64String,
        mimeType: file.type || "application/pdf",
        name: file.name
      });
      setToolDrawerOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleJobScanWorkflow = async () => {
    setLoading(true);
    setToolDrawerOpen(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/scan-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: profile.profession || "Senior Operations Executive",
          location: "Chennai"
        }),
      });
      if (!res.ok) {
        triggerServerError(`Job scan service returned ${res.status}`);
        return;
      }
      const data = await res.json();
      const jobList = data.jobs || [];
      const summaryText = "### Scanned Career Opportunities\n\n" + jobList.map((j: any, i: number) => (
        `**${i + 1}. ${j.title}**\n• Source: ${j.portal}\n• Details: ${j.snippet}\n`
      )).join("\n") + "\n*You can ask me to draft a targeted application or audit your resume for these roles.*";

      const assistantMsg: Message = {
        id: Date.now().toString(),
        sender: "assistant",
        text: summaryText,
        timestamp: Date.now(),
      };

      if (mode === "professional") setProfMessages((prev) => [...prev, assistantMsg]);
      else setStudentMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Job scan error:", err);
      triggerServerError("Could not reach backend career scan service.");
    } finally {
      setLoading(false);
    }
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMode(session.mode);
    if (session.mode === "professional") {
      setProfMessages(session.messages || []);
    } else {
      setStudentMessages(session.messages || []);
    }
    localStorage.setItem("canvas_active_session_id", session.id);
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
        handleStartNewChat();
      }
    }
  };

  const handleSend = async (customMessage?: string) => {
    if (isRecording) {
      stopRecordingAudio();
    }

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
          conversational_style: conversationalStyle,
          message: textToSend,
          history: currentMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          image_base64: filePayload ? filePayload.base64 : null,
          image_mime_type: filePayload ? filePayload.mimeType : "image/jpeg",
          google_email: googleEmail,
          device_id: localStorage.getItem("canvas_device_id")
        }),
      });

      if (!response.ok) {
        triggerServerError(`Backend returned HTTP ${response.status}. Internal engine failure.`);
        return;
      }

      if (!response.body) throw new Error("Streaming not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        if (accumulatedText.includes("[RATE_LIMIT_COOLDOWN")) {
          setRateLimitTimer(15);
          const interval = setInterval(() => {
            setRateLimitTimer((prev) => {
              if (prev && prev > 1) return prev - 1;
              clearInterval(interval);
              return null;
            });
          }, 1000);
        }

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
    } catch (err: any) {
      triggerServerError(err.message || "Lost connection to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeLogin = () => {
    const cleaned = manualPasscodeInput.trim().toLowerCase();
    if (!cleaned) return;

    fetch(`${BACKEND_URL}/api/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: cleaned }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Incorrect passcode. Please try again.");
        return res.json();
      })
      .then(() => {
        localStorage.setItem("canvas_family_passcode", cleaned);
        setAuthenticated(true);
      })
      .catch((err) => {
        alert(err.message || "Incorrect passcode.");
      });
  };

  const handleGoogleLogin = () => {
    if (!googleInputEmail.trim() || !googleInputEmail.includes("@")) {
      alert("Please enter a valid Google or Workspace email address.");
      return;
    }
    fetch(`${BACKEND_URL}/api/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ google_email: googleInputEmail.trim().toLowerCase() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Account not authorized.");
        return res.json();
      })
      .then((data) => {
        setGoogleEmail(googleInputEmail.trim().toLowerCase());
        setAccountType(data.account_type || "personal");
        localStorage.setItem("canvas_google_email", googleInputEmail.trim().toLowerCase());
        setAuthenticated(true);
      })
      .catch((err) => {
        alert(err.message || "Authentication error.");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("canvas_family_passcode");
    localStorage.removeItem("canvas_google_email");
    setGoogleEmail(null);
    setAuthenticated(false);
  };

  // Explicit strongly-typed chips to eliminate TS2339 union errors
  const professionalChips: SuggestionChip[] = [
    { label: "Scan target job openings", icon: Briefcase, action: handleJobScanWorkflow },
    { label: "Review & debug code block", icon: Code, text: "Review and debug this code block: " },
    { label: "Analyze RCM / operational workflow", icon: Search, text: "Analyze this RCM operations workflow for denials and audit risks: " },
    { label: "Draft professional follow-up", icon: FileText, text: "Draft an executive follow-up email regarding: " },
  ];

  const studentChips: SuggestionChip[] = [
    { label: "Create 5-question practice quiz", icon: HelpCircle, text: "Generate a 5-question practice quiz testing: " },
    { label: "Explain a complex topic simply", icon: BookOpen, text: "Explain this topic simply with real-world analogies: " },
    { label: "Build a 7-day study timetable", icon: GraduationCap, text: "Build a balanced 7-day study timetable for: " },
    { label: "Generate concept flashcards", icon: Sparkles, text: "Generate printable concept flashcards for: " },
  ];

  // Secure Gatekeeper Screen (Discreet inputs, no leaked examples)
  if (!authenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[#7ec5f9] via-[#bce3f9] to-[#f4f7d8] p-4">
        <div className="bg-white p-7 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 text-center space-y-4">
          <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Personal AI Canvas</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter the passcode or sign in with your Google Workspace account to open your private assistant.
          </p>

          {/* Masked Passcode Input */}
          <div className="space-y-2 pt-2 text-left">
            <label className="text-[11px] font-semibold text-slate-700 block">Passcode</label>
            <input
              type="password"
              value={manualPasscodeInput}
              onChange={(e) => setManualPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasscodeLogin()}
              placeholder="••••••••"
              className="w-full text-center px-4 py-2.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
            />
            <button
              onClick={handlePasscodeLogin}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Enter Canvas
            </button>
          </div>

          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] text-slate-400 font-semibold uppercase">Or Sign In</span>
          </div>

          {/* Google Workspace / Personal Account */}
          <div className="space-y-2 text-left">
            <label className="text-[11px] font-semibold text-slate-700 block">Google / Workspace Account</label>
            <input
              type="email"
              value={googleInputEmail}
              onChange={(e) => setGoogleInputEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGoogleLogin()}
              placeholder="name@company.com or name@gmail.com"
              className="w-full text-center px-4 py-2.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
            />
            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5" /> Continue with Google
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Works with @gmail.com or authorized work domains
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-b from-[#7ec5f9] via-[#bce3f9] to-[#f4f7d8]">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
      <input type="file" ref={importFileRef} onChange={handleImportBackup} accept="application/json" className="hidden" />

      {/* Automatic Server Error & Auto-Reload Popup */}
      {serverErrorModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-red-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Backend Connection Error</h3>
              <p className="text-xs text-slate-600 leading-relaxed px-2">
                {serverErrorModal.message}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200/80 rounded-2xl p-3">
              <p className="text-xs text-red-700 font-semibold">
                Auto-reloading application in <span className="text-red-900 font-bold text-sm">{serverErrorModal.countdown}s</span>...
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload Now
              </button>
              <button
                onClick={() => {
                  if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
                  setServerErrorModal({ show: false, message: "", countdown: 5 });
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">Personalize Your Canvas</h2>
            </div>
            <p className="text-xs text-slate-600">
              Tailor quizzes, job searches, and code explanations directly to your background.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-800">Your Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800">Age</label>
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
                    className="w-full mt-1 px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800">Primary Role</label>
                  <select
                    value={profile.is_student ? "student" : "professional"}
                    onChange={(e) => setProfile({ ...profile, is_student: e.target.value === "student" })}
                    className="w-full mt-1 px-2.5 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-sky-500"
                  >
                    <option value="professional" className="text-slate-900">Professional</option>
                    <option value="student" className="text-slate-900">Student</option>
                  </select>
                </div>
              </div>

              {profile.is_student ? (
                <div>
                  <label className="text-xs font-semibold text-slate-800">Class / Grade / Subject</label>
                  <input
                    type="text"
                    value={profile.grade_class}
                    onChange={(e) => setProfile({ ...profile, grade_class: e.target.value })}
                    placeholder="e.g. 12th Grade, Computer Science"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-sky-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-800">Profession / Domain</label>
                  <input
                    type="text"
                    value={profile.profession}
                    onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                    placeholder="e.g. Senior Process Executive / Operations"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-sky-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-800">Key Interests</label>
                <input
                  type="text"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  placeholder="e.g. RCM Operations, Python, Machine Learning"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-sky-500"
                />
              </div>

              <button
                onClick={() => saveProfileData({ ...profile, onboarded: true })}
                className="w-full mt-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                Launch My Canvas <ArrowRight className="w-4 h-4" />
              </button>
            </div>
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
            <h2 className="font-semibold text-sm text-slate-800 tracking-tight">Saved Sessions</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          <button
            onClick={handleStartNewChat}
            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Start New Chat
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleExportBackup}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"
              title="Export all sessions as JSON"
            >
              <Download className="w-3 h-3" /> Backup
            </button>
            <button
              onClick={() => importFileRef.current?.click()}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"
              title="Import JSON sessions"
            >
              <UploadCloud className="w-3 h-3" /> Restore
            </button>
          </div>
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
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="truncate max-w-[120px] font-medium">{profile.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowOnboarding(true)} className="text-slate-400 hover:text-sky-600 p-1">
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 p-1" title="Log out / Switch account">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-6 transition-all duration-300 w-full overflow-hidden">
        {/* Pinned Top Bar with Direct New Chat & End Chat Controls */}
        <header className="flex justify-between items-center max-w-5xl w-full mx-auto gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-sm border border-white/60"
              title="Chat History"
            >
              <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
            </button>

            {/* Direct Header Action: + New Chat */}
            <button
              onClick={handleStartNewChat}
              className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-white/60 shadow-xs flex items-center gap-1 transition-all"
              title="Start a new chat session"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Direct Header Action: End / Clear Chat */}
            {currentMessages.length > 0 && (
              <button
                onClick={handleEndThisChat}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold border border-white/60 shadow-xs flex items-center gap-1 transition-all"
                title="End and clear current conversation"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">End Chat</span>
              </button>
            )}
          </div>

          {/* Centered Segmented Control */}
          <div className="bg-white/80 backdrop-blur-md p-0.5 sm:p-1 rounded-full flex shadow-sm border border-white/60">
            <button
              onClick={() => setMode("professional")}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "professional"
                  ? "bg-[#0284c7] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pro
            </button>
            <button
              onClick={() => setMode("student")}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "student"
                  ? "bg-[#0284c7] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Student
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {googleEmail && (
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded-full text-slate-700 border border-white/60">
                {googleEmail}
              </span>
            )}
            <button
              onClick={() => setConversationalStyle(conversationalStyle === "chat" ? "document" : "chat")}
              className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white text-slate-700 text-[10px] sm:text-xs font-semibold border border-white/60 flex items-center gap-1 shadow-xs"
              title="Toggle between concise chat and detailed document format"
            >
              <MessageSquareQuote className="w-3 h-3 text-sky-600" />
              <span>{conversationalStyle === "chat" ? "Chat" : "Doc"}</span>
            </button>

            <button
              onClick={() => setShowOnboarding(true)}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {rateLimitTimer && (
          <div className="max-w-md w-full mx-auto my-1.5 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between shadow-xs">
            <span>Rate limit cooling down...</span>
            <span className="font-bold">{rateLimitTimer}s</span>
          </div>
        )}

        {/* Chat Stream Section */}
        <section 
          ref={chatContainerRef}
          className="flex-1 max-w-4xl w-full mx-auto my-2 sm:my-4 overflow-y-auto max-h-[64vh] pr-1 space-y-3 scroll-smooth"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-600 py-12">
              <div>
                <Sparkles className="w-9 h-9 text-sky-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">
                  Welcome back, {profile.name}!
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto px-4">
                  {mode === "professional"
                    ? `Executive workspace configured for ${profile.profession || "professionals"}. Ask questions, run job scans, or dictate in any language.`
                    : `Academic workspace for ${profile.grade_class || "students"}. Practice tests, study notes, or multi-lingual dictation.`}
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
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                
                {msg.sender === "user" ? (
                  <div className="max-w-[88%] sm:max-w-[78%] px-4 py-3 rounded-2xl rounded-br-none bg-[#0284c7] text-white text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap space-y-2">
                    {msg.image && (
                      <div className="rounded-lg overflow-hidden border border-white/30 bg-sky-800/50 p-1">
                        {msg.image.startsWith("data:application/pdf") ? (
                          <div className="flex items-center gap-2 p-2 text-xs">
                            <FileText className="w-5 h-5 text-white" />
                            <span>PDF Document Attached</span>
                          </div>
                        ) : (
                          <img src={msg.image} alt="Uploaded preview" className="max-h-48 rounded object-cover" />
                        )}
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </div>
                ) : (
                  <div className="relative max-w-[92%] sm:max-w-[85%] bg-white/95 text-slate-800 border border-white/60 rounded-2xl rounded-bl-none p-3.5 sm:p-5 shadow-sm">
                    <div className="pr-12 sm:pr-14">
                      {msg.text ? (
                        <RichTextContent 
                          content={msg.text} 
                          onExpand={() => handleSend("Please provide an in-depth, structured document breakdown of your previous response.")}
                        />
                      ) : (
                        loading && <span className="italic text-slate-400">Personalizing...</span>
                      )}
                    </div>
                    
                    {msg.text && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadDoc(msg.text, `${profile.name}_Notes`)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                          title="Download Word Document"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-600" />
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Input Bar & Actions */}
        <footer className="max-w-4xl w-full mx-auto space-y-2 relative">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {(mode === "professional" ? professionalChips : studentChips).map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (chip.action) {
                      chip.action();
                    } else if (chip.text) {
                      handleSend(chip.text);
                    }
                  }}
                  className="whitespace-nowrap flex-shrink-0 bg-white/85 hover:bg-white text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs border border-white/60"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-600" />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Slide-Up Bottom Drawer */}
          {toolDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Canvas Tools</h3>
                  <button onClick={() => setToolDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleJobScanWorkflow}
                  className="w-full text-left px-3.5 py-3 rounded-2xl text-xs font-semibold text-slate-800 hover:bg-sky-50 flex items-center gap-3 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  Run Playwright Career Scan (Chennai Roles)
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3.5 py-3 rounded-2xl text-xs font-semibold text-slate-800 hover:bg-sky-50 flex items-center gap-3 transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-sky-600" />
                  Attach Multi-Page PDF / Document
                </button>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center gap-2 bg-white border border-sky-300 px-3 py-1.5 rounded-xl text-xs text-sky-800 w-fit shadow-xs">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <span className="font-semibold truncate max-w-xs">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="p-0.5 text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Multilingual Voice Dock */}
          {isRecording ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-sky-400 p-4 transition-all">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Listening to Any Voice
                  </span>
                </div>

                {/* Animated Audio Waveform */}
                <div className="flex items-center gap-1 h-5 px-3">
                  {[0.4, 0.8, 1.2, 0.6, 1.4, 0.9, 0.5].map((multiplier, idx) => {
                    const heightPercent = Math.max(18, Math.min(100, audioLevel * multiplier));
                    return (
                      <div
                        key={idx}
                        className="w-1 bg-sky-500 rounded-full transition-all duration-75"
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={stopRecordingAudio}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Done Dictating
                </button>
              </div>

              <div className="min-h-[48px] max-h-36 overflow-y-auto text-sm text-slate-900 font-medium leading-relaxed px-1">
                {isTranslatingAudio ? (
                  <span className="text-sky-600 font-semibold animate-pulse flex items-center gap-2">
                    <Globe2 className="w-4 h-4 animate-spin" /> Translating native speech to English...
                  </span>
                ) : inputValue ? (
                  inputValue
                ) : (
                  <span className="text-slate-400 italic">
                    Anyone can speak in Tamil, Telugu, Malayalam, Hindi, or English...
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInputValue("")}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium px-2 py-1"
                >
                  Clear text
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopRecordingAudio}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Pause Mic
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Send to Canvas
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Normal High-Contrast Input Bar */
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/80 p-2 sm:p-2.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  selectedFile 
                    ? "Describe what to extract or analyze..."
                    : mode === "professional"
                    ? `Ask advice or code review for ${profile.profession}...`
                    : `Ask for quizzes or notes for ${profile.grade_class || "your subjects"}...`
                }
                className="w-full bg-white text-slate-900 px-3 py-1 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none"
              />

              <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-100">
                <button 
                  onClick={() => setToolDrawerOpen(true)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Tools"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={startRecordingAudio}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                    title="Speak in Tamil, Telugu, Malayalam, or English to transcribe"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={loading || (!inputValue.trim() && !selectedFile)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      (inputValue.trim() || selectedFile) && !loading
                        ? "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}