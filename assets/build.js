import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve('./dist');

// Helper: Ensure clean `dist/` folder
function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(path.resolve(src), path.resolve(DIST_DIR, dest));
}

// Main build process
(async () => {
  try {
    console.log('Cleaning dist directory...');
    cleanDist();

    console.log('Copying index.html...');
    copyFile('index.html', 'index.html');

    console.log('Copying app.css...');
    copyFile('app.css', 'app.css');

    console.log('Bundling and minifying JS...');
    await esbuild.build({
      entryPoints: ['index.js'],
      outfile: path.resolve(DIST_DIR, 'index.js'),
      minify: true,
      bundle: false,
    });

    console.log('Build complete. Files in /assets/dist');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
})();