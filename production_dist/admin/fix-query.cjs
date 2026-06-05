const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/WEBSITES BUILT/Gkk-hire/Dashboard/public/admin/*.html');

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changes = 0;

  let newContent = content.replace(/querySelector\(['"][^'"]+['"]\)\s*\.\s*addEventListener/g, match => {
    changes++;
    return match.replace('.addEventListener', '?.addEventListener');
  });

  if (changes > 0 && content !== newContent) {
    fs.writeFileSync(f, newContent, 'utf8');
    console.log(`Fixed ${changes} querySelectors in:`, f.split('/').pop());
  }
}
