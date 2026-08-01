const path = require('path');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public', 'arquetipos');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const items = [
  { name: 'EMPERADOR', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/EMPERADOR.png' },
  { name: 'MAGO', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/MAGO.png' },
  { name: 'GLADIADOR', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/GLADIADOR.png' },
  { name: 'MALABARISTA', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/MALABARISTA.png' },
  { name: 'MOCHILERO', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/MOCHILERO.png' },
  { name: 'SONADOR', url: 'https://11qxl2z9wnwj1jis.public.blob.vercel-storage.com/SO%C3%91ADOR.png' }
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function run() {
  let totalOrig = 0;
  let totalWebp = 0;

  for (const item of items) {
    console.log(`Downloading ${item.name}...`);
    const buffer = await download(item.url);
    totalOrig += buffer.length;

    const origPngPath = path.join(outDir, `${item.name}.png`);
    fs.writeFileSync(origPngPath, buffer);

    const meta = await sharp(buffer).metadata();
    console.log(`${item.name} downloaded: ${meta.width}x${meta.height}, ${(buffer.length/1024/1024).toFixed(2)} MB`);

    const webpPath = path.join(outDir, `${item.name}.webp`);
    await sharp(buffer)
      .resize({ width: Math.min(meta.width || 800, 800), withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    totalWebp += webpStat.size;
    console.log(` -> Saved ${item.name}.webp: ${(webpStat.size / 1024).toFixed(1)} KB`);
  }

  console.log(`\nDONE!`);
  console.log(`Total Original: ${(totalOrig/1024/1024).toFixed(2)} MB`);
  console.log(`Total WebP: ${(totalWebp/1024/1024).toFixed(2)} MB (${((1 - totalWebp/totalOrig)*100).toFixed(1)}% reduction)`);
}

run().catch(console.error);
