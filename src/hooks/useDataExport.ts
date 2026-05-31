import { useCallback } from "react";

import { buildIcsCalendar } from "@/lib/icsExport";
import type { Habit, Todo } from "@/lib/types";

const triggerDownload = (content: string, mimeType: string, extension: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aura-pulse-export-${new Date().toISOString().split("T")[0]}.${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Builds JSON and CSV exports of the user's todos and habits.
 */
export const useDataExport = (todos: Todo[], habits: Habit[]) => {
  const exportJSON = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        tags: t.tags,
        description: t.description,
        recurrence: t.recurrence ?? null,
        scheduledDate: t.scheduledDate?.toDate().toISOString() ?? null,
        completedDate: t.completedDate?.toDate().toISOString() ?? null,
        createdAt: t.createdAt?.toDate().toISOString() ?? null
      })),
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        frequency: h.frequency,
        reminderTime: h.reminderTime,
        reminderDays: h.reminderDays,
        completionDates: h.completionDates,
        archivedAt: h.archivedAt ? "archived" : null,
        createdAt: h.createdAt?.toDate().toISOString() ?? null
      }))
    };
    triggerDownload(JSON.stringify(data, null, 2), "application/json", "json");
  }, [todos, habits]);

  const exportCSV = useCallback(() => {
    const headers = [
      "Type",
      "Title",
      "Status",
      "Priority",
      "Tags",
      "Scheduled Date",
      "Completed Date",
      "Recurrence"
    ];
    const rows = todos.map((t) => [
      "Todo",
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${t.tags.join(", ")}"`,
      t.scheduledDate?.toDate().toISOString() ?? "",
      t.completedDate?.toDate().toISOString() ?? "",
      t.recurrence ?? ""
    ]);

    habits.forEach((h) => {
      rows.push([
        "Habit",
        `"${h.title.replace(/"/g, '""')}"`,
        h.archivedAt ? "archived" : "active",
        "",
        "",
        "",
        "",
        h.frequency
      ]);
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    triggerDownload(csv, "text/csv", "csv");
  }, [todos, habits]);

  const exportICS = useCallback(() => {
    triggerDownload(buildIcsCalendar(todos), "text/calendar", "ics");
  }, [todos]);

  return { exportJSON, exportCSV, exportICS };
};
