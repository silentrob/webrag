import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const cliJs = path.join(root, 'dist', 'cli.js');

function runCli(args: string[]) {
  return spawnSync(process.execPath, [cliJs, ...args], {
    encoding: 'utf-8',
  });
}

describe('cli', () => {
  it.skipIf(!existsSync(cliJs))('prints help for --help on stderr and exits 0', () => {
    const r = runCli(['--help']);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('Usage: webrag');
  });

  it.skipIf(!existsSync(cliJs))('exits non-zero with no args', () => {
    const r = runCli([]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/webrag|Usage/i);
  });
});
