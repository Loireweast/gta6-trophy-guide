// Leonida Legend v2 — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
// It stages the guide for the grader: app/ and screenshots/ are copied from beside
// this file into the output directory, and /output/dossier.json is written by the
// vendored make.fun library so the judge can read the screenshots and the source.
// vendor/makefun-frontend.ts is the kit's copy, unchanged; the scorer rebuilds the
// dossier with its own copy and compares the two byte for byte, so leave it alone.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader sets /output; a local run can point anywhere with MAKEFUN_OUTPUT_DIR.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
// The whole guide: pages, script, styles and the trophy data file.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
// The four screenshots the judge sees first; the cover is the first by name.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the kit's reference/gate.json): the text cap
// shapes how much source the dossier carries; the others refuse an entry the
// scorer would refuse — at most 4 screenshots of at most 256 KiB each, app/ at
// most 993 files and directories and 48 MiB in all.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
