const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const manifest = require('./manifest.json');

const DIST_DIR = path.join(__dirname, 'dist');
const ZIP_NAME = `llm-helper-v${manifest.version}.zip`;
const ZIP_PATH = path.join(DIST_DIR, ZIP_NAME);

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

const zip = new AdmZip();

console.log(`📦 Packaging ${manifest.name} v${manifest.version}...`);

// Add core files
const files = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.css',
    'popup.js',
    'LICENSE',
    'README.md'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        zip.addLocalFile(file);
        console.log(`  + ${file}`);
    } else {
        console.warn(`  ! Warning: ${file} not found`);
    }
});

// Add icons directory
if (fs.existsSync('icons')) {
    zip.addLocalFolder('icons', 'icons');
    console.log('  + icons/');
}

// Write zip file
zip.writeZip(ZIP_PATH);

console.log(`\n✅ Build successful!`);
console.log(`👉 File: ${ZIP_PATH}`);
