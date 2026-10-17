const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public', 'emulatorjs', 'data');
const coresDir = path.join(targetDir, 'cores');
const reportsDir = path.join(coresDir, 'reports');

fs.mkdirSync(reportsDir, { recursive: true });

const baseUrl = 'https://cdn.emulatorjs.org/stable/data/';

const filesToDownload = [
  'loader.js',
  'emulator.min.js',
  'emulator.min.css',
  'localization/pt-BR.json',
  'localization/en-US.json',
  'compression/extract7z.js',
  'compression/extractzip.js',
  // SNES
  'cores/reports/snes9x.json',
  'cores/snes9x-wasm.data',
  'cores/snes9x-legacy-wasm.data',
  'cores/snes9x-thread-wasm.data',
  'cores/snes9x-thread-legacy-wasm.data',
  // GBA
  'cores/reports/mgba.json',
  'cores/mgba-wasm.data',
  'cores/mgba-legacy-wasm.data',
  'cores/mgba-thread-wasm.data',
  'cores/mgba-thread-legacy-wasm.data',
  // NES
  'cores/reports/fceumm.json',
  'cores/fceumm-wasm.data',
  'cores/fceumm-legacy-wasm.data',
  'cores/fceumm-thread-wasm.data',
  'cores/fceumm-thread-legacy-wasm.data',
  // Genesis / Mega Drive
  'cores/reports/genesis_plus_gx.json',
  'cores/genesis_plus_gx-wasm.data',
  'cores/genesis_plus_gx-legacy-wasm.data',
  'cores/genesis_plus_gx-thread-wasm.data',
  'cores/genesis_plus_gx-thread-legacy-wasm.data',
  // Game Boy / Game Boy Color
  'cores/reports/gambatte.json',
  'cores/gambatte-wasm.data',
  'cores/gambatte-legacy-wasm.data',
  'cores/gambatte-thread-wasm.data',
  'cores/gambatte-thread-legacy-wasm.data'
];

function download(fileRel) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + fileRel;
    const dest = path.join(targetDir, fileRel);
    console.log(`Downloading: ${fileRel}...`);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`[WARN] HTTP ${res.statusCode} for ${fileRel}`);
        res.resume();
        return resolve();
      }

      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`[OK] Saved ${fileRel}`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`[ERR] Failed ${fileRel}:`, err.message);
      resolve();
    });
  });
}

async function run() {
  console.log('Downloading EmulatorJS assets for local lightning-fast hosting...');
  for (const f of filesToDownload) {
    await download(f);
  }
  console.log('Download complete!');
}

run();
