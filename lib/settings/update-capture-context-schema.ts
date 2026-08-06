import { z } from "zod";

import { captureLocationLabelSchema } from "@/lib/capture/capture-context-schema";

export const updateCaptureContextInputSchema = z
    .object({
        captureLocationLabel: captureLocationLabelSchema,
    })
    .strict();
