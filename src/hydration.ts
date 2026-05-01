/**
 * Runs in the browser via `page.evaluate()`.
 * Decides whether to wait longer after `domcontentloaded` for SPAs / hydration.
 */
export function evaluateNeedsHydrationWait(): boolean {
  const bodyTextLen = document.body?.innerText?.trim().length ?? 0;
  const w = globalThis as Window &
    typeof globalThis & {
      __NEXT_DATA__?: unknown;
      __NUXT__?: unknown;
      __remixContext?: unknown;
      __gatsby?: unknown;
    };

  const hasFramework =
    typeof w.__NEXT_DATA__ !== 'undefined' ||
    typeof w.__NUXT__ !== 'undefined' ||
    typeof w.__remixContext !== 'undefined' ||
    typeof w.__gatsby !== 'undefined' ||
    !!document.querySelector(
      '[data-reactroot], [ng-version], [data-server-rendered="false"]',
    );

  if (!hasFramework && bodyTextLen >= 500) return false;
  if (hasFramework && bodyTextLen < 2000) return true;
  if (bodyTextLen < 500) return true;

  return false;
}
