export const getDateKey = (date: Date, timeZone?: string | null) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
};

export const getMonthKey = (date: Date, timeZone?: string | null) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? undefined,
    year: "numeric",
    month: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
};

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const getDateParts = (date: Date, timeZone?: string | null) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone ?? undefined,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(lookup("year"));
  const month = Number(lookup("month"));
  const day = Number(lookup("day"));
  const weekday = lookup("weekday");
  return {
    year,
    month,
    day,
    weekdayIndex: weekdayIndex[weekday] ?? date.getDay()
  };
};

const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(day, lastDay);
};

const getYearlySchedule = (
  reminderDays: number[] | undefined,
  fallbackMonth: number,
  fallbackDay: number
) => {
  if (reminderDays && reminderDays.length >= 2) {
    return { month: reminderDays[0], day: reminderDays[1] };
  }
  if (reminderDays && reminderDays.length === 1) {
    return { month: fallbackMonth, day: reminderDays[0] };
  }
  return { month: fallbackMonth, day: fallbackDay };
};

const isMonthIntervalMatch = (
  dateParts: ReturnType<typeof getDateParts>,
  habitCreatedAt: Date | null,
  interval: number,
  timeZone?: string | null
) => {
  const anchor = habitCreatedAt ? getDateParts(habitCreatedAt, timeZone) : dateParts;
  const monthsSince =
    (dateParts.year - anchor.year) * 12 + (dateParts.month - anchor.month);
  return Math.abs(monthsSince) % interval === 0;
};

export const isHabitScheduledForDate = (
  habit: { frequency: string; reminderDays?: number[]; timezone?: string | null; createdAt?: any },
  date: Date
) => {
  const parts = getDateParts(date, habit.timezone ?? null);
  const reminderDays = habit.reminderDays ?? [];

  if (habit.frequency === "daily") {
    return true;
  }

  if (habit.frequency === "weekly") {
    if (!reminderDays.length) return true;
    return reminderDays.includes(parts.weekdayIndex);
  }

  if (habit.frequency === "monthly") {
    const dayOfMonth = reminderDays[0] ?? parts.day;
    return parts.day === clampDay(parts.year, parts.month, dayOfMonth);
  }

  if (habit.frequency === "quarterly") {
    const dayOfMonth = reminderDays[0] ?? parts.day;
    return (
      parts.day === clampDay(parts.year, parts.month, dayOfMonth) &&
      isMonthIntervalMatch(parts, habit.createdAt?.toDate?.() ?? null, 3, habit.timezone)
    );
  }

  if (habit.frequency === "half-yearly") {
    const dayOfMonth = reminderDays[0] ?? parts.day;
    return (
      parts.day === clampDay(parts.year, parts.month, dayOfMonth) &&
      isMonthIntervalMatch(parts, habit.createdAt?.toDate?.() ?? null, 6, habit.timezone)
    );
  }

  const { month, day } = getYearlySchedule(reminderDays, parts.month, parts.day);
  return (
    parts.month === month &&
    parts.day === clampDay(parts.year, month, day)
  );
};

export const getLocalTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;

export const habitMilestones = [
  1,
  5,
  10,
  20,
  35,
  50,
  75,
  100,
  150,
  200,
  300,
  500
];

export const getHabitMilestoneProgress = (totalCompletions: number) => {
  const safeTotal = Math.max(totalCompletions, 0);
  const level = habitMilestones.filter((milestone) => safeTotal >= milestone).length;
  const currentMilestone = level > 0 ? habitMilestones[level - 1] : 0;
  const nextMilestone = habitMilestones[level] ?? null;
  const progressToNext = nextMilestone ? safeTotal - currentMilestone : 0;
  const completionsNeeded = nextMilestone ? nextMilestone - currentMilestone : 0;
  return {
    level,
    currentMilestone,
    nextMilestone,
    progressToNext,
    completionsNeeded
  };
};
