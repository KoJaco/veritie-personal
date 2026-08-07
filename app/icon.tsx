import { ImageResponse } from "next/og";

import { VeritieIconMark } from "@/lib/pwa/icon-image";

export const size = {
    width: 32,
    height: 32,
};

export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        <VeritieIconMark size={size.width} />,
        size,
    );
}
