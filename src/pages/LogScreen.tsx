import { useEffect, useMemo, useState } from "react";
import Timeline from "@/components/timeline/Timeline";
import BlockCreationPanel from "@/components/timeline/BlockCreationPanel";
import { useDayScore, useStore } from "@/lib/store";
import { TimeBlock } from "@/lib/types";
import { formatDateLong, isoFromDate, isEditableDate, parseISODateLocal, todayISO } from "@/lib/utils";
import NamazTracker from "@/components/NamazTracker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LogScreen() {
  const timezone = useStore((s) => s.settings.timezone);
  const today = todayISO(timezone);
  const [date, setDate] = useState<string>(today);
  const [dateOpen, setDateOpen] = useState(false);
  const isToday = date === today;

  const blocks = useStore((s) => s.blocks);
  const categories = useStore((s) => s.categories);
  const recent = useStore((s) => s.recentSubCategoryIds);
  const showNamazInLog = useStore((s) => s.settings.showNamazInLog);
  const score = useDayScore(date);

  const startedDays = useStore((s) => s.startedDays);
  const dayStarted = startedDays.includes(date);
  const isLocked = !isToday && !isEditableDate(date);

  const planned = blocks.filter((b) => b.date === date && b.kind === "planned");
  const logged = blocks.filter((b) => b.date === date && b.kind === "logged");

  const lockToast = () => toast.info("You can only customize blocks from the last 7 days");

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<TimeBlock | null>(null);
  const [initStart, setInitStart] = useState(9 * 60);
  const [initEnd, setInitEnd] = useState<number | undefined>(undefined);
  const [presetSub, setPresetSub] = useState<string | null>(null);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const recentChips = useMemo(() => {
    const ids = recent.length ? recent : categories.slice(0, 5).map((c) => c.id);
    return ids
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean)
      .slice(0, 5) as typeof categories;
  }, [recent, categories]);

  return (
    <>
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            {isToday ? (
              <>
                <span className="font-display text-3xl font-bold tabular-nums">
                  {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live tracking</span>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Log Phase</p>
                <h1 className="font-display text-2xl mt-0">{formatDateLong(date)}</h1>
                <span className="chip border-amber-500/40 text-amber-400">Past date</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("border-border bg-surface-2 hover:bg-surface-3 text-sm", !isToday && "text-primary border-primary/40")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {isToday ? "Today" : formatDateLong(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface-1 border-border" align="end">
                <Calendar
                  mode="single"
                  selected={parseISODateLocal(date)}
                  onSelect={(d) => {
                    if (d) { setDate(isoFromDate(d)); setDateOpen(false); }
                  }}
                  disabled={(d) => isoFromDate(d) > today}
                  modifiers={{ locked: (d) => !isEditableDate(isoFromDate(d)) && isoFromDate(d) <= today }}
                  modifiersClassNames={{ locked: "opacity-40" }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {!isToday && (
              <Button variant="ghost" onClick={() => setDate(today)} className="text-xs">Jump to Today</Button>
            )}
            <div className="surface-card px-5 py-2.5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mr-3">
                {isToday ? "Today" : "Score"}
              </span>
              <span className={cn("font-display text-2xl font-bold", score.isStarted && score.total < 0 ? "text-destructive" : "text-primary")}>
                {score.isStarted ? `${score.total >= 0 ? "+" : ""}${score.total.toLocaleString()} pts` : "—"}
              </span>
            </div>
          </div>
        </header>

        {/* Lock banner */}
        {isLocked && (
          <div className="surface-card p-4 mb-4 border-l-4 border-l-muted-foreground flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">This date is locked — you can only customize blocks from the last 7 days.</p>
          </div>
        )}

        {/* Quick chips — only show for today */}
        {isToday && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Quick log</span>
            {recentChips.length === 0 ? (
              <span className="text-sm text-muted-foreground">Create categories in Settings to enable quick chips.</span>
            ) : recentChips.map((c) => (
              <button
                key={c.id}
                onClick={() => { setEditing(null); setPresetSub(c.id); setInitStart(Math.floor((time.getHours() * 60 + time.getMinutes()) / 30) * 30); setPanelOpen(true); }}
                className="chip hover:bg-primary hover:text-primary-foreground transition"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Namaz row */}
        {showNamazInLog && (
          <div className="surface-card p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Namaz {isToday ? "today" : formatDateLong(date)}
              </p>
              <p className="text-xs text-muted-foreground">{score.namazCompleted}/5 completed</p>
            </div>
            <NamazTracker date={date} isStarted={dayStarted} />
          </div>
        )}

        <Timeline
          date={date}
          blocks={logged}
          ghostBlocks={planned}
          isToday={isToday}
          onSlotClick={(min) => { if (isLocked) { lockToast(); return; } setEditing(null); setPresetSub(null); setInitStart(min); setInitEnd(undefined); setPanelOpen(true); }}
          onBlockClick={(b) => { if (isLocked) { lockToast(); return; } setEditing(b); setInitEnd(undefined); setPanelOpen(true); }}
          onGhostBlockClick={(b) => { if (isLocked) { lockToast(); return; } setEditing(null); setPresetSub(b.subCategoryId); setInitStart(b.startMin); setInitEnd(b.endMin); setPanelOpen(true); }}
        />
      </div>

      <BlockCreationPanel
        open={panelOpen}
        onOpenChange={(o) => { setPanelOpen(o); if (!o) { setPresetSub(null); setInitEnd(undefined); } }}
        date={date}
        kind="logged"
        initialStartMin={initStart}
        initialEndMin={initEnd}
        editing={editing}
        presetSubCategoryId={presetSub}
      />
    </>
  );
}
