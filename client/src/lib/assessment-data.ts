export const assessmentSections = [
  { id: "building-information", name: "Building Information" },
  { id: "site-transport", name: "Site and Transport" },
  { id: "water-efficiency", name: "Water Efficiency" },
  { id: "energy-efficiency", name: "Energy Efficiency" },
  { id: "indoor-quality", name: "Indoor Environmental Quality" },
  { id: "materials-resources", name: "Materials & Resources" },
  { id: "waste-pollution", name: "Waste & Pollution" },
  { id: "innovation", name: "Innovation" },
];

export const sectionVariables: Record<string, Array<{ id: string; name: string; maxScore: number }>> = {
  "site-transport": [
    { id: "protectRestoreHabitat", name: "Protect or Restore Habitat", maxScore: 20 },
    { id: "heatIslandReduction", name: "Heat Island Reduction", maxScore: 18 },
    { id: "landscapingPlanters", name: "Landscaping and Planters", maxScore: 15 },
    { id: "publicTransport", name: "Access to Public Transport", maxScore: 14 },
    { id: "cyclingWalking", name: "Facilities for Cycling or Walking", maxScore: 12 },
  ],
  "water-efficiency": [
    { id: "waterQuality", name: "Water Quality", maxScore: 15 },
    { id: "highEfficiencyFixtures", name: "High Efficiency Water Fixtures", maxScore: 1 },
    { id: "surfaceWaterManagement", name: "Surface Water Management", maxScore: 2 },
    { id: "waterRecycling", name: "Water Recycling", maxScore: 5 },
    { id: "meteringLeakDetection", name: "Metering/Leak Detection", maxScore: 6 },
  ],
  "energy-efficiency": [
    { id: "renewableEnergy", name: "Renewable Energy Use", maxScore: 9 },
    { id: "energyEfficientEquipment", name: "Energy Efficient Equipment", maxScore: 4 },
    { id: "carbonEmissionReduction", name: "Carbon Emission Reduction", maxScore: 10 },
    { id: "coldStorageEfficiency", name: "Cold Storage Efficiency", maxScore: 4 },
    { id: "ventilationAcEfficiency", name: "Ventilation/AC Efficiency", maxScore: 6 },
  ],
  "indoor-quality": [
    { id: "daylighting", name: "Daylighting", maxScore: 2 },
    { id: "indoorAirQuality", name: "Indoor Air Quality", maxScore: 1 },
    { id: "naturalLightingSources", name: "Natural Lighting Sources", maxScore: 2 },
    { id: "acousticPerformance", name: "Acoustic Performance", maxScore: 1 },
  ],
  "materials-resources": [
    { id: "recycledContentMaterials", name: "Recycled Content Materials", maxScore: 4 },
    { id: "lowEmbeddedEnergyMaterials", name: "Low Embedded Energy Materials", maxScore: 5 },
    { id: "locallySourcedMaterials", name: "Locally Sourced Materials", maxScore: 7 },
    { id: "thirdPartyCertifiedMaterials", name: "Third-Party Certified Materials", maxScore: 6 },
  ],
  "waste-pollution": [
    { id: "constructionWasteManagement", name: "Construction Waste Management", maxScore: 14 },
    { id: "operationalWasteManagement", name: "Operational Waste Management", maxScore: 1 },
    { id: "pollutionControl", name: "Pollution Control", maxScore: 2 },
  ],
  "innovation": [
    { id: "innovativeTechnologies", name: "Innovative Technologies", maxScore: 11 },
    { id: "sustainableProducts", name: "Sustainable Products", maxScore: 3 },
    { id: "ecoFriendlyDesigns", name: "Eco-Friendly Designs", maxScore: 7 },
  ],
};
