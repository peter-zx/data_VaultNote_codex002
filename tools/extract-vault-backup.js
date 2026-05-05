const fs = require("fs");
const path = require("path");

const levelDir =
  "C:/Users/admin/AppData/Roaming/Codex/Partitions/codex-browser-app/Local Storage/leveldb";
const outDir = "C:/Users/admin/Desktop/0505";
const files = fs
  .readdirSync(levelDir)
  .filter((file) => /\.(log|ldb)$/.test(file) || file.startsWith("MANIFEST"));

function extractJsons(text) {
  const marker = '{"version":1,"kdf":';
  const payloads = [];
  let index = 0;
  while ((index = text.indexOf(marker, index)) !== -1) {
    let depth = 0;
    let end = -1;
    let inString = false;
    let escaped = false;
    for (let cursor = index; cursor < text.length; cursor += 1) {
      const char = text[cursor];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          end = cursor + 1;
          break;
        }
      }
    }
    if (end === -1) break;
    const raw = text.slice(index, end);
    try {
      payloads.push(JSON.parse(raw));
    } catch {
      // Ignore partial LevelDB fragments.
    }
    index = end;
  }
  return payloads;
}

const found = [];
for (const file of files) {
  const fullPath = path.join(levelDir, file);
  try {
    const text = fs.readFileSync(fullPath, "utf8");
    const mtime = fs.statSync(fullPath).mtimeMs;
    for (const payload of extractJsons(text)) {
      found.push({ file, mtime, payload });
    }
  } catch {
    // Locked files are expected while Codex is open.
  }
}

if (!found.length) {
  console.error("No VaultNote payload found.");
  process.exit(2);
}

found.sort((a, b) => a.mtime - b.mtime);
const latest = found[found.length - 1];
const stamp = new Date().toISOString().slice(0, 10);
const pretty = JSON.stringify(latest.payload, null, 2);

fs.writeFileSync(path.join(outDir, `vaultnote-encrypted-backup-${stamp}.json`), pretty, "utf8");
fs.writeFileSync(path.join(outDir, "vaultnote-encrypted-backup-latest.json"), pretty, "utf8");
console.log(`Saved ${found.length} payload(s). Latest source: ${latest.file}`);
