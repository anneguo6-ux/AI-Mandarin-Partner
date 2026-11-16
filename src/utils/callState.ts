import { toTaiwanHanyuPinyin } from "./pinyinConverter";

export type CallStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export type SpeakerRole = "tutor" | "student";

export interface TranscriptEntry {
  id: string;
  role: SpeakerRole;
  rawText: string;
  text: string;
  timestamp: number;
}

export interface StatusMeta {
  statusLabel: string;
  buttonLabel: string;
  helperText: string;
  isActiveCall: boolean;
}

export function getCallStatusMeta(
  status: CallStatus,
  isMuted: boolean = false
): StatusMeta {
  switch (status) {
    case "connecting":
      return {
        statusLabel: "Liánxiàn zhōng",
        buttonLabel: "Liánxiàn zhōng",
        helperText: "",
        isActiveCall: true,
      };
    case "listening":
      return {
        statusLabel: isMuted ? "Màikèfēng yǐ jìngyīn" : "Língtīng zhōng",
        buttonLabel: "Jiéshù tōnghuà",
        helperText: "",
        isActiveCall: true,
      };
    case "speaking":
      return {
        statusLabel: "Hǎo péngyou shuōhuà zhōng",
        buttonLabel: "Jiéshù tōnghuà",
        helperText: "",
        isActiveCall: true,
      };
    case "error":
      return {
        statusLabel: "Liánxiàn zhōngduàn",
        buttonLabel: "Chóngxīn kāishǐ tōnghuà",
        helperText: "",
        isActiveCall: false,
      };
    case "idle":
    default:
      return {
        statusLabel: "",
        buttonLabel: "Kāishǐ tōnghuà",
        helperText: "",
        isActiveCall: false,
      };
  }
}

export function formatCallDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Appends a streaming transcription fragment to the transcript list,
 * merging consecutive raw Chinese fragments from the same speaker turn
 * and rendering the full merged text in Taiwan official Hanyu Pinyin.
 */
export function appendTranscriptDelta(
  entries: TranscriptEntry[],
  role: SpeakerRole,
  delta: string,
  options?: {
    forceNewEntry?: boolean;
    createId?: () => string;
    now?: number;
  }
): TranscriptEntry[] {
  const cleaned = delta.replace(/\r?\n/g, " ").trim();
  if (!cleaned) {
    return entries;
  }

  const createId =
    options?.createId ??
    (() => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const now = options?.now ?? Date.now();
  const forceNewEntry = options?.forceNewEntry ?? false;

  const last = entries[entries.length - 1];
  if (last && last.role === role && !forceNewEntry) {
    const needsSpace =
      /[a-zA-Z0-9]$/.test(last.rawText) && /^[a-zA-Z0-9]/.test(cleaned);
    const nextRaw = `${last.rawText}${needsSpace ? " " : ""}${cleaned}`;
    const updated: TranscriptEntry = {
      ...last,
      rawText: nextRaw,
      text: toTaiwanHanyuPinyin(nextRaw),
    };
    return [...entries.slice(0, -1), updated];
  }

  return [
    ...entries,
    {
      id: createId(),
      role,
      rawText: cleaned,
      text: toTaiwanHanyuPinyin(cleaned),
      timestamp: now,
    },
  ];
}

export function mapMicrophoneError(
  errorName?: string,
  errorMessage?: string
): string {
  const name = (errorName ?? "").toLowerCase();
  const msg = (errorMessage ?? "").toLowerCase();

  if (name === "notallowederror" || name === "permissiondeniederror") {
    return "Wúfǎ qǔdé màikèfēng quánxiàn. Qǐng zài shǒujī Safari huò Chrome de wǎngzhàn shèdìng zhōng yǔnxǔ shǐyòng màikèfēng.";
  }
  if (name === "notfounderror" || name === "devicesnotfounderror") {
    return "Zhǎobùdào kěyòng de màikèfēng zhuāngzhì, qǐng quèrèn shèbèi shìfǒu yǐ liánjiē màikèfēng.";
  }
  if (name === "notreadableerror" || name === "trackstarterror") {
    return "Màikèfēng mùqián zhèng bèi qítā yìngyòng chéngshì zhànyòng, qǐng guānbì hòu zài shì yīcì.";
  }
  if (name === "insecurecontexterror" || msg.includes("secure context")) {
    return "Liúlǎnqì yāoqiú zài ānquán liánxiàn (HTTPS) xià cái néng kāiqǐ màikèfēng.";
  }
  return "Wúfǎ kāiqǐ màikèfēng, qǐng quèrèn liúlǎnqì zhīyuán yǔyīn gōngnéng yǔ quánxiàn shèdìng.";
}
