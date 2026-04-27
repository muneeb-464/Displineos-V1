# New App Issues & Bug Reports

---

## 1. Dashboard — Score Ring (Goal-Based Fill)

**Problem:**
When a user sets their daily hours goal in Settings, the dashboard score ring does not reflect the goal progress correctly. The ring has no visual breakdown of how hours are split between Productive, Wasted, or Routine time.

**Requirement:**

* Score ring should only activate/fill once the user has set a daily hours goal in Settings
* If no goal is set → prompt user to set one before the ring renders
* Ring fill must be segmented and color-coded by time type:
  * Productive (P) → Yellow (dark)
  * Wasted (W) → Red
  * Routine (R) → Gray
* Fill percentage formula:
  * `(Total logged hours / Daily goal hours) × 100`
* Each segment fills proportionally based on how many hours belong to P, W, or R

---

## 2. Dashboard — Last Streak & Current Streak Display

**Problem:**
The dashboard currently does not show both the user's **last streak** and **current streak** together. Users have no way to compare where they were vs where they are now.

**Requirement:**

* Dashboard must display **two streak values** clearly:
  * **Current Streak** → number of consecutive days the user has met their daily goal (ongoing)
  * **Last Streak** → the most recently completed/broken streak count before the current one
* Both should be visible on the dashboard at the same time — not toggled or hidden
* Example display:
  ```
  🔥 Current Streak: 5 days
  ⏪ Last Streak:    12 days
  ```
* If the user has no previous streak → Last Streak shows `0` or `—`
* If current streak is broken → it moves to Last Streak and current resets to `0`

---

## 3. Time Format Inconsistency, Timezone Bug & Short Block Height ⚠️ (Critical)

**Problem A — Format Mismatch:**
When adding a time block, the time input shows in **12-hour format (AM/PM)**, but on the **Log page** and **Planner page**, time is displayed in **24-hour format**. This inconsistency causes confusion across the app.

**Problem B — Timezone Not Handled:**
The app does not account for the user's local timezone when saving or displaying time blocks, resulting in incorrect times being stored and shown.

**Problem C — Short Block Tile Height (Log & Planner Page):**
On the Log and Planner pages, time block tiles do not scale properly based on duration. A short block (e.g., 15 minutes) renders with too little height, making it unreadable and visually unclear.

**Requirement:**

* Add a **Timezone Selection** option in Settings
  * Example: dropdown with PKT, UTC, EST, IST, GMT, etc.
* All time values across the app must respect the selected timezone:
  * Block creation screen
  * Log page
  * Planner page
* Pick **one** time format (12h or 24h) and apply it consistently across the entire app
* Optional: Allow user to toggle 12h / 24h preference in Settings
* Block tile height on Log and Planner pages must scale **proportionally** based on block duration
* Even very short blocks (minimum **15 minutes**) must be clearly visible and readable
* Minimum tile height must be enforced so Category name and time range are always fully legible — never clipped or overflowed
* Example scaling reference:
  * 15 min block → minimum visible height (e.g., 30–40px)
  * 30 min block → proportionally taller
  * 1 hour block → full standard height
* Text inside short tiles should truncate gracefully (e.g., `...`) rather than overflow or disappear

---






## 7. Analytics Monthly Page — Wasted Day Rule (50% Goal)

**Problem:**
On the Analytics monthly view, there is no logic to classify a day as "wasted" when the user fails to meet a meaningful portion of their daily goal. This means even completely unproductive days look neutral, skewing the monthly overview.

**Requirement:**

* If a user has set a **daily hours goal** in Settings:
  * If the user completes **less than 50%** of their daily goal on any given day → that day is automatically classified as a **Wasted Day**
  * If the user completes **50% or more** → day is considered valid (Productive or Routine based on block types)
* This rule must be reflected in:
  * Monthly analytics calendar view (day color / marker)
  * Monthly summary stats (total wasted days count)
  * Score calculation for that day
* Wasted Day indicator color → **Red** (consistent with Wasted color system)
* If no daily goal is set → this rule does not apply

---

## Summary

| # | Issue | Type | Priority |
|---|-------|------|----------|
| 1 | Score ring fills based on P / W / R after goal is set | Feature / Fix | High |
| 2 | Dashboard must show both Last Streak and Current Streak | Feature | Medium |
| 3 | Time format mismatch (12h vs 24h) + Timezone + Short block height | Bug | Critical |
| 4 | Time block must show Category, Time & Total Hours | Bug / UI | Medium |
| 5 | Analytics — view all dates, customize last 7 days only | Limitation | Medium |
| 6 | Add block form not responsive on small screens | Bug / UI | High |
| 7 | Monthly analytics — day marked Wasted if < 50% goal met | Feature / Logic | High |