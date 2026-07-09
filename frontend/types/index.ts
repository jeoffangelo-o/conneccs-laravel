// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'FACULTY' | 'SECRETARY' | 'COORDINATOR' | 'CHAIR' | 'DEAN' | 'VPAA';
  department?: string;
}

// IPCR Types
export interface IPCR {
  id: string;
  facultyId: string;
  facultyName: string;
  period: string;
  year: string;
  status: IPCRStatus;
  currentPhase: string;
  majorFunctions: MajorFunction[];
  finalRating?: number;
  adjectivalRating?: string;
  createdAt: string;
  updatedAt?: string;
}

export type IPCRStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';

export interface MajorFunction {
  id: string;
  title: string;
  category: string;
  weight: number;
  targets: Target[];
}

export interface Target {
  id: string;
  parentOpIndicatorId: string;
  code: string;
  description: string;
  measures: string;
  targetValue: string;
  actualAccomplishments?: string;
  actualValue?: number;
  q1Rating?: number;
  e2Rating?: number;
  t3Rating?: number;
  a4Rating?: number;
  remarks?: string;
  movFileUrls?: string[];
  status?: TargetStatus;
  requiredRatings?: ('Q' | 'E' | 'T')[];
  selfRatingQ?: number;
  selfRatingE?: number;
  selfRatingT?: number;
  selfRatingAvg?: number;
  secretaryQ?: number;
  secretaryE?: number;
  secretaryT?: number;
  secretaryRatingAvg?: number;
  officialQ?: number;
  officialE?: number;
  officialT?: number;
  officialRatingAvg?: number;
  submittedAt?: string;
  isLate?: boolean;
}

export type TargetStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ENDORSED'
  | 'RATED'
  | 'APPROVED'
  | 'RETURNED'
  | 'INCOMPLETE'
  | 'APPROVED_OVERRIDE';

// OPCR Types
export interface OPCR {
  id: string;
  period: string;
  year: string;
  majorFunctions: OPCRMajorFunction[];
  createdAt: string;
}

export interface OPCRMajorFunction {
  id: string;
  title: string;
  category: string;
  weight: number;
  successIndicators: SuccessIndicator[];
}

export interface SuccessIndicator {
  id: string;
  code: string;
  description: string;
  measures: string;
  targetValue: string;
  accountableUnits: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedIpcrId?: string;
  relatedTargetId?: string;
}

export type NotificationType =
  | 'IPCR_SUBMITTED'
  | 'IPCR_ENDORSED'
  | 'IPCR_RATED'
  | 'IPCR_APPROVED'
  | 'IPCR_RETURNED'
  | 'IPCR_INCOMPLETE'
  | 'IPCR_OVERRIDE'
  | 'GENERAL';

// Reportorial Types
export interface ReportorialRequirement {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED';
  createdAt: string;
}

export interface ReportorialFolder {
  id: string;
  requirementId: string;
  name: string;
  submissions: ReportorialSubmission[];
}

export interface ReportorialSubmission {
  id: string;
  folderId: string;
  userId: string;
  userName: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
}

// Calendar Event Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'DEADLINE' | 'MEETING' | 'EVENT';
  color?: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  subject: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalIPCRs: number;
  pendingIPCRs: number;
  approvedIPCRs: number;
  completionRate: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
