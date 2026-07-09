import { IPCR, IPCRMajorFunction, IPCRTarget, RatingCalculation, TargetEntryStatus, KRAType } from '../types';

/**
 * CORRECT adjectival rating thresholds per CSPC OPCR spec:
 * 4.500–5.000 = Outstanding
 * 3.500–4.499 = Very Satisfactory
 * 2.500–3.499 = Satisfactory
 * 1.500–2.499 = Unsatisfactory
 * Below 1.500 = Poor
 */
export function getAdjectivalRating(score: number): string {
  if (score >= 4.500) return 'Outstanding';
  if (score >= 3.500) return 'Very Satisfactory';
  if (score >= 2.500) return 'Satisfactory';
  if (score >= 1.500) return 'Unsatisfactory';
  return 'Poor';
}

/**
 * Calculate A4 (Average) from Q, E, T
 * Uses only non-null provided ratings
 * @deprecated Use calculateA4WithRequired instead for accurate rating calculation
 */
export function calculateA4(q: number | null, e: number | null, t: number | null): number {
  const vals = [q, e, t].filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return 0;
  return parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
}

/**
 * Calculate A4 (Average) based on REQUIRED ratings only
 * This is the CORRECT way to calculate ratings per OPCR spec
 * @param target - The IPCR target with rating values
 * @param ratingType - Which rating to use: 'self', 'secretary', or 'dean'
 * @returns Average of only the required ratings
 */
export function calculateA4WithRequired(
  target: IPCRTarget,
  ratingType: 'self' | 'secretary' | 'dean'
): number {
  const requiredRatings = target.requiredRatings || ['Q', 'E', 'T'];
  const ratings: number[] = [];
  
  if (ratingType === 'self') {
    if (requiredRatings.includes('Q') && target.selfRatingQ != null) ratings.push(target.selfRatingQ);
    if (requiredRatings.includes('E') && target.selfRatingE != null) ratings.push(target.selfRatingE);
    if (requiredRatings.includes('T') && target.selfRatingT != null) ratings.push(target.selfRatingT);
  } else if (ratingType === 'secretary') {
    if (requiredRatings.includes('Q') && target.secretaryQ != null) ratings.push(target.secretaryQ);
    if (requiredRatings.includes('E') && target.secretaryE != null) ratings.push(target.secretaryE);
    if (requiredRatings.includes('T') && target.secretaryT != null) ratings.push(target.secretaryT);
  } else if (ratingType === 'dean') {
    if (requiredRatings.includes('Q') && target.deanQ != null) ratings.push(target.deanQ);
    if (requiredRatings.includes('E') && target.deanE != null) ratings.push(target.deanE);
    if (requiredRatings.includes('T') && target.deanT != null) ratings.push(target.deanT);
  }
  
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return parseFloat((sum / ratings.length).toFixed(2));
}

/**
 * Calculate average rating for a major function using APPROVED targets only
 */
function calcMFAverage(mf: IPCRMajorFunction | undefined): number {
  if (!mf || !mf.targets || mf.targets.length === 0) return 0;
  const approvedTargets = mf.targets.filter(t =>
    (t.status === 'APPROVED' || t.status === 'APPROVED_OVERRIDE') && t.officialRatingAvg != null
  );
  if (approvedTargets.length === 0) {
    // Fallback to a4Rating for backward compat
    const rated = mf.targets.filter(t => t.a4Rating && t.a4Rating > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s, t) => s + (t.a4Rating || 0), 0) / rated.length;
  }
  return approvedTargets.reduce((s, t) => s + (t.officialRatingAvg || 0), 0) / approvedTargets.length;
}

/**
 * Compute final IPCR rating from approved targets only
 * Strategic × 45% + Core × 45% + Support × 10%
 */
export function calculateFinalRating(ipcr: IPCR): RatingCalculation {
  const strategic = ipcr.majorFunctions?.find(m => m.category === 'STRATEGIC');
  const core = ipcr.majorFunctions?.find(m => m.category === 'CORE');
  const support = ipcr.majorFunctions?.find(m => m.category === 'SUPPORT');

  const strategicAvg = calcMFAverage(strategic);
  const coreAvg = calcMFAverage(core);
  const supportAvg = calcMFAverage(support);

  const strategicWeighted = strategicAvg * 0.45;
  const coreWeighted = coreAvg * 0.45;
  const supportWeighted = supportAvg * 0.10;

  const final = parseFloat((strategicWeighted + coreWeighted + supportWeighted).toFixed(2));
  const adjectival = getAdjectivalRating(final);

  return { strategicAvg, coreAvg, supportAvg, strategicWeighted, coreWeighted, supportWeighted, final, adjectival };
}

/**
 * Clamp rating value between 1.0 and 5.0
 */
export function clampRating(value: number): number {
  return Math.max(1.0, Math.min(5.0, value));
}

/**
 * Validate rating input: whole number 1–5
 */
export function isValidRating(value: string): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= 1 && num <= 5 && !value.includes('.');
}

/**
 * Count linked IPCRs for an OPCR success indicator
 */
export function countLinkedIPCRs(indicatorId: string, ipcrs: IPCR[]): number {
  let count = 0;
  if (!ipcrs || !Array.isArray(ipcrs)) return 0;
  ipcrs.forEach(ipcr => {
    if (!ipcr?.majorFunctions) return;
    ipcr.majorFunctions.forEach(mf => {
      if (!mf?.targets) return;
      mf.targets.forEach(t => {
        if (t?.parentOpIndicatorId === indicatorId) count++;
      });
    });
  });
  return count;
}

/**
 * Check if a submission is LATE per CSPC deadlines:
 *  - Midyear deadline: July 10
 *  - Year-end deadline: January 10 of following year
 */
export function isSubmissionLate(submittedAt: string, period?: string): boolean {
  const submitted = new Date(submittedAt);
  const year = submitted.getFullYear();
  const month = submitted.getMonth() + 1; // 1-based

  // Midyear: January–June period, deadline July 10
  const midyearDeadline = new Date(year, 6, 10); // July 10
  // Year-end: July–December period, deadline Jan 10 next year
  const yearendDeadline = new Date(year + 1, 0, 10); // Jan 10 next year

  if (!period) {
    // Auto-detect based on month
    if (month <= 7) return submitted > midyearDeadline;
    return submitted > yearendDeadline;
  }

  if (period === 'MIDYEAR') return submitted > midyearDeadline;
  return submitted > yearendDeadline;
}

/**
 * Detect KRA type from major function title / category
 */
export function detectKRAType(mfTitle: string, mfCategory: string): KRAType {
  const title = mfTitle.toLowerCase();
  if (title.includes('research') || title.includes('kra 2')) return 'KRA2';
  if (title.includes('extension') || title.includes('kra 3')) return 'KRA3';
  if (title.includes('instruction') || title.includes('kra 1') || title.includes('teaching')) return 'KRA1';
  if (title.includes('production') || title.includes('kra 4')) return 'KRA4';
  if (title.includes('report')) return 'REPORTORIAL';
  if (mfCategory === 'SUPPORT') return 'SUPPORT';
  return 'STRATEGIC';
}

/**
 * Get required document hints per KRA type
 */
export function getDocumentHints(kraType: KRAType): string[] {
  switch (kraType) {
    case 'KRA1': return ['Table of Specifications (TOS)', 'Grading sheets', 'Syllabus', 'Class program'];
    case 'KRA2': return ['Journal paper / publication', 'Certificate (Scopus/ISI indexing)', 'Citation screenshot'];
    case 'KRA3': return ['Attendance sheet', 'Activity report', 'Evaluation forms', 'MOA/MOU document'];
    case 'KRA4': return ['Production report', 'Commercialization proof'];
    case 'REPORTORIAL': return ['Proof of submission (email / received stamp)'];
    case 'SUPPORT': return ['Attendance records', 'L&D certificate'];
    case 'STRATEGIC': return ['Proof of submission', 'Activity report', 'Supporting documents'];
    default: return ['Supporting documents'];
  }
}

/**
 * Compute self-rating average
 */
export function computeSelfRatingAvg(q?: number | null, e?: number | null, t?: number | null): number {
  return calculateA4(q ?? null, e ?? null, t ?? null);
}

/**
 * Get human-readable description of required ratings
 * @param requiredRatings - Array of required rating types
 * @returns Formatted string describing required ratings
 */
export function getRequiredRatingsDescription(requiredRatings?: ('Q' | 'E' | 'T')[]): string {
  if (!requiredRatings || requiredRatings.length === 0) {
    return 'This target requires: Quality, Efficiency, and Timeliness';
  }
  
  const ratingNames = {
    Q: 'Quality',
    E: 'Efficiency',
    T: 'Timeliness',
  };
  
  const names = requiredRatings.map(r => ratingNames[r]);
  
  if (names.length === 1) {
    return `This target requires: ${names[0]}`;
  } else if (names.length === 2) {
    return `This target requires: ${names[0]} and ${names[1]}`;
  } else {
    return `This target requires: ${names.join(', ')}`;
  }
}

/**
 * Validate that all required ratings are provided
 * @param target - The IPCR target
 * @param ratingType - Which rating to validate
 * @returns Array of missing rating names, empty if all provided
 */
export function validateRequiredRatings(
  target: IPCRTarget,
  ratingType: 'self' | 'secretary' | 'dean'
): string[] {
  const requiredRatings = target.requiredRatings || ['Q', 'E', 'T'];
  const missing: string[] = [];
  
  const ratingNames = {
    Q: 'Quality (Q)',
    E: 'Efficiency (E)',
    T: 'Timeliness (T)',
  };
  
  if (ratingType === 'self') {
    if (requiredRatings.includes('Q') && (target.selfRatingQ == null || target.selfRatingQ === 0)) {
      missing.push(ratingNames.Q);
    }
    if (requiredRatings.includes('E') && (target.selfRatingE == null || target.selfRatingE === 0)) {
      missing.push(ratingNames.E);
    }
    if (requiredRatings.includes('T') && (target.selfRatingT == null || target.selfRatingT === 0)) {
      missing.push(ratingNames.T);
    }
  } else if (ratingType === 'secretary') {
    if (requiredRatings.includes('Q') && (target.secretaryQ == null || target.secretaryQ === 0)) {
      missing.push(ratingNames.Q);
    }
    if (requiredRatings.includes('E') && (target.secretaryE == null || target.secretaryE === 0)) {
      missing.push(ratingNames.E);
    }
    if (requiredRatings.includes('T') && (target.secretaryT == null || target.secretaryT === 0)) {
      missing.push(ratingNames.T);
    }
  } else if (ratingType === 'dean') {
    if (requiredRatings.includes('Q') && (target.deanQ == null || target.deanQ === 0)) {
      missing.push(ratingNames.Q);
    }
    if (requiredRatings.includes('E') && (target.deanE == null || target.deanE === 0)) {
      missing.push(ratingNames.E);
    }
    if (requiredRatings.includes('T') && (target.deanT == null || target.deanT === 0)) {
      missing.push(ratingNames.T);
    }
  }
  
  return missing;
}
