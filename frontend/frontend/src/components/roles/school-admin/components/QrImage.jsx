// QrImage.jsx
// Renders a QR code as a <canvas> element via qrcode.react's QRCodeCanvas.
// html2canvas can rasterise a <canvas> natively, so the QR will appear
// correctly in any generated PDF.
import { QRCodeCanvas } from 'qrcode.react';

/**
 * @param {{
 *   value: string,
 *   size?: number,
 *   fgColor?: string,
 *   bgColor?: string,
 *   onClick?: () => void
 * }} props
 */
export default function QrImage({ value, size = 80, fgColor = '#000000', bgColor = '#ffffff', onClick }) {
  if (!value || value.trim() === '') return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : undefined,
        display: 'inline-block',
      }}
      onClick={onClick}
    >
      <QRCodeCanvas
        value={value}
        size={size}
        fgColor={fgColor}
        bgColor={bgColor}
        level="M"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
