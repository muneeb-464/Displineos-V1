import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDarkTip, setShowDarkTip] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme !== "light";

  const handleToggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    if (next === "light") setShowDarkTip(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className="border-border bg-surface-2 hover:bg-surface-3"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Dark theme tip dialog */}
      <Dialog open={showDarkTip} onOpenChange={setShowDarkTip}>
        <DialogContent className="sm:max-w-sm text-center bg-surface-1 border-border">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 grid place-items-center">
              <Info className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="font-display text-xl">Dark theme recommended</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
              <span className="text-foreground font-medium">DisciplineOS</span> is designed for dark mode — better contrast, easier on the eyes, and built for long focus sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Moon className="h-3.5 w-3.5" />
            <span>Switch back for the best experience</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowDarkTip(false)} className="flex-1 border-border">
              Keep light
            </Button>
            <Button onClick={() => { setTheme("dark"); setShowDarkTip(false); }} className="flex-1 bg-primary text-primary-foreground">
              Use dark
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
