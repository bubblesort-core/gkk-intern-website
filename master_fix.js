import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminDir = path.join(__dirname, 'Dashboard/public/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(adminDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Pattern: (document.getElementById('...')?.value || '') = value;
    const regex = /\((document\.getElementById\(['"].*?['"]\)\?\.value\s*\|\|\s*['"]['"])\)\s*=\s*([^;]+);/g;

    const newContent = content.replace(regex, (match, elementExpr, value) => {
        changed = true;
        const idMatch = elementExpr.match(/getElementById\((['"])(.*?)\1\)/);
        if (idMatch) {
            const quote = idMatch[1];
            const id = idMatch[2];
            return `if (document.getElementById(${quote}${id}${quote})) document.getElementById(${quote}${id}${quote}).value = ${value.trim()};`;
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Fixed: ${file}`);
    }
});

console.log('Global Admin Fix Complete.');
