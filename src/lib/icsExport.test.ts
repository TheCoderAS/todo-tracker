import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";

import { buildIcsCalendar, escapeIcsText, toIcsDate } from "./icsExport";
import type { Todo } from "@/lib/types";

const makeTodo = (overrides: Partial<Todo>): Todo => ({
  id: "t1",
  title: "Sample",
  status: "pending",
  scheduledDate: Timestamp.fromDate(new Date("2026-05-31T17:00:00Z")),
  completedDate: null,
  priority: "medium",
  tags: [],
  contextTags: [],
  description: "",
  ...overrides
});

describe("toIcsDate", () => {
  it("formats a UTC iCalendar timestamp", () => {
    expect(toIcsDate(new Date("2026-05-31T17:05:09Z"))).toBe("20260531T170509Z");
  });
});

describe("escapeIcsText", () => {
  it("escapes special characters", () => {
    expect(escapeIcsText("a, b; c\\d")).toBe("a\\, b\\; c\\\\d");
  });

  it("escapes newlines", () => {
    expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("buildIcsCalendar", () => {
  const now = new Date("2026-05-31T09:00:00Z");

  it("wraps events in a VCALENDAR", () => {
    const ics = buildIcsCalendar([makeTodo({})], now);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Sample");
  });

  it("uses CRLF line endings", () => {
    const ics = buildIcsCalendar([makeTodo({})], now);
    expect(ics).toContain("\r\n");
  });

  it("creates a one-hour event window", () => {
    const ics = buildIcsCalendar([makeTodo({})], now);
    expect(ics).toContain("DTSTART:20260531T170000Z");
    expect(ics).toContain("DTEND:20260531T180000Z");
  });

  it("skips todos without a scheduled date", () => {
    const ics = buildIcsCalendar([makeTodo({ scheduledDate: null })], now);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("skips archived todos", () => {
    const ics = buildIcsCalendar(
      [makeTodo({ archivedAt: Timestamp.fromDate(now) })],
      now
    );
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("maps high priority to PRIORITY:1", () => {
    const ics = buildIcsCalendar([makeTodo({ priority: "high" })], now);
    expect(ics).toContain("PRIORITY:1");
  });
});
