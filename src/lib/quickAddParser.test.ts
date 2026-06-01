import { describe, expect, it } from "vitest";

import { parseQuickAdd } from "./quickAddParser";

// Fixed reference point: Sunday 2026-05-31, 09:00 local.
const NOW = new Date(2026, 4, 31, 9, 0, 0);

describe("parseQuickAdd", () => {
  it("returns a plain title when there is no metadata", () => {
    const result = parseQuickAdd("Buy groceries", NOW);
    expect(result.title).toBe("Buy groceries");
    expect(result.priority).toBe("medium");
    expect(result.tags).toEqual([]);
    expect(result.scheduledDate).toBe("");
    expect(result.scheduledTime).toBe("");
  });

  it("extracts hashtags as tags", () => {
    const result = parseQuickAdd("Email Sam #work #urgent", NOW);
    expect(result.title).toBe("Email Sam");
    expect(result.tags).toEqual(["work", "urgent"]);
  });

  it("extracts priority tokens", () => {
    expect(parseQuickAdd("Ship release !high", NOW).priority).toBe("high");
    expect(parseQuickAdd("Tidy desk !low", NOW).priority).toBe("low");
    expect(parseQuickAdd("Plan week !m", NOW).priority).toBe("medium");
  });

  it("parses 12-hour times", () => {
    const result = parseQuickAdd("Gym at 6pm", NOW);
    expect(result.title).toBe("Gym");
    expect(result.scheduledTime).toBe("18:00");
  });

  it("parses 24-hour times with minutes", () => {
    const result = parseQuickAdd("Standup 09:30", NOW);
    expect(result.scheduledTime).toBe("09:30");
  });

  it("resolves 'today' to the current date", () => {
    const result = parseQuickAdd("Call mum today", NOW);
    expect(result.title).toBe("Call mum");
    expect(result.scheduledDate).toBe("2026-05-31");
  });

  it("resolves 'tomorrow' to the next day", () => {
    const result = parseQuickAdd("Submit report tomorrow at 9am", NOW);
    expect(result.title).toBe("Submit report");
    expect(result.scheduledDate).toBe("2026-06-01");
    expect(result.scheduledTime).toBe("09:00");
  });

  it("defaults 'tonight' to 8pm", () => {
    const result = parseQuickAdd("Read tonight", NOW);
    expect(result.scheduledDate).toBe("2026-05-31");
    expect(result.scheduledTime).toBe("20:00");
  });

  it("resolves an upcoming weekday", () => {
    // NOW is Sunday; the next Tuesday is 2026-06-02.
    const result = parseQuickAdd("Dentist tuesday", NOW);
    expect(result.scheduledDate).toBe("2026-06-02");
  });

  it("resolves 'next <weekday>' to the following week", () => {
    // Next Tuesday after the upcoming one is 2026-06-09.
    const result = parseQuickAdd("Review next tuesday", NOW);
    expect(result.scheduledDate).toBe("2026-06-09");
  });

  it("combines tags, priority, date and time", () => {
    const result = parseQuickAdd("Pay rent tomorrow at 5pm #finance !high", NOW);
    expect(result.title).toBe("Pay rent");
    expect(result.tags).toEqual(["finance"]);
    expect(result.priority).toBe("high");
    expect(result.scheduledDate).toBe("2026-06-01");
    expect(result.scheduledTime).toBe("17:00");
  });
});
