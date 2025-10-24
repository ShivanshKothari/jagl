/**
     * A robust helper to format a Date object based on a format string.
     * Supports formats like 'yyyy-MM-dd HH:mm', 'dd MMM yyyy', etc.
     * @param {Date} date - The Date object to format.
     * @param {string} format - The format string (e.g., 'yyyy-MM-dd HH:mm:ss').
     * @private
     */
export function formatDate(date, format) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return ''; // Return empty string for invalid dates
    }

    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Helper to pad numbers with leading zeros
    const pad = (n) => n.toString().padStart(2, '0');

    const replacements = {
        'yyyy': date.getFullYear(),
        'yy': pad(date.getFullYear() % 100),
        'MM': pad(date.getMonth() + 1),
        'M': date.getMonth() + 1,
        'MMM': monthNamesShort[date.getMonth()],
        'dd': pad(date.getDate()),
        'd': date.getDate(),
        'HH': pad(date.getHours()), // 24-Hour (00-23)
        'H': date.getHours(), // 24-Hour (0-23)
        'hh': pad(date.getHours() % 12 || 12), // 12-Hour Padded (01-12)
        'h': date.getHours() % 12 || 12, // 12-Hour Unpadded (1-12)
        'mm': pad(date.getMinutes()),
        'm': date.getMinutes(),
        'ss': pad(date.getSeconds()),
        's': date.getSeconds(),
        'tt': date.getHours() < 12 ? 'AM' : 'PM', // AM/PM marker
    };

    let formattedString = format;

    // Keys sorted from longest to shortest to ensure tokens like 'MM' are replaced before 'M'
    const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

    sortedKeys.forEach(key => {
        // A safer replacement by creating a RegExp for the full token key
        const regex = new RegExp(key, 'g');
        formattedString = formattedString.replace(regex, replacements[key]);
    });

    return formattedString;
}