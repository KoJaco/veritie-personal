import {
    computeWaveformBarCount,
    downsampleSpectrumValues,
    WAVEFORM_BAR_GAP,
    WAVEFORM_BAR_WIDTH,
    WAVEFORM_HORIZONTAL_PADDING,
} from "@/lib/capture/audio-waveform-layout";

describe("audio-waveform-layout", () => {
    it("computes bar count from container width", () => {
        const barCount = computeWaveformBarCount(
            320,
            WAVEFORM_BAR_WIDTH,
            WAVEFORM_BAR_GAP,
            WAVEFORM_HORIZONTAL_PADDING,
        );

        expect(barCount).toBe(51);
    });

    it("downsamples spectrum values to target bar count", () => {
        const source = [0.1, 0.9, 0.2, 0.8];
        const downsampled = downsampleSpectrumValues(source, 2);

        expect(downsampled).toHaveLength(2);
        expect(downsampled[0]).toBe(0.9);
        expect(downsampled[1]).toBe(0.8);
    });

    it("upsamples spectrum values without zero-only bars", () => {
        const source = Array.from({ length: 320 }, (_, index) =>
            0.1 + (index % 10) * 0.05,
        );
        const upsampled = downsampleSpectrumValues(source, 400);

        expect(upsampled).toHaveLength(400);
        expect(upsampled.every((value) => value > 0)).toBe(true);
    });
});
