import { useMemo, useState } from "react";
import Timeline from "@/components/timeline/Timeline";
import BlockCreationPanel from "@/components/timeline/BlockCreationPanel";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { TimeBlock } from "@/lib/types";
import { formatDateLong, isoFromDate, isEditableDate, parseISODateLocal, todayISO } from "@/lib/utils";
import { Plus, FolderOpen, Play, CalendarIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function Planner() {
  const today = todayISO();
  const [date, setDate] = useState<string>(today);
  const navigate = useNavigate();
  const blocks = useStore((s) => s.blocks).filter((b) => b.date === date && b.kind === "planned");
  const categories = useStore((s) => s.categories);
  const templates = useStore((s) => s.templates);
  const loadTemplate = useStore((s) => s.loadTemplate);
  const startDay = useStore((s) => s.startDay);
  const settings = useStore((s) => s.settings);
  const namazReminders = Object.values(settings.prayerReminders).filter(Boolean).length;
  const showNamazInLog = settings.showNamazInLog;
  const isToday = date === today;
  const isLocked = !isToday && !isEditableDate(date);
  const lockToast = () => toast.info("You can only customize blocks from the last 7 days");

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<TimeBlock | null>(null);
  const [initStart, setInitStart] = useState(9 * 60);
  const [tmplOpen, setTmplOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const plannedHours = useMemo(() => {
    return blocks.reduce((sum, b) => {
      const cat = categories.find((c) => c.id === b.subCategoryId);
      if (cat?.type === "productive") return sum + (b.endMin - b.startMin) / 60;
      return sum;
    }, 0);
  }, [blocks, categories]);

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] min-h-screen">
        {/* Center */}
        <div className="border-r border-border">
          {/* Header */}
          <header className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Planning Phase</p>
              <h1 className="font-display text-2xl mt-1">{formatDateLong(date)}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                    onSelect={(d) => { if (d) { setDate(isoFromDate(d)); setDateOpen(false); } }}
                    modifiers={{ locked: (d) => !isEditableDate(isoFromDate(d)) && isoFromDate(d) <= parseISODateLocal(today) }}
                    modifiersClassNames={{ locked: "opacity-40" }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {!isToday && (
                <Button variant="ghost" onClick={() => setDate(today)} className="text-xs">Jump to Today</Button>
              )}
              <Button variant="outline" onClick={() => setTmplOpen(true)} className="border-border bg-surface-2 hover:bg-surface-3 text-sm">
                <FolderOpen className="h-4 w-4 mr-2" /> Load Template
              </Button>
              <Button
                onClick={() => { if (isLocked) { lockToast(); return; } setEditing(null); setInitStart(9 * 60); setPanelOpen(true); }}
                className="bg-primary text-primary-foreground hover:bg-primary-glow text-sm"
                disabled={isLocked}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Block
              </Button>
            </div>
          </header>

          <div className="px-4 pb-8 sm:px-6 lg:px-10 lg:pb-10">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-8">
              Architect your<br />
              <span className="text-primary underline decoration-primary/60 decoration-4 underline-offset-4">output.</span>
            </h2>

            {blocks.length === 0 && (
              <div className="surface-card p-8 mb-6 text-center">
                <p className="text-muted-foreground">No blocks yet. Click an empty hour or "+ Add Block" to start architecting your day.</p>
              </div>
            )}

            {isLocked && (
              <div className="surface-card p-4 mb-4 border-l-4 border-l-muted-foreground flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">This date is locked — you can only customize blocks from the last 7 days.</p>
              </div>
            )}
            <Timeline
              date={date}
              blocks={blocks}
              isToday={isToday}
              onSlotClick={(min) => { if (isLocked) { lockToast(); return; } setEditing(null); setInitStart(min); setPanelOpen(true); }}
              onBlockClick={(b) => { if (isLocked) { lockToast(); return; } setEditing(b); setPanelOpen(true); }}
            />
          </div>
        </div>

        {/* Right rail — Today Summary only */}
        <aside className="p-4 sm:p-6 lg:p-8 space-y-5 xl:sticky xl:top-0 xl:h-screen xl:overflow-auto border-t border-border xl:border-t-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Today's Summary</p>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Planned Productive Hours</p>
            <p className="font-display text-5xl font-bold mt-3 text-primary">{plannedHours.toFixed(1)}<span className="text-2xl text-muted-foreground">h</span></p>
            <div className="mt-3 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (plannedHours / settings.targetProductiveHours) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Target: {settings.targetProductiveHours}h</p>
          </div>

          {showNamazInLog && (
            <div className="surface-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Planned Namaz</p>
              <p className="font-display text-5xl font-bold mt-3">{namazReminders}<span className="text-2xl text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground mt-2">Reminders enabled in settings</p>
            </div>
          )}

          <Button
            onClick={() => { startDay(date); navigate("/log"); }}
            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary-glow text-base font-semibold"
          >
            <Play className="h-4 w-4 mr-2" /> Start Day
          </Button>
        </aside>
      </div>

      <BlockCreationPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        date={date}
        kind="planned"
        initialStartMin={initStart}
        editing={editing}
      />

      <Dialog open={tmplOpen} onOpenChange={setTmplOpen}>
        <DialogContent className="bg-surface-1 border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Load a template</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No templates yet. Save one in Settings → Templates.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { loadTemplate(t.id, date, "planned"); setTmplOpen(false); }}
                  className="w-full text-left p-4 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition"
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.blocks.length} blocks</div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
