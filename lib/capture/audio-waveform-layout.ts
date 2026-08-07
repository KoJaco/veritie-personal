export const WAVEFORM_BAR_WIDTH = 4;
export const WAVEFORM_BAR_GAP = 2;
export const WAVEFORM_MIN_BAR_COUNT = 48;
export const WAVEFORM_MAX_BAR_COUNT = 400;
export const WAVEFORM_HORIZONTAL_PADDING = 16;

export function computeWaveformBarCount(
    containerWidth: number,
    barWidth = WAVEFORM_BAR_WIDTH,
    barGap = WAVEFORM_BAR_GAP,
    horizontalPadding = WAVEFORM_HORIZONTAL_PADDING,
): number {
    const usableWidth = Math.max(0, containerWidth - horizontalPadding);
    const barStride = barWidth + barGap;
    if (usableWidth <= 0 || barStride <= 0) {
        return WAVEFORM_MIN_BAR_COUNT;
    }

    const rawCount = Math.floor((usableWidth + barGap) / barStride);
    return Math.max(
        WAVEFORM_MIN_BAR_COUNT,
        Math.min(WAVEFORM_MAX_BAR_COUNT, rawCount),
    );
}

export function downsampleSpectrumValues(
    values: number[],
    targetBarCount: number,
): number[] {
    if (targetBarCount <= 0) {
        return [];
    }

    if (values.length === 0) {
        return Array.from({ length: targetBarCount }, () => 0.06);
    }

    if (values.length === targetBarCount) {
        return values;
    }

    const downsampled: number[] = [];
    for (let barIndex = 0; barIndex < targetBarCount; barIndex += 1) {
        const start = Math.floor((barIndex * values.length) / targetBarCount);
        const end = Math.floor(((barIndex + 1) * values.length) / targetBarCount);
        const rangeEnd = Math.max(start + 1, end);
        let peak = 0;
        for (let index = start; index < rangeEnd && index < values.length; index += 1) {
            peak = Math.max(peak, values[index] ?? 0);
        }
        if (peak === 0 && values.length > 0) {
            const fallbackIndex = Math.min(
                values.length - 1,
                Math.floor((barIndex * values.length) / targetBarCount),
            );
            peak = values[fallbackIndex] ?? 0.06;
        }
        downsampled.push(peak);
    }

    return downsampled;
}
