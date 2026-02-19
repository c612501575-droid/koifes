export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const cells = 21;
  const cs = size / cells;
  const hash = (s: string, seed = 0) => {
    let h = seed;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  };
  const pat = Array.from({ length: cells * cells }, (_, i) =>
    (hash(value, i * 7919) & 0xffff) % 5 > 1
  );
  const setFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const idx = (oy + y) * cells + (ox + x);
        if (idx < pat.length) {
          const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          pat[idx] = ring <= 1 || ring === 3;
        }
      }
  };
  setFinder(0, 0);
  setFinder(cells - 7, 0);
  setFinder(0, cells - 7);
  for (let i = 8; i < cells - 8; i++) {
    pat[6 * cells + i] = i % 2 === 0;
    pat[i * cells + 6] = i % 2 === 0;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <rect width={size} height={size} fill="white" />
      {pat.map((f, i) =>
        f ? (
          <rect
            key={i}
            x={(i % cells) * cs}
            y={Math.floor(i / cells) * cs}
            width={cs + 0.5}
            height={cs + 0.5}
            fill="black"
          />
        ) : null
      )}
    </svg>
  );
}
