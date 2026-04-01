import fs from 'fs';
import path from 'path';

// This script reads bubblesort_dataset.csv and generates pandaa_knowledge_data.sql
// Run with: node generate_sql.js

const csvPath = path.resolve('d:/WEBSITES BUILT/Gkk-hire/bubblesort_dataset.csv');
const outputPath = path.resolve('d:/WEBSITES BUILT/Gkk-hire/pandaa_knowledge_data.sql');

try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n');
    
    let sql = '-- AUTO-GENERATED INSERT DATA FOR PANDAA KNOWLEDGE\n';
    sql += 'INSERT INTO pandaa_knowledge (instruction, response, category, project) VALUES\n';

    // Skip header, process lines
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser (handles basic quotes)
        const parts = line.split('","').map(s => s.replace(/^"|"$/g, '').replace(/'/g, "''"));
        
        if (parts.length >= 2) {
            const instr = parts[0];
            const resp = parts[1];
            const cat = parts[2] || 'Uncategorized';
            const proj = parts[3] || 'General';
            rows.push(`('${instr}', '${resp}', '${cat}', '${proj}')`);
        }
    }

    sql += rows.join(',\n') + ';';
    fs.writeFileSync(outputPath, sql);
    console.log(`Success! Generated ${rows.length} rows in ${outputPath}`);
} catch (err) {
    console.error('Error processing CSV:', err);
}
