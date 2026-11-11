import { staffPhoto } from "@/lib/staffPhotos";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** A round staff photo, or the person's initials when there is no photo. */
export function Avatar({ name, email, photo, size = 44, className = "" }: { name: string; email?: string | null; photo?: string | null; size?: number; className?: string }) {
  const src = photo ?? staffPhoto(email);
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={style} className={`shrink-0 rounded-full object-cover object-top ${className}`} />;
  }
  return (
    <div style={{ ...style, fontSize: Math.round(size * 0.36) }} className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className}`}>
      {initials(name)}
    </div>
  );
}
