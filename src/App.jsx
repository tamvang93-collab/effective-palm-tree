import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import AuthPanel from "./components/AuthPanel";
import FloatingSupportMenu from "./components/FloatingSupportMenu";
import GameCard from "./components/GameCard";
import GameDetailModal from "./components/GameDetailModal";
import LowBalancePopup from "./components/LowBalancePopup";
import ProviderCard from "./components/ProviderCard";
import { gamesByProvider, providers } from "./data/mockData";
import { runPresetAnalysis } from "./services/analysisEngine";
import { fetchSiteConfig } from "./services/siteConfig";
import { deductXu, fetchCurrentUser, loginUser, logoutUser, registerUser } from "./services/userApi";

const PROVIDER_QUERY_KEY = "provider";

function getProviderFromLocation() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const provider = params.get(PROVIDER_QUERY_KEY);
  return provider && provider.trim().length > 0 ? provider.trim() : null;
}

function setProviderInLocation(providerId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);

  if (!providerId) {
    url.searchParams.delete(PROVIDER_QUERY_KEY);
  } else {
    url.searchParams.set(PROVIDER_QUERY_KEY, providerId);
  }

  window.history.pushState({ providerId: providerId ?? null }, "", url);
}

export default function App() {
  const [selectedProviderId, setSelectedProviderId] = useState(() => getProviderFromLocation());
  const [searchText, setSearchText] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [lowBalanceOpen, setLowBalanceOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [requiredBalance, setRequiredBalance] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState([]);
  const [authRedirectLoading, setAuthRedirectLoading] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState(null);
  const [adminEntryUrl, setAdminEntryUrl] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [selectedProviderId]
  );

  const games = selectedProviderId ? gamesByProvider[selectedProviderId] ?? [] : [];

  useEffect(() => {
    setSearchText("");
    setSelectedGame(null);
    setAnalysisResult(null);
  }, [selectedProviderId]);

  useEffect(() => {
    setAnalysisResult(null);
    setAnalysisProgress([]);
  }, [selectedGame?.id]);

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((user) => {
      if (!mounted) return;
      setCurrentUser(user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSiteConfig().then((cfg) => {
      if (mounted) setSiteConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    setAdminEntryUrl(p.get("admin") === "1");
  }, []);

  const filteredGames = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => (g?.title ?? "").toLowerCase().includes(q));
  }, [games, searchText]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onPopState = () => {
      setSelectedProviderId(getProviderFromLocation());
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Keep URL in sync when provider changes internally.
    // Avoid infinite loops by only pushing when the query differs.
    if (typeof window === "undefined") return;
    const current = getProviderFromLocation();
    if ((current ?? null) !== (selectedProviderId ?? null)) {
      setProviderInLocation(selectedProviderId);
    }
  }, [selectedProviderId]);

  const handleAuthSuccess = async (result) => {
    if (!result?.user) return;
    setAuthRedirectLoading(true);
    // Show a short transition before opening lobby.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSelectedProviderId(null);
    setCurrentUser(result.user);
    setAuthRedirectLoading(false);
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-app-shell px-4 py-6 text-slate-800 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1800px] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-xl pb-1 text-center">
              <h1 className="text-2xl font-black tracking-wider text-amber-700 drop-shadow-sm sm:text-3xl">
                {siteConfig?.siteTitle ?? "SLOSTWIN - AI"}
              </h1>
              <p className="mt-1 text-sm font-medium tracking-[0.2em] text-slate-600">
                {siteConfig?.siteSubtitle ?? "HỆ THỐNG GAME"}
              </p>
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 top-0 h-full w-16 rotate-12 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]"
                animate={{ x: [-40, 460] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <AuthPanel
              onLogin={loginUser}
              onRegister={registerUser}
              onAuthSuccess={handleAuthSuccess}
              adminEntry={adminEntryUrl}
            />
          </div>
        </div>
        {authRedirectLoading ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-100/75 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-300/40 border-t-sky-600" />
              <p className="text-sm font-black tracking-[0.18em] text-sky-900">ĐANG ĐĂNG NHẬP...</p>
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-600">Đang tự động chuyển vào sảnh game</p>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app-shell px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-amber-700 drop-shadow-sm sm:text-3xl">
              {siteConfig?.siteTitle ?? "SLOSTWIN - AI"}
            </h1>
            <p className="mt-1 text-sm font-medium tracking-[0.2em] text-slate-600">
              {siteConfig?.siteSubtitle ?? "HỆ THỐNG GAME"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold tracking-[0.16em] text-amber-900 shadow-sm ring-1 ring-amber-300/40">
              VIP {currentUser?.vip ?? 0}
            </span>
            <span className="rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold tracking-[0.16em] text-emerald-900 shadow-sm ring-1 ring-emerald-300/40">
              XU {Number(currentUser?.balance ?? 0).toLocaleString()}
            </span>

            {selectedProvider ? (
              <button
                type="button"
                onClick={() => setSelectedProviderId(null)}
                className="rounded-full border border-sky-400/50 bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.16em] text-slate-800 shadow-sm transition hover:bg-white"
              >
                QUAY VỀ SẢNH
              </button>
            ) : null}
            {currentUser?.isAdmin ? (
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="rounded-full border border-violet-300/50 bg-violet-100/90 px-4 py-2 text-xs font-bold tracking-[0.16em] text-violet-900 shadow-sm transition hover:bg-violet-100"
              >
                QUẢN TRỊ
              </button>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
                setCurrentUser(null);
              }}
              className="rounded-full border border-rose-300/50 bg-rose-50/95 px-4 py-2 text-xs font-bold tracking-[0.16em] text-rose-900 shadow-sm transition hover:bg-rose-100"
            >
              ĐĂNG XUẤT
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!selectedProvider ? (
            <motion.section
              key="lobby"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="mb-5 text-xl font-extrabold tracking-[0.18em] text-sky-800">SẢNH GAME</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onOpen={() => setSelectedProviderId(provider.id)}
                  />
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="games"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="mb-2 text-xl font-extrabold tracking-[0.18em] text-sky-800">{selectedProvider.name}</h2>
              <p className="mb-6 text-xs font-semibold tracking-[0.22em] text-slate-600">{selectedProvider.lobbyLabel}</p>

              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex-1 rounded-full border border-sky-300/60 bg-white/60 px-4 py-2 shadow-inner">
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Tìm game..."
                      className="w-full bg-transparent text-xs font-bold tracking-[0.16em] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      aria-label="Search games"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredGames.length === 0) return;
                      const pick = filteredGames[Math.floor(Math.random() * filteredGames.length)];
                      const el = document.getElementById(`game-${pick.id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="rounded-full border border-emerald-400/45 bg-emerald-100/90 px-4 py-2 text-xs font-black tracking-[0.16em] text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                  >
                    NGẪU NHIÊN
                  </button>
                </div>

                <div className="text-xs font-bold tracking-[0.16em] text-slate-600">
                  {filteredGames.length}/{games.length}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                {filteredGames.map((game) => (
                  <GameCard key={game.id} game={game} id={`game-${game.id}`} onOpen={() => setSelectedGame(game)} />
                ))}
              </div>

              {filteredGames.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50/90 p-6 text-center shadow-sm">
                  <p className="text-sm font-bold tracking-wide text-amber-900">
                    {games.length === 0 ? "Chưa có dữ liệu game cho sảnh này" : "Không tìm thấy game phù hợp"}
                  </p>
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <GameDetailModal
        open={Boolean(selectedGame)}
        game={selectedGame}
        user={currentUser}
        analysisResult={analysisResult}
        analyzing={analyzing}
        analysisProgress={analysisProgress}
        onClose={() => setSelectedGame(null)}
        siteConfig={siteConfig ?? undefined}
        onAnalyze={async ({ game, points, modelKey, gameLink }) => {
          const balance = Number(currentUser?.balance ?? 0);
          const cAll = Number(siteConfig?.deductXuModelAll5 ?? 10);
          const cOth = Number(siteConfig?.deductXuModelOther ?? 2);
          const analysisCost = modelKey === "all5" ? cAll : cOth;
          if (balance < analysisCost) {
            setCurrentBalance(balance);
            setRequiredBalance(analysisCost);
            setLowBalanceOpen(true);
            return;
          }

          setAnalyzing(true);
          setAnalysisProgress([]);
          const deductResult = await deductXu(analysisCost);
          if (!deductResult.ok) {
            setCurrentBalance(balance);
            setRequiredBalance(analysisCost);
            setLowBalanceOpen(true);
            setAnalyzing(false);
            return;
          }

          // Force immediate UI balance update after confirmed deduction.
          setCurrentUser((prev) => {
            const prevBalance = Number(prev?.balance ?? 0);
            const fallbackBalance = Math.max(0, prevBalance - analysisCost);
            const apiBalance =
              typeof deductResult.user?.balance === "number" ? deductResult.user.balance : fallbackBalance;
            if (!prev && !deductResult.user) return prev;
            return {
              ...(prev ?? {}),
              ...(deductResult.user ?? {}),
              balance: apiBalance,
              xu: apiBalance,
              coins: apiBalance
            };
          });

          const statusSteps = [
            "Dang quet du lieu game...",
            "Dang truy cap endpoint va metadata...",
            "Dang phan tich chuyen sau...",
            "Dang tong hop ket qua..."
          ];

          for (const step of statusSteps) {
            setAnalysisProgress((prev) => [...prev, step]);
            // Gia lap tien trinh phan tich theo tung buoc.
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => setTimeout(resolve, 550));
          }

          const result = runPresetAnalysis({
            game,
            providerId: selectedProviderId,
            points,
            modelKey,
            gameLink
          });
          setAnalysisResult(result);
          setAnalyzing(false);
        }}
        onResetData={() => {
          setAnalyzing(false);
          setAnalysisProgress([]);
          setAnalysisResult(null);
        }}
      />

      <LowBalancePopup
        open={lowBalanceOpen}
        currentBalance={currentBalance}
        requiredBalance={requiredBalance}
        onClose={() => setLowBalanceOpen(false)}
        onDeposit={() => {
          // Placeholder: wire to your real deposit flow/route.
          setLowBalanceOpen(false);
        }}
      />

      {adminOpen ? (
        <AdminPanel
          adminRole={currentUser?.adminRole ?? null}
          onClose={async () => {
            setAdminOpen(false);
            const u = await fetchCurrentUser();
            if (u) setCurrentUser(u);
            const cfg = await fetchSiteConfig();
            setSiteConfig(cfg);
          }}
        />
      ) : null}

      <FloatingSupportMenu />
    </main>
  );
}
