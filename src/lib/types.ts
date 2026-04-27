export type CategoryType = "productive" | "routine" | "wasted";

export interface SubCategory {
  id: string;
  name: string;
  type: CategoryType;
  pointsPerHour: number;
  isDeepWork?: boolean;
  icon?: string;
}

export interface TimeBlock {
  id: string;
  date: string; // YYYY-MM-DD
  subCategoryId: string;
  startMin: number; // minutes from 00:00
  endMin: number;
  kind: "planned" | "logged";
  note?: string;
}

export type PrayerName = "Fajr" | "Zuhr" | "Asr" | "Maghrib" | "Isha";
export const PRAYERS: PrayerName[] = ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"];

export interface NamazLog {
  date: string;
  prayer: PrayerName;
  completed: boolean;
}

export interface Reflection {
  id: string;
  date: string;
  wentWell: string;
  wasted: string;
  tomorrow: string;
  score: number;
  productiveHours: number;
  namazCompleted: number;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  blocks: Omit<TimeBlock, "id" | "date" | "kind">[];
}

export interface Settings {
  productiveRate: number;
  wastedRate: number;
  namazBonus: number;
  namazPenalty: number;
  dailyTargetPenalty: number;
  deepWorkMultiplier: number;
  targetProductiveHours: number;
  streakMinHours: number;
  prayerReminders: Record<PrayerName, boolean>;
  userName: string;
  showNamazInLog: boolean;
  namazInScore: boolean;
  timezone: string;
  timeFormat: "12h" | "24h";
}

export interface DayPlanState {
  date: string;
  startedDay: boolean;
}
