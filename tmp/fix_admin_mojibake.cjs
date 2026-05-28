const fs = require('fs');
const path = require('path');

const roots = [
  'D:/WEBSITES BUILT/Gkk-hire/Dashboard/public/admin',
  'D:/WEBSITES BUILT/Gkk-hire/Dashboard/public/js',
  'D:/WEBSITES BUILT/Gkk-hire/InternMobileApp/assets/www/admin',
];

const exts = new Set(['.html', '.js', '.css', '.ts']);
const badPattern = /(Ã|Â|â|ðŸ|ï¸|�)/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function score(s) {
  const m = s.match(badPattern);
  return m ? m.length : 0;
}

const files = roots.flatMap((r) => walk(r));
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const originalScore = score(original);
  if (originalScore === 0) continue;

  const recovered = Buffer.from(original, 'latin1').toString('utf8');
  const recoveredScore = score(recovered);

  if (recoveredScore < originalScore) {
    fs.writeFileSync(file, recovered, 'utf8');
    changed += 1;
    console.log(`fixed: ${file} (${originalScore} -> ${recoveredScore})`);
  }
}

console.log(`ChangedFiles=${changed}`);
