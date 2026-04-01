export const ASSETS_BASE_URL = (import.meta.env.VITE_ASSETS_BASE_URL ?? "").replace(/\/+$/, "");

export function buildGameImageUrl(providerKey, slug, ext = "webp") {
  const prefix = ASSETS_BASE_URL ? `${ASSETS_BASE_URL}/` : "";
  return `${prefix}assets/img/games/${providerKey}/${slug}.${ext}`;
}

