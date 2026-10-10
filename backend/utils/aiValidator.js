const { isValidUuid, UUID_REGEX } = require("./errors");

function validateAiDiagnosis(candidate, { validConceptIds = [], validEvidenceIds = [] }) {
  const errors = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    errors.push("candidate must be a non-null object");
    return { ok: false, errors };
  }

  // suspected_concept
  if (typeof candidate.suspected_concept !== "string" || !isValidUuid(candidate.suspected_concept)) {
    errors.push("suspected_concept must be a valid UUID string");
  } else if (!validConceptIds.includes(candidate.suspected_concept)) {
    errors.push("suspected_concept is not in validConceptIds");
  }

  // confidence
  if (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence)) {
    errors.push("confidence must be a finite number");
  } else if (candidate.confidence < 0 || candidate.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  // reason
  if (typeof candidate.reason !== "string" || candidate.reason.trim().length < 10) {
    errors.push("reason must be a non-empty string with at least 10 characters");
  }

  // Low-confidence must explain the data gap (honest reporting).
  // Evaluate only when confidence is a valid number AND reason is a
  // string, so malformed inputs don't cascade into this rule.
  if (
    typeof candidate.confidence === "number" &&
    Number.isFinite(candidate.confidence) &&
    candidate.confidence < 0.5 &&
    typeof candidate.reason === "string"
  ) {
    const lower = candidate.reason.toLowerCase();
    const hasGapKeyword = ["insufficient", "uncertain", "data gap", "limited"].some((kw) =>
      lower.includes(kw)
    );
    if (!hasGapKeyword) {
      errors.push("reason must explain the data gap when confidence < 0.5");
    }
  }

  // reference_evidence_ids
  if (!Array.isArray(candidate.reference_evidence_ids) || candidate.reference_evidence_ids.length === 0) {
    errors.push("reference_evidence_ids must be a non-empty array");
  } else {
    for (const id of candidate.reference_evidence_ids) {
      if (typeof id !== "string" || !isValidUuid(id)) {
        errors.push(`reference_evidence_ids contains invalid UUID: ${id}`);
      } else if (!validEvidenceIds.includes(id)) {
        errors.push(`reference_evidence_ids contains unknown evidence id: ${id}`);
      }
    }
  }
  // reason must cite at least one reference_evidence_ids entry (only if array valid)
  const evidenceIds = candidate.reference_evidence_ids || [];
  const arrayValid = Array.isArray(candidate.reference_evidence_ids) && evidenceIds.length > 0 && !evidenceIds.some(id => typeof id !== "string" || !isValidUuid(id) || !validEvidenceIds.includes(id));
  if (arrayValid && typeof candidate.reason === "string") {
    const hasCite = evidenceIds.some(id => candidate.reason.includes(id));
    if (!hasCite) {
      errors.push("reason must cite at least one reference_evidence_ids entry");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const value = {
    suspected_concept: candidate.suspected_concept,
    confidence: candidate.confidence,
    reason: candidate.reason,
    reference_evidence_ids: candidate.reference_evidence_ids,
  };
  return { ok: true, value };
}

module.exports = { validateAiDiagnosis, UUID_REGEX };
