import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { CategoryType, TimeBlock } from "@/lib/types";
import { formatDateLong, labelToMinutes, minutesToLabel, todayISO, uid } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
  kind: "planned" | "logged";
  initialStartMin?: number;
  initialEndMin?: number;
  editing?: TimeBlock | null;
  presetSubCategoryId?: string | null;
}

const TYPES: { v: CategoryType; label: string }[] = [
  { v: "productive", label: "Productive" },
  { v: "routine", label: "Routine" },
  { v: "wasted", label: "Wasted" },
];

export default function BlockCreationPanel({
  open, onOpenChange, date, kind, initialStartMin = 9 * 60, initialEndMin, editing, presetSubCategoryId,
}: Props) {
  const { categories, blocks: allBlocks, addBlock, updateBlock, deleteBlock, addCategory, pushRecentSub } = useStore();
  const [type, setType] = useState<CategoryType>("productive");
  const [subId, setSubId] = useState<string>("");
  const [start, setStart] = useState(minutesToLabel(initialStartMin));
  const [end, setEnd] = useState(minutesToLabel(initialStartMin + 60));
  const [newSubName, setNewSubName] = useState("");
  const [overlapError, setOverlapError] = useState(false);
  const [overlappingBlocks, setOverlappingBlocks] = useState<typeof allBlocks>([]);

  const isPast = date < todayISO();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | "merge" | null>(null);

  useEffect(() => {
    if (editing) {
      const cat = categories.find((c) => c.id === editing.subCategoryId);
      setType(cat?.type ?? "productive");
      setSubId(editing.subCategoryId);
      setStart(minutesToLabel(editing.startMin));
      setEnd(minutesToLabel(editing.endMin));
    } else {
      setStart(minutesToLabel(initialStartMin));
      setEnd(minutesToLabel(initialEndMin ?? initialStartMin + 60));
      if (presetSubCategoryId) {
        const c = categories.find((x) => x.id === presetSubCategoryId);
        if (c) { setType(c.type); setSubId(c.id); }
      } else {
        setSubId("");
        setType("productive");
      }
    }
  }, [editing, open, initialStartMin, presetSubCategoryId]); // eslint-disable-line

  const filteredSubs = categories.filter((c) => c.type === type);

  const executeSave = () => {
    let finalSubId = subId;
    if (!finalSubId && newSubName.trim()) {
      const id = "c-" + uid();
      addCategory({ name: newSubName.trim(), type, pointsPerHour: type === "wasted" ? 2 : 2 } as any);
      finalSubId = useStore.getState().categories.find((c) => c.name === newSubName.trim())?.id || id;
    }
    if (!finalSubId) return;
    const startMin = labelToMinutes(start);
    const endMin = labelToMinutes(end);
    if (endMin <= startMin) return;

    if (editing) {
      updateBlock(editing.id, { subCategoryId: finalSubId, startMin, endMin });
    } else {
      addBlock({ date, subCategoryId: finalSubId, startMin, endMin, kind });
    }
    pushRecentSub(finalSubId);
    onOpenChange(false);
  };

  const handleSave = () => {
    const startMin = labelToMinutes(start);
    const endMin = labelToMinutes(end);
    const hasSub = subId || newSubName.trim();
    if (!hasSub || endMin <= startMin) return;

    // Check for overlap with existing blocks on the same date and kind
    const siblings = allBlocks.filter(
      (b) => b.date === date && b.kind === kind && (!editing || b.id !== editing.id)
    );
    const overlaps = siblings.filter((b) => b.startMin < endMin && b.endMin > startMin);
    if (overlaps.length > 0) { setOverlapError(true); setOverlappingBlocks(overlaps); return; }
    setOverlapError(false);
    setOverlappingBlocks([]);

    if (isPast) {
      setPendingAction("save");
      setConfirmOpen(true);
    } else {
      executeSave();
    }
  };

  const executeMerge = () => {
    let finalSubId = subId;
    if (!finalSubId && newSubName.trim()) {
      const id = "c-" + uid();
      addCategory({ name: newSubName.trim(), type, pointsPerHour: type === "wasted" ? 2 : 2 } as any);
      finalSubId = useStore.getState().categories.find((c) => c.name === newSubName.trim())?.id || id;
    }
    if (!finalSubId) return;
    const startMin = Math.min(labelToMinutes(start), ...overlappingBlocks.map((b) => b.startMin));
    const endMin = Math.max(labelToMinutes(end), ...overlappingBlocks.map((b) => b.endMin));
    overlappingBlocks.forEach((b) => deleteBlock(b.id));
    if (editing) {
      updateBlock(editing.id, { subCategoryId: finalSubId, startMin, endMin });
    } else {
      addBlock({ date, subCategoryId: finalSubId, startMin, endMin, kind });
    }
    pushRecentSub(finalSubId);
    setOverlapError(false);
    setOverlappingBlocks([]);
    onOpenChange(false);
  };

  const executeDelete = () => {
    if (editing) deleteBlock(editing.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    setPendingAction("delete");
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (pendingAction === "save") executeSave();
    else if (pendingAction === "merge") executeMerge();
    else if (pendingAction === "delete") executeDelete();
    setPendingAction(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-surface-1 border-l-border w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">
              {editing ? "Edit block" : kind === "planned" ? "Plan a block" : "Log time block"}
            </SheetTitle>
            {isPast && (
              <p className="text-xs text-amber-400 mt-1">
                Editing past data for {formatDateLong(date)} — changes sync to Dashboard &amp; Analytics automatically.
              </p>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {TYPES.map((t) => (
                  <button
                    key={t.v}
                    onClick={() => { setType(t.v); setSubId(""); }}
                    className={cn(
                      "rounded-lg py-2 text-sm border transition",
                      type === t.v ? "bg-primary text-primary-foreground border-primary" : "border-border bg-surface-2 hover:bg-surface-3"
                    )}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sub-category</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {filteredSubs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSubId(c.id)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm border text-left transition truncate",
                      subId === c.id ? "border-primary bg-accent text-accent-foreground" : "border-border bg-surface-2 hover:bg-surface-3"
                    )}
                  >{c.name}</button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="+ New sub-category"
                  value={newSubName}
                  onChange={(e) => { setNewSubName(e.target.value); setSubId(""); }}
                  className="bg-surface-2 border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Start</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="bg-surface-2 border-border mt-2" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">End</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-surface-2 border-border mt-2" />
              </div>
            </div>

            {overlapError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                <p className="text-xs text-destructive">
                  This block overlaps with {overlappingBlocks.length} existing block{overlappingBlocks.length > 1 ? "s" : ""}.
                  Adjust the time or merge them into one.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isPast ? () => { setPendingAction("merge"); setConfirmOpen(true); } : executeMerge}
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/20 text-xs"
                >
                  Merge into one block (
                  {minutesToLabel(Math.min(labelToMinutes(start), ...overlappingBlocks.map((b) => b.startMin)))}
                  {" – "}
                  {minutesToLabel(Math.max(labelToMinutes(end), ...overlappingBlocks.map((b) => b.endMin)))}
                  )
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary-glow">
                {editing ? "Save changes" : kind === "planned" ? "Add to plan" : "Log it"}
              </Button>
              {editing && (
                <Button variant="outline" onClick={handleDelete} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setPendingAction(null); }}>
        <AlertDialogContent className="bg-surface-1 border-border">
          <AlertDialogHeader>
            {pendingAction === "delete" ? (
              <>
                <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isPast
                    ? `This will permanently remove the block from ${formatDateLong(date)}. Your score and Analytics will update automatically.`
                    : "This will permanently remove the block. This cannot be undone."}
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Modify past data?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are {editing ? "editing" : "adding"} a block for {formatDateLong(date)}, which is a past date. Your score on Dashboard and Analytics will update automatically.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-2 border-border hover:bg-surface-3">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {pendingAction === "delete" ? "Delete" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
