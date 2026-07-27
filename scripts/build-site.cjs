const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "client"), { recursive: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });
fs.mkdirSync(path.join(dist, ".openai"), { recursive: true });

fs.writeFileSync(path.join(dist, "client", "index.html"), html);
fs.copyFileSync(
  path.join(root, ".openai", "hosting.json"),
  path.join(dist, ".openai", "hosting.json"),
);

const worker = `const HTML = ${JSON.stringify(html)};
export default {
  async fetch() {
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
