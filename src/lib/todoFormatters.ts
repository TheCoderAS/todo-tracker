import type { Timestamp } from "firebase/firestore";

export const formatDateInput = (timestamp: Timestamp | null) =>
  timestamp ? timestamp.toDate().toISOString().split("T")[0] : "";

export const formatTimeInput = (timestamp: Timestamp | null) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const formatDateDisplay = (timestamp: Timestamp | null) =>
  timestamp
    ? timestamp.toDate().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "Not scheduled";

export const formatGroupTitle = (date: Date) => {
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const dayPart = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${datePart} - ${dayPart}`;
};
