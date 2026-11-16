import test from "node:test";
import assert from "node:assert/strict";
import {
  appendTranscriptDelta,
  formatCallDuration,
  getCallStatusMeta,
  mapMicrophoneError,
} from "./callState";

const HAS_HANZI = /\p{Script=Han}/u;

test("getCallStatusMeta returns Hanyu Pinyin statuses with no Hanzi and empty idle status/helper", () => {
  const idle = getCallStatusMeta("idle");
  assert.equal(idle.statusLabel, "");
  assert.equal(idle.helperText, "");
  assert.equal(idle.buttonLabel, "Kāishǐ tōnghuà");

  assert.equal(getCallStatusMeta("connecting").statusLabel, "Liánxiàn zhōng");
  assert.equal(getCallStatusMeta("listening").statusLabel, "Língtīng zhōng");
  assert.equal(
    getCallStatusMeta("listening", true).statusLabel,
    "Màikèfēng yǐ jìngyīn"
  );
  assert.equal(
    getCallStatusMeta("speaking").statusLabel,
    "Hǎo péngyou shuōhuà zhōng"
  );
  assert.equal(getCallStatusMeta("speaking").buttonLabel, "Jiéshù tōnghuà");

  for (const status of ["idle", "connecting", "listening", "speaking", "error"] as const) {
    const meta = getCallStatusMeta(status);
    assert.equal(HAS_HANZI.test(meta.statusLabel), false);
    assert.equal(HAS_HANZI.test(meta.buttonLabel), false);
    assert.equal(meta.helperText, "");
  }
});

test("formatCallDuration formats mm:ss with zero-padding", () => {
  assert.equal(formatCallDuration(0), "00:00");
  assert.equal(formatCallDuration(9), "00:09");
  assert.equal(formatCallDuration(65), "01:05");
  assert.equal(formatCallDuration(-3), "00:00");
});

test("appendTranscriptDelta merges fragments and converts display text to Taiwan Hanyu Pinyin with zero Hanzi", () => {
  let list = appendTranscriptDelta([], "tutor", "嗨！你好！", {
    createId: () => "1",
    now: 1000,
  });
  list = appendTranscriptDelta(list, "tutor", "今天過得怎麼樣？", {
    createId: () => "2",
    now: 1100,
  });
  assert.equal(list.length, 1);
  assert.equal(HAS_HANZI.test(list[0].text), false);
  assert.match(list[0].text, /^Hāi! Nǐhǎo!/);
  assert.match(list[0].text, /zěnmeyàng\?$/);

  list = appendTranscriptDelta(list, "student", "我今天很好。", {
    createId: () => "3",
    now: 2000,
  });
  assert.equal(list.length, 2);
  assert.equal(HAS_HANZI.test(list[1].text), false);
  assert.equal(list[1].text, "Wǒ jīntiān hěn hǎo.");

  list = appendTranscriptDelta(list, "tutor", "你吃過台灣小吃嗎？", {
    forceNewEntry: true,
    createId: () => "4",
    now: 3000,
  });
  assert.equal(list.length, 3);
  assert.equal(HAS_HANZI.test(list[2].text), false);
  assert.equal(list[2].text, "Nǐ chīguo Táiwān xiǎochī ma?");
});

test("mapMicrophoneError returns Hanyu Pinyin guidance with zero Hanzi", () => {
  for (const name of ["NotAllowedError", "NotFoundError", "NotReadableError", "Unknown"]) {
    const msg = mapMicrophoneError(name);
    assert.equal(HAS_HANZI.test(msg), false);
    assert.ok(msg.length > 10);
  }
});
