import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("index.html is a self-contained single HTML file with inline CSS, inline JS, and zero Hanzi", () => {
  const htmlPath = path.resolve(process.cwd(), "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.match(html, /<style>[\s\S]+<\/style>/);
  assert.match(html, /<script>[\s\S]+<\/script>/);
  assert.equal(/<link[^>]+rel=["']stylesheet["']/i.test(html), false);
  assert.equal(/<script[^>]+src=/i.test(html), false);
  assert.equal(/\p{Script=Han}/u.test(html), false);

  assert.match(html, /AI Zhōngwén Hǎo Péngyou/);
  assert.match(html, /Kāishǐ tōnghuà/);
  assert.match(html, /getUserMedia/);
  assert.match(html, /new WebSocket/);
  assert.match(html, /\/live/);
});
