export const PROVINCIAL_MATRIX = {
  AB: {
    jurisdiction: "Alberta",
    authority: "Occupational Health and Safety Act, Regulation and Code",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  BC: {
    jurisdiction: "British Columbia",
    authority: "Workers Compensation Act and Occupational Health and Safety Regulation",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  MB: {
    jurisdiction: "Manitoba",
    authority: "Workplace Safety and Health Act and Regulation",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  NB: {
    jurisdiction: "New Brunswick",
    authority: "Occupational Health and Safety Act",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  NL: {
    jurisdiction: "Newfoundland and Labrador",
    authority: "Occupational Health and Safety Act and Regulations",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  NS: {
    jurisdiction: "Nova Scotia",
    authority: "Occupational Health and Safety Act",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  NT: {
    jurisdiction: "Northwest Territories",
    authority: "Safety Act and Occupational Health and Safety Regulations",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  NU: {
    jurisdiction: "Nunavut",
    authority: "Safety Act and Occupational Health and Safety Regulations",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  ON: {
    jurisdiction: "Ontario",
    authority: "Occupational Health and Safety Act",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  PE: {
    jurisdiction: "Prince Edward Island",
    authority: "Occupational Health and Safety Act",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  QC: {
    jurisdiction: "Quebec",
    authority: "Act respecting occupational health and safety",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  SK: {
    jurisdiction: "Saskatchewan",
    authority: "Saskatchewan Employment Act and Occupational Health and Safety Regulations",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
  YT: {
    jurisdiction: "Yukon",
    authority: "Occupational Health and Safety Act and Regulations",
    highRiskRequiresPermit: true,
    stopWorkThreshold: 9,
  },
};

export function getProvincialRules(province = "AB") {
  return PROVINCIAL_MATRIX[province] || PROVINCIAL_MATRIX.AB;
}
