"use client";

import React from "react";
import { StudentQuotesTicker, StudyRoomPresetGrid, StudyRoomPreset, StudyQuote } from "./StudentSection";

export default function StudentBanner({
  onSelectPrompt,
}: {
  onSelectPrompt: (promptText: string) => void;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto px-3 my-2 space-y-2">
      <StudentQuotesTicker
        onSelectQuote={(q: StudyQuote) =>
          onSelectPrompt(`Let's reflect on this quote: "${q.quote}"`)
        }
      />
      <StudyRoomPresetGrid
        onSelectPreset={(p: StudyRoomPreset) => onSelectPrompt(p.suggestedPrompt)}
      />
    </div>
  );
}
