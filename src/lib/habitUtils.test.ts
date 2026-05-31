import { describe, expect, it } from "vitest";

import {
  getDateKey,
  getHabitMilestoneProgress,
  habitMilestones,
  isHabitScheduledForDate
} from "./habitUtils";

describe("getDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date("2026-05-31T12:00:00Z");
    expect(getDateKey(date, "UTC")).toBe("2026-05-31");
  });

  it("respects the provided time zone", () => {
    // 2026-01-01T02:00Z is still 2025-12-31 in New York.
    const date = new Date("2026-01-01T02:00:00Z");
    expect(getDateKey(date, "America/New_York")).toBe("2025-12-31");
  });
});

describe("isHabitScheduledForDate", () => {
  const date = new Date("2026-05-31T12:00:00Z"); // Sunday (weekday index 0)

  it("schedules daily habits every day", () => {
    expect(isHabitScheduledForDate({ frequency: "daily", timezone: "UTC" }, date)).toBe(
      true
    );
  });

  it("matches weekly habits only on selected weekdays", () => {
    expect(
      isHabitScheduledForDate(
        { frequency: "weekly", reminderDays: [0], timezone: "UTC" },
        date
      )
    ).toBe(true);
    expect(
      isHabitScheduledForDate(
        { frequency: "weekly", reminderDays: [1], timezone: "UTC" },
        date
      )
    ).toBe(false);
  });

  it("matches monthly habits on the configured day of month", () => {
    expect(
      isHabitScheduledForDate(
        { frequency: "monthly", reminderDays: [31], timezone: "UTC" },
        date
      )
    ).toBe(true);
    expect(
      isHabitScheduledForDate(
        { frequency: "monthly", reminderDays: [15], timezone: "UTC" },
        date
      )
    ).toBe(false);
  });
});

describe("getHabitMilestoneProgress", () => {
  it("reports no level for zero completions", () => {
    const progress = getHabitMilestoneProgress(0);
    expect(progress.level).toBe(0);
    expect(progress.currentMilestone).toBe(0);
    expect(progress.nextMilestone).toBe(habitMilestones[0]);
  });

  it("computes progress toward the next milestone", () => {
    const progress = getHabitMilestoneProgress(7); // between 5 and 10
    expect(progress.currentMilestone).toBe(5);
    expect(progress.nextMilestone).toBe(10);
    expect(progress.progressToNext).toBe(2);
    expect(progress.completionsNeeded).toBe(5);
  });

  it("caps at the final milestone", () => {
    const progress = getHabitMilestoneProgress(999);
    expect(progress.level).toBe(habitMilestones.length);
    expect(progress.nextMilestone).toBeNull();
  });

  it("never returns a negative total", () => {
    expect(getHabitMilestoneProgress(-5).level).toBe(0);
  });
});
