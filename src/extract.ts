import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ArticleExtraction {
  title?: string;
  contentHtml: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedTime?: string;
  textContent?: string;
}

/**
 * Extract main article HTML via Mozilla Readability.
 * @returns `null` if Readability could not find an article.
 */
export function extractArticle(html: string, baseUrl: string): ArticleExtraction | null {
  const dom = new JSDOM(html, { url: baseUrl });
  const doc = dom.window.document;
  const clone = doc.cloneNode(true) as typeof doc;
  const reader = new Readability(clone);
  const article = reader.parse();
  if (!article?.content) return null;

  return {
    title: article.title || undefined,
    contentHtml: article.content,
    excerpt: article.excerpt || undefined,
    byline: article.byline || undefined,
    siteName: article.siteName || undefined,
    publishedTime: article.publishedTime || undefined,
    textContent: article.textContent || undefined,
  };
}

/** Fallback main content: `body` inner HTML or full document. */
export function extractBodyFallback(html: string, baseUrl: string): string {
  const dom = new JSDOM(html, { url: baseUrl });
  const body = dom.window.document.body;
  if (body?.innerHTML) return body.innerHTML;
  return html;
}

/**
 * Scope rendered HTML to the first match of `selector` (outer HTML of the element).
 */
export function scopeHtmlToSelector(
  html: string,
  baseUrl: string,
  selector: string,
): string | null {
  const dom = new JSDOM(html, { url: baseUrl });
  const el = dom.window.document.querySelector(selector);
  return el?.outerHTML ?? null;
}
