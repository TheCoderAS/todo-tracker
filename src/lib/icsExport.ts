import type { Todo } from "@/lib/types";

const pad = (value: number) => String(value).padStart(2, "0");

/** Formats a Date as a UTC iCalendar timestamp: YYYYMMDDTHHMMSSZ. */
export const toIcsDate = (date: Date): string =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
  `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

/** Escapes text per RFC 5545 (commas, semicolons, backslashes, newlines). */
export const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/**
 * Builds an RFC 5545 VCALENDAR string containing one VEVENT per scheduled
 * todo. Todos without a scheduled date are skipped. Each event is one hour
 * long by default.
 */
export const buildIcsCalendar = (todos: Todo[], now: Date = new Date()): string => {
  const stamp = toIcsDate(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aura Pulse//Todo Export//EN",
    "CALSCALE:GREGORIAN"
  ];

  todos
    .filter((todo) => todo.scheduledDate && !todo.archivedAt)
    .forEach((todo) => {
      const start = todo.scheduledDate!.toDate();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${todo.id}@aura-pulse`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `SUMMARY:${escapeIcsText(todo.title)}`,
        `STATUS:${todo.status === "completed" ? "COMPLETED" : "CONFIRMED"}`,
        `PRIORITY:${todo.priority === "high" ? 1 : todo.priority === "low" ? 9 : 5}`,
        "END:VEVENT"
      );
    });

  lines.push("END:VCALENDAR");
  // iCalendar lines are CRLF-delimited.
  return lines.join("\r\n");
};
