import { describe, expect, it } from "vitest";

import { VeritieSDK, useVeritie } from "./index";

describe("root exports", () => {
  it("exports the Veritie SDK surface", () => {
    expect(VeritieSDK).toBeTypeOf("function");
    expect(useVeritie).toBeTypeOf("function");
  });
});
