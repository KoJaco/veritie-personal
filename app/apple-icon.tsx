import { ImageResponse } from "next/og";

import { VeritieIconMark } from "@/lib/pwa/icon-image";

export const size = {
    width: 180,
    height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        <VeritieIconMark size={size.width} />,
        size,
    );
}
