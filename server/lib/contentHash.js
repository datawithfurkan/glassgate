import crypto from "crypto";

export function contentHash(text = "") {
  const hex = crypto.createHash("sha256").update(text).digest("hex");
  return `sha256:${hex.slice(0, 16)}`;
}
