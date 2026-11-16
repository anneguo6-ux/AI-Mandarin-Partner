import { MessageSquareText } from "lucide-react";

interface TopBarProps {
  transcriptCount: number;
  onOpenTranscripts: () => void;
}

export function TopBar({
  transcriptCount,
  onOpenTranscripts,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 28 28"
            className="h-7 w-7 shrink-0 text-[#0F766E]"
            fill="none"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="7"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <path
              d="M9 14V14.01M14 9.5V18.5M19 12V16"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="truncate text-base font-bold text-slate-900 whitespace-nowrap">
            AI Mandarin Partner
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenTranscripts}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
          aria-label={
            transcriptCount > 0
              ? `Kāiqǐ duìhuà jìlù (${transcriptCount})`
              : "Kāiqǐ duìhuà jìlù"
          }
        >
          <MessageSquareText className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="whitespace-nowrap">
            Duìhuà jìlù{transcriptCount > 0 ? ` (${transcriptCount})` : ""}
          </span>
        </button>
      </div>
    </header>
  );
}
