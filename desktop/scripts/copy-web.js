// Copy the built web app (app/dist) into desktop/web for packaging.
const fs = require('fs');
const path = require('path');
const src = path.resolve(__dirname, '../../app/dist');
const dst = path.resolve(__dirname, '../web');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
console.log(`Copied ${src} -> ${dst}`);
