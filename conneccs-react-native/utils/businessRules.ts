import { User, IPCRTarget, IPCR, KRAType } from '../types';

/**
 * Central business rules enforcement for IPCR workflow
 */

// Deadlines: July 10 for mid-year, January 10 for year-end
export const MIDYEAR_DEADLINE = { month: 6, day: 10 }; // July 10 (month is 0-indexed)
export const YEAREND_DEADLINE = { month: 0, day: 10 }; // January 10

/**
 * Check if Secretary can rate a specific target
 * - Secretary cannot rate their own IPCR
 * - Secretary cannot rate Dean's IPCR
 */
export function canSecretaryRateTarget(
  secretary: User,
  target: IPCRTarget,
  ipcr: IPCR
): boolean {
  // Secretary cannot rate their own IPCR
  if (ipcr.facultyId === secretary.id) {
    return false;
  }

  // Secretary cannot rate Dean's IPCR
  if (ipcr.isDeanIPCR) {
    return false;
  }

  return true;
}

/**
 * Check if faculty can edit a target
 * - Cannot edit if target is APPROVED or APPROVED_OVERRIDE
 */
export function canFacultyEditTarget(user: User, target: IPCRTarget): boolean {
  if (target.status === 'APPROVED' || target.status === 'APPROVED_OVERRIDE') {
    return false;
  }
  return true;
}

/**
 * Determine if a target needs coordinator review based on KRA type
 * - KRA2 (Research) needs Research Coordinator review
 * - KRA3 (Extension) needs Extension Coordinator review
 */
export function needsCoordinatorReview(target: IPCRTarget): boolean {
  return target.kraType === 'KRA2' || target.kraType === 'KRA3';
}

/**
 * Check if target submission is late based on period deadline
 */
export function isTargetSubmissionLate(
  submittedAt: string,
  period: 'MIDYEAR' | 'YEAREND'
): boolean {
  const submissionDate = new Date(submittedAt);
  const year = submissionDate.getFullYear();
  
  let deadline: Date;
  if (period === 'MIDYEAR') {
    deadline = new Date(year, MIDYEAR_DEADLINE.month, MIDYEAR_DEADLINE.day);
  } else {
    // Year-end deadline is in January of the following year
    deadline = new Date(year + 1, YEAREND_DEADLINE.month, YEAREND_DEADLINE.day);
  }
  
  return submissionDate > deadline;
}

/**
 * Check if IPCR is delinquent (zero approved entries by deadline)
 */
export function isIPCRDelinquent(ipcr: IPCR, deadline: Date): boolean {
  const now = new Date();
  if (now <= deadline) {
    return false; // Not past deadline yet
  }

  // Check if any targets are approved
  const hasApprovedTargets = ipcr.majorFunctions.some(mf =>
    mf.targets.some(
      t => t.status === 'APPROVED' || t.status === 'APPROVED_OVERRIDE'
    )
  );

  return !hasApprovedTargets;
}

/**
 * Determine KRA type from target description and major function title
 */
export function getTargetKRAType(
  target: IPCRTarget,
  majorFunctionTitle: string
): KRAType {
  // If already set, return it
  if (target.kraType) {
    return target.kraType;
  }

  const title = majorFunctionTitle.toLowerCase();
  const description = target.description.toLowerCase();

  // KRA 1: Instruction/Teaching
  if (
    title.includes('instruction') ||
    title.includes('teaching') ||
    description.includes('teaching') ||
    description.includes('class')
  ) {
    return 'KRA1';
  }

  // KRA 2: Research
  if (
    title.includes('research') ||
    description.includes('research') ||
    description.includes('publication') ||
    description.includes('journal')
  ) {
    return 'KRA2';
  }

  // KRA 3: Extension
  if (
    title.includes('extension') ||
    title.includes('community') ||
    description.includes('extension') ||
    description.includes('community engagement')
  ) {
    return 'KRA3';
  }

  // KRA 4: Production
  if (
    title.includes('production') ||
    description.includes('production')
  ) {
    return 'KRA4';
  }

  // Strategic functions
  if (title.includes('strategic')) {
    return 'STRATEGIC';
  }

  // Support functions
  if (title.includes('support')) {
    return 'SUPPORT';
  }

  // Default to SUPPORT for unclassified
  return 'SUPPORT';
}

/**
 * Get document requirements based on KRA type
 */
export function getDocumentRequirements(kraType: KRAType): string[] {
  switch (kraType) {
    case 'KRA1':
      return [
        'Class syllabus',
        'Lesson plans',
        'Student evaluation results',
        'Grade sheets',
      ];
    case 'KRA2':
      return [
        'Published journal article',
        'Research certificate',
        'Citation proof',
        'Conference presentation certificate',
      ];
    case 'KRA3':
      return [
        'Extension activity report',
        'Attendance sheet',
        'MOA/MOU document',
        'Activity photos',
        'Certificate of participation',
      ];
    case 'KRA4':
      return [
        'Production output',
        'Certificate of completion',
        'Product documentation',
      ];
    case 'STRATEGIC':
      return [
        'Strategic plan document',
        'Implementation report',
        'Meeting minutes',
      ];
    case 'SUPPORT':
      return [
        'Activity report',
        'Supporting documents',
        'Completion certificate',
      ];
    default:
      return ['Supporting documents'];
  }
}

/**
 * Check if coordinator can review a target based on their type
 */
export function canCoordinatorReviewTarget(
  coordinator: User,
  target: IPCRTarget
): boolean {
  if (coordinator.role !== 'COORDINATOR') {
    return false;
  }

  const coordinatorType = coordinator.coordinatorType;
  const kraType = target.kraType;

  if (kraType === 'KRA2' && coordinatorType === 'RESEARCH') {
    return true;
  }

  if (kraType === 'KRA3' && coordinatorType === 'EXTENSION') {
    return true;
  }

  if (coordinatorType === 'BOTH') {
    return kraType === 'KRA2' || kraType === 'KRA3';
  }

  return false;
}

/**
 * Get the next deadline based on current date
 */
export function getNextDeadline(): { date: Date; period: 'MIDYEAR' | 'YEAREND' } {
  const now = new Date();
  const year = now.getFullYear();
  
  const midyearDeadline = new Date(year, MIDYEAR_DEADLINE.month, MIDYEAR_DEADLINE.day);
  const yearendDeadline = new Date(year + 1, YEAREND_DEADLINE.month, YEAREND_DEADLINE.day);
  
  if (now < midyearDeadline) {
    return { date: midyearDeadline, period: 'MIDYEAR' };
  } else {
    return { date: yearendDeadline, period: 'YEAREND' };
  }
}

/**
 * Calculate days until deadline
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get all faculty users (FACULTY, CHAIR, COORDINATOR roles)
 * This is the single source of truth for determining who counts as "faculty"
 */
export function getFacultyUsers(users: User[]): User[] {
  return users.filter(
    (u: User) => u.role === 'FACULTY' || u.role === 'CHAIR' || u.role === 'COORDINATOR'
  );
}

/**
 * Get total faculty count from users array
 */
export function getTotalFacultyCount(users: User[]): number {
  return getFacultyUsers(users).length;
}
