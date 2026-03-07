/** Strip HTML tags and script-injection characters from a string */
export function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '');
}

/** Block dangerous characters on keydown (XSS vectors) */
export function onSanitizedKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['<', '>', '{', '}', '`'].includes(e.key)) {
    e.preventDefault();
  }
}

export const rules = {
  /** Letters, spaces, hyphens, apostrophes — for person/place names */
  name: /^[a-zA-Z\s\-'.]+$/,
  /** Letters, numbers, spaces, hyphens, &, apostrophes, parentheses — for org names */
  orgName: /^[a-zA-Z0-9\s\-&'.()]+$/,
  /** Uppercase letters, numbers, hyphens — for employee numbers */
  employeeNumber: /^[A-Z0-9][A-Z0-9\-]*$/,
};

export const messages = {
  name: "Only letters, spaces, hyphens, and apostrophes allowed",
  orgName: "Only letters, numbers, spaces, hyphens, &, and ( ) allowed",
  employeeNumber: "Must start with a letter or digit; only uppercase letters, numbers, and hyphens allowed",
};
