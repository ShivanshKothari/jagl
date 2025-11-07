/**
 * A robust helper to format a Date object based on a format string.
 * Supports formats like 'yyyy-MM-dd HH:mm', 'dd MMM yyyy', etc.
 * @param {Date} date - The Date object to format.
 * @param {string} format - The format string (e.g., 'yyyy-MM-dd HH:mm:ss').
 * @returns {string}
 */
export function formatDate(date, format) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ""; // Return empty string for invalid dates
  }

  const monthNamesShort = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  // Helper to pad numbers with leading zeros
  const pad = (n, len = 2) => n.toString().padStart(len, "0");

  const replacements = {
    "yyyy": date.getFullYear(),
    "yy": pad(date.getFullYear() % 100),
    "MM": pad(date.getMonth() + 1),
    "M": date.getMonth() + 1,
    "MMM": monthNamesShort[date.getMonth()],
    "dd": pad(date.getDate()),
    "d": date.getDate(),
    "HH": pad(date.getHours()), // 24-hour
    "H": date.getHours(),
    "hh": pad(date.getHours() % 12 || 12),
    "h": date.getHours() % 12 || 12,
    "mm": pad(date.getMinutes()),
    "m": date.getMinutes(),
    "ss": pad(date.getSeconds()),
    "s": date.getSeconds(),
    "tt": date.getHours() < 12 ? "AM" : "PM"
  };

  // escape regex special chars for token keys
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Sort tokens by length desc so regex prefers longer tokens where applicable
  const tokens = Object.keys(replacements).sort((a, b) => b.length - a.length).map(escapeRegExp);

  // Create a single regex that matches any token exactly where it appears in the format
  const tokenRegex = new RegExp(tokens.join("|"), "g");

  // Replace using a single pass so replacements do not get reprocessed
  const formatted = String(format).replace(tokenRegex, (match) => {
    return replacements.hasOwnProperty(match) ? replacements[match] : match;
  });

  return formatted;
}
