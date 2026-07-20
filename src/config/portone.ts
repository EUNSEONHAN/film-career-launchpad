// PortOne (포트원) V2 client-side config.
// storeId and channelKey are PUBLIC values — safe to expose in the browser.
// Fill these in from PortOne 콘솔 → 결제연동 페이지.

export const PORTONE_STORE_ID =
  import.meta.env.VITE_PORTONE_STORE_ID ?? "store-REPLACE_ME";

// Channel keys per payment method. Create a channel per PG/method in PortOne 콘솔.
export const PORTONE_CHANNEL_KEYS = {
  card:
    import.meta.env.VITE_PORTONE_CHANNEL_KEY_CARD ?? "channel-key-REPLACE_ME",
  kakaopay:
    import.meta.env.VITE_PORTONE_CHANNEL_KEY_KAKAOPAY ??
    "channel-key-REPLACE_ME",
};

export function isPortoneConfigured(method: "card" | "kakaopay") {
  return (
    !PORTONE_STORE_ID.includes("REPLACE_ME") &&
    !PORTONE_CHANNEL_KEYS[method].includes("REPLACE_ME")
  );
}
