import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, PRAYERS, useTotalPoints, getRankInfo, RANKS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn, todayISO } from "@/lib/utils";
import { CategoryType } from "@/lib/types";
import { Trash2, Plus, FolderPlus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "goals", label: "Daily Goals" },
  { id: "categories", label: "Categories" },
  { id: "points", label: "Points System" },
  { id: "templates", label: "Templates" },
  { id: "streak", label: "Streak Settings" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("profile");

  return (
      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] min-h-screen">
        {/* Inner navigation */}
        <aside className="border-b md:border-b-0 md:border-r border-border p-4 md:p-6 shrink-0">
          <p className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground mb-4">Configuration</p>
          <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0 md:space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap text-left px-3 py-2 text-sm transition",
                  section === s.id
                    ? "text-primary border-b-2 border-primary md:border-b-0 md:border-l-2 md:rounded-none md:bg-primary/10 rounded-none"
                    : "text-muted-foreground hover:text-foreground rounded-md"
                )}
              >{s.label}</button>
            ))}
          </nav>
        </aside>

        <div className="p-4 sm:p-6 lg:p-10 max-w-3xl min-w-0">
          {section === "profile" && <ProfileSection />}
          {section === "goals" && <GoalsSection />}
          {section === "categories" && <CategoriesSection />}
          {section === "points" && <PointsSection />}
          {section === "templates" && <TemplatesSection />}
          {section === "streak" && <StreakSection />}
        </div>
      </div>
  );
}

function ProfileSection() {
  const { settings, updateSettings } = useStore();
  const { user, isLoggedIn, signOut, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const totalPoints = useTotalPoints();
  const rankInfo = getRankInfo(totalPoints);

  // Auto-sync display name from Google account
  useEffect(() => {
    if (isLoggedIn && user && settings.userName === "Operator") {
      updateSettings({ userName: user.name });
    }
  }, [isLoggedIn, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  // Find next rank for progress bar
  const currentRankIdx = RANKS.findIndex((r) => r.name === rankInfo.name);
  const nextRank = RANKS[currentRankIdx + 1] ?? null;
  const progressPct = nextRank
    ? Math.min(100, ((totalPoints - rankInfo.min) / (nextRank.min - rankInfo.min)) * 100)
    : 100;

  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-6">Profile</h2>

      {/* Google account card */}
      {isLoggedIn && user && (
        <div className="surface-card p-5 mb-8 flex items-center gap-4">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-secondary grid place-items-center font-display text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-primary mt-0.5">Google Account</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="surface-card p-5 mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Sign in to sync your data across devices.</p>
          <Button onClick={signInWithGoogle} className="shrink-0 gap-2">Sign in with Google</Button>
        </div>
      )}

      {/* Display name */}
      <div className="surface-card p-5 mb-6">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Display name</Label>
        <Input value={settings.userName} onChange={(e) => updateSettings({ userName: e.target.value })} className="mt-2 bg-surface-2 border-border" />
      </div>

      {/* ── Rank Hero Card ── */}
      <div
        className="relative mb-4 rounded-2xl overflow-hidden border"
        style={{ borderColor: rankInfo.color + "55", background: `linear-gradient(135deg, ${rankInfo.color}18 0%, transparent 60%)` }}
      >
        {/* Glow blob */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: rankInfo.color }} />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6">
          {/* Avatar + icon */}
          <div className="relative shrink-0">
            {isLoggedIn && user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-full object-cover ring-4"
                style={{ ringColor: rankInfo.color + "55" }} />
            ) : (
              <div className="h-20 w-20 rounded-full bg-surface-3 grid place-items-center font-display text-2xl font-bold ring-4"
                style={{ outlineColor: rankInfo.color, boxShadow: `0 0 0 4px ${rankInfo.color}44` }}>
                {(isLoggedIn && user ? user.name : settings.userName).split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            {/* rank icon badge */}
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background bg-surface-1 grid place-items-center text-base" style={{ borderColor: rankInfo.color + "66" }}>
              {rankInfo.icon}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: rankInfo.color }}>{rankInfo.tierIcon} {rankInfo.tier} Tier</p>
            <h3 className="font-display text-3xl font-bold leading-tight">{isLoggedIn && user ? user.name : settings.userName}</h3>
            <p className="font-display text-4xl font-black mt-1 tracking-tight" style={{ color: rankInfo.color }}>{rankInfo.name}</p>

            {/* Progress to next rank */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold tabular-nums">{totalPoints.toLocaleString()} pts</span>
                {nextRank
                  ? <span>{nextRank.icon} {nextRank.name} in {(nextRank.min - totalPoints).toLocaleString()} pts</span>
                  : <span className="font-semibold" style={{ color: rankInfo.color }}>MAX RANK</span>
                }
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-surface-3">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${rankInfo.color}cc, ${rankInfo.color})` }} />
              </div>
              {nextRank && (
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{progressPct.toFixed(0)}% to {nextRank.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rank Ladder ── */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Rank Ladder</p>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {(["Beginner", "Growth", "Advanced", "Pro", "Ultimate"] as const).map((tier) => {
            const tierRanks = RANKS.filter((r) => r.tier === tier);
            const tierColor = tierRanks[0].color;
            const tierIcon = tierRanks[0].tierIcon;
            return (
              <div key={tier}>
                {/* Tier label row */}
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-2">
                  <span className="text-sm">{tierIcon}</span>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: tierColor }}>{tier}</span>
                </div>
                {/* Ranks */}
                {tierRanks.map((r) => {
                  const rIdx = RANKS.findIndex((x) => x.name === r.name);
                  const isCurrent = r.name === rankInfo.name;
                  const isPast = rIdx < currentRankIdx;
                  const isLocked = rIdx > currentRankIdx;
                  return (
                    <div
                      key={r.name}
                      className={cn("flex items-center gap-3 px-4 py-3 transition", isLocked ? "opacity-40" : "opacity-100")}
                      style={isCurrent ? { backgroundColor: tierColor + "15" } : undefined}
                    >
                      {/* Icon */}
                      <span className={cn("text-xl w-8 text-center shrink-0", isLocked ? "grayscale" : "")}>{r.icon}</span>

                      {/* Name + range */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-none" style={{ color: isLocked ? undefined : tierColor }}>{r.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                          {r.max === Infinity ? `${r.min.toLocaleString()}+ pts` : `${r.min.toLocaleString()} – ${r.max.toLocaleString()} pts`}
                        </p>
                      </div>

                      {/* Status badge */}
                      {isCurrent && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: tierColor }}>Current</span>
                      )}
                      {isPast && (
                        <span className="shrink-0 h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold text-white" style={{ backgroundColor: tierColor + "99" }}>✓</span>
                      )}
                      {isLocked && (
                        <span className="shrink-0 text-muted-foreground text-sm">🔒</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function GoalsSection() {
  const { settings, updateSettings } = useStore();
  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-6">Daily Goals</h2>
      <div className="surface-card p-6 mb-6">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target productive hours</Label>
        <div className="flex items-end gap-3 mt-3">
          <span className="font-display text-6xl font-bold text-primary">{settings.targetProductiveHours.toFixed(1)}</span>
          <span className="text-muted-foreground text-2xl pb-2">HOURS</span>
        </div>
        <Slider
          value={[settings.targetProductiveHours]}
          min={1} max={14} step={0.5}
          onValueChange={(v) => updateSettings({ targetProductiveHours: v[0] })}
          className="mt-6"
        />
      </div>
      <div className="surface-card p-6 mb-6">
        <h3 className="font-display text-xl font-bold mb-1">Namaz &amp; Score</h3>
        <p className="text-sm text-muted-foreground mb-4">Control how namaz affects your points and where it appears.</p>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Count Namaz in Score</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add prayer bonuses (+5 pts each) and missed prayer penalties to your daily score.</p>
            </div>
            <Switch
              checked={settings.namazInScore}
              onCheckedChange={(v) => updateSettings({ namazInScore: v })}
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Show Tracker in Log &amp; Planner</p>
              <p className="text-xs text-muted-foreground mt-0.5">Display the Namaz prayer tracker widget on those pages.</p>
            </div>
            <Switch
              checked={settings.showNamazInLog}
              onCheckedChange={(v) => updateSettings({ showNamazInLog: v })}
            />
          </div>
        </div>
      </div>
      <div className="surface-card p-6">
        <h3 className="font-display text-xl font-bold mb-4">Prayer reminders</h3>
        <div className="space-y-3">
          {PRAYERS.map((p) => (
            <div key={p} className="flex items-center justify-between">
              <span>{p}</span>
              <Switch
                checked={settings.prayerReminders[p]}
                onCheckedChange={(v) => updateSettings({ prayerReminders: { ...settings.prayerReminders, [p]: v } })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoriesSection() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("productive");
  const [pts, setPts] = useState(10);

  const add = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, pointsPerHour: pts });
    setName(""); setPts(10);
    toast.success("Category added.");
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-6">Categories Manager</h2>
      <div className="space-y-2 mb-6">
        {categories.map((c) => (
          <div key={c.id} className="surface-card p-4 flex items-center gap-4 border-l-4" style={{ borderLeftColor: c.type === "productive" ? "hsl(var(--primary))" : c.type === "routine" ? "hsl(var(--secondary))" : "hsl(var(--destructive))" }}>
            <div className="flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{c.type} · {c.pointsPerHour} pts/hr {c.isDeepWork && "· deep work"}</p>
            </div>
            <Input
              type="number" value={c.pointsPerHour}
              onChange={(e) => updateCategory(c.id, { pointsPerHour: +e.target.value })}
              className="w-20 bg-surface-2 border-border"
            />
            <button onClick={() => deleteCategory(c.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="surface-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Add category</p>
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_140px_100px_auto] gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-2 sm:col-span-1 bg-surface-2 border-border" />
          <select value={type} onChange={(e) => setType(e.target.value as CategoryType)} className="bg-surface-2 border border-border rounded-md px-3 text-sm">
            <option value="productive">Productive</option>
            <option value="routine">Routine</option>
            <option value="wasted">Wasted</option>
          </select>
          <Input type="number" value={pts} onChange={(e) => setPts(+e.target.value)} className="bg-surface-2 border-border" />
          <Button onClick={add} className="bg-primary text-primary-foreground col-span-2 sm:col-span-1"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function PointsSection(): JSX.Element {
  const { settings } = useStore();

  const fixedRates = [
    { label: "Productive", description: "Earned per hour of productive work", value: `+${settings.productiveRate} pts/hr`, color: "hsl(var(--primary))" },
    { label: "Deep Work", description: "Productive × deep work multiplier", value: `+${settings.productiveRate * settings.deepWorkMultiplier} pts/hr`, color: "hsl(var(--primary))" },
    { label: "Wasted", description: "Deducted per hour of wasted time", value: `−${settings.wastedRate} pts/hr`, color: "hsl(var(--destructive))" },
    { label: "Namaz bonus", description: "Earned per prayer completed", value: `+${settings.namazBonus} pts`, color: "#22c55e" },
    { label: "Missed prayer", description: "Deducted per prayer missed", value: `−${settings.namazPenalty} pts`, color: "hsl(var(--destructive))" },
    { label: "Daily target miss", description: "Deducted if productive hours < target", value: `−${settings.dailyTargetPenalty} pts`, color: "hsl(var(--destructive))" },
  ];

  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-2">Points System</h2>
      <p className="text-sm text-muted-foreground mb-6">
        These values are fixed and cannot be changed — they keep the ranking fair for everyone.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {fixedRates.map((item) => (
          <div key={item.label} className="surface-card p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <span className="font-display text-xl font-bold tabular-nums shrink-0" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="surface-card p-5 border-l-4 border-l-muted-foreground">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">How scoring works</p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Every logged hour in a productive category earns points.</li>
          <li>Deep Work blocks are multiplied by {settings.deepWorkMultiplier}×.</li>
          <li>Wasted time deducts points from your daily total.</li>
          <li>Completing all 5 prayers earns a full +{settings.namazBonus * 5} pts bonus.</li>
          <li>Missing prayers and falling short of your daily target apply penalties.</li>
          <li>Your total points across all days determines your rank.</li>
        </ul>
      </div>
    </div>
  );
}

function TemplatesSection() {
  const { templates, addTemplate, deleteTemplate, loadTemplate, blocks } = useStore();
  const [name, setName] = useState("");

  const saveFromToday = () => {
    if (!name.trim()) return;
    const todayBlocks = blocks.filter((b) => b.date === todayISO() && b.kind === "planned")
      .map((b) => ({ subCategoryId: b.subCategoryId, startMin: b.startMin, endMin: b.endMin }));
    if (todayBlocks.length === 0) {
      toast.error("Plan some blocks today first, then save them as a template.");
      return;
    }
    addTemplate({ name: name.trim(), blocks: todayBlocks });
    setName("");
    toast.success("Template saved.");
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-6">Templates</h2>
      <div className="surface-card p-5 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Save today's plan as a template</p>
        <div className="flex gap-2">
          <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="bg-surface-2 border-border" />
          <Button onClick={saveFromToday} className="bg-primary text-primary-foreground"><FolderPlus className="h-4 w-4 mr-2" /> Save</Button>
        </div>
      </div>
      <div className="space-y-2">
        {templates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No templates yet.</p>
        ) : templates.map((t) => (
          <div key={t.id} className="surface-card p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.blocks.length} blocks</p>
            </div>
            <Button variant="outline" onClick={() => { loadTemplate(t.id, todayISO(), "planned"); toast.success("Template loaded onto today's plan."); }} className="border-border">Load</Button>
            <button onClick={() => deleteTemplate(t.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakSection() {
  const { settings, updateSettings, startedDays } = useStore();
  return (
    <div>
      <h2 className="font-display text-3xl font-bold mb-6">Streak Settings</h2>
      <div className="surface-card p-6 max-w-md">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Minimum productive hours per day to count as streak</Label>
        <Input
          type="number" min={1} max={14} step={0.5}
          value={settings.streakMinHours}
          onChange={(e) => updateSettings({ streakMinHours: +e.target.value })}
          className="mt-2 bg-surface-2 border-border font-display text-2xl h-14"
        />
        <p className="text-sm text-muted-foreground mt-4">Current streak: <span className="text-primary font-semibold">{startedDays.length} days</span></p>
      </div>
    </div>
  );
}
