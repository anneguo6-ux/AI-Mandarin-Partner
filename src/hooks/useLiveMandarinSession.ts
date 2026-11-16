import { useCallback, useEffect, useRef, useState } from "react";
import {
  base64ToInt16Pcm,
  calculateRmsLevel,
  downsampleBuffer,
  float32ToInt16Pcm,
  int16PcmToBase64,
  int16PcmToFloat32,
  MODEL_OUTPUT_SAMPLE_RATE,
  TARGET_INPUT_SAMPLE_RATE,
} from "../utils/audioUtils";
import {
  appendTranscriptDelta,
  CallStatus,
  mapMicrophoneError,
  TranscriptEntry,
} from "../utils/callState";

interface ServerWsMessage {
  type?: string;
  data?: string;
  text?: string;
  message?: string;
}

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createAudioContextWithRate(preferredRate: number): AudioContext {
  const AudioCtx =
    window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Liúlǎnqì bù zhīyuán Web Audio API.");
  }
  try {
    return new AudioCtx({ sampleRate: preferredRate });
  } catch {
    return new AudioCtx();
  }
}

export function useLiveMandarinSession(
  visualizerRef: React.RefObject<HTMLDivElement | null>
) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const activePlaybackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const statusRef = useRef<CallStatus>("idle");
  const turnFinalizedRef = useRef<{ tutor: boolean; student: boolean }>({
    tutor: true,
    student: true,
  });

  const updateStatus = useCallback((next: CallStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const setVisualEnergy = useCallback(
    (energy: number) => {
      if (visualizerRef.current) {
        const clamped = Math.max(0, Math.min(1, energy));
        visualizerRef.current.style.setProperty(
          "--voice-energy",
          clamped.toFixed(3)
        );
      }
    },
    [visualizerRef]
  );

  const stopAllPlayback = useCallback(() => {
    for (const src of activePlaybackSourcesRef.current) {
      try {
        src.onended = null;
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    }
    activePlaybackSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const teardownResources = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    stopAllPlayback();

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }

    if (muteGainRef.current) {
      try {
        muteGainRef.current.disconnect();
      } catch {
        // ignore
      }
      muteGainRef.current = null;
    }

    analyserRef.current = null;

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    }

    if (inputCtxRef.current) {
      const ctx = inputCtxRef.current;
      inputCtxRef.current = null;
      ctx.close().catch(() => {});
    }

    if (outputCtxRef.current) {
      const ctx = outputCtxRef.current;
      outputCtxRef.current = null;
      ctx.close().catch(() => {});
    }

    setVisualEnergy(0);
  }, [setVisualEnergy, stopAllPlayback]);

  // Call duration timer
  useEffect(() => {
    if (status !== "listening" && status !== "speaking") {
      return;
    }
    const timer = window.setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownResources();
    };
  }, [teardownResources]);

  const schedulePlaybackChunk = useCallback(
    (base64Pcm: string) => {
      const outputCtx = outputCtxRef.current;
      if (!outputCtx) return;

      if (outputCtx.state === "suspended") {
        outputCtx.resume().catch(() => {});
      }

      const int16 = base64ToInt16Pcm(base64Pcm);
      if (int16.length === 0) return;

      const float32 = int16PcmToFloat32(int16);
      const audioBuffer = outputCtx.createBuffer(
        1,
        float32.length,
        MODEL_OUTPUT_SAMPLE_RATE
      );
      audioBuffer.getChannelData(0).set(float32);

      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (analyserRef.current) {
        source.connect(analyserRef.current);
        analyserRef.current.connect(outputCtx.destination);
      } else {
        source.connect(outputCtx.destination);
      }

      const now = outputCtx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now + 0.04;
      }

      const startAt = nextStartTimeRef.current;
      nextStartTimeRef.current = startAt + audioBuffer.duration;

      activePlaybackSourcesRef.current.add(source);
      if (statusRef.current !== "speaking") {
        updateStatus("speaking");
      }

      source.onended = () => {
        activePlaybackSourcesRef.current.delete(source);
        if (
          activePlaybackSourcesRef.current.size === 0 &&
          statusRef.current === "speaking"
        ) {
          updateStatus("listening");
        }
      };

      source.start(startAt);
    },
    [updateStatus]
  );

  const startVisualizerLoop = useCallback(() => {
    const dataArray = new Uint8Array(64);
    const tick = () => {
      if (
        statusRef.current === "speaking" &&
        analyserRef.current &&
        activePlaybackSourcesRef.current.size > 0
      ) {
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setVisualEnergy(Math.min(1, rms * 3.5));
      } else if (statusRef.current !== "listening") {
        setVisualEnergy(0);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [setVisualEnergy]);

  const endCall = useCallback(() => {
    teardownResources();
    setIsMuted(false);
    isMutedRef.current = false;
    setDurationSeconds(0);
    updateStatus("idle");
  }, [teardownResources, updateStatus]);

  const startCall = useCallback(async () => {
    if (statusRef.current === "connecting") return;

    teardownResources();
    setErrorMessage(null);
    setDurationSeconds(0);
    setIsMuted(false);
    isMutedRef.current = false;
    turnFinalizedRef.current = { tutor: true, student: true };
    updateStatus("connecting");

    // 1. Synchronously unlock Web Audio inside user gesture (critical for iOS Safari)
    let inputCtx: AudioContext;
    let outputCtx: AudioContext;
    try {
      inputCtx = createAudioContextWithRate(TARGET_INPUT_SAMPLE_RATE);
      outputCtx = createAudioContextWithRate(MODEL_OUTPUT_SAMPLE_RATE);
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      // Resume both contexts synchronously during tap gesture
      inputCtx.resume().catch(() => {});
      outputCtx.resume().catch(() => {});

      // Play a silent 1-sample buffer to unlock iOS Safari speaker route
      const silent = outputCtx.createBuffer(1, 1, MODEL_OUTPUT_SAMPLE_RATE);
      const silentSrc = outputCtx.createBufferSource();
      silentSrc.buffer = silent;
      silentSrc.connect(outputCtx.destination);
      silentSrc.start(0);

      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
    } catch (err) {
      teardownResources();
      const msg =
        err instanceof Error ? err.message : "Wúfǎ chūshǐhuà yīnxùn bōfàng.";
      setErrorMessage(msg);
      updateStatus("error");
      return;
    }

    // 2. Request microphone permission
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      teardownResources();
      setErrorMessage(
        "Liúlǎnqì huánjìng bù zhīyuán màikèfēng, qǐng shǐyòng Safari huò Chrome (HTTPS)."
      );
      updateStatus("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
    } catch (err) {
      teardownResources();
      const domErr = err as { name?: string; message?: string };
      setErrorMessage(mapMicrophoneError(domErr?.name, domErr?.message));
      updateStatus("error");
      return;
    }

    // 3. Connect WebSocket to server Gemini Live bridge
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let didStartMicPipeline = false;

    const startMicPipeline = () => {
      if (didStartMicPipeline || !inputCtxRef.current || !streamRef.current) {
        return;
      }
      didStartMicPipeline = true;

      const ctx = inputCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(streamRef.current);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;

      sourceNodeRef.current = source;
      processorRef.current = processor;
      muteGainRef.current = muteGain;

      const actualSampleRate = ctx.sampleRate || TARGET_INPUT_SAMPLE_RATE;

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);

        if (isMutedRef.current) {
          if (statusRef.current === "listening") {
            setVisualEnergy(0);
          }
          return;
        }

        if (statusRef.current === "listening") {
          setVisualEnergy(calculateRmsLevel(inputData));
        }

        const downsampled = downsampleBuffer(
          inputData,
          actualSampleRate,
          TARGET_INPUT_SAMPLE_RATE
        );
        const pcm16 = float32ToInt16Pcm(downsampled);
        const base64 = int16PcmToBase64(pcm16);

        ws.send(JSON.stringify({ type: "audio", data: base64 }));
      };

      source.connect(processor);
      processor.connect(muteGain);
      muteGain.connect(ctx.destination);

      startVisualizerLoop();
    };

    ws.onmessage = (event) => {
      let msg: ServerWsMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerWsMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case "connected": {
          updateStatus("listening");
          startMicPipeline();
          break;
        }
        case "audio": {
          if (msg.data) {
            schedulePlaybackChunk(msg.data);
          }
          break;
        }
        case "outputTranscript": {
          if (msg.text) {
            const forceNew = turnFinalizedRef.current.tutor;
            turnFinalizedRef.current.tutor = false;
            turnFinalizedRef.current.student = true;
            setTranscripts((prev) =>
              appendTranscriptDelta(prev, "tutor", msg.text!, {
                forceNewEntry: forceNew,
              })
            );
          }
          break;
        }
        case "inputTranscript": {
          if (msg.text) {
            const forceNew = turnFinalizedRef.current.student;
            turnFinalizedRef.current.student = false;
            turnFinalizedRef.current.tutor = true;
            setTranscripts((prev) =>
              appendTranscriptDelta(prev, "student", msg.text!, {
                forceNewEntry: forceNew,
              })
            );
          }
          break;
        }
        case "turnComplete": {
          turnFinalizedRef.current.tutor = true;
          break;
        }
        case "interrupted": {
          stopAllPlayback();
          turnFinalizedRef.current.tutor = true;
          if (statusRef.current === "speaking") {
            updateStatus("listening");
          }
          break;
        }
        case "error": {
          teardownResources();
          setErrorMessage(
            msg.message || "Yǔyīn liánxiàn fāshēng cuòwù, qǐng shāohòu zài shì."
          );
          updateStatus("error");
          break;
        }
        case "closed": {
          if (statusRef.current !== "idle" && statusRef.current !== "error") {
            teardownResources();
            updateStatus("idle");
          }
          break;
        }
      }
    };

    ws.onerror = () => {
      if (statusRef.current === "idle" || statusRef.current === "error") return;
      teardownResources();
      setErrorMessage("Wúfǎ liánjiē yǔyīn sìfúqì, qǐng quèrèn wǎnglù hòu zài shì.");
      updateStatus("error");
    };

    ws.onclose = () => {
      if (statusRef.current === "connecting") {
        teardownResources();
        setErrorMessage("Yǔyīn sìfúqì liánxiàn shībài, qǐng shāohòu zài shì.");
        updateStatus("error");
      } else if (
        statusRef.current === "listening" ||
        statusRef.current === "speaking"
      ) {
        teardownResources();
        updateStatus("idle");
      }
    };
  }, [
    schedulePlaybackChunk,
    setVisualEnergy,
    startVisualizerLoop,
    stopAllPlayback,
    teardownResources,
    updateStatus,
  ]);

  const toggleCall = useCallback(() => {
    if (
      statusRef.current === "connecting" ||
      statusRef.current === "listening" ||
      statusRef.current === "speaking"
    ) {
      endCall();
    } else {
      startCall();
    }
  }, [endCall, startCall]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      return next;
    });
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  return {
    status,
    isMuted,
    errorMessage,
    durationSeconds,
    transcripts,
    toggleCall,
    startCall,
    endCall,
    toggleMute,
    clearTranscripts,
  };
}
