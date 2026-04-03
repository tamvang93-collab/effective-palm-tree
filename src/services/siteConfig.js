const defaults = () => ({
  deductXuModelAll5: 10,
  deductXuModelOther: 2,
  siteTitle: "SLOSTWIN - AI",
  siteSubtitle: "HỆ THỐNG GAME"
});

export async function fetchSiteConfig() {
  try {
    const res = await fetch("/api/site-config", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data?.config) return defaults();
    return { ...defaults(), ...data.config };
  } catch {
    return defaults();
  }
}
