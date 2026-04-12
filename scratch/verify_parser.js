const fs = require('fs');
// To test the ESM module in CommonJS scratch we might need some tricks or just use a temporary .ts file with ts-node
// But I can just check the regexes logic in a simple js file to be sure.

const text = `
Fecha de Emisión: 31/07/2025
Punto de Venta: Comp. Nro:	00002 00000119
Razón Social: ARROYO GUILLERMO MARIO
CUIT: 20262367429
FACTURA	C
Importe Total: $ 906571,14
Honorarios por servicios prestados, correspondiente al mes de JULIO de 2025
`;

const MESES_NOMBRES = {
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
  'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
};

function test(text) {
    const data = {};
    const tipoMatch = text.match(/FACTURA\s+([A-CM])/i);
    if (tipoMatch) data.letra = tipoMatch[1].toUpperCase();

    const nroMatch = text.match(/Punto de Venta:.*?Comp\. Nro:.*?(\d+)\s+(\d+)/i);
    if (nroMatch) {
        data.puntoVenta = nroMatch[1].padStart(5, '0');
        data.numero = nroMatch[2].padStart(8, '0');
    }

    const cuitMatch = text.match(/(?:CUIT|CUIL)[:\s]*(\d{2}-?\d{8}-?\d{1})/i);
    if (cuitMatch) {
        data.cuitEmisor = cuitMatch[1].replace(/-/g, '');
    }

    const totalMatch = text.match(/Importe Total:\s*\$\s*([\d\.,]+)/i);
    if (totalMatch) {
        const rawValue = totalMatch[1].replace(/\./g, '').replace(',', '.');
        data.importeTotal = parseFloat(rawValue);
    }

    const honorariosMatch = text.match(/mes de\s+([A-Z]+)\s+de\s+(\d{4})/i);
    if (honorariosMatch) {
        const mesNombre = honorariosMatch[1].toUpperCase();
        if (MESES_NOMBRES[mesNombre]) {
            data.mesHonorarios = MESES_NOMBRES[mesNombre];
            data.anioHonorarios = parseInt(honorariosMatch[2]);
        }
    }

    console.log(data);
}

test(text);
