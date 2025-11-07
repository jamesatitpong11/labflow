// Sticker printing utility functions
import JsBarcode from 'jsbarcode';

export interface PatientStickerData {
  idCard: string;
  title: string;
  firstName: string;
  lastName: string;
  visitNumber: string;
  ln: string;
  age: string;
  visitDate: string;
  visitTime: string;
  printerName?: string;
}

export interface BarcodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

// ✅ Generate barcode as PNG
export function generateBarcode(text: string): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 2,
      background: '#ffffff',
      lineColor: '#000000',
      fontSize: 0,
      textMargin: 0,
    });
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.warn('JsBarcode not available, using fallback:', error);
    return generateFallbackBarcode(text);
  }
}

// ✅ Generate vector barcode (SVG)
export function generateBarcodeSVG(text: string, options: BarcodeOptions = {}): string {
  const {
    width = 1,
    height = 50,
    margin = 10,
    background = '#ffffff',
    lineColor = '#000000',
  } = options;

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg as unknown as SVGElement, text, {
      format: 'CODE128',
      width,
      height,
      margin,
      background,
      lineColor,
      displayValue: false,
    });
    if (!svg.getAttribute('viewBox')) {
      const w = svg.getAttribute('width') || String(width);
      const h = svg.getAttribute('height') || String(height);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    // ให้ SVG ปรับขนาดตาม CSS width/height ได้แน่นอน
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('shape-rendering', 'crispEdges');
    return svg.outerHTML;
  } catch (error) {
    console.warn('JsBarcode SVG generation failed, falling back to PNG:', error);
    const png = generateBarcode(text);
    return `<img src="${png}" alt="barcode" />`;
  }
}

// ✅ Simple fallback barcode
function generateFallbackBarcode(text: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = 300;
  canvas.height = 60;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.fillText(text, 10, 30);
  return canvas.toDataURL('image/png', 1.0);
}
