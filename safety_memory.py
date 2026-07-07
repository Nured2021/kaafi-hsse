# ==========================================
# PROJECT A: HSE OFFICE AI AGENCY
# MODULE 4: SAFETY MEMORY — OBJECT-ORIENTED PROGRAMMING
# ==========================================

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

INCIDENTS_FILE = os.path.join(os.path.dirname(__file__), "incidents_log.txt")
DEFAULT_OFFICER = "Safety Officer AI"

RISK_COLOUR = {
    "CRITICAL": "\033[91m",  # red
    "HIGH": "\033[93m",      # yellow
    "LOW": "\033[92m",       # green
}
RESET = "\033[0m"

# ---------------------------------------------------------------------------
# 1. Incident — data model
# ---------------------------------------------------------------------------


@dataclass
class Incident:
    """Represents a single raw safety incident loaded from the log file."""

    incident_id: str
    zone: str
    report: str
    officer: str = DEFAULT_OFFICER

    # Fields populated by RiskAssessor after classification
    hazard_type: str = field(default="", init=False)
    risk_level: str = field(default="", init=False)
    recommended_action: str = field(default="", init=False)

    def is_assessed(self) -> bool:
        """Return True once the RiskAssessor has filled in the classification fields."""
        return bool(self.hazard_type and self.risk_level and self.recommended_action)


# ---------------------------------------------------------------------------
# 2. HSEAgent — abstract base class
# ---------------------------------------------------------------------------


class HSEAgent(ABC):
    """
    Abstract base class for all agents in the HSE Office AI system.

    Every concrete agent must implement `run()`, which accepts and returns
    a list of Incident objects so agents can be chained together.
    """

    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def run(self, incidents: list[Incident]) -> list[Incident]:
        """Execute the agent's primary task on the incident list."""

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name!r})"


# ---------------------------------------------------------------------------
# 3. SafetyInspector — parses incidents_log.txt into Incident objects
# ---------------------------------------------------------------------------


class SafetyInspector(HSEAgent):
    """
    Reads `incidents_log.txt` and converts each entry into an Incident object.

    Expected block format (blank lines and lines starting with # are ignored):
        ID:     <incident-id>
        ZONE:   <facility zone>
        REPORT: <free-text description>
    """

    def __init__(self, filepath: str, officer: str = DEFAULT_OFFICER) -> None:
        super().__init__("Safety Inspector")
        self.filepath = filepath
        self.officer = officer

    def run(self, incidents: list[Incident] | None = None) -> list[Incident]:
        """Parse the log file and return a fresh list of Incident objects."""
        parsed: list[Incident] = []
        current: dict[str, str] = {}

        with open(self.filepath, encoding="utf-8") as fh:
            for raw_line in fh:
                line = raw_line.strip()

                if not line or line.startswith("#"):
                    if current:
                        self._flush(current, parsed)
                        current = {}
                    continue

                if line.upper().startswith("ID:"):
                    current["id"] = line.split(":", 1)[1].strip()
                elif line.upper().startswith("ZONE:"):
                    current["zone"] = line.split(":", 1)[1].strip()
                elif line.upper().startswith("REPORT:"):
                    current["report"] = line.split(":", 1)[1].strip()

        # Flush the final entry if the file does not end with a blank line
        if current:
            self._flush(current, parsed)

        return parsed

    def _flush(self, current: dict[str, str], parsed: list[Incident]) -> None:
        """Validate and append a completed entry to the parsed list."""
        if {"id", "zone", "report"} <= current.keys():
            parsed.append(
                Incident(
                    incident_id=current["id"],
                    zone=current["zone"],
                    report=current["report"],
                    officer=self.officer,
                )
            )


# ---------------------------------------------------------------------------
# 4. RiskAssessor — classifies each Incident using keyword detection
# ---------------------------------------------------------------------------


class RiskAssessor(HSEAgent):
    """
    Evaluates each Incident and assigns a hazard type, risk level, and
    recommended corrective action based on keyword analysis of the report text.
    """

    # Ordered rules: (keywords, hazard_type, risk_level, recommended_action)
    _RULES: list[tuple[list[str], str, str, str]] = [
        (
            ["forklift", "machinery"],
            "Heavy Machinery Violation",
            "CRITICAL",
            "Suspend operation immediately and verify driver licence and PPE.",
        ),
        (
            ["chemical", "spill"],
            "Chemical Hazard",
            "HIGH",
            "Evacuate the spill area and deploy the hazmat cleanup team.",
        ),
        (
            ["electrical", "live"],
            "Electrical Hazard",
            "CRITICAL",
            "Isolate the electrical supply and barricade the area. Notify the electrical supervisor.",
        ),
        (
            ["confined space", "gas monitoring"],
            "Confined Space Hazard",
            "CRITICAL",
            "Halt entry immediately. Issue confined space permit and deploy gas monitor.",
        ),
        (
            ["toxic gas", "toxic", "fumes", "ventilation"],
            "Toxic / Gas Hazard",
            "CRITICAL",
            "Evacuate the area immediately. Restore ventilation and conduct air quality testing before re-entry.",
        ),
        (
            ["fuel", "leak", "ignition", "high pressure"],
            "Fire & Explosion Risk",
            "CRITICAL",
            "Isolate the ignition source and fuel supply. Evacuate and deploy fire suppression team.",
        ),
        (
            ["height", "fall", "harness"],
            "Working at Height Hazard",
            "HIGH",
            "Stop work at height. Ensure fall arrest harness is fitted and inspected.",
        ),
        (
            ["fire", "exit", "blocked"],
            "Fire Safety Violation",
            "HIGH",
            "Clear the fire exit immediately and issue a non-conformance notice.",
        ),
    ]

    _DEFAULT = (
        "General Safety Concern",
        "LOW",
        "Issue a standard safety reminder to the team.",
    )

    def __init__(self) -> None:
        super().__init__("Risk Assessor")

    def run(self, incidents: list[Incident]) -> list[Incident]:
        """Classify every incident in the list and return the same list (mutated)."""
        for incident in incidents:
            self._assess(incident)
        return incidents

    def _assess(self, incident: Incident) -> None:
        """Apply keyword rules to a single Incident and set its classification fields."""
        text = incident.report.lower()
        for keywords, hazard_type, risk_level, action in self._RULES:
            if any(kw in text for kw in keywords):
                incident.hazard_type = hazard_type
                incident.risk_level = risk_level
                incident.recommended_action = action
                return

        incident.hazard_type, incident.risk_level, incident.recommended_action = (
            self._DEFAULT
        )


# ---------------------------------------------------------------------------
# 5. ComplianceOfficer — prints the formatted terminal report
# ---------------------------------------------------------------------------


class ComplianceOfficer(HSEAgent):
    """
    Renders a clean, colour-coded terminal report for every assessed Incident.
    """

    def __init__(self) -> None:
        super().__init__("Compliance Officer")

    def run(self, incidents: list[Incident]) -> list[Incident]:
        """Print the full incident report and return the unchanged list."""
        print("=" * 54)
        print("      KAAFI HSSE — SAFETY MEMORY INCIDENT DATABASE     ")
        print(f"      Total incidents loaded: {len(incidents)}")
        print("=" * 54)

        for incident in incidents:
            colour = RISK_COLOUR.get(incident.risk_level, "")
            print(f"\n  INCIDENT ID     : {incident.incident_id}")
            print(f"  ZONE            : {incident.zone}")
            print(f"  REPORTING AGENT : {incident.officer}")
            print(f"  INCIDENT REPORT : {incident.report}")
            print(f"  HAZARD TYPE     : {incident.hazard_type}")
            print(f"  RISK LEVEL      : {colour}{incident.risk_level}{RESET}")
            print(f"  ACTION REQUIRED : {incident.recommended_action}")
            print("  " + "-" * 52)

        print("\n" + "=" * 54)
        print("  END OF REPORT — All incidents processed.")
        print("=" * 54)

        return incidents


# ---------------------------------------------------------------------------
# 6. main — orchestrate the agent pipeline
# ---------------------------------------------------------------------------


def main() -> None:
    """
    Entry point. Runs the three-agent HSE pipeline:
        SafetyInspector  →  RiskAssessor  →  ComplianceOfficer
    """
    inspector = SafetyInspector(filepath=INCIDENTS_FILE)
    assessor = RiskAssessor()
    officer = ComplianceOfficer()

    incidents = inspector.run()      # parse file → list[Incident]
    incidents = assessor.run(incidents)   # classify each incident
    officer.run(incidents)               # print the report


if __name__ == "__main__":
    main()

