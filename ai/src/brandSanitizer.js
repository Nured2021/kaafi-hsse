export const KAAFI_BRANDING = {
  brand: "KAAFI HSSE",
  header: "KAAFI HSSE - Safety Excellence",
  logoPlaceholder: "CLEAN_KAAFI_LOGO_V1",
  blockedNames: ["SafetyCo Partners", "SafetyCo", "BP Wind Energy", "BP", "IHSA.ca", "IHSA"],
};

const PERSONAL_NAME_LABEL =
  /\b([Pp]repared by|[Rr]eviewed by|[Ww]orker name|[Ss]upervisor name|[Ee]mployee name)\s*:\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/gm;

export function sanitizeKaafiText(value) {
  if (typeof value !== "string") {
    return "";
  }

  const branded = KAAFI_BRANDING.blockedNames.reduce(
    (cleaned, name) => cleaned.replaceAll(name, KAAFI_BRANDING.brand),
    value,
  );

  return branded.replace(PERSONAL_NAME_LABEL, "$1: [Removed for privacy]");
}

export function sanitizeKaafiResult(result) {
  return {
    ...result,
    input: sanitizeKaafiText(result.input),
    risk: sanitizeKaafiText(result.risk),
    jsa: sanitizeKaafiText(result.jsa),
    documents: sanitizeKaafiText(result.documents),
    summary: sanitizeKaafiText(result.summary),
  };
}
