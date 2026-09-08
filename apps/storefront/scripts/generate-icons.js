// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const buffer = Buffer.from(pngBase64, 'base64');

fs.writeFileSync(path.join(__dirname, '../public/icon-192x192.png'), buffer);
fs.writeFileSync(path.join(__dirname, '../public/icon-512x512.png'), buffer);
console.log('Icons generated successfully.');
