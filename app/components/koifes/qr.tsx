"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value || "XXXX"}
      size={size}
      bgColor="#FFFFFF"
      fgColor="#000000"
      level="M"
    />
  );
}
