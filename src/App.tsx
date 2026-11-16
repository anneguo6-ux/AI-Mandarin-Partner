/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { TranscriptDrawer } from "./components/TranscriptDrawer";
import { VoiceCallStage } from "./components/VoiceCallStage";
import { useLiveMandarinSession } from "./hooks/useLiveMandarinSession";

export default function App() {
  const visualizerRef = useRef<HTMLDivElement | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const {
    status,
    isMuted,
    errorMessage,
    durationSeconds,
    transcripts,
    toggleCall,
    toggleMute,
    clearTranscripts,
  } = useLiveMandarinSession(visualizerRef);

  const latestTranscript =
    transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F7F8] text-slate-900">
      <TopBar
        transcriptCount={transcripts.length}
        onOpenTranscripts={() => setIsTranscriptOpen(true)}
      />

      <VoiceCallStage
        status={status}
        isMuted={isMuted}
        errorMessage={errorMessage}
        durationSeconds={durationSeconds}
        latestTranscript={latestTranscript}
        visualizerRef={visualizerRef}
        onToggleCall={toggleCall}
        onToggleMute={toggleMute}
      />

      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        entries={transcripts}
        onClose={() => setIsTranscriptOpen(false)}
        onClear={clearTranscripts}
      />
    </div>
  );
}
