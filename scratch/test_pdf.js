const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function test() {
    let dataBuffer = fs.readFileSync('20262367429_011_00002_00000119.pdf');

    try {
        const parser = new PDFParse({ data: dataBuffer });
        const pdfData = await parser.getText();
        const text = pdfData.text;

        console.log("--- TEXT CONTENT ---");
        console.log(text);
        console.log("--- END CONTENT ---");

        // Test extraction
        const fechaMatch = text.match(/Fecha de Emisi[óo]n:\s*(\d{2}\/\d{2}\/\d{4})/i);
        console.log("Fecha:", fechaMatch ? fechaMatch[1] : "Not found");

        const nroMatch = text.match(/Punto de Venta:\s*(\d+)\s*Comp\. Nro:\s*(\d+)/i);
        console.log("PV:", nroMatch ? nroMatch[1] : "Not found");
        console.log("Nro:", nroMatch ? nroMatch[2] : "Not found");

        const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
        console.log("CUIT:", cuitMatch ? cuitMatch[1] : "Not found");

        const totalMatch = text.match(/Importe Total:\s*\$\s*([\d\.,]+)/i);
        console.log("Total:", totalMatch ? totalMatch[1] : "Not found");

        // Periodo
        const periodoMatch = text.match(/Per[íi]odo Facturado Desde:\s*(\d{2}\/\d{2}\/\d{4})\s*Hasta:\s*(\d{2}\/\d{2}\/\d{4})/i);
        console.log("Periodo:", periodoMatch ? `${periodoMatch[1]} - ${periodoMatch[2]}` : "Not found");

    } catch (e) {
        console.error("Error parsing PDF:", e);
    }
}

test();
