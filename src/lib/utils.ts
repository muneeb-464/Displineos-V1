import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const todayISO = (timezone?: string) => {
  if (timezone) {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  }
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const minutesToLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export const formatMinutes = (m: number, format: "12h" | "24h" = "24h"): string => {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  if (format === "24h") {
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
};

export const labelToMinutes = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const nowMinutes = (timezone?: string) => {
  if (timezone) {
    const t = new Date().toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false });
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const formatDateLong = (iso: string) => {
  const d = parseISODateLocal(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

/** Parse a "yyyy-MM-dd" string as a LOCAL date (avoids UTC midnight shift). */
export const parseISODateLocal = (iso: string): Date => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(iso);
  return new Date(+m[1], +m[2] - 1, +m[3]);
};

export const isoFromDate = (d: Date): string => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

/** Returns true if the ISO date is today or within the last 7 days (editable window). */
export const isEditableDate = (iso: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 7);
  const d = parseISODateLocal(iso);
  return d >= cutoff;
};
