/** Headshots from the Gas Needs staff profile, keyed by login email. Anyone not listed shows initials. */
const PHOTOS: Record<string, string> = {
  "abraham@flaretechnical.com": "/staff/abraham.jpg",
  "abraham@gasneeds.com": "/staff/abraham.jpg",
  "sales@gasneeds.com": "/staff/antony.jpg",
  "business@gasneeds.com": "/staff/manu.jpg",
  "accounts@gasneeds.com": "/staff/jintu.jpg",
  "jai@gasneeds.com": "/staff/jai.jpg",
};

export const staffPhoto = (email?: string | null): string | null => (email ? PHOTOS[email.toLowerCase()] ?? null : null);
