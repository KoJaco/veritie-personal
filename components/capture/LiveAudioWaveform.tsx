"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type LiveAudioWaveformMode = "idle" | "active" | "passive";

type LiveAudioWaveformProps = {
    stream: MediaStream | null;
    mode: LiveAudioWaveformMode;
    className?: string;
};

const BAR_COUNT = 9;
const BAR_WIDTH = 7;
const GAP = 2;

function resolveWaveformFill(): string {
    if (typeof document === "undefined") {
        return "#1e1e1e";
    }
    return document.documentElement.classList.contains("dark")
        ? "#E9E4D8"
        : "#1e1e1e";
}

function drawWaveformBars(
    ctx: CanvasRenderingContext2D,
    rect: DOMRectReadOnly,
    energies: number[],
    fillStyle: string,
) {
    const waveformWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * GAP;
    const startX = (rect.width - waveformWidth) / 2;
    const centerIndex = Math.floor(BAR_COUNT / 2);

    for (let index = 0; index < BAR_COUNT; index++) {
        const distance = Math.abs(index - centerIndex);
        const falloff = 1 - distance * 0.2;
        const energy = Math.min(1, Math.max(0, energies[index] ?? 0) * falloff);
        const height = Math.max(8, energy * rect.height * 0.75);
        const x = startX + index * (BAR_WIDTH + GAP);
        const y = (rect.height - height) / 2;
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, height, BAR_WIDTH / 2);
        ctx.fill();
    }
}

function idleBarEnergies() {
    const centerIndex = Math.floor(BAR_COUNT / 2);
    return Array.from({ length: BAR_COUNT }, (_, index) => {
        const distance = Math.abs(index - centerIndex);
        return 0.1 + Math.max(0, 0.08 - distance * 0.02);
    });
}

function passiveBarEnergies(timeSeconds: number) {
    const centerIndex = Math.floor(BAR_COUNT / 2);
    return Array.from({ length: BAR_COUNT }, (_, index) => {
        const distance = Math.abs(index - centerIndex);
        const base = 0.12 + Math.max(0, 0.06 - distance * 0.015);
        const wobble =
            Math.sin(timeSeconds * 1.6 + index * 0.85) * 0.035 +
            Math.sin(timeSeconds * 0.65 + index * 0.45) * 0.02;
        return base + wobble;
    });
}

export function LiveAudioWaveform({
    stream,
    mode,
    className,
}: LiveAudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const fillStyle = resolveWaveformFill();
        let frameId = 0;
        let cancelled = false;

        const drawFrame = (energies: number[]) => {
            const rect = canvas.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(rect.width * ratio));
            canvas.height = Math.max(1, Math.floor(rect.height * ratio));
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                return;
            }
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.clearRect(0, 0, rect.width, rect.height);
            drawWaveformBars(ctx, rect, energies, fillStyle);
        };

        if (mode === "active" && stream) {
            const AudioContextCtor =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext })
                    .webkitAudioContext;
            if (!AudioContextCtor) {
                return;
            }

            const context = new AudioContextCtor();
            const analyser = context.createAnalyser();
            const source = context.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.78;
            const data = new Uint8Array(analyser.frequencyBinCount);
            const centerIndex = Math.floor(BAR_COUNT / 2);

            const draw = () => {
                if (cancelled) {
                    return;
                }
                analyser.getByteFrequencyData(data);
                const average =
                    data.reduce((total, bucket) => total + bucket, 0) /
                    Math.max(1, data.length);
                const centerEnergy = average / 255;
                const energies = Array.from({ length: BAR_COUNT }, (_, index) => {
                    const distance = Math.abs(index - centerIndex);
                    const bucketIndex = Math.min(
                        data.length - 1,
                        Math.floor(
                            (distance / centerIndex) * data.length * 0.65,
                        ),
                    );
                    const bucketEnergy = data[bucketIndex] / 255;
                    return Math.max(centerEnergy, bucketEnergy);
                });
                drawFrame(energies);
                frameId = window.requestAnimationFrame(draw);
            };

            draw();

            return () => {
                cancelled = true;
                window.cancelAnimationFrame(frameId);
                source.disconnect();
                void context.close();
            };
        }

        if (mode === "passive") {
            const startTime = performance.now();
            const draw = (time: number) => {
                if (cancelled) {
                    return;
                }
                const elapsed = (time - startTime) / 1000;
                drawFrame(passiveBarEnergies(elapsed));
                frameId = window.requestAnimationFrame(draw);
            };
            frameId = window.requestAnimationFrame(draw);

            return () => {
                cancelled = true;
                window.cancelAnimationFrame(frameId);
            };
        }

        drawFrame(idleBarEnergies());
        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, [mode, stream]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("mx-auto block h-20 w-44", className)}
            aria-hidden="true"
        />
    );
}
