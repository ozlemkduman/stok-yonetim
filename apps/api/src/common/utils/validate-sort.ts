/**
 * Validates sortBy parameter against a whitelist of allowed columns.
 * Prevents SQL injection through orderBy clauses.
 */
export function validateSortColumn(
  sortBy: string,
  allowedColumns: string[],
  defaultColumn: string,
): string {
  if (allowedColumns.includes(sortBy)) {
    return sortBy;
  }
  return defaultColumn;
}
