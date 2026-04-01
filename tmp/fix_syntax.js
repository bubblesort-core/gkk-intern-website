const fs = require('fs');
const path = require('path');
const dir = 'Dashboard/public/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changedCount = 0;

  // Regex to match (document.getElementById('ID')?.value || '') = VAL;
  // It handles quotes and spaces.
  const regex = /\(\s?document\.getElementById\(\s?(['"])(.*?)\1\s?\)\s?\?\.value\s?\|\|\s?['"]['\"]\s?\)\s?=\s?(.*?)(?=;|$)/g;
  
  content = content.replace(regex, (match, quote, id, value) => {
    changedCount++;
    return `if (document.getElementById('${id}')) document.getElementById('${id}').value = ${value}`;
  });

  if (changedCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${changedCount} instances in: ${file}`);
  }
});
