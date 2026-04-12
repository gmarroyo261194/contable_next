const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function verifyAmount() {
    const dataBuffer = fs.readFileSync('20262367429_011_00002_00000119.pdf');
    const parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;
    const lines = text.split('\n').map(l => l.trim());
    
    let foundTotal = 0;
    const totalIndex = lines.findIndex(l => l.includes("Importe Total:"));

    if (totalIndex !== -1) {
        console.log(`Encontrado "Importe Total:" en línea ${totalIndex}`);
        
        // Caso 1: Misma línea
        const sameLineMatch = lines[totalIndex].match(/Importe Total:.*?([\d\.,]+)/i);
        if (sameLineMatch && sameLineMatch[1].includes(',')) {
            console.log('Encontrado en misma línea:', sameLineMatch[1]);
            const rawValue = sameLineMatch[1].replace(/\./g, '').replace(',', '.');
            foundTotal = parseFloat(rawValue);
        }

        // Caso 2: Líneas anteriores
        if (!foundTotal) {
            console.log('Buscando en líneas anteriores...');
            for (let i = totalIndex - 1; i >= Math.max(0, totalIndex - 5); i--) {
                console.log(`Revisando L${i}: "${lines[i]}"`);
                const match = lines[i].match(/^([\d\.]*,\d{2})$/);
                if (match) {
                    console.log('¡Encontrado valor numérico!', match[1]);
                    const rawValue = match[1].replace(/\./g, '').replace(',', '.');
                    foundTotal = parseFloat(rawValue);
                    break;
                }
            }
        }
    }

    console.log('VALOR FINAL EXTRAÍDO:', foundTotal);
}

verifyAmount().catch(console.error);
