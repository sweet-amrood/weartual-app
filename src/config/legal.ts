/** Override with EXPO_PUBLIC_PRIVACY_URL / EXPO_PUBLIC_TERMS_URL in `.env`. */
export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || "https://weartual.com/privacy";

export const TERMS_OF_SERVICE_URL =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() || "https://weartual.com/terms";
