import test from "node:test";
import assert from "node:assert/strict";
import {
  joinSyllablesWithApostrophe,
  toTaiwanHanyuPinyin,
} from "./pinyinConverter";

const HAS_HANZI = /\p{Script=Han}/u;

test("joinSyllablesWithApostrophe inserts apostrophe before a/e/o-initial syllables", () => {
  assert.equal(joinSyllablesWithApostrophe(["xī", "ān"]), "xī'ān");
  assert.equal(joinSyllablesWithApostrophe(["tiān", "ān", "mén"]), "tiān'ānmén");
  assert.equal(joinSyllablesWithApostrophe(["pí", "ǎo"]), "pí'ǎo");
  assert.equal(joinSyllablesWithApostrophe(["nǚ", "ér"]), "nǚ'ér");
  assert.equal(joinSyllablesWithApostrophe(["tái", "wān"]), "táiwān");
});

test("toTaiwanHanyuPinyin converts greetings and TOCFL A sentences with zero Hanzi", () => {
  const greeting = toTaiwanHanyuPinyin(
    "嗨！你好！我是你的華語口說助教。今天過得怎麼樣？"
  );
  assert.equal(HAS_HANZI.test(greeting), false);
  assert.match(greeting, /^Hāi! Nǐhǎo!/);
  assert.match(greeting, /Huáyǔ/);
  assert.match(greeting, /zhùjiào/);
  assert.match(greeting, /guòde/);
  assert.match(greeting, /zěnmeyàng\?$/);

  const friendGreeting = toTaiwanHanyuPinyin(
    "嗨！你好！我是你的中文好朋友。今天過得怎麼樣？"
  );
  assert.equal(HAS_HANZI.test(friendGreeting), false);
  assert.match(friendGreeting, /^Hāi! Nǐhǎo!/);
  assert.match(friendGreeting, /Zhōngwén hǎo péngyou/);
  assert.match(friendGreeting, /guòde/);
  assert.match(friendGreeting, /zěnmeyàng\?$/);

  const food = toTaiwanHanyuPinyin("你吃過台灣小吃嗎？");
  assert.equal(HAS_HANZI.test(food), false);
  assert.equal(food, "Nǐ chīguo Táiwān xiǎochī ma?");

  const afterClass = toTaiwanHanyuPinyin("下課以後，你通常做什麼？");
  assert.equal(HAS_HANZI.test(afterClass), false);
  assert.equal(afterClass, "Xiàkè yǐhòu, nǐ tōngcháng zuò shénme?");
});

test("toTaiwanHanyuPinyin applies Taiwan MOE standard readings and apostrophe rules", () => {
  const sample = toTaiwanHanyuPinyin(
    "星期天我去台北和西安玩，喝珍珠奶茶，休息一下。"
  );
  assert.equal(HAS_HANZI.test(sample), false);
  assert.match(sample, /Xīngqítiān/);
  assert.match(sample, /Táiběi/);
  assert.match(sample, /Xī'ān/);
  assert.match(sample, /xiūxí/);
  assert.match(sample, /yīxià/);

  const weekend = toTaiwanHanyuPinyin("我們週末去夜市喝珍珠奶茶，好嗎？");
  assert.equal(HAS_HANZI.test(weekend), false);
  assert.equal(weekend, "Wǒmen zhōumò qù yèshì hē zhēnzhū nǎichá, hǎo ma?");

  const study = toTaiwanHanyuPinyin("你今天在學校學了什麼？還是我們去吃牛肉麵？");
  assert.equal(HAS_HANZI.test(study), false);
  assert.match(study, /xué le/);
  assert.match(study, /Háishì/);
  assert.match(study, /niúròumiàn/);
});

