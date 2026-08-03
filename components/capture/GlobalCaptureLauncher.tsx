"use client";

import {
    useCallback,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";
import {
    AudioWaveform,
    EyeOffIcon,
    FileIcon,
    ImageIcon,
    X,
    TextIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VoiceCaptureLauncherPanel } from "@/components/capture/VoiceCaptureLauncherPanel";
import {
    VeritieCaptureLeaseProvider,
    useVeritieCaptureLease,
} from "@/components/capture/VeritieCaptureLeaseContext";
import { usePersistedCaptureLauncherTucked } from "@/lib/hooks/usePersistedCaptureLauncherTucked";
import { useEscapeClose, useInitialFocus } from "@/lib/hooks/useEscapeClose";
import { LAYER_CLASS } from "@/lib/ui/layering";
import { cn } from "@/lib/utils";

const LAUNCHER_BACKDROP_Z = LAYER_CLASS.launcherBackdrop;
const LAUNCHER_CHROME_Z = LAYER_CLASS.launcherChrome;
const TRIGGER_SIZE_PX = 56;
const TUCKED_PEEK_PX = 16;
const TUCKED_OFFSET_PX = TRIGGER_SIZE_PX - TUCKED_PEEK_PX;
const SWIPE_HIDE_THRESHOLD_PX = 48;
const BACKDROP_CLOSE_GUARD_MS = 400;

type LauncherMode = "options" | "voice";

function isSwipeRightToHide(deltaX: number, deltaY: number) {
    return (
        deltaX > SWIPE_HIDE_THRESHOLD_PX &&
        Math.abs(deltaX) > Math.abs(deltaY)
    );
}

export function GlobalCaptureLauncher() {
    return (
        <VeritieCaptureLeaseProvider>
            <GlobalCaptureLauncherInner />
        </VeritieCaptureLeaseProvider>
    );
}

function GlobalCaptureLauncherInner() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<LauncherMode>("options");
    const shouldReduceMotion = useReducedMotion();
    const { isTucked, setIsTucked, isHydrated } =
        usePersistedCaptureLauncherTucked();
    const optionsDialogRef = useRef<HTMLDivElement>(null);
    const voiceDialogRef = useRef<HTMLDivElement>(null);
    const swipePointerRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
    } | null>(null);
    const suppressTriggerClickRef = useRef(false);
    const openedAtRef = useRef(0);

    const { prepareLease, releaseLease } = useVeritieCaptureLease();

    const resetTransientState = useCallback(() => {
        setMode("options");
    }, []);

    const openLauncher = useCallback(() => {
        openedAtRef.current = Date.now();
        setOpen(true);
        resetTransientState();
        void prepareLease();
    }, [prepareLease, resetTransientState]);

    const close = useCallback(() => {
        setOpen(false);
        resetTransientState();
        releaseLease();
    }, [releaseLease, resetTransientState]);

    const returnToOptions = useCallback(() => {
        resetTransientState();
    }, [resetTransientState]);

    const isLauncherTucked = isHydrated && isTucked;

    const hideLauncher = useCallback(() => {
        close();
        setIsTucked(true);
    }, [close, setIsTucked]);

    const handleTriggerClick = useCallback(() => {
        if (suppressTriggerClickRef.current) {
            suppressTriggerClickRef.current = false;
            return;
        }

        if (isLauncherTucked) {
            setIsTucked(false);
            openLauncher();
            return;
        }

        if (open) {
            close();
            return;
        }

        openLauncher();
    }, [
        close,
        isLauncherTucked,
        open,
        openLauncher,
        setIsTucked,
    ]);

    const handleBackdropClose = useCallback(() => {
        if (Date.now() - openedAtRef.current < BACKDROP_CLOSE_GUARD_MS) {
            return;
        }
        close();
    }, [close]);

    const handleFabPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            if (isLauncherTucked || open || event.button !== 0) {
                return;
            }

            event.currentTarget.setPointerCapture(event.pointerId);
            swipePointerRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
            };
        },
        [isLauncherTucked, open],
    );

    const handleFabPointerUp = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            const swipeState = swipePointerRef.current;
            if (!swipeState || swipeState.pointerId !== event.pointerId) {
                return;
            }

            swipePointerRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }

            const deltaX = event.clientX - swipeState.startX;
            const deltaY = event.clientY - swipeState.startY;
            if (!isSwipeRightToHide(deltaX, deltaY)) {
                return;
            }

            suppressTriggerClickRef.current = true;
            hideLauncher();
        },
        [hideLauncher],
    );

    const handleFabPointerCancel = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            if (swipePointerRef.current?.pointerId !== event.pointerId) {
                return;
            }

            swipePointerRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
        },
        [],
    );

    const showOptionsMenu = open && mode === "options";
    const showVoicePanel = open && mode === "voice";

    useEscapeClose(open && mode === "options", close);
    useEscapeClose(open && mode === "voice", returnToOptions);
    useInitialFocus(showOptionsMenu, optionsDialogRef);
    useInitialFocus(showVoicePanel, voiceDialogRef);

    return (
        <>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.button
                        type="button"
                        aria-label="Close capture launcher"
                        className={cn(
                            "fixed inset-0 bg-black/75",
                            LAUNCHER_BACKDROP_Z,
                        )}
                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                        onClick={handleBackdropClose}
                    />
                )}
            </AnimatePresence>

            <motion.div
                className={cn(
                    "fixed bottom-8 flex flex-col items-end gap-3",
                    LAUNCHER_CHROME_Z,
                    isLauncherTucked ? "right-0" : "right-6",
                )}
                initial={false}
                animate={{
                    x:
                        isLauncherTucked && !shouldReduceMotion
                            ? TUCKED_OFFSET_PX
                            : 0,
                }}
                transition={
                    shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 32 }
                }
            >
                <AnimatePresence initial={false}>
                    {showOptionsMenu && (
                        <motion.div
                            key="capture-options-stack"
                            ref={optionsDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="capture-options-title"
                            className="flex w-auto flex-col items-end gap-3 text-right"
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 8 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                                shouldReduceMotion ? undefined : { opacity: 0, y: 8 }
                            }
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="max-w-[min(calc(100vw-3rem),18rem)]">
                                <h2
                                    id="capture-options-title"
                                    className="text-base font-semibold text-white"
                                >
                                    Capture
                                </h2>
                                <p className="mt-1 text-sm text-white/75">
                                    Choose how you want <br />to add something.
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <CaptureOption
                                    label="Voice log"
                                    icon={AudioWaveform}
                                    onSelect={() => setMode("voice")}
                                />
                                {/* <CaptureOption
                                    label="PDF"
                                    icon={FileIcon}
                                    disabled
                                    hint="Coming soon"
                                />
                                <CaptureOption
                                    label="Image"
                                    icon={ImageIcon}
                                    disabled
                                    hint="Coming soon"
                                />
                                <CaptureOption
                                    label="Text"
                                    icon={TextIcon}
                                    disabled
                                    hint="Coming soon"
                                /> */}
                                <CaptureOption
                                    label="Hide"
                                    icon={EyeOffIcon}
                                    onSelect={hideLauncher}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    type="button"
                    size="icon-lg"
                    className={cn("h-14 w-14 rounded-2xl shadow-lg", open && "bg-background text-foreground hover:bg-background/80")}
                    aria-label={
                        open
                            ? "Close capture launcher"
                            : isLauncherTucked
                                ? "Show capture launcher"
                                : "Open capture launcher"
                    }
                    aria-expanded={open}
                    onClick={handleTriggerClick}
                    onPointerDown={handleFabPointerDown}
                    onPointerUp={handleFabPointerUp}
                    onPointerCancel={handleFabPointerCancel}
                >
                    {open ? (
                        <X className="h-8 w-8" />
                    ) : (
                        <AudioWaveform className="h-8 w-8" />
                    )}
                </Button>
            </motion.div>

            <AnimatePresence initial={false}>
                {showVoicePanel && (
                    <motion.div
                        key="capture-voice-panel"
                        ref={voiceDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="capture-voice-title"
                        className={cn(
                            "fixed rounded-3xl border border-border/80 bg-card p-4 shadow-2xl",
                            LAUNCHER_CHROME_Z,
                            "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4",
                            "w-[min(calc(100vw-2rem),24rem)] md:w-[min(calc(100vw-2rem),42rem)]",
                            "max-h-[min(85dvh,800px)] min-h-[300px] overflow-y-auto",
                        )}
                        initial={
                            shouldReduceMotion ? false : { opacity: 0, y: 20, x: 16 }
                        }
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={
                            shouldReduceMotion ? undefined : { opacity: 0, y: 12, x: 12 }
                        }
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        onClick={(event) => event.stopPropagation()}
                    >

                        <VoiceCaptureLauncherPanel
                            onBack={returnToOptions}
                            onComplete={close}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function CaptureOption({
    label,
    icon: Icon,
    onSelect,
    disabled,
    hint,
}: {
    label: string;
    icon: typeof AudioWaveform;
    onSelect?: () => void;
    disabled?: boolean;
    hint?: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.()}
            className={cn(
                "flex w-auto items-center gap-2 rounded-2xl border border-white/15 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg",
                "transition-colors hover:bg-accent/80",
                disabled && "opacity-45",
            )}
        >
            <span>{label}</span>
            {hint && (
                <span className="text-xs text-muted-foreground">{hint}</span>
            )}
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
            </span>
        </button>
    );
}
