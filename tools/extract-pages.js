import fs from "fs";
import readline from "readline";
import { createReadStream, createWriteStream } from "fs";
import path from "path";

if (process.argv.length < 4) {
    console.error("Usage: node extract-pages.js PATHTO.csv PATHTO.txt");
    process.exit(1);
}

const csvPath = process.argv[2];
const outputPath = process.argv[3];

// Create directories for output if they don't exist
try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
} catch (err) {
    console.error(`Error creating directory for output: ${err.message}`);
    process.exit(1);
}

// Use streams and readline for efficient processing of large files
async function processCSV() {
    try {
        const fileStream = createReadStream(csvPath, { encoding: 'utf8' });
        const outputStream = createWriteStream(outputPath, { encoding: 'utf8' });
        
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        let lineCount = 0;
        let websiteCount = 0;
        
        for await (const line of rl) {
            lineCount++;
            if (line.trim() === '') continue;
            
            // More robust CSV parsing - handles various formats better
            // Each line expected to be like: 1,"fonts.googleapis.com",10
            try {
                // Handle quoted strings with commas inside
                let parts = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        parts.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                // Add the last part
                parts.push(current);
                
                // Clean up parts and extract domain
                parts = parts.map(part => part.trim().replace(/^"|"$/g, ''));
                
                if (parts.length >= 2) {
                    const website = parts[1];
                    if (website) {
                        outputStream.write(website + '\n');
                        websiteCount++;
                        
                        // Show progress for large files
                        if (websiteCount % 1000 === 0) {
                            process.stdout.write(`Processed ${websiteCount} websites...\r`);
                        }
                    }
                }
            } catch (e) {
                console.error(`Warning: Could not parse line ${lineCount}: "${line}"`);
            }
        }
        
        outputStream.end();
        console.log(`\nExtracted ${websiteCount} websites to ${outputPath}`);
    } catch (err) {
        console.error(`Error processing CSV: ${err.message}`);
        process.exit(1);
    }
}

processCSV();