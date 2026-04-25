import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import GuestBanner from "@/components/GuestBanner";
import SignInModal from "@/components/SignInModal";
import ThemeToggle from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";

const SMALL_SCREEN_KEY = "displine_small_screen_warned";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSmallScreenTip, setShowSmallScreenTip] = useState(false);

  useEffect(() => {
    // Show once per session on small screens
    const alreadyShown = sessionStorage.getItem(SMALL_SCREEN_KEY);
    if (!alreadyShown && window.innerWidth < 768) {
      setShowSmallScreenTip(true);
      sessionStorage.setItem(SMALL_SCREEN_KEY, "1");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="fixed top-4 right-5 z-40 hidden md:block">
        <ThemeToggle />
      </div>

      <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:ml-[84px] transition-[filter,opacity] duration-300 peer-hover:md:blur-sm peer-hover:md:opacity-60 peer-hover:md:pointer-events-none">
        <GuestBanner />
        <main className="flex-1">{children}</main>
      </div>

      <SignInModal />

      {/* Small screen warning */}
      <Dialog open={showSmallScreenTip} onOpenChange={setShowSmallScreenTip}>
        <DialogContent className="max-w-xs text-center bg-surface-1 border-border">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
              <Monitor className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="font-display text-xl">Best on large screens</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
              <span className="text-foreground font-medium">DisciplineOS</span> is designed for desktop and tablet. On small screens some features like the timeline and analytics may feel cramped.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-2">
            For the best experience, open this app on a laptop or larger device.
          </p>
          <Button onClick={() => setShowSmallScreenTip(false)} className="mt-4 w-full bg-primary text-primary-foreground">
            Continue anyway
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
