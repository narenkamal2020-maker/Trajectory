// Copy non-TS assets (SQL migrations) into dist/ after tsc.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '../src/db/migrations');
const dst = path.join(__dirname, '../dist/db/migrations');
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src)) if (f.endsWith('.sql')) fs.copyFileSync(path.join(src, f), path.join(dst, f));
console.log('Copied migrations to dist/');
