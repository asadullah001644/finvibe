import type { Profile } from "@/lib/types";

const DISPLAY_NAME_MAX = 50;

export function resolveDisplayName(
  profile: Pick<Profile, "displayName" | "email">,
  fallbackEmail?: string | null,
): string {
  const trimmed = profile.displayName?.trim();
  if (trimmed) {
    return trimmed;
  }

  const email = (profile.email || fallbackEmail || "").trim();
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "Account";
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export function resolveDisplayInitial(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "A";
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Enter a display name, or leave the field empty to use your email prefix.";
  }

  if (trimmed.length > DISPLAY_NAME_MAX) {
    return `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`;
  }

  if (!/^[\p{L}\p{N}\s'.-]+$/u.test(trimmed)) {
    return "Use letters, numbers, spaces, and basic punctuation only.";
  }

  return null;
}

export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
