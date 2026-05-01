import process from 'node:process';
import { closeBrowser } from './browser.js';
import { fetchPage } from './fetch.js';
import type { FetchOptions } from './types.js';

function printHelp(): void {
  process.stderr.write(`Usage: webrag <url> [options]

Print Markdown to stdout (e.g. webrag https://example.com/page > results.md).
Warnings go to stderr.

Options:
  --selector <css>     Scope HTML to selector before Readability
  --wait-for <css>     After hydration wait, use this selector instead of networkidle
  --timeout <ms>       Navigation timeout (default: 30000)
  --no-hydration       Skip SPA / hydration detection
  --wait-until <mode>  Force page.goto waitUntil: load | domcontentloaded | networkidle
  --images             Include images in output (default: off)
  --no-links           Unwrap links to plain text
  -h, --help           Show this help
`);
}

function parseArgs(argv: string[]): { url: string; options: FetchOptions } {
  const options: FetchOptions = {};
  let url = '';
  let i = 0;

  if (argv.length === 0) {
    printHelp();
    process.exit(1);
  }

  if (argv[0] === '-h' || argv[0] === '--help') {
    printHelp();
    process.exit(0);
  }

  if (!argv[0].startsWith('-')) {
    url = argv[0];
    i = 1;
  }

  while (i < argv.length) {
    const flag = argv[i++];
    if (flag === undefined) break;

    switch (flag) {
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
      case '--selector': {
        const v = argv[i++];
        if (!v || v.startsWith('-')) {
          process.stderr.write('webrag: --selector requires a value\n');
          process.exit(1);
        }
        options.selector = v;
        break;
      }
      case '--wait-for': {
        const v = argv[i++];
        if (!v || v.startsWith('-')) {
          process.stderr.write('webrag: --wait-for requires a value\n');
          process.exit(1);
        }
        options.waitForSelector = v;
        break;
      }
      case '--timeout': {
        const raw = argv[i++];
        const n = raw ? Number(raw) : NaN;
        if (!Number.isFinite(n) || n <= 0) {
          process.stderr.write('webrag: --timeout expects a positive number\n');
          process.exit(1);
        }
        options.timeout = n;
        break;
      }
      case '--no-hydration':
        options.detectHydration = false;
        break;
      case '--wait-until': {
        const mode = argv[i++];
        if (!mode || mode.startsWith('-')) {
          process.stderr.write('webrag: --wait-until requires a value\n');
          process.exit(1);
        }
        if (mode !== 'load' && mode !== 'domcontentloaded' && mode !== 'networkidle') {
          process.stderr.write(
            'webrag: --wait-until must be load, domcontentloaded, or networkidle\n',
          );
          process.exit(1);
        }
        options.waitUntil = mode;
        break;
      }
      case '--images':
        options.includeImages = true;
        break;
      case '--no-links':
        options.includeLinks = false;
        break;
      default:
        if (!url && !flag.startsWith('-')) {
          url = flag;
        } else {
          process.stderr.write(`webrag: unknown option ${flag}\n`);
          printHelp();
          process.exit(1);
        }
    }
  }

  if (!url) {
    process.stderr.write('webrag: missing URL\n');
    printHelp();
    process.exit(1);
  }

  if (!/^https?:\/\//i.test(url)) {
    process.stderr.write('webrag: URL must start with http:// or https://\n');
    process.exit(1);
  }

  return { url, options };
}

async function main(): Promise<void> {
  const { url, options } = parseArgs(process.argv.slice(2));

  try {
    const result = await fetchPage(url, options);
    if (result.warnings.length > 0) {
      process.stderr.write(`${result.warnings.join('\n')}\n`);
    }
    const md = result.markdown;
    process.stdout.write(md.endsWith('\n') ? md : `${md}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`webrag: ${msg}\n`);
    process.exitCode = 2;
  } finally {
    await closeBrowser();
  }
}

void main();
