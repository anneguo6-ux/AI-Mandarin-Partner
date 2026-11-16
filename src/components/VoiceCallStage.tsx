import {
  AlertCircle,
  AudioLines,
  Ear,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
} from "lucide-react";
import type { RefObject } from "react";
import {
  CallStatus,
  formatCallDuration,
  getCallStatusMeta,
  TranscriptEntry,
} from "../utils/callState";

interface VoiceCallStageProps {
  status: CallStatus;
  isMuted: boolean;
  errorMessage: string | null;
  durationSeconds: number;
  latestTranscript: TranscriptEntry | null;
  visualizerRef: RefObject<HTMLDivElement | null>;
  onToggleCall: () => void;
  onToggleMute: () => void;
}

export function VoiceCallStage({
  status,
  isMuted,
  errorMessage,
  durationSeconds,
  latestTranscript,
  visualizerRef,
  onToggleCall,
  onToggleMute,
}: VoiceCallStageProps) {
  const meta = getCallStatusMeta(status, isMuted);
  const isConnecting = status === "connecting";
  const isListening = status === "listening";
  const isSpeaking = status === "speaking";
  const isLive = isListening || isSpeaking;

  const buttonClasses = isLive
    ? "bg-[#BE123C] hover:bg-[#9F1239] text-white shadow-xl shadow-rose-900/20 focus-visible:ring-rose-500/35"
    : isConnecting
      ? "bg-slate-800 hover:bg-slate-700 text-white shadow-lg shadow-slate-900/15 focus-visible:ring-slate-500/35"
      : "bg-[#0F766E] hover:bg-[#0D9488] text-white shadow-xl shadow-teal-900/20 focus-visible:ring-teal-600/35";

  const ringColorClass = isSpeaking
    ? "border-blue-500/25 bg-blue-500/5"
    : isListening
      ? "border-rose-500/25 bg-rose-500/5"
      : "border-teal-600/15 bg-teal-600/5";

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(15,118,110,0.055)_0%,transparent_58%)]"
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        {/* Title in Taiwan Official Hanyu Pinyin */}
        <h1 className="text-balance text-2xl font-bold text-slate-900 sm:text-4xl">
          AI Zhōngwén Hǎo Péngyou
        </h1>

        {/* Central Focal Anchor: Microphone / Call Button */}
        <div
          ref={visualizerRef}
          style={{ "--voice-energy": "0" } as React.CSSProperties}
          className="relative my-9 flex items-center justify-center sm:my-11"
        >
          {/* Outer voice-reactive acoustic ring (compositor-only transform) */}
          <div
            aria-hidden="true"
            className={`motion-safe-only pointer-events-none absolute h-48 w-48 rounded-full border transition-transform duration-150 ease-out sm:h-56 sm:w-56 ${
              isLive
                ? ringColorClass
                : "border-teal-800/10 bg-teal-700/[0.02]"
            }`}
            style={{
              transform: isLive
                ? "scale(calc(1 + var(--voice-energy, 0) * 0.24))"
                : "scale(1)",
              opacity: isLive ? 0.9 : 0.75,
            }}
          />
          <div
            aria-hidden="true"
            className={`motion-safe-only pointer-events-none absolute h-40 w-40 rounded-full border transition-transform duration-100 ease-out sm:h-48 sm:w-48 ${
              isLive
                ? ringColorClass
                : "border-teal-800/15 bg-teal-700/[0.03]"
            }`}
            style={{
              transform: isLive
                ? "scale(calc(1 + var(--voice-energy, 0) * 0.14))"
                : "scale(1)",
              opacity: 1,
            }}
          />

          <button
            type="button"
            onClick={onToggleCall}
            data-testid="call-toggle-button"
            data-call-status={status}
            aria-label={meta.buttonLabel}
            className={`relative z-10 flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full px-3 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-4 sm:h-42 sm:w-42 ${buttonClasses}`}
          >
            {isConnecting ? (
              <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />
            ) : isLive ? (
              <PhoneOff className="h-10 w-10" aria-hidden="true" />
            ) : (
              <Mic className="h-11 w-11" aria-hidden="true" />
            )}
            <span className="text-center text-xs font-semibold leading-tight tracking-wide sm:text-sm">
              {meta.buttonLabel}
            </span>
          </button>
        </div>

        {/* Status Indicator (shown during active/connecting/error states; omitted on idle) */}
        {status !== "idle" && (
          <div
            role="status"
            aria-live="polite"
            aria-label={meta.statusLabel}
            data-testid="call-status-label"
            className="flex items-center justify-center gap-2 text-base font-semibold text-slate-900"
          >
            {status === "connecting" && (
              <Loader2
                className="h-4 w-4 animate-spin text-slate-600"
                aria-hidden="true"
              />
            )}
            {status === "listening" &&
              (isMuted ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#BE123C]">
                  <Ear className="h-4 w-4" aria-hidden="true" />
                </span>
              ))}
            {status === "speaking" && (
              <AudioLines className="h-4 w-4 text-blue-700" aria-hidden="true" />
            )}
            {status === "error" && (
              <AlertCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
            )}
            {status !== "listening" && <span>{meta.statusLabel}</span>}
          </div>
        )}

        {/* Secondary Active Call Controls: Icon-only Mute + Duration Timer */}
        {isLive && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onToggleMute}
              data-testid="mute-toggle-button"
              aria-pressed={isMuted}
              aria-label={isMuted ? "Qǔxiāo jìngyīn" : "Màikèfēng jìngyīn"}
              title={isMuted ? "Qǔxiāo jìngyīn" : "Màikèfēng jìngyīn"}
              className={`inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                isMuted
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Mic className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <span
              aria-label="Tōnghuà shíjiān"
              className="font-mono-timer inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700"
            >
              {formatCallDuration(durationSeconds)}
            </span>
          </div>
        )}

        {/* Error Alert (Permission / Connection recovery in Hanyu Pinyin) */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 flex w-full max-w-md items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-left text-sm leading-relaxed text-rose-900"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"
              aria-hidden="true"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Subtitle Card in Taiwan Official Hanyu Pinyin */}
        {!errorMessage && latestTranscript && (
          <div className="mt-7 w-full max-w-md rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-left shadow-xs">
            <div className="text-xs font-semibold text-slate-500">
              {latestTranscript.role === "tutor" ? "Zhōngwén hǎo péngyou" : "Nǐ"}
            </div>
            <p className="mt-1 text-base leading-relaxed text-slate-900 sm:text-lg">
              {latestTranscript.text}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
