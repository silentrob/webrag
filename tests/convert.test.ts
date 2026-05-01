import { describe, expect, it } from 'vitest';
import {
  convertHtmlToMarkdown,
  stripImgTags,
  stripLinkTags,
} from '../src/convert.js';

describe('convertHtmlToMarkdown', () => {
  it('converts headings and paragraphs', () => {
    const { markdown, warnings } = convertHtmlToMarkdown(
      '<h1>Title</h1><p>Hello <strong>world</strong>.</p>',
      { headingStyle: 'atx', includeImages: false, includeLinks: true },
    );
    expect(warnings).toBeDefined();
    expect(markdown).toContain('Title');
    expect(markdown.toLowerCase()).toContain('hello');
    expect(markdown).toContain('world');
  });

  it('skips images when includeImages is false', () => {
    const { markdown } = convertHtmlToMarkdown(
      '<p>Text</p><img src="https://example.com/x.png" alt="pic" />',
      { includeImages: false },
    );
    expect(markdown.toLowerCase()).not.toContain('http');
    expect(markdown.toLowerCase()).toContain('text');
  });

  it('unwraps links when includeLinks is false', () => {
    const { markdown } = convertHtmlToMarkdown(
      '<p><a href="https://example.com">click me</a></p>',
      { includeLinks: false },
    );
    expect(markdown).toContain('click me');
    expect(markdown).not.toContain('http');
  });
});

describe('stripImgTags', () => {
  it('removes img elements', () => {
    const html = '<p>a</p><img src="x" />';
    expect(stripImgTags(html)).not.toContain('<img');
    expect(stripImgTags(html)).toContain('a');
  });
});

describe('stripLinkTags', () => {
  it('replaces anchors with text', () => {
    expect(stripLinkTags('<a href="x">y</a>')).toBe('y');
  });
});
