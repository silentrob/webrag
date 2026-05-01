/** Resource types Playwright can classify for request interception. */
export type BlockableResourceType = 'image' | 'font' | 'media' | 'stylesheet';

export interface FetchOptions {
  /** Overrides automatic hydration detection — single navigation with this wait condition. */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** Navigation and wait timeout in ms. */
  timeout?: number;
  userAgent?: string;
  /**
   * When true (default), after `domcontentloaded` may wait for network idle or a selector
   * if the page looks like a client-rendered app or body text is still sparse.
   */
  detectHydration?: boolean;
  /**
   * After a sparse / framework page is detected, wait for this selector instead of networkidle.
   */
  waitForSelector?: string;
  /**
   * Abort matching resource types before navigation (default: image, font, media, stylesheet).
   * Pass `[]` to load all resources.
   */
  blockResources?: BlockableResourceType[];
  /** Scope DOM to this selector before Readability (e.g. `article`). */
  selector?: string;
  /** Use Mozilla Readability for main content (default: true). */
  readability?: boolean;
  headingStyle?: 'atx' | 'underlined';
  /** When false, strip images / use converter `skipImages` (default: false). */
  includeImages?: boolean;
  /** When false, unwrap links to plain text before conversion (default: true). */
  includeLinks?: boolean;
  /** Include title, byline, etc. on the result object (default: true). */
  includeMetadata?: boolean;
}

export interface FetchResult {
  /** Final URL after redirects. */
  url: string;
  title?: string;
  markdown: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedTime?: string;
  warnings: string[];
}
