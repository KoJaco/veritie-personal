const sdk = await import("../dist/index.js");

if (typeof sdk.VeritieSDK !== "function") {
  throw new Error("VeritieSDK ESM export missing");
}
if (typeof sdk.useVeritie !== "function") {
  throw new Error("useVeritie ESM export missing");
}
