# ==========================================
# PROJECT A: HSE OFFICE AI AGENCY
# MODULE 2: SAFETY MEMORY — MULTI-INCIDENT DATABASE
# ==========================================

# 1. Advanced Data Structure: list of incident dictionaries
incident_database = [
    {
        "id": "INC-001",
        "officer": "Safety Officer AI",
        "zone": "Zone-C Warehouse",
        "report": "A worker was spotted operating the forklift without a hard hat and safety shoes.",
    },
    {
        "id": "INC-002",
        "officer": "Safety Officer AI",
        "zone": "Zone-A Chemical Storage",
        "report": "A chemical spill was detected near the solvent drums. Liquid spreading toward drainage.",
    },
    {
        "id": "INC-003",
        "officer": "Safety Officer AI",
        "zone": "Zone-B Assembly Line",
        "report": "Worker observed near live electrical panel with cabinet door left open.",
    },
    {
        "id": "INC-004",
        "officer": "Safety Officer AI",
        "zone": "Zone-D Loading Bay",
        "report": "Heavy machinery left unattended with engine running in pedestrian walkway.",
    },
    {
        "id": "INC-005",
        "officer": "Safety Officer AI",
        "zone": "Zone-E Office Block",
        "report": "Fire exit door was found blocked by cardboard boxes during a routine walkthrough.",
    },
    {
        "id": "INC-006",
        "officer": "Safety Officer AI",
        "zone": "Zone-F Maintenance Bay",
        "report": "Worker entered confined space without permit or gas monitoring equipment.",
    },
    {
        "id": "INC-007",
        "officer": "Safety Officer AI",
        "zone": "Zone-G Roof Access",
        "report": "Technician working at height without fall arrest harness attached.",
    },
]


# 2. Keyword-based hazard classification engine
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


# 3. Process the database and print a formatted terminal report
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
