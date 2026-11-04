/** Cleans a pasted link: adds https:// if missing and only allows web links. Returns null when it is not a usable link. */
export function cleanLink(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (withScheme.length > 2000) return null;
    return url.toString();
  } catch {
    return null;
  }
}
