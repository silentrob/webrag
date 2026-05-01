import { applyResourceBlocking, withPage } from './browser.js';
import { convertHtmlToMarkdown } from './convert.js';
import {
  extractArticle,
  extractBodyFallback,
  scopeHtmlToSelector,
} from './extract.js';
import { evaluateNeedsHydrationWait } from './hydration.js';
import type { FetchOptions, FetchResult } from './types.js';

const DEFAULT_TIMEOUT = 30_000;

/**
 * Fetch a URL in a headless browser, extract readable content, return Markdown.
 */
export async function fetchPage(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const detectHydration = options.detectHydration ?? true;
  const readability = options.readability ?? true;
  const headingStyle = options.headingStyle ?? 'atx';
  const includeImages = options.includeImages ?? false;
  const includeLinks = options.includeLinks ?? true;
  const includeMetadata = options.includeMetadata ?? true;

  const warnings: string[] = [];

  return withPage(
    async (page) => {
      applyResourceBlocking(page, options.blockResources);

      if (options.waitUntil) {
        await page.goto(url, { waitUntil: options.waitUntil, timeout });
      } else {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        if (detectHydration) {
          const needsWait = await page.evaluate(evaluateNeedsHydrationWait);
          if (needsWait) {
            if (options.waitForSelector) {
              await page.waitForSelector(options.waitForSelector, {
                state: 'attached',
                timeout,
              });
            } else {
              await page.waitForLoadState('networkidle', { timeout });
            }
          }
        }
      }

      const finalUrl = page.url();
      let html = await page.content();

      if (options.selector) {
        const scoped = scopeHtmlToSelector(html, finalUrl, options.selector);
        if (!scoped) {
          warnings.push(`selector_not_found:${options.selector}`);
        } else {
          html = scoped;
        }
      }

      let title: string | undefined;
      let excerpt: string | undefined;
      let byline: string | undefined;
      let siteName: string | undefined;
      let publishedTime: string | undefined;
      let markdownSource: string;

      if (readability) {
        const article = extractArticle(html, finalUrl);
        if (article) {
          markdownSource = article.contentHtml;
          title = article.title;
          excerpt = article.excerpt;
          byline = article.byline;
          siteName = article.siteName;
          publishedTime = article.publishedTime;
        } else {
          warnings.push('readability:no_article_fallback_body');
          markdownSource = extractBodyFallback(html, finalUrl);
        }
      } else {
        markdownSource = extractBodyFallback(html, finalUrl);
      }

      const converted = convertHtmlToMarkdown(markdownSource, {
        headingStyle,
        includeImages,
        includeLinks,
      });
      warnings.push(...converted.warnings);

      const base: FetchResult = {
        url: finalUrl,
        markdown: converted.markdown,
        warnings,
      };
      if (!includeMetadata) return base;

      return {
        ...base,
        title,
        excerpt,
        byline,
        siteName,
        publishedTime,
      };
    },
    { userAgent: options.userAgent },
  );
}
