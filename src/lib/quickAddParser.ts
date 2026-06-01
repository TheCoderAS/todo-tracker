import type { TodoPriority } from "@/lib/types";

export interface ParsedQuickAdd {
  title: string;
  scheduledDate: string; // YYYY-MM-DD ("" if none detected)
  scheduledTime: string; // HH:mm ("" if none detected)
  priority: TodoPriority;
  tags: string[];
}

const pad = (value: number) => String(value).padStart(2, "0");

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

const PRIORITY_WORDS: Record<string, TodoPriority> = {
  "!high": "high",
  "!h": "high",
  "!medium": "medium",
  "!med": "medium",
  "!m": "medium",
  "!low": "low",
  "!l": "low"
};

/**
 * Parses a free-text quick-add string into structured todo fields.
 *
 * Supported syntax (all optional, order-independent):
 *   - `#tag`               → tags
 *   - `!high` / `!med` / `!low` (and short forms) → priority
 *   - `at 6pm`, `at 18:30`, `6:00pm` → time
 *   - `today`, `tomorrow`, `tonight`, weekday names, `next <weekday>` → date
 *   - everything left over becomes the title
 *
 * `now` is injectable so the logic is deterministic in tests.
 */
export const parseQuickAdd = (
  input: string,
  now: Date = new Date()
): ParsedQuickAdd => {
  const tags: string[] = [];
  let priority: TodoPriority = "medium";
  let scheduledDate = "";
  let scheduledTime = "";

  let working = ` ${input.trim()} `;

  // Tags: #word
  working = working.replace(/\s#([\p{L}\p{N}_-]+)/gu, (_match, tag: string) => {
    const normalized = tag.toLowerCase();
    if (!tags.includes(normalized)) tags.push(normalized);
    return " ";
  });

  // Priority: !high / !med / !low (and short forms)
  working = working.replace(/\s(![\p{L}]+)/gu, (match, token: string) => {
    const mapped = PRIORITY_WORDS[token.toLowerCase()];
    if (mapped) {
      priority = mapped;
      return " ";
    }
    return match;
  });

  // Time: "at 6pm", "at 18:30", "6:30pm", "9am"
  const timeRegex =
    /\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\s(?:at\s+)?(\d{1,2}):(\d{2})\b/i;
  const timeMatch = working.match(timeRegex);
  if (timeMatch) {
    let hours: number;
    let minutes: number;
    if (timeMatch[3]) {
      // 12-hour clock with am/pm
      hours = Number(timeMatch[1]) % 12;
      if (timeMatch[3].toLowerCase() === "pm") hours += 12;
      minutes = timeMatch[2] ? Number(timeMatch[2]) : 0;
    } else {
      // 24-hour clock
      hours = Number(timeMatch[4]);
      minutes = Number(timeMatch[5]);
    }
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      scheduledTime = `${pad(hours)}:${pad(minutes)}`;
      working = working.replace(timeMatch[0], " ");
    }
  }

  // Relative / named dates
  const lower = working.toLowerCase();
  const setDate = (date: Date) => {
    scheduledDate = toDateInput(date);
  };

  if (/\btoday\b/.test(lower)) {
    setDate(now);
    working = working.replace(/\btoday\b/i, " ");
  } else if (/\btonight\b/.test(lower)) {
    setDate(now);
    if (!scheduledTime) scheduledTime = "20:00";
    working = working.replace(/\btonight\b/i, " ");
  } else if (/\btomorrow\b/.test(lower)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    setDate(date);
    working = working.replace(/\btomorrow\b/i, " ");
  } else {
    const nextMatch = lower.match(/\bnext\s+(\w+)\b/);
    const weekdayMatch = lower.match(
      /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );
    if (nextMatch && WEEKDAYS.includes(nextMatch[1])) {
      const target = WEEKDAYS.indexOf(nextMatch[1]);
      setDate(addDaysForNext(now, target));
      working = working.replace(/\bnext\s+\w+\b/i, " ");
    } else if (weekdayMatch) {
      const target = WEEKDAYS.indexOf(weekdayMatch[1]);
      setDate(addDaysForUpcoming(now, target));
      working = working.replace(
        /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
        " "
      );
    }
  }

  const title = working.replace(/\s+/g, " ").trim();

  return { title, scheduledDate, scheduledTime, priority, tags };
};

// Upcoming occurrence of `target` weekday (today counts only if it is today's weekday → next week to avoid "in the past").
const addDaysForUpcoming = (now: Date, target: number) => {
  const date = new Date(now);
  const delta = (target - now.getDay() + 7) % 7 || 7;
  date.setDate(now.getDate() + delta);
  return date;
};

// "next <weekday>" → the occurrence in the following week.
const addDaysForNext = (now: Date, target: number) => {
  const date = new Date(now);
  const delta = (target - now.getDay() + 7) % 7 || 7;
  date.setDate(now.getDate() + delta + 7);
  return date;
};
