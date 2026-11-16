import test from "node:test";
import assert from "node:assert/strict";
import {
  base64ToInt16Pcm,
  calculateRmsLevel,
  downsampleBuffer,
  float32ToInt16Pcm,
  int16PcmToBase64,
  int16PcmToFloat32,
} from "./audioUtils";

test("downsampleBuffer passes through when sample rates match", () => {
  const input = new Float32Array([0.1, -0.2, 0.3, -0.4]);
  const output = downsampleBuffer(input, 16000, 16000);
  assert.strictEqual(output, input);
});

test("downsampleBuffer downsamples 48kHz to 16kHz cleanly (3:1)", () => {
  const input = new Float32Array([0.3, 0.3, 0.3, -0.6, -0.6, -0.6]);
  const output = downsampleBuffer(input, 48000, 16000);
  assert.equal(output.length, 2);
  assert.ok(Math.abs(output[0] - 0.3) < 1e-5);
  assert.ok(Math.abs(output[1] - -0.6) < 1e-5);
});

test("downsampleBuffer downsamples 44.1kHz (iOS Safari) to 16kHz", () => {
  const input = new Float32Array(4410).fill(0.25);
  const output = downsampleBuffer(input, 44100, 16000);
  assert.equal(output.length, 1600);
  assert.ok(Math.abs(output[0] - 0.25) < 1e-5);
});

test("float32ToInt16Pcm and int16PcmToBase64 roundtrip accurately", () => {
  const original = new Float32Array([0, 0.5, -0.5, 1, -1]);
  const pcm16 = float32ToInt16Pcm(original);
  const b64 = int16PcmToBase64(pcm16);
  const decodedPcm16 = base64ToInt16Pcm(b64);
  const decodedFloat = int16PcmToFloat32(decodedPcm16);

  assert.equal(decodedFloat.length, original.length);
  for (let i = 0; i < original.length; i++) {
    assert.ok(Math.abs(decodedFloat[i] - original[i]) < 0.001);
  }
});

test("calculateRmsLevel clamps silence to 0 and loud signals to 1", () => {
  assert.equal(calculateRmsLevel(new Float32Array(0)), 0);
  assert.equal(calculateRmsLevel(new Float32Array([0, 0, 0])), 0);
  assert.equal(calculateRmsLevel(new Float32Array([1, -1, 1, -1])), 1);
});
