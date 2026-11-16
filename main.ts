// Vanguard Token Launch Radar Entrypoint
// Clean, erasable Node.js 22 TypeScript application.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function parseCliArg(name: string, fallback: string): string {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1]!;
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1) : fallback;
}

const inputPath = parseCliArg('input', '/input');
const inputFile = inputPath.endsWith('.json') ? inputPath : join(inputPath, 'snapshot.json');

if (!existsSync(inputFile)) {
  process.stderr.write(`token-radar: snapshot file missing at ${inputFile}\n`);
  process.exit(2);
}

const outputPath = parseCliArg('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const snapshotRaw = readFileSync(inputFile, 'utf8');
const snapshot = parseSnapshot(snapshotRaw);

const { board, radar } = buildRadar(snapshot);
const validationError = boardIssue(board, snapshot);

if (validationError !== null) {
  process.stderr.write(`token-radar validation error: ${validationError}\n`);
  process.exit(1);
}

mkdirSync(outputPath, { recursive: true });
writeFileSync(join(outputPath, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(outputPath, 'data.js'), dataScript(radar));

function mirrorDirectory(sourceDir: string, destDir: string): void {
  if (!existsSync(sourceDir)) return;
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(sourceDir)) {
    if (entry.startsWith('.')) continue;
    const src = join(sourceDir, entry);
    const dst = join(destDir, entry);
    if (statSync(src).isFile()) {
      copyFileSync(src, dst);
    }
  }
}

mirrorDirectory(join(rootDir, 'dashboard'), join(outputPath, 'dashboard'));
mirrorDirectory(join(rootDir, 'screenshots'), join(outputPath, 'screenshots'));

const dossierJson = buildDossier(outputPath, { text_max_bytes: 65536 });
writeFileSync(join(outputPath, 'dossier.json'), dossierJson);

process.stdout.write(`Vanguard Token Launch Radar: successfully evaluated and sealed ${board.length} ranked protocols into ${outputPath}\n`);
