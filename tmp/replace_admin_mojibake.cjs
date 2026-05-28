const fs = require('fs');
const path = require('path');

const roots = [
  'D:/WEBSITES BUILT/Gkk-hire/Dashboard/public/admin',
  'D:/WEBSITES BUILT/Gkk-hire/Dashboard/public/js',
  'D:/WEBSITES BUILT/Gkk-hire/InternMobileApp/assets/www/admin',
];

const exts = new Set(['.html', '.js', '.css', '.ts']);

const pairs = [
  ['â‚¹', '₹'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â€¦', '…'],
  ['â€¢', '•'],
  ['â„¹ï¸', 'ℹ️'],
  ['âš ï¸', '⚠️'],
  ['âœ…', '✅'],
  ['âœ¨', '✨'],
  ['âœ“', '✓'],
  ['âŒ', '❌'],
  ['â¸ï¸', '⛔'],
  ['âˆ’', '−'],
  ['â”€', '─'],
  ['â•', '═'],
  ['ðŸ“…', '📅'],
  ['ðŸ”—', '🔗'],
  ['ðŸŽ¥', '🎥'],
  ['ðŸ•’', '🕒'],
  ['ðŸ“¦', '📦'],
  ['ðŸŽ¨', '🎨'],
  ['ðŸ”’', '🔒'],
  ['ðŸ”“', '🔓'],
  ['ðŸ—‘ï¸', '🗑️'],
  ['ðŸ”´', '🔴'],
  ['Â·', '·'],
  ['Â', ''],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = roots.flatMap((r) => walk(r));
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let text = original;

  for (const [bad, good] of pairs) {
    if (text.includes(bad)) text = text.split(bad).join(good);
  }

  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8');
    changed += 1;
    console.log(`fixed: ${file}`);
  }
}

console.log(`ChangedFiles=${changed}`);
