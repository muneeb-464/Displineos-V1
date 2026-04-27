import { cn } from "@/lib/utils";

interface Segment {
  hours: number;
  color: string;
  label: string;
}

interface Props {
  segments: Segment[];   // P, R, W hours + colors
  goalHours: number;     // daily target from settings
  size?: number;
  stroke?: number;
  className?: string;
}

export default function ScoreRing({ segments, goalHours, size = 200, stroke = 16, className }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const totalHours = segments.reduce((s, seg) => s + seg.hours, 0);
  const fillRatio = goalHours > 0 ? Math.min(1, totalHours / goalHours) : 0;
  const pct = Math.round(fillRatio * 100);

  // Each segment fills proportionally within the filled arc
  // e.g. if ring is 80% full and P=60%, R=30%, W=10% of total → each gets that share of the 80%
  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const segShare = totalHours > 0 ? (seg.hours / totalHours) * fillRatio : 0;
    const dashLen = segShare * c;
    const offset = c - cumulative * c;
    cumulative += segShare;
    return { ...seg, dashLen, offset };
  }).filter((a) => a.dashLen > 0.5);

  return (
    <div className={cn("relative grid place-items-center shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--surface-3))" strokeWidth={stroke} fill="none" />

        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            stroke={arc.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${arc.dashLen} ${c - arc.dashLen}`}
            strokeDashoffset={arc.offset}
            strokeLinecap={i === arcs.length - 1 ? "round" : "butt"}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke-dasharray 0.6s ease" }}
          />
        ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {goalHours > 0 ? (
            <>
              <div className="font-display font-black tracking-tight leading-none" style={{ fontSize: size * 0.2 }}>
                {pct}%
              </div>
              <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                {totalHours.toFixed(1)}h / {goalHours}h
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground px-4 text-center leading-snug">
              Set a daily goal in Settings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
