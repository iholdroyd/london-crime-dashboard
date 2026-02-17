const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert "YYYY-MM" or "YYYY-MM-DD" → "Month Year", e.g. "2026-01" → "January 2026"
 * Returns the original string if parsing fails.
 */
export function formatMonthYear(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    const parts = raw.split('-');
    if (parts.length < 2) return raw;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return raw;
    return `${MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Get the previous month from a "YYYY-MM" date string
 * e.g. "2026-01" → "December 2025"
 */
export function getPreviousMonth(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;

    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);

    // Subtract one month
    month--;
    if (month < 1) {
        month = 12;
        year--;
    }

    // Format back to Month Year
    const monthIdx = month - 1;
    return `${MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Get the date from 12 months ago from a "YYYY-MM" date string
 * e.g. "2026-01" → "January 2025"
 */
export function get12MonthsAgo(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('-');
    if (parts.length < 2) return dateStr;

    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);

    // Subtract 12 months (1 year)
    year--;

    // Format back to Month Year
    const monthIdx = month - 1;
    return `${MONTH_NAMES[monthIdx]} ${year}`;
}
