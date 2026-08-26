// Compiles resume/main.tex into public/resume/resume.pdf.
//
// public/resume/ is gitignored because the PDF is generated, so a fresh clone
// has nothing to serve at /resume/resume.pdf until this has run once. It is
// wired to predev and prebuild so that happens automatically, and it is a
// no-op when the PDF is already newer than the source.
//
// LaTeX is not required to work on the site, so a missing latexmk warns and
// exits cleanly rather than breaking the build.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tex = join(root, 'resume', 'main.tex');
const built = join(root, 'resume', 'main.pdf');
const out = join(root, 'public', 'resume', 'resume.pdf');

const mtime = (p) => {
	try {
		return statSync(p).mtimeMs;
	} catch {
		return 0;
	}
};

if (mtime(out) > mtime(tex)) {
	process.exit(0);
}

const hasLatexmk = spawnSync('latexmk', ['-v'], { stdio: 'ignore' }).status === 0;
if (!hasLatexmk) {
	console.warn(
		'[resume] latexmk not found, skipping. /resume/resume.pdf will 404 until you install ' +
			'a TeX distribution and run `npm run resume`.',
	);
	process.exit(0);
}

execFileSync('latexmk', ['-pdf', '-interaction=nonstopmode', 'main.tex'], {
	cwd: join(root, 'resume'),
	stdio: 'inherit',
});
mkdirSync(dirname(out), { recursive: true });
copyFileSync(built, out);
console.log('[resume] built public/resume/resume.pdf');
