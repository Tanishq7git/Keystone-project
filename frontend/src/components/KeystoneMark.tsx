/**
 * The KEYSTONE mark: a five-stone arch. The center stone — the keystone — is the
 * one that holds the others up, rendered in gold; the flanking stones use the
 * same slate/steel/teal/charcoal tones the app uses for work-order status.
 * This literal reading of the product name is the app's one signature visual.
 */
const STONE_COLORS = ['#8B93A7', '#3E6FA6', '#E8A73B', '#2E9E7C', '#2B2F45'];

function buildStones(cx: number, cy: number, radius: number, blockW: number, blockH: number) {
  const angles = [180, 135, 90, 45, 0];
  return angles.map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy - radius * Math.sin(rad);
    const rotation = 90 - deg;
    return { x, y, rotation, color: STONE_COLORS[i], isKeystone: deg === 90 };
  });
}

export function KeystoneMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const stones = buildStones(50, 58, 34, 18, 12);

  return (
    <svg width={size} height={size} viewBox="0 0 100 78" className={className} aria-hidden="true">
      {stones.map((s, i) => (
        <rect
          key={i}
          x={s.x - 9}
          y={s.y - 6}
          width={18}
          height={12}
          rx={2}
          fill={s.color}
          transform={`rotate(${s.rotation} ${s.x} ${s.y})`}
          opacity={s.isKeystone ? 1 : 0.92}
        />
      ))}
      {/* base plinths */}
      <rect x="4" y="64" width="20" height="6" rx="1.5" fill="#2B2F45" opacity="0.85" />
      <rect x="76" y="64" width="20" height="6" rx="1.5" fill="#2B2F45" opacity="0.85" />
    </svg>
  );
}
