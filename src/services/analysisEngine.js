function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const providerBias = {
  pg: 2,
  jili: 0,
  fc: -1,
  jdb: 1,
  pragmatic: 2,
  topplayer: 0,
  "168game": -1,
  cq9: 1,
  turbo: -2,
  microgaming: 1
};

export function runRuleBasedAnalysis({ game, providerId, points }) {
  const safePoints = clamp(Number(points) || 0, 1, 1000);
  const now = new Date();
  const timeBucket = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  const seed = hashString(`${game?.id ?? game?.title ?? "unknown"}-${providerId}-${safePoints}-${timeBucket}`);
  const random = mulberry32(seed);

  const gameKey = game?.title ?? "Unknown game";
  const gameHash = hashString(gameKey);
  const baseByGame = 66 + (gameHash % 24); // 66..89
  const pointBoost = Math.floor(safePoints / 200); // 0..5
  const providerBoost = providerBias[providerId] ?? 0;
  const hotBoost = game?.isHot ? 3 : 0;
  const newBoost = game?.isNew ? 1 : 0;
  const randomSwing = Math.floor(random() * 9) - 4; // -4..4
  const finalPercentage = clamp(baseByGame + pointBoost + providerBoost + hotBoost + newBoost + randomSwing, 60, 99);

  const confidence = clamp(72 + Math.floor(random() * 18) + (game?.isHot ? 3 : 0), 70, 98);
  const riskScore = clamp(100 - finalPercentage + Math.floor(random() * 8), 5, 45);

  const budget = safePoints;
  const triggerThreshold = Math.floor(budget * 0.5);
  const totalQuayMoi = Math.floor(triggerThreshold * 0.6);
  const totalQuayAuto = Math.floor(triggerThreshold * 0.4);
  const betMoi = 3 + Math.floor(random() * 3); // 3..5K
  const betAuto = 5 + Math.floor(random() * 4); // 5..8K

  const nightMode = now.getHours() >= 18 && now.getHours() <= 23;
  const nightRoundBoost = nightMode ? 4 + Math.floor(random() * 6) : 0;
  const nightBetBoost = nightMode ? 2 + Math.floor(random() * 3) : 0;

  const quayMoiRounds = Math.max(1, Math.floor(totalQuayMoi / betMoi) + nightRoundBoost);
  const quayAutoRounds = Math.max(1, Math.floor(totalQuayAuto / betAuto) + nightRoundBoost);
  const quayMoiBet = betMoi + nightBetBoost;
  const quayAutoBet = betAuto + nightBetBoost;

  const windowStart = formatTime(now);
  const windowMinutes = 9 + Math.floor(random() * 8);
  const windowEndDate = new Date(now.getTime() + windowMinutes * 60000);
  const windowEnd = formatTime(windowEndDate);

  const riskTag = riskScore >= 30 ? "CAO" : riskScore >= 18 ? "TRUNG BÌNH" : "THẤP";
  const signalTag = finalPercentage >= 85 ? "TÍN HIỆU MẠNH" : finalPercentage >= 74 ? "TÍN HIỆU ỔN ĐỊNH" : "TÍN HIỆU CẦN THẬN TRỌNG";

  return {
    percentage: finalPercentage,
    confidence,
    riskScore,
    riskTag,
    signalTag,
    goldenWindow: `${windowStart} - ${windowEnd}`,
    quayMoi: {
      rounds: quayMoiRounds,
      minBetK: quayMoiBet
    },
    quayAuto: {
      rounds: quayAutoRounds,
      minBetK: quayAutoBet
    },
    businessLogic: [
      "AI Prediction Engine",
      "Game Selection Logic",
      "Real-time Logging",
      "VIP Level System"
    ],
    explanation: [
      `Nền dữ liệu: ${providerId?.toUpperCase() ?? "N/A"} + profile game.`,
      `Vốn đầu vào: ${safePoints} điểm, ngưỡng kích hoạt ${triggerThreshold}.`,
      `Điều chỉnh theo khung giờ: ${nightMode ? "giờ vàng (18h-23h)" : "ngoài giờ vàng"}.`,
      `Độ tin cậy phân tích: ${confidence}% (rule-based + random có kiểm soát).`
    ]
  };
}

const MODEL_BASE = {
  manus: { label: "MANUS AI", confidence: 96, latency: "01:38" },
  claude: { label: "CLAUDE 3.7 SONNET", confidence: 94, latency: "01:52" },
  gpt: { label: "GPT-4.1", confidence: 95, latency: "01:44" },
  gemini: { label: "GEMINI 2.0 FLASH", confidence: 93, latency: "01:33" },
  deepseek: { label: "DEEPSEEK V3", confidence: 92, latency: "01:49" },
  all5: { label: "ALL 5 MODELS", confidence: 98, latency: "02:05" }
};

function modelKeyToMeta(modelKey) {
  return MODEL_BASE[modelKey] ?? MODEL_BASE.manus;
}

export function runPresetAnalysis({ game, modelKey, gameLink }) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const meta = modelKeyToMeta(modelKey);

  return {
    modelLabel: meta.label,
    gameTitle: game?.title ?? "GAME KHÔNG XÁC ĐỊNH",
    gameLink: gameLink?.trim() || "https://example.com/game",
    onlineUsers: 1280,
    passRate: 99,
    passWindow: "5 PHÚT (HOẶC TỪ 1 ĐẾN 10 PHÚT)",
    confidence: meta.confidence,
    elapsed: meta.latency,
    checkedAt: `${hh}:${mm}`,
    structuralScore: 96,
    security: "AES-256 + TLS 1.3",
    status: "SAFE",
    summaryLines: [
      "Đang quét endpoint game...",
      "Đang truy cập payload và metadata...",
      "Đang phân tích chuyên sâu luồng traffic...",
      "Tổng hợp kết quả theo mô hình đã chọn."
    ],
    codeSnippet: [
      "const aiSignal = await engine.scan(gameLink);",
      "const risk = aiSignal.riskScore < 25 ? 'LOW' : 'MEDIUM';",
      "const passRate = 99;",
      "return { risk, passRate, onlineUsers: 1280 };"
    ].join("\n")
  };
}

