const sdk = require("../dist/index.cjs");

if (typeof sdk.VeritieSDK !== "function") {
  throw new Error("VeritieSDK CJS export missing");
}
if (typeof sdk.useVeritie !== "function") {
  throw new Error("useVeritie CJS export missing");
}
