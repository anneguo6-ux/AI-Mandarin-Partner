export const TARGET_INPUT_SAMPLE_RATE = 16000;
export const MODEL_OUTPUT_SAMPLE_RATE = 24000;

/**
 * Downsamples a mono Float32 PCM buffer from `inputSampleRate` (e.g. 48000Hz
 * or 44100Hz on iOS Safari / desktop) down to `outputSampleRate` (16000Hz).
 * Uses box-averaging across each target sample window to prevent aliasing.
 */
export function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = TARGET_INPUT_SAMPLE_RATE
): Float32Array {
  if (buffer.length === 0 || inputSampleRate <= 0 || outputSampleRate <= 0) {
    return new Float32Array(0);
  }
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.floor(buffer.length / ratio));
  const result = new Float32Array(outputLength);

  if (ratio > 1) {
    let offsetBuffer = 0;
    for (let i = 0; i < outputLength; i++) {
      const nextOffsetBuffer = Math.min(
        buffer.length,
        Math.round((i + 1) * ratio)
      );
      let accum = 0;
      let count = 0;
      for (let j = offsetBuffer; j < nextOffsetBuffer; j++) {
        accum += buffer[j];
        count++;
      }
      result[i] = count > 0 ? accum / count : buffer[Math.min(offsetBuffer, buffer.length - 1)];
      offsetBuffer = nextOffsetBuffer;
    }
  } else {
    // Linear interpolation if hardware rate is somehow lower than 16kHz
    for (let i = 0; i < outputLength; i++) {
      const pos = i * ratio;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const s0 = buffer[idx] ?? 0;
      const s1 = buffer[Math.min(idx + 1, buffer.length - 1)] ?? s0;
      result[i] = s0 + (s1 - s0) * frac;
    }
  }

  return result;
}

/**
 * Converts normalized Float32 [-1, 1] audio samples to signed 16-bit PCM.
 */
export function float32ToInt16Pcm(float32: Float32Array): Int16Array {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
  }
  return pcm;
}

/**
 * Converts signed 16-bit PCM samples to normalized Float32 [-1, 1].
 */
export function int16PcmToFloat32(pcm: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    float32[i] = pcm[i] / 32768;
  }
  return float32;
}

/**
 * Encodes a 16-bit PCM Int16Array (little-endian) as a base64 string.
 */
export function int16PcmToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string into a little-endian 16-bit PCM Int16Array.
 */
export function base64ToInt16Pcm(base64: string): Int16Array {
  const binary = atob(base64);
  const byteLength = binary.length;
  const alignedLength = byteLength - (byteLength % 2);
  const bytes = new Uint8Array(alignedLength);
  for (let i = 0; i < alignedLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Computes clamped RMS audio level [0..1] for smooth visual feedback.
 */
export function calculateRmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sumSq += s * s;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  return Math.min(1, Math.max(0, rms * 3.5));
}
