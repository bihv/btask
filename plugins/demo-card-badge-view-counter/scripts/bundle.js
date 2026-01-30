const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const OUTPUT_DIR = path.join(__dirname, '../');
const CLIENT_JS_SOURCE = path.join(DIST_DIR, 'client.iife.js');
const CLIENT_JS_DEST = path.join(OUTPUT_DIR, 'client.js');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');
const ZIP_FILE_NAME = 'plugin-bundle.zip';
const ZIP_FILE_PATH = path.join(OUTPUT_DIR, ZIP_FILE_NAME);

async function bundle() {
    console.log('📦 Starting bundle process...');

    // 1. Check if build exists
    if (!fs.existsSync(CLIENT_JS_SOURCE)) {
        console.error('❌ Build output not found. Please run "npm run build" first.');
        process.exit(1);
    }

    // 2. Prepare client.js (copy from dist)
    try {
        fs.copyFileSync(CLIENT_JS_SOURCE, CLIENT_JS_DEST);
        console.log('✅ Copied client.js');
    } catch (err) {
        console.error('❌ Failed to copy client.js:', err);
        process.exit(1);
    }

    // 3. Create Zip
    const output = fs.createWriteStream(ZIP_FILE_PATH);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function () {
        console.log(`✅ Bundle created: ${ZIP_FILE_NAME} (${archive.pointer()} bytes)`);

        // 4. Cleanup
        try {
            if (fs.existsSync(CLIENT_JS_DEST)) {
                fs.unlinkSync(CLIENT_JS_DEST);
                console.log('✅ Cleanup client.js');
            }
        } catch (err) {
            console.warn('⚠️ Failed to cleanup client.js:', err);
        }
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    // Append files
    archive.file(CLIENT_JS_DEST, { name: 'client.js' });
    archive.file(MANIFEST_FILE, { name: 'manifest.json' });

    await archive.finalize();
}

bundle().catch(err => {
    console.error('❌ Bundle failed:', err);
    process.exit(1);
});
