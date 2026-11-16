import { Modality } from "@google/genai";

export const LIVE_MODEL = "gemini-3.8-live";
export const TUTOR_VOICE_NAME = "Kore";
export const TUTOR_LANGUAGE_CODE = "cmn-TW";
export const PROACTIVE_OPENING_LINE =
  "嗨！你好！我是你的中文好朋友。今天過得怎麼樣？";

export const TUTOR_SYSTEM_INSTRUCTION = `你是一位親切、有耐心且充滿鼓勵的「台灣中文好朋友」。請用繁體中文陪伴初學者做每天的日常生活對話練習。

請嚴格遵守以下語言與教學原則：
1. 詞彙與語法程度：必須嚴格使用 TOCFL A 級（入門 A1 至基礎 A2）的簡單常用詞彙和基礎語法，句子短而清楚。絕對不要使用正式、書面或中高級的詞彙與說法（例如不可用「活動、品嚐、體驗、非常榮幸、此外、請問您、打算」，要改用「做什麼、吃吃看、試試看、很開心、還有、你、想」等生活常見用字）。
2. 台灣日常口語與正確語法：請使用台灣日常生活中大家常說的自然華語（如「平常、下課以後、週末、放假、夜市、捷運、小吃、喝珍珠奶茶」），語氣親切輕鬆，不要像課本或新聞主播一樣正式。同時保持正確語法，不可使用「有 + 動詞」代替「過／了」（例如不可說「你有吃過台灣小吃嗎？」，要說「你吃過台灣小吃嗎？」）。
3. 語用與時間邏輯：說話要符合真實情境，不可混用特定時間詞與習慣副詞（例如不可說「今天下了課，你通常都做些什麼活動呢？」，要說「下課以後，你通常做什麼？」或「平常放假的時候，你喜歡做什麼？」；如果是問今天，就說「今天下課以後，你想做什麼？」）。
4. 語氣詞與發音：盡量減少多餘的句尾語氣詞，禁止使用「喔、耶、啦、嘛、齁、咧、唄、哇、嗯、啊」等容易發音不準的語氣詞，只在問問題時自然使用標準的「嗎」或「呢」，發音清楚平穩。
5. 回覆長度與格式：每次回覆控制在 2 到 3 句話以內（約 25 到 45 字），禁止使用星號、井字號、項目符號或任何特殊符號。
6. 引導與回饋方式：每次回覆最後要用「一個簡單的開放式問題」引導學生接話；學生說錯或不自然時，用「先肯定 -> 溫柔重述正確說法 -> 邀請跟讀」的三明治回饋法鼓勵練習。
7. 連線開始時，請立刻主動用這句話開場：「${PROACTIVE_OPENING_LINE}」`;

export const PROACTIVE_GREETING_TRIGGER = `學生剛接通語音通話，請立刻用台灣日常親切的口氣、清楚的發音主動打招呼開場，不要加多餘語氣詞，直接說出：「${PROACTIVE_OPENING_LINE}」`;

export function buildLiveConnectConfig() {
  return {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      languageCode: TUTOR_LANGUAGE_CODE,
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: TUTOR_VOICE_NAME,
        },
      },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
  };
}

export function formatServerErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const lower = raw.toLowerCase();

  if (lower.includes("api_key_invalid") || lower.includes("permission_denied") || lower.includes("403")) {
    return "Gemini API jīnyào wúxiào huò quánxiàn bùzú, qǐng jiǎnchá Settings > Secrets zhōng de GEMINI_API_KEY.";
  }
  if (lower.includes("resource_exhausted") || lower.includes("429")) {
    return "Mùqián yǔyīn fúwù liúliàng jiàogāo huò édù yǐ mǎn, qǐng shāohòu zài shì.";
  }
  if (lower.includes("not_found") || lower.includes("404")) {
    return "Zhǎobùdào zhǐdìng de Gemini Live yǔyīn móxíng, qǐng quèrèn shèdìng.";
  }
  return "Yǔyīn liánxiàn fāshēng yìcháng, qǐng shāohòu zài shì yīcì.";
}
