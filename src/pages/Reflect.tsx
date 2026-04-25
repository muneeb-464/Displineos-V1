import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { computeDayScore, useStore } from "@/lib/store";
import { formatDateLong, isoFromDate, parseISODateLocal, todayISO } from "@/lib/utils";
import { ChevronDown, ArrowRight, CalendarDays, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Reflect() {
  const [date, setDate] = useState(todayISO());
  const [calOpen, setCalOpen] = useState(false);
  const score = computeDayScore(date);
  const reflections = useStore((s) => s.reflections);
  const addReflection = useStore((s) => s.addReflection);
  const showNamaz = useStore((s) => s.settings.showNamazInLog);

  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const save = () => {
    if (!a.trim() && !b.trim() && !c.trim()) {
      toast.error("Write at least one reflection before saving.");
      return;
    }
    addReflection({
      date, wentWell: a, wasted: b, tomorrow: c,
      score: score.total, productiveHours: score.productiveHours, namazCompleted: score.namazCompleted,
    });
    setA(""); setB(""); setC("");
    toast.success("Reflection saved.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] min-h-screen">

      {/* ── LEFT — Form (sticky) ── */}
      <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-r border-border px-5 py-8 sm:px-8 sm:py-10">
        {/* Date + title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 border-border bg-surface-2 hover:bg-surface-3 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(parseISODateLocal(date), "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-border bg-surface-1 p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseISODateLocal(date)}
                  onSelect={(d) => { if (d) { setDate(isoFromDate(d)); setCalOpen(false); } }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">{formatDateLong(date)}</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight">End of Day<br /><span className="text-primary">Reflection</span></h1>
        </div>

        {/* Score summary */}
        <div className={`grid gap-2 mb-6 ${showNamaz ? "grid-cols-3" : "grid-cols-2"}`}>
          <SummaryCard label="Score" value={score.isStarted ? `${score.total}` : "—"} unit="pts" />
          <SummaryCard label="Productive" value={score.isStarted ? score.productiveHours.toFixed(1) : "—"} unit="hrs" />
          {showNamaz && <SummaryCard label="Namaz" value={score.isStarted ? `${score.namazCompleted}/5` : "—"} />}
        </div>

        {/* Form fields */}
        <Field label="What went well today?" value={a} onChange={setA} placeholder="Identify your wins, however small…" />
        <Field label="What did I waste time on?" value={b} onChange={setB} placeholder="Audit the friction points…" />
        <Field label="What will I do differently tomorrow?" value={c} onChange={setC} placeholder="Define the structural change…" />

        <Button
          onClick={save}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-glow font-semibold mt-1"
        >
          Save Reflection <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* ── RIGHT — Entries ── */}
      <div className="px-5 py-8 sm:px-6 sm:py-10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Past Reflections
          </h2>
          {reflections.length > 0 && (
            <span className="ml-auto chip text-xs">{reflections.length}</span>
          )}
        </div>

        {reflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📓</span>
            <p className="font-display text-lg font-semibold">No entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">Save your first reflection on the left.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reflections.map((r) => (
              <div key={r.id} className="surface-card overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="w-full flex items-start gap-3 p-4 hover:bg-surface-2 transition text-left"
                >
                  {/* Date column */}
                  <div className="shrink-0 text-center bg-surface-3 rounded-lg px-2.5 py-2 min-w-[48px]">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                      {format(parseISODateLocal(r.date), "MMM")}
                    </p>
                    <p className="font-display text-xl font-bold leading-tight mt-0.5">
                      {format(parseISODateLocal(r.date), "d")}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{format(parseISODateLocal(r.date), "EEEE")}</p>
                      <span className="chip chip-primary text-xs">{r.score} pts</span>
                      <span className="text-xs text-muted-foreground">{r.productiveHours.toFixed(1)}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.wentWell || r.tomorrow || r.wasted || "—"}
                    </p>
                  </div>

                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform", openId === r.id && "rotate-180")} />
                </button>

                {openId === r.id && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                    <EntryDetail label="✅ What went well" text={r.wentWell} />
                    <EntryDetail label="⏱ What I wasted time on" text={r.wasted} />
                    <EntryDetail label="🔄 What I'll change tomorrow" text={r.tomorrow} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="mb-4">
      <label className="font-display text-sm font-semibold">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 bg-surface-2 border-border resize-none text-sm"
      />
      {value.trim() && (
        <div className="text-right text-[11px] text-muted-foreground mt-1">{words} word{words !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="surface-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold mt-1 text-primary leading-none">
        {value}
        {unit && <span className="text-xs text-muted-foreground font-normal ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function EntryDetail({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{text || <span className="text-muted-foreground italic">Nothing noted.</span>}</p>
    </div>
  );
}
