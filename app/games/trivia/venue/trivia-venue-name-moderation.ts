const BLOCKED_TERMS = [
  "fuck", "shit", "bitch", "cunt", "dick", "pussy", "cock", "asshole", "motherfucker",
  "nigger", "nigga", "faggot", "retard", "kike", "spic", "chink", "whore", "slut",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" };

export function normalizeTriviaVenueNicknameForModeration(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .split("")
    .map((char) => LEET[char] ?? char)
    .join("")
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1");
}

function collapsed(value: string) {
  return value.replace(/(.)\1+/g, "$1");
}

export function moderateTriviaVenueNickname(value: string): { allowed: true; name: string } | { allowed: false; reason: string } {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 30) return { allowed: false, reason: "Use a nickname between 1 and 30 characters." };
  if (!/[a-z0-9]/i.test(name)) return { allowed: false, reason: "Use letters or numbers in your nickname." };
  const normalized = normalizeTriviaVenueNicknameForModeration(name);
  const compressed = collapsed(normalized);
  if (BLOCKED_TERMS.some((term) => normalized.includes(term) || compressed.includes(collapsed(term)))) {
    return { allowed: false, reason: "Choose another nickname." };
  }
  return { allowed: true, name };
}
