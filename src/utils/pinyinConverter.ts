import { customPinyin, pinyin } from "pinyin-pro";

/**
 * Register Taiwan Ministry of Education (教育部國語辭典 / 中文譯音使用原則)
 * standard pronunciations and Traditional Chinese polyphone disambiguations
 * so pinyin-pro outputs accurate Taiwan Mandarin readings.
 */
customPinyin(
  {
    // Traditional characters where Simplified-trained dicts often misread
    嗨: "hāi",
    嗎: "ma",
    呢: "ne",
    吧: "ba",
    的: "de",
    地: "de",
    得: "de",
    了: "le",
    著: "zhe",
    麼: "me",
    們: "men",
    誰: "shéi",

    // Common Traditional polyphone compounds
    怎麼: "zěn me",
    怎麼樣: "zěn me yàng",
    什麼: "shén me",
    為什麼: "wèi shén me",
    我們: "wǒ men",
    你們: "nǐ men",
    他們: "tā men",
    她們: "tā men",
    還是: "hái shì",
    還有: "hái yǒu",
    還沒: "hái méi",
    過得: "guò de",
    覺得: "jué de",
    記得: "jì de",
    聽得懂: "tīng de dǒng",
    看得懂: "kàn de dǒng",
    喜歡: "xǐ huan",
    朋友: "péng you",
    東西: "dōng xi",
    時候: "shí hou",
    多少: "duō shao",
    謝謝: "xiè xie",
    客氣: "kè qi",
    知道: "zhī dào",
    覺得不錯: "jué de bù cuò",
    晚上: "wǎn shang",
    早上: "zǎo shang",
    中午: "zhōng wǔ",
    下午: "xià wǔ",

    // Taiwan MOE standard pronunciations (國語一字多音審訂表)
    星期: "xīng qí",
    星期一: "xīng qí yī",
    星期二: "xīng qí èr",
    星期三: "xīng qí sān",
    星期四: "xīng qí sì",
    星期五: "xīng qí wǔ",
    星期六: "xīng qí liù",
    星期天: "xīng qí tiān",
    星期日: "xīng qí rì",
    垃圾: "lè sè",
    研究: "yán jiù",
    法國: "fà guó",
    休息: "xiū xí",
    微笑: "wéi xiào",
    危險: "wéi xiǎn",
    企業: "qì yè",
    便宜: "pián yí",
    品質: "pǐn zhí",
    教室: "jiào shì",
    助教: "zhù jiào",
    吃過: "chī guo",
    去過: "qù guo",
    看過: "kàn guo",
    聽過: "tīng guo",
    買過: "mǎi guo",
    喝過: "hē guo",
    做過: "zuò guo",
    學過: "xué guo",
    來過: "lái guo",
    台灣: "tái wān",
    臺灣: "tái wān",
    台北: "tái běi",
    臺北: "tái běi",
    台中: "tái zhōng",
    臺中: "tái zhōng",
    台南: "tái nán",
    臺南: "tái nán",
    高雄: "gāo xióng",
    花蓮: "huā lián",
    新竹: "xīn zhú",
    桃園: "táo yuán",
    華語: "huá yǔ",
    中文: "zhōng wén",
    國語: "guó yǔ",
  },
  { multiple: "replace", polyphonic: "replace" }
);

/**
 * Multi-character words that Intl.Segmenter sometimes splits or merges awkwardly,
 * mapped to their canonical Taiwan Hanyu Pinyin word groupings.
 */
const COMPOUND_SPLIT_OVERRIDES: Record<string, string[]> = {
  做什麼: ["做", "什麼"],
  去哪裡: ["去", "哪裡"],
  吃什麼: ["吃", "什麼"],
  喝什麼: ["喝", "什麼"],
  我是: ["我", "是"],
  你是: ["你", "是"],
  你的: ["你", "的"],
  我的: ["我", "的"],
  想去: ["想", "去"],
  想吃: ["想", "吃"],
  想喝: ["想", "喝"],
  我去: ["我", "去"],
  你去: ["你", "去"],
  我吃: ["我", "吃"],
  你吃: ["你", "吃"],
  很好: ["很", "好"],
  太好了: ["太", "好", "了"],
  沒關係: ["沒關係"],
  對不起: ["對不起"],
  不客氣: ["不客氣"],
  珍珠奶茶: ["珍珠", "奶茶"],
  台灣小吃: ["台灣", "小吃"],
  臺灣小吃: ["臺灣", "小吃"],
  便利商店: ["便利", "商店"],
  超級市場: ["超級", "市場"],
  好嗎: ["好", "嗎"],
  對嗎: ["對", "嗎"],
  是嗎: ["是", "嗎"],
  好吧: ["好", "吧"],
  對吧: ["對", "吧"],
  走吧: ["走", "吧"],
  你呢: ["你", "呢"],
  您呢: ["您", "呢"],
  他呢: ["他", "呢"],
  她呢: ["她", "呢"],
  好朋友: ["好", "朋友"],
};

const PROPER_NOUN_WORDS = new Set([
  "台灣",
  "臺灣",
  "台北",
  "臺北",
  "台中",
  "臺中",
  "台南",
  "臺南",
  "高雄",
  "花蓮",
  "新竹",
  "桃園",
  "西安",
  "華語",
  "中文",
  "國語",
  "法國",
  "美國",
  "日本",
  "英國",
  "韓國",
  "天安門",
]);

const PUNCTUATION_MAP: Record<string, string> = {
  "，": ", ",
  "。": ". ",
  "！": "! ",
  "？": "? ",
  "、": ", ",
  "：": ": ",
  "；": "; ",
  "（": " (",
  "）": ") ",
  "「": '"',
  "」": '"',
  "『": '"',
  "』": '"',
  "“": '"',
  "”": '"',
  "’": "'",
  "‘": "'",
  "…": "...",
  "—": " - ",
};

const AEO_START_REGEX = /^[aeoāáǎàēéěèōóǒò]/i;
const HAN_CHAR_REGEX = /\p{Script=Han}/u;

let cachedSegmenter: Intl.Segmenter | null = null;
function getSegmenter(): Intl.Segmenter | null {
  if (cachedSegmenter) return cachedSegmenter;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    cachedSegmenter = new Intl.Segmenter("zh-Hant-TW", {
      granularity: "word",
    });
  }
  return cachedSegmenter;
}

/**
 * Joins syllables of a single Chinese word according to Hanyu Pinyin orthography,
 * inserting an apostrophe (') before non-initial syllables starting with a/o/e.
 */
export function joinSyllablesWithApostrophe(syllables: string[]): string {
  if (syllables.length === 0) return "";
  let joined = syllables[0];
  for (let i = 1; i < syllables.length; i++) {
    const next = syllables[i];
    if (!next) continue;
    if (AEO_START_REGEX.test(next)) {
      joined += `'${next}`;
    } else {
      joined += next;
    }
  }
  return joined;
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function expandSubSegments(segment: string): string[] {
  if (COMPOUND_SPLIT_OVERRIDES[segment]) {
    return COMPOUND_SPLIT_OVERRIDES[segment];
  }
  if (segment.length >= 2 && /[嗎呢吧]$/.test(segment)) {
    const stem = segment.slice(0, -1);
    const particle = segment.slice(-1);
    return [...expandSubSegments(stem), particle];
  }
  // Pre-split common 2-char prefixes like 下課 -> 下課, 我喜歡 -> 我 + 喜歡
  for (const [key, parts] of Object.entries(COMPOUND_SPLIT_OVERRIDES)) {
    if (segment.length > key.length && segment.startsWith(key)) {
      return [...parts, ...expandSubSegments(segment.slice(key.length))];
    }
  }
  return [segment];
}

function convertHanWordToPinyin(word: string): string {
  const syllables = pinyin(word, {
    type: "array",
    toneType: "symbol",
    toneSandhi: false,
    v: false,
    nonZh: "consecutive",
  });

  const cleanSyllables = syllables
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !HAN_CHAR_REGEX.test(s));

  if (cleanSyllables.length === 0) {
    return "";
  }

  let joined = joinSyllablesWithApostrophe(cleanSyllables);
  if (PROPER_NOUN_WORDS.has(word)) {
    joined = capitalizeWord(joined);
  }
  return joined;
}

function segmentChineseText(input: string): string[] {
  const segmenter = getSegmenter();
  if (!segmenter) {
    return Array.from(input);
  }
  const rawSegments = Array.from(segmenter.segment(input)).map(
    (item) => item.segment
  );

  // Merge adjacent single characters that form well-known Taiwan 2-char words
  const merged: string[] = [];
  const MERGE_PAIRS = new Set([
    "下課",
    "上課",
    "上班",
    "下班",
    "吃過",
    "去過",
    "看過",
    "台灣",
    "臺灣",
    "台北",
    "臺北",
    "台中",
    "臺中",
    "台南",
    "臺南",
    "華語",
    "助教",
    "小吃",
    "夜市",
    "捷運",
    "週末",
    "放假",
    "平常",
    "通常",
    "喜歡",
    "朋友",
    "時候",
  ]);

  for (let i = 0; i < rawSegments.length; i++) {
    const curr = rawSegments[i];
    const next = rawSegments[i + 1];
    if (next && MERGE_PAIRS.has(curr + next)) {
      merged.push(curr + next);
      i++;
    } else {
      merged.push(curr);
    }
  }

  return merged.flatMap(expandSubSegments);
}

/**
 * Converts Traditional Chinese text into Taiwan official Hanyu Pinyin
 * (教育部漢語拼音規則 + 正詞法), ensuring zero Chinese characters remain.
 */
export function toTaiwanHanyuPinyin(text: string): string {
  if (!text) return "";

  const tokens = segmentChineseText(text);
  let out = "";

  for (const token of tokens) {
    if (!token) continue;

    if (PUNCTUATION_MAP[token]) {
      const mapped = PUNCTUATION_MAP[token];
      if (out.endsWith(" ") && (mapped.startsWith(",") || mapped.startsWith(".") || mapped.startsWith("!") || mapped.startsWith("?") || mapped.startsWith(":") || mapped.startsWith(";"))) {
        out = out.trimEnd();
      }
      out += mapped;
      continue;
    }

    if (/^[,.!?:;)\]]+$/.test(token)) {
      out = out.trimEnd() + token + " ";
      continue;
    }

    if (/^\s+$/.test(token)) {
      if (!out.endsWith(" ") && out.length > 0) {
        out += " ";
      }
      continue;
    }

    if (HAN_CHAR_REGEX.test(token)) {
      const py = convertHanWordToPinyin(token);
      if (py) {
        if (
          out.length > 0 &&
          !out.endsWith(" ") &&
          !out.endsWith('"') &&
          !out.endsWith("(")
        ) {
          out += " ";
        }
        out += py;
      }
      continue;
    }

    // Latin / numbers (e.g. "A1", "TOCFL", "AI")
    if (
      out.length > 0 &&
      !out.endsWith(" ") &&
      !out.endsWith('"') &&
      !out.endsWith("(")
    ) {
      out += " ";
    }
    out += token;
  }

  // Normalize spacing & capitalize sentence starts
  const normalized = out
    .replace(/\s+([,.!?:;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter of string and after . ! ?
  return normalized.replace(/(^|[.!?]\s+)(\p{L})/gu, (_m, prefix, ch) => {
    return `${prefix}${ch.toUpperCase()}`;
  });
}
