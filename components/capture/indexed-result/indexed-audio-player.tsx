"use client";

import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PitchWaveform } from "@/components/ui/pitch-waveform";
import {
  computeWaveformBarCount,
  downsampleSpectrumValues,
  WAVEFORM_BAR_GAP,
  WAVEFORM_BAR_WIDTH,
  WAVEFORM_HORIZONTAL_PADDING,
  WAVEFORM_MIN_BAR_COUNT,
} from "@/lib/capture/audio-waveform-layout";
import { cn } from "@/lib/utils";

type SpectrumState = {
  audioUrl: string | null;
  values: number[];
  status: "idle" | "loading" | "ready" | "error";
  durationSeconds: number | null;
};

const DECODE_SPECTRUM_BAR_COUNT = 320;
const FALLBACK_SPECTRUM = Array.from(
  { length: DECODE_SPECTRUM_BAR_COUNT },
  (_, index) => {
    const position = index / Math.max(DECODE_SPECTRUM_BAR_COUNT - 1, 1);
    const pulse =
      Math.sin(position * Math.PI * 8) * 0.18 +
      Math.sin(position * Math.PI * 21) * 0.08;
    const envelope = 0.25 + Math.sin(position * Math.PI) * 0.35;
    return Math.max(0.06, Math.min(0.72, envelope + pulse));
  },
);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function readMediaDuration(audio: HTMLAudioElement) {
  const mediaDuration = audio.duration;
  if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
    return mediaDuration;
  }

  if (audio.seekable.length > 0) {
    const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
      return seekableEnd;
    }
  }

  return 0;
}

function resolvePlaybackDuration(
  mediaDuration: number,
  decodedDurationSeconds: number | null,
): number {
  if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
    return mediaDuration;
  }

  if (
    decodedDurationSeconds != null &&
    Number.isFinite(decodedDurationSeconds) &&
    decodedDurationSeconds > 0
  ) {
    return decodedDurationSeconds;
  }

  return 0;
}

function createAudioContext() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  return new AudioContextConstructor();
}

function mixToMono(buffer: AudioBuffer) {
  const mono = new Float32Array(buffer.length);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let index = 0; index < buffer.length; index += 1) {
      mono[index] += channelData[index] / buffer.numberOfChannels;
    }
  }

  return mono;
}

function buildSpectrumValues(buffer: AudioBuffer, targetBarCount: number) {
  const mono = mixToMono(buffer);
  const samplesPerBar = Math.max(1, Math.floor(mono.length / targetBarCount));
  const values: number[] = [];

  for (let barIndex = 0; barIndex < targetBarCount; barIndex += 1) {
    const start = barIndex * samplesPerBar;
    const end =
      barIndex === targetBarCount - 1
        ? mono.length
        : Math.min(mono.length, start + samplesPerBar);

    let sumSquares = 0;
    let sampleCount = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const sample = mono[sampleIndex] ?? 0;
      sumSquares += sample * sample;
      sampleCount += 1;
    }

    const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
    values.push(rms);
  }

  const peak = Math.max(...values, 0.01);
  return values.map((value) =>
    clamp(0.06 + Math.sqrt(value / peak) * 0.88, 0.06, 1),
  );
}

function useAudioSpectrum(audioUrl: string | null): SpectrumState {
  const [state, setState] = useState<SpectrumState>({
    audioUrl: null,
    values: [],
    status: "idle",
    durationSeconds: null,
  });

  useEffect(() => {
    if (!audioUrl) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    const loadSpectrum = async () => {
      let audioContext: AudioContext | null = null;

      try {
        const response = await fetch(audioUrl, {
          signal: abortController.signal,
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch audio (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) {
          return;
        }

        audioContext = createAudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (cancelled) {
          return;
        }

        setState({
          audioUrl,
          values: buildSpectrumValues(audioBuffer, DECODE_SPECTRUM_BAR_COUNT),
          status: "ready",
          durationSeconds: audioBuffer.duration,
        });
      } catch (error) {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        console.error("Failed to reconstruct audio spectrum", error);
        setState({
          audioUrl,
          values: FALLBACK_SPECTRUM,
          status: "error",
          durationSeconds: null,
        });
      } finally {
        if (audioContext && audioContext.state !== "closed") {
          void audioContext.close();
        }
      }
    };

    void loadSpectrum();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [audioUrl]);

  if (!audioUrl) {
    return {
      audioUrl: null,
      values: [],
      status: "idle",
      durationSeconds: null,
    };
  }

  if (state.audioUrl !== audioUrl) {
    return {
      audioUrl,
      values: FALLBACK_SPECTRUM,
      status: "loading",
      durationSeconds: null,
    };
  }

  return state;
}

export function IndexedAudioPlayer({
  audioUrl,
  requestedSeekMs,
  onSeekHandled,
}: {
  audioUrl: string | null;
  requestedSeekMs: number | null;
  onSeekHandled: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [barCount, setBarCount] = useState(WAVEFORM_MIN_BAR_COUNT);
  const spectrum = useAudioSpectrum(audioUrl);

  const effectiveDuration = useMemo(
    () => resolvePlaybackDuration(duration, spectrum.durationSeconds),
    [duration, spectrum.durationSeconds],
  );

  const progress = useMemo(() => {
    if (!Number.isFinite(effectiveDuration) || effectiveDuration <= 0) {
      return 0;
    }

    return clamp(currentTime / effectiveDuration, 0, 1);
  }, [currentTime, effectiveDuration]);

  useEffect(() => {
    const node = waveformContainerRef.current;
    if (!node) {
      return;
    }

    const syncBarCount = () => {
      setBarCount(
        computeWaveformBarCount(
          node.clientWidth,
          WAVEFORM_BAR_WIDTH,
          WAVEFORM_BAR_GAP,
          WAVEFORM_HORIZONTAL_PADDING,
        ),
      );
    };

    syncBarCount();
    const observer = new ResizeObserver(syncBarCount);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      return;
    }

    const syncDuration = () => {
      const nextDuration = readMediaDuration(audio);
      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    };

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("loadeddata", syncDuration);
    audio.addEventListener("progress", syncDuration);
    syncDuration();

    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("loadeddata", syncDuration);
      audio.removeEventListener("progress", syncDuration);
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      return;
    }

    audio.load();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.muted = muted;
    audio.playbackRate = playbackRate;
  }, [muted, playbackRate, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) {
      return;
    }

    let animationFrame = 0;

    const updateCurrentTime = () => {
      setCurrentTime(audio.currentTime);
      animationFrame = requestAnimationFrame(updateCurrentTime);
    };

    animationFrame = requestAnimationFrame(updateCurrentTime);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (requestedSeekMs == null || !audio) {
      return;
    }

    const seekSeconds = requestedSeekMs / 1000;

    const applySeek = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(seekSeconds, audio.duration);
      } else if (seekSeconds >= 0) {
        audio.currentTime = seekSeconds;
      }
      setCurrentTime(audio.currentTime);
      onSeekHandled();
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      applySeek();
      return;
    }

    audio.addEventListener("loadedmetadata", applySeek, { once: true });

    return () => {
      audio.removeEventListener("loadedmetadata", applySeek);
    };
  }, [audioUrl, onSeekHandled, requestedSeekMs]);

  const renderedSpectrum = useMemo(() => {
    const baseSpectrum =
      spectrum.values.length > 0 ? spectrum.values : FALLBACK_SPECTRUM;
    return downsampleSpectrumValues(baseSpectrum, barCount);
  }, [barCount, spectrum.values]);

  if (!audioUrl) {
    return null;
  }

  const handlePlayToggle = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play().catch((error) => {
        console.error("Failed to play voice log audio", error);
        setIsPlaying(false);
      });
      return;
    }

    audio.pause();
  };

  const handleSeekProgress = (nextProgress: number) => {
    const audio = audioRef.current;
    if (!audio || effectiveDuration <= 0) {
      return;
    }

    const nextTime = clamp(nextProgress, 0, 1) * effectiveDuration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const mediaDuration = readMediaDuration(audio);
    const maxTime = mediaDuration > 0 ? mediaDuration : effectiveDuration;
    const nextTime = clamp(
      audio.currentTime + seconds,
      0,
      Number.isFinite(maxTime) && maxTime > 0 ? maxTime : Number.MAX_SAFE_INTEGER,
    );
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (nextVolume: number) => {
    const normalizedVolume = clamp(nextVolume, 0, 1);
    setVolume(normalizedVolume);
    setMuted(normalizedVolume === 0);
  };

  const handleRateToggle = () => {
    setPlaybackRate((current) => {
      if (current === 1) return 1.25;
      if (current === 1.25) return 1.5;
      if (current === 1.5) return 2;
      return 1;
    });
  };

  const isSpectrumLoading = spectrum.status === "loading";
  const timeLabel = `${formatPlaybackTime(currentTime)} / ${formatPlaybackTime(effectiveDuration)}`;

  return (
    <div className="mt-1.5 grid w-full min-w-0 gap-3">
      <audio
        key={audioUrl}
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        className="sr-only"
        onLoadStart={() => {
          setDuration(0);
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        onLoadedMetadata={(event) => {
          setDuration(readMediaDuration(event.currentTarget));
          setCurrentTime(event.currentTarget.currentTime || 0);
        }}
        onDurationChange={(event) => {
          setDuration(readMediaDuration(event.currentTarget));
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime || 0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={(event) => {
          setIsPlaying(false);
          setCurrentTime(readMediaDuration(event.currentTarget));
        }}
        onError={(event) => {
          setIsPlaying(false);
          const mediaError = event.currentTarget.error;
          if (mediaError) {
            console.error(
              "Voice log audio failed to load",
              mediaError.code,
              mediaError.message,
            );
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={handlePlayToggle}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => handleSkip(-5)}
          aria-label="Rewind 5 seconds"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => handleSkip(5)}
          aria-label="Forward 5 seconds"
        >
          <RotateCw className="size-4" />
        </Button>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {timeLabel}
        </span>
      </div>

      <div
        ref={waveformContainerRef}
        className={cn(
          "w-full min-w-0 overflow-hidden rounded-full bg-muted/40 px-2 text-primary",
          isSpectrumLoading && "animate-pulse",
        )}
      >
        <PitchWaveform
          values={renderedSpectrum}
          progress={progress}
          loading={isSpectrumLoading}
          disabled={effectiveDuration <= 0}
          height={68}
          barWidth={WAVEFORM_BAR_WIDTH}
          barGap={WAVEFORM_BAR_GAP}
          barRadius={2}
          fadeEdges
          ariaLabel="Audio spectrum scrubber"
          onSeek={handleSeekProgress}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Button
          type="button"
          size="icon"
          className="size-7"
          variant="ghost"
          onClick={() => setMuted((current) => !current)}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted || volume === 0 ? (
            <VolumeX className="size-3.5" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
        </Button>
        <label className="flex min-w-36 flex-1 items-center gap-2">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            className="h-1.5 w-full accent-primary"
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleRateToggle}
          aria-label="Change playback speed"
          className="font-mono"
        >
          {playbackRate}x
        </Button>
      </div>
    </div>
  );
}
