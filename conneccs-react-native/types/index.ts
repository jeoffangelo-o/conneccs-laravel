// ─── USER ROLES ───────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'DEAN' | 'CHAIR' | 'FACULTY' | 'SECRETARY' | 'COORDINATOR';
export type CoordinatorType = 'RESEARCH' | 'EXTENSION' | 'BOTH';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  program?: string;
  position: string;
  initials: string;
  avatarColor: string;
  coordinatorType?: CoordinatorType;
}

// ─── TARGET-LEVEL STATUS (per IPCR entry) ────────────────────────────────────
export type TargetEntryStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ENDORSED'           // Coordinator verified KRA2/KRA3
  | 'INCOMPLETE'         // Secretary flagged missing docs
  | 'RATED'              // Secretary has rated
  | 'RETURNED'           // Dean returned for revision
  | 'APPROVED'           // Dean approved (secretary rating locked)
  | 'APPROVED_OVERRIDE'; // Dean overrode secretary rating

// ─── OVERALL IPCR STATUS ─────────────────────────────────────────────────────
export type IPCROverallStatus =
  | 'IN_PROGRESS'  // some targets submitted, some still pending
  | 'SUBMITTED'    // all targets submitted, awaiting secretary rating
  | 'RATED'        // secretary rated all targets, awaiting Dean
  | 'APPROVED'     // Dean approved all targets, rating computed
  | 'RETURNED'     // Dean returned one or more targets for revision
  | 'FINAL'        // PMT validated, OPCR consolidated
  | 'DELINQUENT';  // zero approved entries by deadline

// Legacy alias kept for backward compatibility
export type IPCRStatus = IPCROverallStatus | 'PENDING_REVIEW' | 'REVISION_REQUIRED' | 'COMPLETED';

export type IPCRPhase = 'TARGET_SETTING' | 'MID_YEAR_REVIEW' | 'TERMINAL_REVIEW' | 'CLOSED';
export type FunctionCategory = 'STRATEGIC' | 'CORE' | 'SUPPORT';
export type PeriodType = 'MIDYEAR' | 'YEAREND';
export type KRAType = 'KRA1' | 'KRA2' | 'KRA3' | 'KRA4' | 'STRATEGIC' | 'SUPPORT' | 'REPORTORIAL';

// ─── OPCR SUCCESS INDICATOR ───────────────────────────────────────────────────
export interface SuccessIndicator {
  id: string;
  code: string;
  description: string;
  measures: string;
  timeline: string;
  targetValue: number;
  actualValue: number;
  percentAccomplished: number;
  accountableUnits: string;
  requiredRatings?: ('Q' | 'E' | 'T')[];
}

export interface MajorFunction {
  id: string;
  title: string;
  category: FunctionCategory;
  weight: number;
  successIndicators: SuccessIndicator[];
}

export interface OPCR {
  id: string;
  year: number;
  period: string;
  officeName: string;
  deanId: string;
  status: string;
  currentPhase: string;
  majorFunctions: MajorFunction[];
}

// ─── IPCR TARGET (per success indicator) ─────────────────────────────────────
export interface IPCRTarget {
  id: string;
  parentOpIndicatorId: string;
  code?: string;
  description: string;
  measures: string;
  targetValue?: number;
  kraType?: KRAType;

  // Status
  status: TargetEntryStatus;
  isLate?: boolean;
  submittedAt?: string;

  // Required ratings for this target
  requiredRatings?: ('Q' | 'E' | 'T')[];

  // Faculty self-rating
  actualAccomplishments: string;
  actualValue?: number;
  selfRatingQ?: number | null;
  selfRatingE?: number | null;
  selfRatingT?: number | null;
  selfRatingAvg?: number | null;

  // Legacy field aliases (kept for backward compat)
  q1Rating?: number | null;
  e2Rating?: number | null;
  t3Rating?: number | null;
  a4Rating?: number | null;

  // Secretary rating
  secretaryQ?: number | null;
  secretaryE?: number | null;
  secretaryT?: number | null;
  secretaryRatingAvg?: number | null;
  secretaryRatedAt?: string;
  secretaryRatedById?: string;
  incompleteNote?: string;

  // Coordinator verification
  coordinatorVerifiedAt?: string;
  coordinatorVerifiedById?: string;
  coordinatorNote?: string;

  // Dean review
  deanQ?: number | null;
  deanE?: number | null;
  deanT?: number | null;
  deanRatingAvg?: number | null;
  deanReviewedAt?: string;
  deanReviewedById?: string;
  deanRemarks?: string;

  // Official / locked rating
  officialQ?: number | null;
  officialE?: number | null;
  officialT?: number | null;
  officialRatingAvg?: number | null;

  // Return tracking
  returnNote?: string;
  returnedBy?: 'SECRETARY' | 'COORDINATOR' | 'DEAN';

  // Documents
  movFileUrls: string[];
  remarks?: string;

  // Document hints (shown to faculty based on KRA type)
  documentsRequired?: string[];
}

// ─── IPCR MAJOR FUNCTION ─────────────────────────────────────────────────────
export interface IPCRMajorFunction {
  id: string;
  title: string;
  category: FunctionCategory;
  weight: number;
  targets: IPCRTarget[];
}

// ─── IPCR (Individual Performance Commitment Review) ─────────────────────────
export interface IPCR {
  id: string;
  year: number;
  period: string;
  targetsPeriod?: PeriodType;
  facultyId: string;
  facultyName: string;
  status: IPCRStatus;
  overallStatus?: IPCROverallStatus;
  currentPhase: IPCRPhase;

  // Dean's IPCR is flagged as external
  isDeanIPCR?: boolean;
  externalVpaaFlag?: boolean;
  submittedToVpaaAt?: string;

  // Delinquency
  isDelinquent?: boolean;

  // Workflow timestamps
  submittedAt?: string;
  secretaryRatedAt?: string;
  deanApprovedAt?: string;

  // Rating output
  finalRating: number | null;
  adjectivalRating: string | null;
  majorFunctions: IPCRMajorFunction[];

  // Reviewer chain
  notedByChairId?: string | null;
  verifiedByVpaa?: string | null;
  approvedByDeanId?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;

  createdAt?: string;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'IPCR_APPROVED'
  | 'IPCR_REVISION'
  | 'IPCR_SUBMITTED'
  | 'IPCR_RATED'
  | 'IPCR_RETURNED'
  | 'IPCR_ENDORSED'
  | 'IPCR_INCOMPLETE'
  | 'IPCR_OVERRIDE'
  | 'DEADLINE_REMINDER'
  | 'REMINDER';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  createdAt: string;
  relatedIpcrId?: string;
  relatedTargetId?: string;
}

// ─── RATING CALCULATION ───────────────────────────────────────────────────────
export interface RatingCalculation {
  strategicAvg: number;
  coreAvg: number;
  supportAvg: number;
  strategicWeighted: number;
  coreWeighted: number;
  supportWeighted: number;
  final: number;
  adjectival: string;
}

// ─── REPORTORIAL REQUIREMENTS ─────────────────────────────────────────────────
export interface ReportorialRequirement {
  id: string;
  no: string;
  requirement: string;
  template: string;
  templateFileUrl?: string; // URL to uploaded template file
  copies: string;
  fileSize: string;
  deadline: string;
  remarks: string;
  staff: string; // Secretary assigned (JO, STEPH, CHEN, VIANNE)
  category: 'REPORTORIAL' | 'OTHER_DOCUMENTS';
  createdAt: string;
  updatedAt?: string;
}

export interface ReportorialSubmission {
  id: string;
  requirementId: string;
  facultyId: string;
  facultyName: string;
  submittedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  qualityRating?: number | null;
  timelinessRating?: number | null;
  accomplishments?: string;
  remarks?: string;
  status: 'SUBMITTED' | 'RATED' | 'RETURNED';
  ratedAt?: string;
  ratedById?: string;
}

export interface ReportorialReminder {
  id: string;
  requirementId: string;
  sentAt: string;
  sentBy: string;
  recipientIds: string[]; // Faculty IDs who haven't submitted
  message: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'ALL';
}

export interface ReportorialReport {
  id: string;
  requirementId: string;
  generatedAt: string;
  generatedBy: string;
  reportType: 'SUBMITTED' | 'NOT_SUBMITTED' | 'SUMMARY';
  facultyList: {
    facultyId: string;
    facultyName: string;
    status: 'SUBMITTED' | 'NOT_SUBMITTED';
    submittedAt?: string;
    qualityRating?: number;
    timelinessRating?: number;
  }[];
}

// ─── MESSAGING SYSTEM ─────────────────────────────────────────────────────────
export interface MessageChannel {
  id: string;
  name: string;
  description?: string;
  type: 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT';
  participantIds: string[];
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
  }[];
  sentAt: string;
  readBy: string[]; // User IDs who have read the message
  isSystemMessage?: boolean; // For automated reportorial reminders
  relatedReportorialId?: string; // Link to reportorial requirement
}
