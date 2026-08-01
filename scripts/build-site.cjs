const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dist = path.join(root, "dist");
const fontDir = path.join(root, "assets", "fonts");
const fontFiles = fs.readdirSync(fontDir).filter((file) => file.endsWith(".woff2"));
const fontLicenseFiles = fs.readdirSync(fontDir).filter((file) => /^OFL-.*\.txt$/i.test(file));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "client"), { recursive: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });
fs.mkdirSync(path.join(dist, ".openai"), { recursive: true });
fs.mkdirSync(path.join(dist, "client", "assets", "fonts"), { recursive: true });

fs.writeFileSync(path.join(dist, "client", "index.html"), html);
[...fontFiles, ...fontLicenseFiles].forEach((file) => {
  fs.copyFileSync(
    path.join(fontDir, file),
    path.join(dist, "client", "assets", "fonts", file),
  );
});
fs.copyFileSync(
  path.join(root, ".openai", "hosting.json"),
  path.join(dist, ".openai", "hosting.json"),
);

const fontAssets = Object.fromEntries(fontFiles.map((file) => [
  `/assets/fonts/${file}`,
  fs.readFileSync(path.join(fontDir, file)).toString("base64"),
]));

const worker = `const HTML = ${JSON.stringify(html)};
const FONT_ASSETS = ${JSON.stringify(fontAssets)};
export default {
  async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (FONT_ASSETS[pathname]) {
      const binary = Uint8Array.from(atob(FONT_ASSETS[pathname]), character => character.charCodeAt(0));
      return new Response(binary, {
        headers: {
          "content-type": "font/woff2",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }
    return new Response(HTML, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff"
      }
    });
  }
};
`;

fs.writeFileSync(path.join(dist, "server", "index.js"), worker);
console.log("Site HTML autonome préparé dans /dist.");
