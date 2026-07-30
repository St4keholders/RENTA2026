// lib/referral.ts
// First-touch referral cookie management

const COOKIE_NAME = 'rentash_ref';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Set referral cookie only if not already set (first-touch) */
export function setRefCookie(slug: string) {
  if (typeof document === 'undefined') return;
  if (getRefCookie()) return; // already set, first-touch wins
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(slug)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

/** Get referral slug from cookie */
export function getRefCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Clear referral cookie */
export function clearRefCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
}
