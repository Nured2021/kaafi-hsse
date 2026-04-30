export const KAAFI_BRANDING = {
  brand: "KAAFI HSSE",
  header: "KAAFI HSSE - Safety Excellence",
  blockedNames: ["SafetyCo Partners", "SafetyCo", "BP Wind Energy", "BP", "IHSA.ca", "IHSA", "Shell", "Suncor", "Syncrude", "CNRL"],
};

const PERSONAL_NAME_REGEX = /\b(Prepared by|Reviewed by|Worker name|Supervisor name|Employee name|Submitted by|Approved by)\s*:\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/gim;

export function sanitizeKaafiText(value) {
  if (typeof value !== "string") return "";
  let cleaned = value;
  KAAFI_BRANDING.blockedNames.forEach(name => {
    cleaned = cleaned.replaceAll(name, KAAFI_BRANDING.brand);
  });
  return cleaned.replace(PERSONAL_NAME_REGEX, "$1: [Removed for privacy]");
}
