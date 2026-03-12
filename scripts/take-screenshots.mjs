#!/usr/bin/env node

/**
 * Takes screenshots of the registry site using Playwright.
 * Requires the dev server running on localhost:3000.
 *
 * Usage: npx playwright install chromium && node scripts/take-screenshots.mjs
 */

import { chromium } from "playwright";
import { join } from "path";

const BASE = "http://localhost:3000";
const OUT = join(import.meta.dirname, "../docs/screenshots");

const PAGES = [
  {
    name: "homepage-hero",
    path: "/",
    viewport: { width: 1440, height: 900 },
    fullPage: false,
    waitFor: 2000,
    colorScheme: "dark",
  },
  {
    name: "homepage-full",
    path: "/",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitFor: 2000,
    colorScheme: "dark",
  },
  {
    name: "plugin-detail",
    path: "/plugins/v2-anthropic",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitFor: 1500,
    colorScheme: "dark",
  },
  {
    name: "plugin-detail-light",
    path: "/plugins/spark",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitFor: 1500,
    colorScheme: "light",
  },
  {
    name: "explore",
    path: "/explore",
    viewport: { width: 1440, height: 900 },
    fullPage: false,
    waitFor: 1500,
    colorScheme: "dark",
  },
  {
    name: "compare",
    path: "/compare",
    viewport: { width: 1440, height: 900 },
    fullPage: false,
    waitFor: 1500,
    colorScheme: "dark",
  },
  {
    name: "stats",
    path: "/stats",
    viewport: { width: 1440, height: 900 },
    fullPage: false,
    waitFor: 1500,
    colorScheme: "dark",
  },
  {
    name: "homepage-mobile",
    path: "/",
    viewport: { width: 390, height: 844 },
    fullPage: false,
    waitFor: 2000,
    colorScheme: "dark",
  },
];

async function main() {
  const browser = await chromium.launch();

  for (const page of PAGES) {
    console.log(`📸 ${page.name} (${page.viewport.width}x${page.viewport.height}, ${page.colorScheme})`);

    const context = await browser.newContext({
      viewport: page.viewport,
      colorScheme: page.colorScheme,
      deviceScaleFactor: 2,
    });

    const tab = await context.newPage();
    await tab.goto(`${BASE}${page.path}`, { waitUntil: "networkidle" });
    await tab.waitForTimeout(page.waitFor);

    await tab.screenshot({
      path: join(OUT, `${page.name}.png`),
      fullPage: page.fullPage,
    });

    await context.close();
    console.log(`  ✓ saved ${page.name}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${PAGES.length} screenshots saved to docs/screenshots/`);
}

main().catch(console.error);
