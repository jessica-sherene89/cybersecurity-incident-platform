const Incident = require('../models/Incident');

/**
 * Generate a unique sequential-style Incident ID like INC-2026-0001
 */
const generateIncidentId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INC-${currentYear}-`;

  // Find the latest incident created in the current year
  const latestIncident = await Incident.findOne({
    incidentId: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select('incidentId');

  let nextNumber = 1;

  if (latestIncident && latestIncident.incidentId) {
    const parts = latestIncident.incidentId.split('-');
    if (parts.length === 3) {
      const parsedNum = parseInt(parts[2], 10);
      if (!isNaN(parsedNum)) {
        nextNumber = parsedNum + 1;
      }
    }
  }

  // Format with leading zeros to 4 digits (e.g., 0001, 0012)
  const paddedNumber = String(nextNumber).padStart(4, '0');
  const generatedId = `${prefix}${paddedNumber}`;

  // Double-check uniqueness
  const existing = await Incident.findOne({ incidentId: generatedId });
  if (existing) {
    // If collision occurs due to race condition, append timestamp suffix
    return `${prefix}${paddedNumber}-${Date.now().toString().slice(-3)}`;
  }

  return generatedId;
};

module.exports = { generateIncidentId };
