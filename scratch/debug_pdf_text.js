const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function testCurrentLogic() {
    const dataBuffer = fs.readFileSync('20262367429_011_00002_00000119.pdf');
    const parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    const lines = text.split('\n').map(l => l.trim());
    const iibvIndex = lines.findIndex(l => l.includes("Ingresos Brutos:"));
    let foundCuit = '';

    if (iibvIndex > 0) {
        console.log(`Encontrado "Ingresos Brutos:" en línea ${iibvIndex}: "${lines[iibvIndex]}"`);
        for (let i = iibvIndex - 1; i >= Math.max(0, iibvIndex - 5); i--) {
            console.log(`Revisando línea ${i}: "${lines[i]}"`);
            const match = lines[i].match(/\d{2}-?\d{8}-?\d{1}/);
            if (match) {
                foundCuit = match[0].replace(/-/g, '');
                console.log(`¡CUIT Encontrado!: ${foundCuit}`);
                break;
            }
        }
    }

    if (!foundCuit) {
        console.log('No se encontró CUIT cerca del ancla, usando fallback...');
        const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
        if (cuitMatch) {
            foundCuit = cuitMatch[1].replace(/-/g, '');
            console.log(`CUIT Fallback: ${foundCuit}`);
        }
    }

    console.log('FINAL RESULT:', foundCuit);
}

testCurrentLogic().catch(console.error);
