import { Fragment, useMemo, useState } from "react";
import { endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPrayerStatus } from "@/lib/namaz";
import { buildAggregateReport, buildPresetDateRange, normalizeDateRange, RANGE_PRESETS, type RangePreset } from "@/lib/reporting";
import { computeDayScore, PRAYERS, useDayScore, useStore } from "@/lib/store";
import { cn, isoFromDate, parseISODateLocal, todayISO } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Tab = "daily" | "range" | "monthly";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground) / 0.72)",
  "hsl(var(--muted-foreground) / 0.68)",
];

export default function Analytics() {
  const [tab, setTab] = useState<Tab>("range");
  const [preset, setPreset] = useState<RangePreset>(7);
  const [customStart, setCustomStart] = useState<string>(buildPresetDateRange(7)[0]);
  const [customEnd, setCustomEnd] = useState<string>(todayISO());

  const rangeDates = useMemo(() => normalizeDateRange(customStart, customEnd), [customEnd, customStart]);

  return (
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Analytics</h1>
            <p className="mt-2 text-sm text-muted-foreground">View daily snapshots, flexible ranges, and monthly trends.</p>
          </div>
          <div className="surface-soft inline-flex w-full flex-wrap gap-2 rounded-lg p-1 lg:w-auto">
            {(["daily", "range", "monthly"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm capitalize transition lg:flex-none",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {tab === "daily" && <DailyView />}
        {tab === "range" && (
          <RangeView
            preset={preset}
            onPresetChange={(days) => {
              setPreset(days);
              const dates = buildPresetDateRange(days);
              setCustomStart(dates[0]);
              setCustomEnd(dates[dates.length - 1]);
            }}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
            dates={rangeDates}
          />
        )}
        {tab === "monthly" && <MonthlyView />}
      </div>
  );
}

function DailyView() {
  const today = todayISO();
  const score = useDayScore(today);
  const started = score.isStarted;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MiniStat label="Total score" value={started ? score.total.toString() : "—"} tone={started ? "primary" : "default"} />
      <MiniStat label="Productive hrs" value={started ? `${score.productiveHours.toFixed(1)}h` : "—"} />
      <MiniStat label="Wasted hrs" value={started ? `${score.wastedHours.toFixed(1)}h` : "—"} tone={started ? "destructive" : "default"} />
    </div>
  );
}

function RangeView({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  dates,
}: {
  preset: RangePreset;
  onPresetChange: (days: RangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  dates: string[];
}) {
  const blocks = useStore((s) => s.blocks);
  const namaz = useStore((s) => s.namaz);
  const categories = useStore((s) => s.categories);
  const startedDays = useStore((s) => s.startedDays);
  const showNamaz = useStore((s) => s.settings.showNamazInLog);
  const report = useMemo(() => buildAggregateReport(dates), [dates, blocks, namaz, categories, startedDays]);
  const maxScore = Math.max(...report.dayScores.map((day) => day.total), 1);
  const totalBreakdownHours = report.breakdown.reduce((sum, item) => sum + item.hours, 0) || 1;
  const barData = report.dayScores.map((day) => ({
    day: format(parseISODateLocal(day.date), dates.length > 15 ? "d MMM" : "EEE"),
    Productive: +day.productiveHours.toFixed(1),
    Routine: +day.routineHours.toFixed(1),
    Wasted: +day.wastedHours.toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <div className="surface-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Flexible progress range</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose 2, 4, 7, 15, 30, or a fully custom day range.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_PRESETS.map((days) => (
              <Button key={days} type="button" variant={preset === days ? "default" : "outline"} onClick={() => onPresetChange(days)} className="border-border bg-surface-2 hover:bg-surface-3">
                {days} days
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <DateField label="Start" value={customStart} onChange={onCustomStartChange} />
          <DateField label="End" value={customEnd} onChange={onCustomEndChange} />
          <div className="surface-soft flex items-center justify-center px-4 py-3 text-sm text-muted-foreground">{dates.length} days selected</div>
        </div>
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2", showNamaz ? "xl:grid-cols-5" : "xl:grid-cols-4")}>
        <MiniStat label="Total score" value={report.totalScore.toLocaleString()} tone="primary" />
        <MiniStat label="Productive hrs" value={`${report.productiveHours.toFixed(1)}h`} />
        <MiniStat label="Wasted hrs" value={`${report.wastedHours.toFixed(1)}h`} tone="destructive" />
        {showNamaz && <MiniStat label="Namaz rate" value={`${report.namazCompletionRate.toFixed(0)}%`} />}
        <MiniStat label="Active days" value={report.activeDays.toString()} />
      </div>

      <div className="surface-card p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold">Consistency strip</h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Daily score intensity</p>
          </div>
          {report.bestDay && <div className="chip">Best: {format(parseISODateLocal(report.bestDay.date), "d MMM")} · {report.bestDay.total} pts</div>}
        </div>
        <div className={cn("grid gap-3", dates.length <= 7 ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10")}>
          {report.dayScores.map((day) => {
            const neutral = !day.isStarted;
            const intensity = !neutral && day.total > 0 ? Math.max(0.14, Math.min(1, day.total / maxScore)) : 0;
            return (
              <div key={day.date} className="aspect-square rounded-xl p-2 text-center" style={{ background: neutral ? "hsl(var(--muted) / 0.4)" : intensity ? `hsl(var(--primary) / ${intensity})` : "hsl(var(--surface-2))", color: intensity > 0.5 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}>
                <div className="text-[10px] uppercase tracking-wider">{format(parseISODateLocal(day.date), dates.length > 15 ? "d MMM" : "EEE")}</div>
                <div className="mt-2 font-display text-lg font-bold">{neutral ? "·" : day.total || "–"}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="surface-card p-4 sm:p-6">
          <h3 className="mb-3 font-display text-xl font-bold">Daily hours</h3>
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            {[
              { label: "Productive", color: "hsl(var(--cat-productive))" },
              { label: "Routine",    color: "hsl(var(--cat-routine))" },
              { label: "Wasted",     color: "hsl(var(--cat-wasted))" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--surface-3) / 0.4)" }}
                  contentStyle={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="Productive" fill="hsl(var(--cat-productive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Routine"    fill="hsl(var(--cat-routine))"    radius={[4, 4, 0, 0]} />
                <Bar dataKey="Wasted"     fill="hsl(var(--cat-wasted))"     radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-4 sm:p-6">
          <h3 className="mb-4 font-display text-xl font-bold">Time breakdown</h3>
          {report.breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracked time in this range yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={report.breakdown} dataKey="hours" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {report.breakdown.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--surface-2))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--foreground))",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number, name: string) => [`${value.toFixed(1)}h`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {report.breakdown.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.hours.toFixed(1)}h</span>
                    <span className="shrink-0 font-mono text-xs text-primary">
                      {((item.hours / totalBreakdownHours) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <h3 className="mb-4 font-display text-xl font-bold">Category deep dive</h3>
        <div className="space-y-3">
          {report.breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Track blocks to unlock the category breakdown.</p>
          ) : report.breakdown.map((item) => (
            <div key={item.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)_80px] sm:items-center sm:gap-4">
              <div className="font-medium">{item.name}</div>
              <div className="font-mono text-sm">{item.hours.toFixed(1)}h</div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full bg-primary" style={{ width: `${(item.hours / totalBreakdownHours) * 100}%` }} />
              </div>
              <div className="text-left font-mono text-sm text-primary sm:text-right">{item.points} pts</div>
            </div>
          ))}
        </div>
      </div>

      {showNamaz && (
        <div className="surface-card overflow-x-auto p-4 sm:p-6">
          <h3 className="mb-4 font-display text-xl font-bold">Namaz completion</h3>
          <div className="grid min-w-[720px] grid-cols-[72px_repeat(var(--days),minmax(52px,1fr))] gap-2 text-xs" style={{ ["--days" as string]: dates.length }}>
            <div />
            {dates.map((date) => <div key={date} className="text-center text-muted-foreground">{format(parseISODateLocal(date), dates.length > 15 ? "d" : "EEE")}</div>)}
            {PRAYERS.map((prayer) => (
              <Fragment key={prayer}>
                <div className="py-2 text-muted-foreground">{prayer}</div>
                {dates.map((date) => {
                  const status = getPrayerStatus(date, prayer, namaz);
                  return (
                    <div key={date + prayer} className={cn("grid h-9 place-items-center rounded-md font-medium", status === "done" ? "bg-primary text-primary-foreground" : status === "missed" ? "bg-destructive/20 text-destructive" : "bg-surface-2 text-muted-foreground")}>
                      {status === "done" ? "✓" : status === "missed" ? "✕" : "·"}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyView() {
  const ref = new Date();
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(ref), { weekStartsOn: 1 }), end: endOfMonth(ref) });
  const startedDays = useStore((s) => s.startedDays);
  useStore((s) => s.blocks);
  useStore((s) => s.namaz);

  return (
    <div className="surface-card p-4 sm:p-6">
      <h3 className="mb-4 font-display text-xl font-bold">{format(ref, "MMMM yyyy")}</h3>
      <div className="mb-2 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="text-center">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const started = startedDays.includes(iso);
          const score = started ? computeDayScore(iso) : null;
          const intensity = score && score.total > 0 ? Math.min(1, score.total / 1500) : 0;
          return (
            <div
              key={iso}
              className={cn("aspect-square rounded-lg border border-border p-2", !isSameMonth(day, ref) && "opacity-30", isToday(day) && "ring-2 ring-primary")}
              style={{ background: !started ? "hsl(var(--muted) / 0.3)" : intensity ? `hsl(var(--primary) / ${intensity * 0.6})` : "hsl(var(--surface-2))" }}
            >
              <div className="flex h-full flex-col justify-between">
                <span className="text-xs text-muted-foreground">{format(day, "d")}</span>
                {started && score && score.total > 0 && <span className="text-xs font-mono font-bold">{score.total}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start border-border bg-surface-2 hover:bg-surface-3">
            <CalendarDays className="h-4 w-4" />
            {format(parseISODateLocal(value), "dd MMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto border-border bg-surface-1 p-0" align="start">
          <Calendar
            mode="single"
            selected={parseISODateLocal(value)}
            onSelect={(date) => {
              if (date) {
                onChange(isoFromDate(date));
                setOpen(false);
              }
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "destructive" }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-3 font-display text-4xl font-bold", tone === "primary" && "text-primary", tone === "destructive" && "text-destructive")}>{value}</p>
    </div>
  );
}
