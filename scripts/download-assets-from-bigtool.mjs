import fs from "node:fs";
import path from "node:path";

const ASSET_HOST = "https://bigtool.net/";

async function fetchToFile(url, filePath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return { ok: false, status: res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
  return { ok: true, status: res.status };
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const root = process.cwd();
const manifestPath = path.join(root, "scripts", "out", "asset-manifest.json");
const outDir = path.join(root, "scripts", "out", "downloaded");

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing manifest. Run: node scripts/generate-asset-manifest.mjs`);
  process.exit(1);
}

const manifest = readJson(manifestPath);
const assets = manifest.assets ?? [];

// Only keep webp by default (smallest). You can change this to download other formats.
const desiredExt = process.env.DOWNLOAD_EXT ?? "webp";
const filtered = assets.filter((a) => a.ext === desiredExt);

const limit = Number(process.env.DOWNLOAD_LIMIT ?? "0") || filtered.length;
const slice = filtered.slice(0, limit);

console.log(`Downloading ${slice.length}/${filtered.length} assets (ext=${desiredExt}) from ${ASSET_HOST}`);

let okCount = 0;
let skipCount = 0;
let failCount = 0;

for (let i = 0; i < slice.length; i++) {
  const a = slice[i];
  const rel = a.cdnPath;
  const dest = path.join(outDir, rel);
  if (fs.existsSync(dest)) {
    skipCount++;
    continue;
  }
  const url = new URL(rel, ASSET_HOST).toString();
  const result = await fetchToFile(url, dest);
  if (result.ok) okCount++;
  else failCount++;

  if ((i + 1) % 50 === 0) {
    console.log(`Progress ${i + 1}/${slice.length} ok=${okCount} skip=${skipCount} fail=${failCount}`);
  }
}

console.log(`Done ok=${okCount} skip=${skipCount} fail=${failCount}`);
console.log(`Output folder: ${path.relative(root, outDir)}`);

