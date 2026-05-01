import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { BlockableResourceType } from './types.js';

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

/** Eager browser init — call at process startup to avoid first-request cold start. */
export async function warmup(): Promise<void> {
  await getBrowser();
}

/** Close the shared Chromium process. */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

export interface WithPageOptions {
  userAgent?: string;
}

/**
 * One isolating `BrowserContext` per call; closes context in `finally`.
 */
export async function withPage<T>(
  fn: (page: Page, context: BrowserContext) => Promise<T>,
  options: WithPageOptions = {},
): Promise<T> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: options.userAgent,
  });
  try {
    const page = await context.newPage();
    return await fn(page, context);
  } finally {
    await context.close();
  }
}

const DEFAULT_BLOCK: BlockableResourceType[] = [
  'image',
  'font',
  'media',
  'stylesheet',
];

/**
 * Abort heavy resources before navigation (speed + aligned with token defaults).
 */
export function applyResourceBlocking(
  page: Page,
  blockResources: BlockableResourceType[] | undefined,
): void {
  const blocked =
    blockResources === undefined ? DEFAULT_BLOCK : [...blockResources];
  if (blocked.length === 0) return;

  void page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (blocked.includes(type as BlockableResourceType)) {
      void route.abort();
    } else {
      void route.continue();
    }
  });
}
