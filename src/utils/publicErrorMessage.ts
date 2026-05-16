/** Strip noisy vendor / stack details before showing users. */
export function sanitizePublicErrorMessage(raw: string): string {
  const msg = String(raw || "").trim();
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.length > 280) return `${msg.slice(0, 277)}…`;
  return msg;
}
