export type RiskLevel = "low" | "medium" | "high";

export type ContractStatus =
  | "active"
  | "expired"
  | "pending"
  | "draft"
  | "archived";

export type RenewalType =
  | "auto-renewal"
  | "manual-renewal"
  | "evergreen"
  | "fixed-term";

export type ClauseType =
  | "Renewal"
  | "Termination"
  | "Liability"
  | "Data Processing"
  | "Confidentiality"
  | "SLA";

export type TimelineEventType =
  | "start"
  | "end"
  | "renewal"
  | "notice-window-open"
  | "notice-deadline";

export type WorkspaceRole = "admin" | "member" | "viewer";
export type WorkspaceMemberStatus = "active" | "invited";
export type ReminderStatus = "pending" | "sent";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  label: string;
  isCritical?: boolean;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  relativeTime: string;
}

export interface ContractFile {
  id: string;
  contractId: string;
  filename: string;
  storagePath: string;
  versionNumber: number;
  createdAt: string;
  sizeBytes?: number | null;
  publicUrl?: string | null;
}

export interface ContractReminder {
  id: string;
  contractId: string;
  remindOn: string;
  channel: "email" | "in_app";
  note: string;
  status: ReminderStatus;
  createdAt: string;
}

export interface Contract {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  vendor: string;
  contractType: string;
  owner: string;
  status: ContractStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  healthLabel: string;
  contractValue: number;
  valuePeriod: "month" | "year" | "total";
  renewalType: RenewalType;
  startDate: string;
  endDate?: string | null;
  renewalDate?: string | null;
  noticePeriodDays: number;
  nextDeadline: string;
  summary: string;
  aiSummary: string;
  clauses: ClauseType[] | string[];
  reviewedAt?: string | null;
  archivedAt?: string | null;
  timelineEvents: TimelineEvent[];
  recentActivities: RecentActivity[];
  currentFile?: ContractFile | null;
  reminders?: ContractReminder[];
}

export interface NotificationPreferences {
  channels: Record<string, boolean>;
  events: Record<string, boolean>;
}

export interface AiSettings {
  autoAnalyzeOnUpload: boolean;
  riskSensitivity: "Low" | "Medium" | "High";
  clauseExtractionDepth: "Basic" | "Standard" | "Full";
  languageDetection: "Auto-detect" | "English" | "Other";
  summaryStyle: "Concise" | "Detailed";
  secureAnalysisMode: boolean;
  metadataOnlyStorage: boolean;
  retainAnalysisHistory: boolean;
}

export interface WorkspaceIntegration {
  status: "connected" | "not_connected" | "active";
  note?: string;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending";
}

export interface BillingSnapshot {
  planName: string;
  planStatus: "Active" | "Trial" | "Manual setup required";
  renewalDate: string | null;
  contractsUsed: number;
  contractsLimit: number;
  aiAnalysesUsed: number;
  aiAnalysesLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
  billingEmail: string;
  companyName: string;
  vatId: string;
  invoices: InvoiceRecord[];
}

export interface WorkspaceSettings {
  workspaceId: string;
  notificationPreferences: NotificationPreferences;
  aiSettings: AiSettings;
  integrations: Record<string, WorkspaceIntegration>;
  billingSnapshot: BillingSnapshot;
}

export interface WorkspaceMember {
  id: string;
  userId?: string | null;
  email: string;
  name: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  createdAt: string;
}

export interface WorkspaceProfile {
  id: string;
  fullName: string;
  avatarPath?: string | null;
  avatarUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
}

