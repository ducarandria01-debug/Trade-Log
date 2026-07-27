const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const sourceConfig = path.join(root, ".openai", "hosting.json");
const configDirectory = path.join(output, ".openai");
const destinationConfig = path.join(configDirectory, "hosting.json");

if (!fs.existsSync(path.join(output, "server", "index.js"))) {
  throw new Error("vinext did not generate the required /dist/server/index.js entrypoint.");
}

fs.mkdirSync(configDirectory, { recursive: true });
fs.copyFileSync(sourceConfig, destinationConfig);
console.log("Sites deployment metadata copied into /dist.");
