export function formatDate(date) {
  if (!date) return "";
  let d = date;
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      const parts = date.slice(0, 10).split("-").map(Number);
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(date);
    }
  }
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return String(date);
}

export function dateValue(date) {
  if (date instanceof Date) return date.getTime();
  if (typeof date === "string") {
    const t = new Date(date).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}
