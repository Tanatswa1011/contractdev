export type RiskLevel = "low" | "medium" | "high";

export type ContractStatus = "active" | "expired" | "pending" | "draft";

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

export interface Contract {
  id: string;
  name: string;
  vendor: string;
  status: ContractStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  healthLabel: string;
  contractValue: number;
  valuePeriod: "month" | "year" | "total";
  renewalType: RenewalType;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  noticePeriodDays: number;
  nextDeadline: string;
  summary: string;
  aiSummary: string;
  clauses: ClauseType[];
  timelineEvents: TimelineEvent[];
  recentActivities: RecentActivity[];
}

