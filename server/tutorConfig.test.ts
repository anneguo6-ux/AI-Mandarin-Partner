import test from "node:test";
import assert from "node:assert/strict";
import { Modality } from "@google/genai";
import {
  buildLiveConnectConfig,
  formatServerErrorMessage,
  LIVE_MODEL,
  PROACTIVE_GREETING_TRIGGER,
  PROACTIVE_OPENING_LINE,
  TUTOR_SYSTEM_INSTRUCTION,
  TUTOR_VOICE_NAME,
} from "./tutorConfig";

test("Live API config uses gemini-3.8-live, Kore voice, and AUDIO modality with transcriptions", () => {
  assert.equal(LIVE_MODEL, "gemini-3.8-live");
  assert.equal(TUTOR_VOICE_NAME, "Kore");
  const config = buildLiveConnectConfig();
  assert.deepEqual(config.responseModalities, [Modality.AUDIO]);
  assert.ok(config.inputAudioTranscription);
  assert.ok(config.outputAudioTranscription);
});

test("System instruction enforces TOCFL Band A, everyday Taiwan Mandarin, pragmatics, and particle limits", () => {
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /台灣中文好朋友/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /TOCFL A 級/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /台灣日常生活中大家常說的自然華語/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /不可用「活動/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /你吃過台灣小吃嗎/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /下課以後，你通常做什麼/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /減少多餘的句尾語氣詞/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /2 到 3 句話以內/);
  assert.match(TUTOR_SYSTEM_INSTRUCTION, /先肯定 -> 溫柔重述正確說法 -> 邀請跟讀/);
  assert.ok(TUTOR_SYSTEM_INSTRUCTION.includes(PROACTIVE_OPENING_LINE));
  assert.ok(PROACTIVE_GREETING_TRIGGER.includes(PROACTIVE_OPENING_LINE));
});

test("formatServerErrorMessage translates Gemini API errors cleanly in Hanyu Pinyin", () => {
  const hasHanzi = /\p{Script=Han}/u;
  const keyMsg = formatServerErrorMessage(new Error("API_KEY_INVALID"));
  assert.match(keyMsg, /GEMINI_API_KEY/);
  assert.equal(hasHanzi.test(keyMsg), false);

  const quotaMsg = formatServerErrorMessage(new Error("RESOURCE_EXHAUSTED 429"));
  assert.match(quotaMsg, /édù yǐ mǎn/);
  assert.equal(hasHanzi.test(quotaMsg), false);

  const notFoundMsg = formatServerErrorMessage(new Error("404 NOT_FOUND"));
  assert.match(notFoundMsg, /Gemini Live/);
  assert.equal(hasHanzi.test(notFoundMsg), false);

  const genericMsg = formatServerErrorMessage(new Error("UNKNOWN"));
  assert.match(genericMsg, /Yǔyīn liánxiàn/);
  assert.equal(hasHanzi.test(genericMsg), false);
});

