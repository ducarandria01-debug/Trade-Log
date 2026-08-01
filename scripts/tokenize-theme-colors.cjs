const fs = require("node:fs");
const path = require("node:path");

const target = path.resolve(__dirname, "..", "index.html");
const source = fs.readFileSync(target, "utf8");
const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);

if (!styleMatch) throw new Error("Bloc CSS introuvable.");

const tokenStart = "/* THEME_TOKENS_START */";
const tokenEnd = "/* THEME_TOKENS_END */";
const protectedTokenBlock = styleMatch[1].match(
  new RegExp(`${tokenStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${tokenEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
);

if (!protectedTokenBlock) throw new Error("Bloc de tokens introuvable.");

const placeholder = "/* __APEX_PROTECTED_THEME_TOKENS__ */";
let css = styleMatch[1].replace(protectedTokenBlock[0], placeholder);

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { hue: 0, saturation: 0, lightness };
  const delta = max - min;
  const saturation = lightness > .5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return { hue: hue * 60, saturation, lightness };
}

function percentage(alpha) {
  return `${Math.max(.1, Math.min(100, Math.round(alpha * 1000) / 10))}%`;
}

function mixed(token, alpha, backdrop = "transparent") {
  if (alpha >= .995 && backdrop === "transparent") return `var(${token})`;
  return `color-mix(in srgb, var(${token}) ${percentage(alpha)}, ${backdrop})`;
}

function semanticColor(property, red, green, blue, alpha = 1) {
  if (alpha <= 0) return "transparent";
  const prop = property.toLowerCase();
  const textUse = prop === "color";
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  const chromatic = saturation >= .22;
  let family = "neutral";
  if (chromatic && (hue < 20 || hue >= 335)) family = "loss";
  else if (chromatic && hue >= 20 && hue < 76) family = "accent";
  else if (chromatic && hue >= 76 && hue < 195) family = "win";

  if (textUse) {
    let token;
    if (family === "accent") token = "--accent-text";
    else if (family === "win") token = "--win-text";
    else if (family === "loss") token = "--loss-text";
    else if (lightness >= .72) token = "--text-1";
    else if (lightness >= .42) token = "--text-2";
    else if (lightness >= .2) token = "--text-3";
    else token = "--on-accent";
    return mixed(token, alpha);
  }

  if ((prop === "box-shadow" || prop === "text-shadow") && family === "neutral") {
    return "var(--shadow)";
  }

  if (family !== "neutral") {
    const token = family === "accent" ? "--accent" : family === "win" ? "--win" : "--loss";
    if (alpha < .995) return mixed(token, alpha);
    if ((prop.includes("background") || prop === "background") && lightness < .32) {
      return `color-mix(in srgb, var(${token}) 14%, var(--surface))`;
    }
    if (prop.includes("border") && lightness < .42) {
      return `color-mix(in srgb, var(${token}) 30%, var(--border))`;
    }
    return `var(${token})`;
  }

  if (alpha < .995) {
    if ((prop.includes("background") || prop === "background") && lightness < .18 && alpha >= .3) {
      return "var(--scrim)";
    }
    const token = lightness >= .58 ? "--text-1" : lightness < .18 ? "--border" : "--text-3";
    return mixed(token, alpha);
  }

  if (prop.includes("border") || prop === "outline" || prop === "outline-color") return "var(--border)";
  if (prop.includes("background") || prop === "background") {
    if (lightness < .08) return "var(--bg)";
    if (lightness < .3) return "var(--surface)";
    if (lightness < .58) return "var(--border)";
    return "var(--surface)";
  }
  if (prop === "fill" || prop === "stroke" || prop === "stop-color") {
    if (lightness >= .72) return "var(--text-1)";
    if (lightness >= .4) return "var(--text-2)";
    return "var(--border)";
  }
  if (lightness < .1) return "var(--bg)";
  if (lightness < .3) return "var(--surface)";
  if (lightness < .55) return "var(--text-3)";
  if (lightness < .75) return "var(--text-2)";
  return "var(--text-1)";
}

function parseHex(hex) {
  let value = hex.slice(1);
  if (value.length === 3 || value.length === 4) value = [...value].map(char => char + char).join("");
  const alpha = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;
  return {
    red: parseInt(value.slice(0, 2), 16),
    green: parseInt(value.slice(2, 4), 16),
    blue: parseInt(value.slice(4, 6), 16),
    alpha
  };
}

function replaceColors(property, value) {
  let result = value.replace(/rgba?\(\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*[, ]\s*([0-9.]+)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)/gi, (_, r, g, b, a) => {
    const alpha = a ? (a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a)) : 1;
    return semanticColor(property, Number(r), Number(g), Number(b), alpha);
  });
  result = result.replace(/#[0-9a-f]{3,8}\b/gi, hex => {
    const parsed = parseHex(hex);
    return semanticColor(property, parsed.red, parsed.green, parsed.blue, parsed.alpha);
  });
  result = result.replace(/\b(black|white)\b/gi, name => {
    const channel = name.toLowerCase() === "white" ? 255 : 0;
    return semanticColor(property, channel, channel, channel, 1);
  });
  return result;
}

css = css.replace(/([-\w]+)\s*:\s*([^;{}]+);/g, (declaration, property, value) => {
  if (!/(?:#|rgba?\(|\bblack\b|\bwhite\b)/i.test(value)) return declaration;
  return `${property}: ${replaceColors(property, value)};`;
});
css = css
  .replace(/color\s*:\s*var\(--(?:accent|amber)\)/gi, "color: var(--accent-text)")
  .replace(/color\s*:\s*var\(--(?:green|win)\)/gi, "color: var(--win-text)")
  .replace(/color\s*:\s*var\(--(?:red|loss)\)/gi, "color: var(--loss-text)")
  .replace(/color\s*:\s*var\(--text-3\)/gi, "color: var(--text-2)")
  .replace(/(background-color|border-color|outline-color)\s*:\s*var\(--accent-text\)/gi, "$1: var(--accent)")
  .replace(/(background-color|border-color|outline-color)\s*:\s*var\(--win-text\)/gi, "$1: var(--win)")
  .replace(/(background-color|border-color|outline-color)\s*:\s*var\(--loss-text\)/gi, "$1: var(--loss)");

css = css.replace(placeholder, protectedTokenBlock[0]);
const output = source.replace(styleMatch[0], `<style>${css}</style>`);
fs.writeFileSync(target, output, "utf8");
