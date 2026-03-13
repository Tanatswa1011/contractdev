import {
  AiSettings,
  BillingSnapshot,
  Contract,
  NotificationPreferences,
  WorkspaceIntegration,
  WorkspaceSettings,
} from "@/types/contract";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    email: true,
    "in-app": true,
    slack: false,
    teams: false,
    whatsapp: false,
    sms: false,
  },
  events: {
    expiring: true,
    risk: true,
    uploaded: true,
    renewal: true,
    clause: true,
  },
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  autoAnalyzeOnUpload: true,
  riskSensitivity: "Medium",
  clauseExtractionDepth: "Standard",
  languageDetection: "Auto-detect",
  summaryStyle: "Concise",
  secureAnalysisMode: false,
  metadataOnlyStorage: false,
  retainAnalysisHistory: true,
};

export const DEFAULT_INTEGRATIONS: Record<string, WorkspaceIntegration> = {
  google: {
    status: "connected",
    note: "Calendar sync is enabled for reminder dates.",
  },
  slack: {
    status: "not_connected",
    note: "Connect Slack when you are ready to route alerts to a channel.",
  },
  zapier: {
    status: "not_connected",
    note: "Zapier is available for workflow automation after API setup.",
  },
  webhooks: {
    status: "active",
    note: "Webhook events can be configured after manual endpoint setup.",
  },
};

export const DEFAULT_BILLING_SNAPSHOT: BillingSnapshot = {
  planName: "Pro",
  planStatus: "Manual setup required",
  renewalDate: null,
  contractsUsed: 0,
  contractsLimit: 100,
  aiAnalysesUsed: 0,
  aiAnalysesLimit: 200,
  storageUsedGb: 0,
  storageLimitGb: 10,
  billingEmail: "",
  companyName: "",
  vatId: "",
  invoices: [],
};

export function defaultWorkspaceSettings(workspaceId: string): WorkspaceSettings {
  return {
    workspaceId,
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    aiSettings: DEFAULT_AI_SETTINGS,
    integrations: DEFAULT_INTEGRATIONS,
    billingSnapshot: DEFAULT_BILLING_SNAPSHOT,
  };
}

export function slugifyContractName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function getRiskLevelFromScore(score: number): Contract["riskLevel"] {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function getHealthLabel(score: number) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High exposure";
  if (score >= 45) return "Watchlist";
  if (score >= 25) return "Moderate risk";
  return "Healthy";
}

export function getRelativeTime(timestamp: string) {
  const target = new Date(timestamp).getTime();
  const now = Date.now();
  const deltaSeconds = Math.max(1, Math.floor((now - target) / 1000));

  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  const deltaWeeks = Math.floor(deltaDays / 7);
  if (deltaWeeks < 5) return `${deltaWeeks}w ago`;

  const deltaMonths = Math.floor(deltaDays / 30);
  if (deltaMonths < 12) return `${deltaMonths}mo ago`;

  const deltaYears = Math.floor(deltaDays / 365);
  return `${deltaYears}y ago`;
}

export function createDownload(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportContractsCsv(contracts: Contract[]) {
  const rows = [
    [
      "Name",
      "Vendor",
      "Type",
      "Status",
      "Risk",
      "Risk score",
      "Owner",
      "Renewal date",
      "Next deadline",
    ],
    ...contracts.map((contract) => [
      contract.name,
      contract.vendor,
      contract.contractType,
      contract.status,
      contract.riskLevel,
      String(contract.riskScore),
      contract.owner,
      contract.renewalDate ?? "",
      contract.nextDeadline,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  createDownload("contracts-export.csv", csv, "text/csv;charset=utf-8");
}
