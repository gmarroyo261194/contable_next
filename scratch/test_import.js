// scratch/test_import.js
const { PDFParse } = require('pdf-parse');
console.log('PDFParse:', PDFParse);
try {
    const parser = new PDFParse({ data: Buffer.from('') });
    console.log('Constructor works');
} catch (e) {
    console.log('Constructor fails:', e.message);
}
