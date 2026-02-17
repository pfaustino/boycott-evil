import QRCode from 'qrcode';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = 'https://boycott-evil.vercel.app';
const outputPath = join(__dirname, '..', 'app', 'public', 'qr-code.png');

try {
  // Generate QR code as PNG buffer
  const qrCodeDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Convert data URL to buffer
  const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Write to file
  await writeFile(outputPath, buffer);
  console.log(`✓ QR code generated successfully at: ${outputPath}`);
  console.log(`  URL: ${url}`);
} catch (error) {
  console.error('Error generating QR code:', error);
  process.exit(1);
}
