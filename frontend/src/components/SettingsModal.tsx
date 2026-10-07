"use client";

import React, { useState } from "react";
import { X, Settings, User, Key, ExternalLink, GraduationCap, Briefcase, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    email: string;
    avatarUrl: string;
    role: "student" | "professional";
    ageGroup: string;
    customApiKey: string;
  };
  onSaveProfile: (profile: any) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}: SettingsModalProps) {
  const [role, setRole] = useState<"student" | "professional">(userProfile.role);
  const [ageGroup, setAgeGroup] = useState(userProfile.ageGroup);
  const [apiKey, setApiKey] = useState(userProfile.customApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...userProfile,
      role,
      ageGroup,
      customApiKey: apiKey,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Genie Workspace Preferences</h3>
              <p className="text-[11px] text-slate-400">Configure profile, persona, and API keys</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-8 text-center text-sm font-semibold text-emerald-600 flex flex-col items-center gap-2">
            <Check className="w-8 h-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
            <span>Preferences saved successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Account Card */}
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-800 block truncate">{userProfile.name}</span>
                <span className="text-xs text-slate-500 block truncate">{userProfile.email}</span>
                <span className="text-[10px] text-pink-600 font-semibold uppercase tracking-wider">
                  Google Workspace Connected
                </span>
              </div>
            </div>

            {/* Persona Switch: Student vs Professional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Workflow Persona</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all ${
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
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all ${
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

            {/* Age Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Age Demographic</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              >
                <option value="teen">Under 18 (School & Foundational)</option>
                <option value="college">18 – 24 (University / Early Career)</option>
                <option value="pro">25 – 45 (Working Professional / Enterprise)</option>
                <option value="senior">45+ (Executive & Senior Leadership)</option>
              </select>
            </div>

            {/* BYOK / API Key Purchase Hub */}
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
                  <span>Get Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini / OpenAI / Claude Key)"
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Supplying your own API key removes all daily VIP caps and provides unlimited high-throughput streaming.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}