import { describe, expect, it } from 'vitest';
import {
  extractArticle,
  extractBodyFallback,
  scopeHtmlToSelector,
} from '../src/extract.js';

const ARTICLE_HTML = `<!DOCTYPE html>
<html>
<head><title>News Site</title></head>
<body>
  <header><nav>Home About</nav></header>
  <article>
    <h1>Main Story</h1>
    <p>This is the article body with enough text to satisfy readers.</p>
    <p>Second paragraph adds substance to the piece.</p>
  </article>
  <aside>Ads here</aside>
</body>
</html>`;

describe('extractArticle', () => {
  it('extracts main article and drops chrome', () => {
    const article = extractArticle(ARTICLE_HTML, 'https://news.example/item');
    expect(article).not.toBeNull();
    expect(article?.contentHtml.toLowerCase()).toContain('main story');
    const html = article?.contentHtml ?? '';
    expect(html.toLowerCase()).toContain('article body');
    expect(html.toLowerCase()).not.toContain('ads here');
  });
});

describe('extractBodyFallback', () => {
  it('returns body inner HTML', () => {
    const body = extractBodyFallback(ARTICLE_HTML, 'https://example.com');
    expect(body.toLowerCase()).toContain('article');
    expect(body.toLowerCase()).toContain('header');
  });
});

describe('scopeHtmlToSelector', () => {
  it('returns outer HTML of first match', () => {
    const scoped = scopeHtmlToSelector(
      ARTICLE_HTML,
      'https://example.com',
      'article h1',
    );
    expect(scoped?.toLowerCase()).toContain('main story');
    expect(scoped?.toLowerCase()).not.toContain('DOCTYPE');
  });

  it('returns null when selector misses', () => {
    expect(scopeHtmlToSelector(ARTICLE_HTML, 'https://example.com', '#nope')).toBeNull();
  });
});
