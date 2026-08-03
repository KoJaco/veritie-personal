"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type PitchWaveformProps = {
    values: number[];
    progress: number;
    loading?: boolean;
    disabled?: boolean;
    height?: number;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    fadeEdges?: boolean;
    ariaLabel?: string;
    onSeek?: (progress: number) => void;
};

export function PitchWaveform({
    values,
    progress,
    loading = false,
    disabled = false,
    height = 68,
    barWidth = 4,
    barGap = 2,
    barRadius = 2,
    fadeEdges = false,
    ariaLabel = "Audio scrubber",
    onSeek,
}: PitchWaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointer = useCallback(
        (clientX: number) => {
            if (disabled || !onSeek || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const ratio = (clientX - rect.left) / rect.width;
            onSeek(Math.max(0, Math.min(1, ratio)));
        },
        [disabled, onSeek],
    );

    return (
        <div
            ref={containerRef}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className={cn(
                "flex w-full items-center justify-center",
                !disabled && onSeek && "cursor-pointer",
                loading && "opacity-60",
            )}
            style={{ height }}
            onClick={(event) => handlePointer(event.clientX)}
            onKeyDown={(event) => {
                if (!onSeek || disabled) return;
                if (event.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
                if (event.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
            }}
        >
            <div className="flex items-center" style={{ gap: barGap }}>
                {values.map((value, index) => {
                    const barProgress = index / Math.max(values.length - 1, 1);
                    const isPlayed = barProgress <= progress;
                    const barHeight = Math.max(4, value * (height - 8));
                    const edgeFade = fadeEdges
                        ? 0.35 +
                          Math.sin(barProgress * Math.PI) * 0.65
                        : 1;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "transition-colors",
                                isPlayed
                                    ? "bg-primary"
                                    : "bg-primary/25",
                            )}
                            style={{
                                width: barWidth,
                                height: barHeight * edgeFade,
                                borderRadius: barRadius,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
