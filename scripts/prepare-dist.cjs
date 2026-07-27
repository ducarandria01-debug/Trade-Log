const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "out");
const destination = path.join(root, "dist");

if (!fs.existsSync(source)) {
  throw new Error("Next.js static export was not generated in /out.");
}

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
console.log("Static deployment bundle prepared in /dist.");
