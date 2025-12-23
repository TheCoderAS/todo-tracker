export const getDateKey = (date: Date, timeZone?: string | null) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
};

export const getLocalTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
