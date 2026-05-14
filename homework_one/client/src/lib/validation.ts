// Prototype-faithful frontend validation. The backend's [EmailAddress] DataAnnotation is the
// authoritative check (see homework_one/src/WelcomeApp.Api/Dtos/RegisterRequest.cs); this regex
// only drives the inline "looks good" / "fix this" UX feedback before submit.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValid(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export type Strength = 0 | 1 | 2 | 3 | 4;

// 0: empty. 1: length ≥ 6. +1 for length ≥ 10. +1 for upper + lower. +1 for digit + special.
export function passwordStrength(password: string): Strength {
  if (!password) return 0;
  let score: Strength = 0 as Strength;
  if (password.length >= 6) score = 1;
  if (password.length >= 10) score = (score + 1) as Strength;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score = (score + 1) as Strength;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score = (score + 1) as Strength;
  return Math.min(4, score) as Strength;
}

export const STRENGTH_LABELS = ['', 'weak', 'fair', 'good', 'strong'] as const;

// Fallback name derivation when no display name is available — take the local-part,
// split on punctuation, Title-case each word.
export function deriveName(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return 'friend';
  const parts = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return parts.join(' ') || 'friend';
}

export function timeGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function formatPlan(plan: string): string {
  // Matches the prototype copy: "Free · trial". Future plan tiers (Pro, Team) pass through.
  if (plan === 'Free') return 'Free · trial';
  return plan;
}
