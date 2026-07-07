# ==========================================
# PROJECT A: HSE OFFICE AI AGENCY
# MODULE 3: SAFETY MEMORY — FILE I/O & READING
# ==========================================

import os

INCIDENTS_FILE = os.path.join(os.path.dirname(__file__), "incidents_log.txt")
OFFICER_NAME = "Safety Officer AI"


def load_incidents(filepath: str) -> list:
    """
    Parse incidents_log.txt and return a list of incident dictionaries.

    Expected block format (blank lines and # comments are ignored):
        ID:     <id>
        ZONE:   <zone>
        REPORT: <description>
    """
    incidents = []
    current: dict = {}

    with open(filepath, encoding="utf-8") as fh:
        for raw_line in fh:
            line = raw_line.strip()

            # Skip blank lines and comment lines
            if not line or line.startswith("#"):
                if current:
                    # Flush a completed entry when we hit a blank line
                    if {"id", "zone", "report"} <= current.keys():
                        current.setdefault("officer", OFFICER_NAME)
                        incidents.append(current)
                    current = {}
                continue

            if line.upper().startswith("ID:"):
                current["id"] = line.split(":", 1)[1].strip()
            elif line.upper().startswith("ZONE:"):
                current["zone"] = line.split(":", 1)[1].strip()
            elif line.upper().startswith("REPORT:"):
                current["report"] = line.split(":", 1)[1].strip()

    # Flush the final entry if the file does not end with a blank line
    if current and {"id", "zone", "report"} <= current.keys():
        current.setdefault("officer", OFFICER_NAME)
        incidents.append(current)

    return incidents


# 1. Load incidents from the external log file
incident_database = load_incidents(INCIDENTS_FILE)


# 2. Keyword-based hazard classification engine (unchanged)
def classify_incident(report_text: str) -> dict:
    """
    Classify a single incident report by scanning for hazard keywords.

    Returns a dict with hazard_type, risk_level, and recommended_action.
    """
    text = report_text.lower()

    if "forklift" in text or "machinery" in text:
        return {
            "hazard_type": "Heavy Machinery Violation",
            "risk_level": "CRITICAL",
            "recommended_action": "Suspend operation immediately and verify driver licence and PPE.",
        }
    elif "chemical" in text or "spill" in text:
        return {
            "hazard_type": "Chemical Hazard",
            "risk_level": "HIGH",
            "recommended_action": "Evacuate the spill area and deploy the hazmat cleanup team.",
        }
    elif "electrical" in text or "live" in text:
        return {
            "hazard_type": "Electrical Hazard",
            "risk_level": "CRITICAL",
            "recommended_action": "Isolate the electrical supply and barricade the area. Notify the electrical supervisor.",
        }
    elif "confined space" in text or "gas monitoring" in text:
        return {
            "hazard_type": "Confined Space Hazard",
            "risk_level": "CRITICAL",
            "recommended_action": "Halt entry immediately. Issue confined space permit and deploy gas monitor.",
        }
    elif "toxic gas" in text or "toxic" in text or "fumes" in text or "ventilation" in text:
        return {
            "hazard_type": "Toxic / Gas Hazard",
            "risk_level": "CRITICAL",
            "recommended_action": "Evacuate the area immediately. Restore ventilation and conduct air quality testing before re-entry.",
        }
    elif "fuel" in text or "leak" in text or "ignition" in text or "high pressure" in text:
        return {
            "hazard_type": "Fire & Explosion Risk",
            "risk_level": "CRITICAL",
            "recommended_action": "Isolate the ignition source and fuel supply. Evacuate and deploy fire suppression team.",
        }
    elif "height" in text or "fall" in text or "harness" in text:
        return {
            "hazard_type": "Working at Height Hazard",
            "risk_level": "HIGH",
            "recommended_action": "Stop work at height. Ensure fall arrest harness is fitted and inspected.",
        }
    elif "fire" in text or "exit" in text or "blocked" in text:
        return {
            "hazard_type": "Fire Safety Violation",
            "risk_level": "HIGH",
            "recommended_action": "Clear the fire exit immediately and issue a non-conformance notice.",
        }
    else:
        return {
            "hazard_type": "General Safety Concern",
            "risk_level": "LOW",
            "recommended_action": "Issue a standard safety reminder to the team.",
        }


# 3. Process all loaded incidents and print a formatted terminal report
RISK_COLOUR = {
    "CRITICAL": "\033[91m",   # red
    "HIGH":     "\033[93m",   # yellow
    "LOW":      "\033[92m",   # green
}
RESET = "\033[0m"

print("=" * 54)
print("      KAAFI HSSE — SAFETY MEMORY INCIDENT DATABASE     ")
print(f"      Total incidents loaded: {len(incident_database)}")
print("=" * 54)

for incident in incident_database:
    classification = classify_incident(incident["report"])
    risk = classification["risk_level"]
    colour = RISK_COLOUR.get(risk, "")

    print(f"\n  INCIDENT ID     : {incident['id']}")
    print(f"  ZONE            : {incident['zone']}")
    print(f"  REPORTING AGENT : {incident['officer']}")
    print(f"  INCIDENT REPORT : {incident['report']}")
    print(f"  HAZARD TYPE     : {classification['hazard_type']}")
    print(f"  RISK LEVEL      : {colour}{risk}{RESET}")
    print(f"  ACTION REQUIRED : {classification['recommended_action']}")
    print("  " + "-" * 52)

print("\n" + "=" * 54)
print("  END OF REPORT — All incidents processed.")
print("=" * 54)
