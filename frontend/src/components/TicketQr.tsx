'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/**
 * QR de un boleto. Codifica la URL de verificación del panel de administración,
 * de modo que al escanearlo el personal ve los datos del boleto.
 */
export function TicketQr({ code, size = 132 }: { code: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/admin/tickets/${code}`;
    QRCode.toDataURL(url, { width: size * 2, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [code, size]);

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} alt={`QR del boleto ${code}`} className="qr" />
  ) : (
    <div className="qr qr--placeholder" style={{ width: size, height: size }} />
  );
}
