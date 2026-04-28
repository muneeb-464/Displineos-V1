import { useState } from "react";
import ScoreRing from "@/components/ScoreRing";
import StatCard from "@/components/StatCard";
import NamazTracker from "@/components/NamazTracker";
import { useDayScore, useStore, useStreaks } from "@/lib/store";
import { formatDateLong, isoFromDate, parseISODateLocal, todayISO } from "@/lib/utils";
import { Flame, Zap, Trash2, Moon, AlertTriangle, CalendarIcon, History } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const timezone = useStore((s) => s.settings.timezone);
  const today = todayISO(timezone);
  const [date, setDate] = useState<string>(today);
  const [dateOpen, setDateOpen] = useState(false);
  const isToday = date === today;
  const isMobile = useIsMobile();
  const score = useDayScore(date);
  const { current: streak, last: lastStreak } = useStreaks();
  const settings = useStore((s) => s.settings);
  const blocks = useStore((s) => s.blocks);
  const categories = useStore((s) => s.categories);
  const startedDays = useStore((s) => s.startedDays);

  const planned = blocks.filter((b) => b.date === date && b.kind === "planned");
  const logged = blocks.filter((b) => b.date === date && b.kind === "logged");
  const dayStarted = startedDays.includes(date);

  const totalHours = score.productiveHours + score.routineHours + score.wastedHours || 1;
  const productivePct = (score.productiveHours / totalHours) * 100;
  const routinePct = (score.routineHours / totalHours) * 100;
  const wastedPct = (score.wastedHours / totalHours) * 100;

  return (
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {/* Greeting card */}
        <div className="surface-card p-4 sm:p-6 lg:p-8 mb-6 border-l-4 border-l-primary">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{formatDateLong(date)}</p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 leading-tight">
                {isToday ? `Welcome back, ${settings.userName}` : "Day Review"}
              </h1>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
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
                      onSelect={(d) => { if (d) { setDate(isoFromDate(d)); setDateOpen(false); } }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {!isToday && (
                  <Button variant="ghost" onClick={() => setDate(today)} className="text-xs">Jump to Today</Button>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <div className="chip chip-primary text-sm"><Flame className="h-4 w-4" /> {streak} day{streak !== 1 ? "s" : ""}</div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Current streak</p>
                </div>
                <div>
                  <div className="chip text-sm opacity-70"><History className="h-4 w-4" /> {lastStreak > 0 ? `${lastStreak} day${lastStreak !== 1 ? "s" : ""}` : "—"}</div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Last streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!dayStarted && (
          <div className="surface-card p-5 mb-6 border-l-4 border-l-muted-foreground flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground text-sm">Day not started — score is <strong>Neutral</strong>. Press <em>Start Day</em> on the Planner to begin tracking.</p>
          </div>
        )}

        {/* Three stats */}
        <div className={`grid grid-cols-1 gap-5 mb-6 ${settings.showNamazInLog ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <StatCard
            label="Productive Hours"
            value={dayStarted ? `${score.productiveHours.toFixed(1)}h` : "—"}
            icon={<Zap className="h-4 w-4 text-primary" />}
            variant="primary"
            progress={dayStarted ? score.productiveHours / settings.targetProductiveHours : 0}
          />
          <StatCard
            label="Wasted Hours"
            value={dayStarted ? `${score.wastedHours.toFixed(1)}h` : "—"}
            icon={<Trash2 className="h-4 w-4 text-destructive" />}
            variant="danger"
            progress={dayStarted ? Math.min(1, score.wastedHours / 4) : 0}
          />
          {settings.showNamazInLog && (
            <StatCard
              label="Namaz"
              value={`${score.namazCompleted}/5`}
              sub="completed"
              icon={<Moon className="h-4 w-4 text-primary" />}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Score Ring */}
          <div className="surface-card p-4 sm:p-6 lg:p-8">
            <div className="mb-4">
              <h3 className="font-display text-2xl font-bold">Goal Progress</h3>
              <p className="text-sm text-muted-foreground">
                {!dayStarted ? "Neutral — day not started" : `Target: ${settings.targetProductiveHours}h productive`}
              </p>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around mt-4">
              <ScoreRing
                segments={[
                  { hours: dayStarted ? score.productiveHours : 0, color: "hsl(var(--cat-productive))", label: "Productive" },
                  { hours: dayStarted ? score.routineHours : 0,    color: "hsl(var(--cat-routine))",    label: "Routine"    },
                  { hours: dayStarted ? score.wastedHours : 0,     color: "hsl(var(--cat-wasted))",     label: "Wasted"     },
                ]}
                goalHours={settings.targetProductiveHours}
                size={isMobile ? 160 : 200}
              />
              <div className="flex flex-row gap-6 sm:flex-col sm:gap-0 sm:space-y-4">
                <Legend color="hsl(var(--cat-productive))" label="Productive" value={dayStarted ? `${score.productiveHours.toFixed(1)}h` : "—"} />
                <Legend color="hsl(var(--cat-routine))"    label="Routine"    value={dayStarted ? `${score.routineHours.toFixed(1)}h`    : "—"} />
                <Legend color="hsl(var(--cat-wasted))"     label="Wasted"     value={dayStarted ? `${score.wastedHours.toFixed(1)}h`     : "—"} />
              </div>
            </div>
          </div>

          {/* Where did your day go + planned vs actual */}
          <div className="surface-card p-4 sm:p-6 lg:p-8">
            <h3 className="font-display text-2xl font-bold">Where did your day go?</h3>

            <div className="mt-5 h-3 bg-surface-3 rounded-full overflow-hidden flex">
              {dayStarted ? (
                <>
                  <div className="bg-primary h-full" style={{ width: `${productivePct}%` }} />
                  <div className="bg-secondary h-full" style={{ width: `${routinePct}%` }} />
                  <div className="bg-destructive h-full" style={{ width: `${wastedPct}%` }} />
                </>
              ) : (
                <div className="bg-muted-foreground/30 h-full w-full" />
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 text-xs text-muted-foreground">
              {dayStarted ? (
                <>
                  <span>P {productivePct.toFixed(0)}%</span>
                  <span>R {routinePct.toFixed(0)}%</span>
                  <span>W {wastedPct.toFixed(0)}%</span>
                </>
              ) : (
                <span className="col-span-3 text-center">Neutral</span>
              )}
            </div>

            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-8 mb-3">Planned vs Actual</p>
            <PlannedVsActual planned={planned} logged={logged} categories={categories} />
          </div>
        </div>

        {/* Namaz tracker — editable for any date including past days */}
        {settings.showNamazInLog && (
          <div className="surface-card p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl font-bold">Namaz</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {score.namazCompleted}/5 completed
                {dayStarted && score.namazCompleted < 5 && (
                  <span className="ml-2 text-destructive text-xs">
                    ({5 - score.namazCompleted} missed)
                  </span>
                )}
              </span>
            </div>
            <NamazTracker date={date} isStarted={dayStarted} />
          </div>
        )}

        {/* Penalties */}
        <div className="surface-card p-4 sm:p-6 border-l-4 border-l-destructive">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-xl font-bold">Daily Penalties</h3>
          </div>
          {!dayStarted ? (
            <p className="text-sm text-muted-foreground">No penalties — day not started.</p>
          ) : score.penalties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No penalties today. Keep it tight.</p>
          ) : (
            <div className="space-y-2">
              {score.penalties.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 surface-soft">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>{p.label}</span>
                  </div>
                  <span className="text-destructive font-semibold">{p.pts} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function PlannedVsActual({ planned, logged, categories }: any) {
  const renderStrip = (blocks: any[], label: string) => {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <div className="relative h-8 surface-soft overflow-hidden">
          {blocks.map((b: any) => {
            const cat = categories.find((c: any) => c.id === b.subCategoryId);
            const left = ((b.startMin - 6 * 60) / (17 * 60)) * 100;
            const width = ((b.endMin - b.startMin) / (17 * 60)) * 100;
            const color = cat?.type === "productive" ? "bg-primary"
              : cat?.type === "routine" ? "bg-secondary" : "bg-destructive";
            return <div key={b.id} className={`${color} absolute top-0 bottom-0`} style={{ left: `${left}%`, width: `${width}%` }} />;
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-3">
      {renderStrip(planned, "Planned")}
      {renderStrip(logged, "Actual")}
    </div>
  );
}
