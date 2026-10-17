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
  'cores/reports/snes9x.json',
  'cores/snes9x-wasm.data',
  'cores/reports/mgba.json',
  'cores/mgba-wasm.data',
  'cores/reports/fceumm.json',
  'cores/fceumm-wasm.data',
  'cores/reports/genesis_plus_gx.json',
  'cores/genesis_plus_gx-wasm.data',
  'cores/reports/gambatte.json',
  'cores/gambatte-wasm.data'
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
