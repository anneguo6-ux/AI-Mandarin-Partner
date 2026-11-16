import { Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { TranscriptEntry } from "../utils/callState";

interface TranscriptDrawerProps {
  isOpen: boolean;
  entries: TranscriptEntry[];
  onClose: () => void;
  onClear: () => void;
}

export function TranscriptDrawer({
  isOpen,
  entries,
  onClose,
  onClear,
}: TranscriptDrawerProps) {
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, entries.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end sm:items-stretch">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Guānbì duìhuà jìlù zhēzhào"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer / Mobile Bottom Sheet */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Duìhuà jìlù"
        className="relative z-10 mt-auto flex max-h-[82dvh] w-full flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl sm:mt-0 sm:max-h-none sm:max-w-md sm:rounded-none sm:border-t-0 sm:border-l"
      >
        {/* Mobile grab handle */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden"
        />

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-base font-bold text-slate-900">Duìhuà jìlù</h2>
          <div className="flex items-center gap-1">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Qīngchú duìhuà jìlù"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Qīngchú</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Guānbì duìhuà jìlù"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {entries.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-700">
                Mùqián hái méiyǒu duìhuà jìlù
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const isTutor = entry.role === "tutor";
              return (
                <div
                  key={entry.id}
                  className={`flex flex-col ${
                    isTutor ? "items-start" : "items-end"
                  }`}
                >
                  <span className="mb-1 px-1 text-xs font-medium text-slate-500">
                    {isTutor ? "Zhōngwén hǎo péngyou" : "Nǐ"}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isTutor
                        ? "border border-slate-200 bg-slate-50 text-slate-900"
                        : "bg-[#0F766E] text-white"
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollEndRef} />
        </div>
      </section>
    </div>
  );
}
