import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import type { JsConversionOptions, JsHeadingStyle } from '@kreuzberg/html-to-markdown-node';

const require = createRequire(import.meta.url);
const kreuzberg = require('@kreuzberg/html-to-markdown-node') as {
  convert: (html: string, options?: JsConversionOptions | null) => string;
  JsHeadingStyle: typeof JsHeadingStyle;
};

const { convert, JsHeadingStyle: HeadingStyle } = kreuzberg;

/** Remove `<img>` elements before conversion. */
export function stripImgTags(html: string): string {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  dom.window.document.querySelectorAll('img').forEach((img) => img.remove());
  return dom.window.document.body?.innerHTML ?? html;
}

/** Replace anchors with their visible text only. */
export function stripLinkTags(html: string): string {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const { document: doc } = dom.window;
  doc.querySelectorAll('a').forEach((a) => {
    const text = doc.createTextNode(a.textContent ?? '');
    a.replaceWith(text);
  });
  return doc.body?.innerHTML ?? html;
}

export interface ConvertHtmlOptions {
  headingStyle?: 'atx' | 'underlined';
  includeImages?: boolean;
  includeLinks?: boolean;
}

export interface ConvertHtmlResult {
  markdown: string;
  warnings: string[];
}

function mapHeadingStyle(
  s: ConvertHtmlOptions['headingStyle'],
): JsHeadingStyle | undefined {
  if (!s || s === 'atx') return HeadingStyle.Atx;
  return HeadingStyle.Underlined;
}

/**
 * Convert cleaned article HTML to Markdown using Kreuzberg's Rust core.
 */
export function convertHtmlToMarkdown(
  html: string,
  options: ConvertHtmlOptions = {},
): ConvertHtmlResult {
  const headingStyle = mapHeadingStyle(options.headingStyle);
  let working = html;

  if (options.includeImages === false) working = stripImgTags(working);
  if (options.includeLinks === false) working = stripLinkTags(working);

  const opts: JsConversionOptions = {
    headingStyle,
    skipImages: options.includeImages === false,
    extractMetadata: false,
  };

  const markdown = convert(working, opts).trim();
  return { markdown, warnings: [] };
}
