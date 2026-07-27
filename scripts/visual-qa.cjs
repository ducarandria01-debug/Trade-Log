const { chromium } = require("C:/Users/ducar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const baseUrl = process.env.QA_URL || "http://127.0.0.1:4173";
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];

  desktop.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  desktop.on("pageerror", error => errors.push(error.message));

  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  const initial = {
    title: await desktop.title(),
    heading: await desktop.locator("h1").first().textContent(),
    kpis: await desktop.locator(".kpi").count(),
    trades: await desktop.locator("tbody tr").count(),
  };
  await desktop.screenshot({ path: "qa-dashboard.png", fullPage: true });

  await desktop.getByRole("button", { name: "Journal des trades" }).click();
  await desktop.locator(".search input").fill("XAU");
  const filteredRows = await desktop.locator("tbody tr").count();

  await desktop.getByRole("button", { name: "Nouveau trade" }).click();
  await desktop.locator('input[name="asset"]').fill("USD/JPY");
  await desktop.locator('input[name="entry"]').fill("155");
  await desktop.locator('input[name="exit"]').fill("156");
  await desktop.locator('input[name="rr"]').fill("2");
  await desktop.locator('input[name="setup"]').fill("Breakout");
  await desktop.getByRole("button", { name: "Ajouter au journal" }).click();
  await desktop.waitForSelector(".toast");
  const saved = JSON.parse(await desktop.evaluate(() => localStorage.getItem("apex-trades")));

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: "qa-mobile.png", fullPage: true });
  const mobileMetrics = await mobile.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    navVisible: getComputedStyle(document.querySelector(".mobile-nav")).display,
  }));

  console.log(JSON.stringify({
    initial,
    filteredRows,
    addedTrade: saved.some(trade => trade.asset === "USD/JPY"),
    mobileMetrics,
    errors,
  }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
