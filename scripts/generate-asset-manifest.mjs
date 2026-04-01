import fs from "node:fs";
import path from "node:path";

function gameNameToSlug(gameName) {
  // Keep identical slug rules to bigtool so the image filenames match.
  const vietnameseMap = {
    à: "a",
    á: "a",
    ạ: "a",
    ả: "a",
    ã: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ậ: "a",
    ẩ: "a",
    ẫ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ặ: "a",
    ẳ: "a",
    ẵ: "a",
    è: "e",
    é: "e",
    ẹ: "e",
    ẻ: "e",
    ẽ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ệ: "e",
    ể: "e",
    ễ: "e",
    ì: "i",
    í: "i",
    ị: "i",
    ỉ: "i",
    ĩ: "i",
    ı: "i",
    ò: "o",
    ó: "o",
    ọ: "o",
    ỏ: "o",
    õ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ộ: "o",
    ổ: "o",
    ỗ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ợ: "o",
    ở: "o",
    ỡ: "o",
    ù: "u",
    ú: "u",
    ụ: "u",
    ủ: "u",
    ũ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ự: "u",
    ử: "u",
    ữ: "u",
    ỳ: "y",
    ý: "y",
    ỵ: "y",
    ỷ: "y",
    ỹ: "y",
    đ: "d",
    À: "A",
    Á: "A",
    Ạ: "A",
    Ả: "A",
    Ã: "A",
    Â: "A",
    Ầ: "A",
    Ấ: "A",
    Ậ: "A",
    Ẩ: "A",
    Ẫ: "A",
    Ă: "A",
    Ằ: "A",
    Ắ: "A",
    Ặ: "A",
    Ẳ: "A",
    Ẵ: "A",
    È: "E",
    É: "E",
    Ẹ: "E",
    Ẻ: "E",
    Ẽ: "E",
    Ê: "E",
    Ề: "E",
    Ế: "E",
    Ệ: "E",
    Ể: "E",
    Ễ: "E",
    Ì: "I",
    Í: "I",
    Ị: "I",
    Ỉ: "I",
    Ĩ: "I",
    İ: "I",
    Ò: "O",
    Ó: "O",
    Ọ: "O",
    Ỏ: "O",
    Õ: "O",
    Ô: "O",
    Ồ: "O",
    Ố: "O",
    Ộ: "O",
    Ổ: "O",
    Ỗ: "O",
    Ơ: "O",
    Ờ: "O",
    Ớ: "O",
    Ợ: "O",
    Ở: "O",
    Ỡ: "O",
    Ù: "U",
    Ú: "U",
    Ụ: "U",
    Ủ: "U",
    Ũ: "U",
    Ư: "U",
    Ừ: "U",
    Ứ: "U",
    Ự: "U",
    Ử: "U",
    Ữ: "U",
    Ỳ: "Y",
    Ý: "Y",
    Ỵ: "Y",
    Ỷ: "Y",
    Ỹ: "Y",
    Đ: "D"
  };

  let slug = gameName;

  for (const key in vietnameseMap) {
    slug = slug.replace(new RegExp(key, "g"), vietnameseMap[key]);
  }

  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug;
}

function extractProviderTitlesFromBigtool(bigtoolRaw, providerKey) {
  const key = providerKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`'${key}'\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*(,|\\n\\s*})`);
  const m = bigtoolRaw.match(re);
  if (!m) return [];

  const block = m[1];
  const titles = [];
  const titleRe = /'([^']+)'/g;
  let match;
  while ((match = titleRe.exec(block))) {
    titles.push(match[1]);
  }

  return titles;
}

const providers = ["pg", "jili", "fc", "jdb", "pragmatic", "topplayer", "168game", "cq9", "turbo", "microgaming"];
const exts = ["webp", "png", "jpg", "jpeg"];

const root = process.cwd();
const bigtoolPath = path.join(root, "bigtool_game-list.js");
const outDir = path.join(root, "scripts", "out");
const outPath = path.join(outDir, "asset-manifest.json");

if (!fs.existsSync(bigtoolPath)) {
  console.error(`Missing file: ${bigtoolPath}`);
  process.exit(1);
}

const bigtoolRaw = fs.readFileSync(bigtoolPath, "utf8");

const assets = [];
for (const providerKey of providers) {
  const titles = extractProviderTitlesFromBigtool(bigtoolRaw, providerKey);
  for (const title of titles) {
    const slug = gameNameToSlug(title);
    for (const ext of exts) {
      assets.push({
        providerKey,
        title,
        slug,
        ext,
        cdnPath: `assets/img/games/${providerKey}/${slug}.${ext}`
      });
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), assets }, null, 2), "utf8");
console.log(`Wrote manifest: ${path.relative(root, outPath)} (${assets.length} entries)`);

