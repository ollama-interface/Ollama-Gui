/**
 * Utility functions to parse and format raw PostgreSQL data
 */

export interface ParsedRow {
  [key: string]: any;
}

/**
 * Parse raw PostgreSQL values into appropriate JavaScript types
 * Handles both string and native JSON types from the database
 */
export function parsePostgresValue(value: any, columnName?: string): any {
  if (value === null || value === undefined) {
    return null;
  }

  // If it's already a native type (boolean, number), return as-is
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  // Handle boolean string values
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  // Handle numeric string values
  if (!isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed);
  }

  // Handle UUID format (36 chars with hyphens: 8-4-4-4-12)
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  // Handle UUID as hex string (32 hex chars without hyphens)
  if (/^[0-9a-f]{32}$/i.test(trimmed) && trimmed.length === 32) {
    // Convert hex to UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${trimmed.substring(0, 8)}-${trimmed.substring(8, 12)}-${trimmed.substring(12, 16)}-${trimmed.substring(16, 20)}-${trimmed.substring(20)}`;
  }

  // Handle date formats (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle timestamp formats
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed;
  }

  // Return as string for everything else
  return trimmed;
}

/**
 * Parse raw PostgreSQL result rows into typed objects
 */
export function parsePostgresResults(
  rawResults: Record<string, string | null>[],
): ParsedRow[] {
  return rawResults.map((row) => {
    const parsedRow: ParsedRow = {};
    for (const [key, value] of Object.entries(row)) {
      parsedRow[key] = parsePostgresValue(value, key);
    }
    return parsedRow;
  });
}

/**
 * Format a value for display in the UI
 */
export function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Get the display type of a value for styling
 */
export function getValueType(
  value: any,
): "null" | "boolean" | "number" | "date" | "uuid" | "string" {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (typeof value === "string") {
    // Check if it's a UUID
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      return "uuid";
    }

    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "date";
    }

    return "string";
  }

  return "string";
}
