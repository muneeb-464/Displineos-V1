import { useEffect, useMemo, useState } from "react";
import { TimeBlock } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, formatMinutes, nowMinutes } from "@/lib/utils";
import { Zap } from "lucide-react";

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_PX = 72;
const GUTTER = 64; // px reserved for hour labels on the left
const MIN_BLOCK_PX = 32;
const minToPx = (m: number) => ((m - START_HOUR * 60) / 60) * HOUR_PX;

interface Props {
  date: string;
  blocks: TimeBlock[];
  onSlotClick: (startMin: number) => void;
  onBlockClick: (block: TimeBlock) => void;
  ghostBlocks?: TimeBlock[];
  onGhostBlockClick?: (block: TimeBlock) => void;
  isToday?: boolean;
}

interface BlockLayout {
  block: TimeBlock;
  col: number;
  totalCols: number;
  visualTop: number;
  visualHeight: number;
}

function computeLayout(blocks: TimeBlock[]): BlockLayout[] {
  if (!blocks.length) return [];
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const colEnds: number[] = [];
  const assigned: { block: TimeBlock; col: number }[] = [];

  for (const b of sorted) {
    let col = colEnds.findIndex((end) => end <= b.startMin);
    if (col === -1) col = colEnds.length;
    colEnds[col] = b.endMin;
    assigned.push({ block: b, col });
  }

  const colVisualBottom: number[] = [];

  return assigned.map(({ block, col }) => {
    const overlapping = assigned.filter(
      ({ block: o }) => o.startMin < block.endMin && o.endMin > block.startMin
    );
    const totalCols = Math.max(...overlapping.map((a) => a.col)) + 1;

    const rawH = ((block.endMin - block.startMin) / 60) * HOUR_PX;
    const visualHeight = Math.max(MIN_BLOCK_PX, rawH);
    const timeTop = minToPx(block.startMin);
    const prevBottom = colVisualBottom[col] ?? 0;
    const visualTop = Math.max(timeTop, prevBottom + 1);
    colVisualBottom[col] = visualTop + visualHeight;

    return { block, col, totalCols, visualTop, visualHeight };
  });
}

export default function Timeline({ blocks, onSlotClick, onBlockClick, ghostBlocks = [], onGhostBlockClick, isToday }: Props) {
  const categories = useStore((s) => s.categories);
  const settings = useStore((s) => s.settings);
  const [now, setNow] = useState(() => nowMinutes(settings.timezone));

  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes(settings.timezone)), 30000);
    return () => clearInterval(t);
  }, [settings.timezone]);

  const containerHeight = (END_HOUR - START_HOUR + 1) * HOUR_PX;

  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR), []);
  const layout = useMemo(() => computeLayout(blocks), [blocks]);
  const ghostLayout = useMemo(() => computeLayout(ghostBlocks), [ghostBlocks]);

  const renderBlock = ({ block: b, col, totalCols, visualTop: top, visualHeight: height }: BlockLayout, ghost = false) => {
    const cat = categories.find((c) => c.id === b.subCategoryId);
    if (!cat) return null;

    const rawH = ((b.endMin - b.startMin) / 60) * HOUR_PX;
    const GAP = 2;
    const leftPct = `calc(${GUTTER}px + ${col} / ${totalCols} * (100% - ${GUTTER}px) + ${GAP}px)`;
    const widthPct = `calc((100% - ${GUTTER}px) / ${totalCols} - ${GAP * 2}px)`;

    const accent =
      cat.type === "productive" ? "border-l-cat-productive bg-cat-productive/5"
      : cat.type === "routine"   ? "border-l-cat-routine bg-cat-routine/5"
      : "border-l-cat-wasted bg-cat-wasted/5";

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (ghost && onGhostBlockClick) onGhostBlockClick(b);
      else if (!ghost) onBlockClick(b);
    };

    return (
      <button
        key={b.id}
        onClick={handleClick}
        style={{ top, height, left: leftPct, width: widthPct }}
        className={cn(
          "absolute rounded-lg border border-border border-l-4 px-2 py-1.5 text-left transition z-10 overflow-hidden flex flex-col justify-start",
          accent,
          ghost
            ? onGhostBlockClick
              ? "opacity-40 hover:opacity-70 hover:border-primary/40 cursor-pointer"
              : "opacity-30 pointer-events-none"
            : "hover:border-primary/40 bg-surface-1"
        )}
      >
        {(() => {
          const mins = b.endMin - b.startMin;
          const dh = Math.floor(mins / 60);
          const dm = mins % 60;
          const dur = `${dh > 0 ? `${dh}h` : ""}${dm > 0 ? ` ${dm}m` : ""}`.trim();
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              {cat.isDeepWork && <Zap className="h-3 w-3 shrink-0 text-primary" />}
              <span className="font-semibold text-md shrink-0">{cat.name}</span>
              {rawH >= 36 && (
                <>
                  <span className="text-muted-foreground/30 text-[10px] shrink-0">|</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {formatMinutes(b.startMin, settings.timeFormat)} – {formatMinutes(b.endMin, settings.timeFormat)}
                    <span className="mx-1 opacity-40">·</span>
                    {dur}
                  </span>
                </>
              )}
              {totalCols === 1 && (
                <span className={cn(
                  "ml-auto shrink-0 chip text-[9px] uppercase tracking-wider",
                  cat.type === "productive" && "chip-primary",
                  cat.type === "wasted" && "bg-cat-wasted/20 text-cat-wasted",
                )}>{cat.type}</span>
              )}
            </div>
          );
        })()}
      </button>
    );
  };

  return (
    <div className="relative select-none" style={{ height: containerHeight }}>
      {/* hour rows */}
      {hours.map((h) => (
        <div
          key={h}
          onClick={() => onSlotClick(h * 60)}
          className="absolute left-0 right-0 border-t border-border/40 cursor-pointer hover:bg-surface-2/30 transition"
          style={{ top: minToPx(h * 60), height: HOUR_PX }}
        >
          <span className="absolute left-1 top-1 text-[10px] text-muted-foreground/60 font-mono leading-none z-0">
            {formatMinutes(h * 60, settings.timeFormat)}
          </span>
        </div>
      ))}

      {/* ghost blocks */}
      {ghostLayout.map((item) => renderBlock(item, true))}

      {/* real blocks */}
      {layout.map((item) => renderBlock(item))}

      {/* NOW line */}
      {isToday && now >= START_HOUR * 60 && now <= END_HOUR * 60 && (
        <div className="absolute left-12 right-2 z-20 pointer-events-none" style={{ top: minToPx(now) }}>
          <div className="flex items-center gap-2">
            <span className="chip chip-primary text-[10px] tracking-widest animate-pulse-glow">NOW</span>
            <div className="flex-1 h-px bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
          </div>
        </div>
      )}
    </div>
  );
}
