import { addDays, addMonths } from "date-fns";
import { Contract } from "@/types/contract";

const today = new Date();

function iso(date: Date) {
  return date.toISOString();
}

export const contracts: Contract[] = [
  {
    id: "aws",
    name: "AWS Cloud Infrastructure Agreement",
    vendor: "Amazon Web Services",
    status: "active",
    riskLevel: "medium",
    riskScore: 72,
    healthLabel: "Moderate risk",
    contractValue: 240_000,
    valuePeriod: "year",
    renewalType: "auto-renewal",
    startDate: iso(addMonths(today, -18)),
    endDate: iso(addMonths(today, 6)),
    renewalDate: iso(addMonths(today, 6)),
    noticePeriodDays: 90,
    nextDeadline: iso(addDays(today, 45)),
    summary:
      "Core infrastructure agreement covering compute, storage, and networking workloads in production regions.",
    aiSummary:
      "This AWS agreement underpins mission-critical infrastructure with a 12‑month auto-renewal. The primary exposure is a 90‑day notice window and broad service credits as sole remedy for SLA breaches.",
    clauses: ["Renewal", "Termination", "Liability", "Data Processing", "SLA"],
    timelineEvents: [
      {
        id: "aws-start",
        type: "start",
        date: iso(addMonths(today, -18)),
        label: "Initial term start"
      },
      {
        id: "aws-notice-open",
        type: "notice-window-open",
        date: iso(addDays(addMonths(today, 6), -90)),
        label: "Notice window opens"
      },
      {
        id: "aws-notice-deadline",
        type: "notice-deadline",
        date: iso(addDays(addMonths(today, 6), -1)),
        label: "Non-renewal deadline",
        isCritical: true
      },
      {
        id: "aws-renewal",
        type: "renewal",
        date: iso(addMonths(today, 6)),
        label: "Auto-renewal"
      }
    ],
    recentActivities: [
      {
        id: "aws-1",
        description: "Contract updated — added new production region",
        timestamp: iso(addDays(today, -1)),
        relativeTime: "1d ago"
      },
      {
        id: "aws-2",
        description: "Risk review completed by legal",
        timestamp: iso(addDays(today, -3)),
        relativeTime: "3d ago"
      }
    ]
  },
  {
    id: "slack",
    name: "Slack Business+ Subscription",
    vendor: "Slack Technologies",
    status: "active",
    riskLevel: "low",
    riskScore: 28,
    healthLabel: "Healthy",
    contractValue: 48_000,
    valuePeriod: "year",
    renewalType: "auto-renewal",
    startDate: iso(addMonths(today, -10)),
    endDate: iso(addMonths(today, 2)),
    renewalDate: iso(addMonths(today, 2)),
    noticePeriodDays: 30,
    nextDeadline: iso(addDays(today, 21)),
    summary:
      "Messaging and collaboration platform for internal teams with enhanced compliance features.",
    aiSummary:
      "Slack is a standard SaaS subscription with favorable termination rights and a short, manageable notice window. Overall portfolio risk contribution is low.",
    clauses: ["Renewal", "Termination", "Data Processing", "Confidentiality"],
    timelineEvents: [
      {
        id: "slack-start",
        type: "start",
        date: iso(addMonths(today, -10)),
        label: "Initial term start"
      },
      {
        id: "slack-notice-open",
        type: "notice-window-open",
        date: iso(addDays(addMonths(today, 2), -30)),
        label: "Notice window opens"
      },
      {
        id: "slack-renewal",
        type: "renewal",
        date: iso(addMonths(today, 2)),
        label: "Renewal"
      }
    ],
    recentActivities: [
      {
        id: "slack-1",
        description: "Renewal reminder scheduled — Slack Business+",
        timestamp: iso(addDays(today, -0)),
        relativeTime: "2m ago"
      }
    ]
  },
  {
    id: "m365",
    name: "Microsoft 365 Enterprise",
    vendor: "Microsoft",
    status: "active",
    riskLevel: "low",
    riskScore: 34,
    healthLabel: "Healthy",
    contractValue: 180_000,
    valuePeriod: "year",
    renewalType: "manual-renewal",
    startDate: iso(addMonths(today, -11)),
    endDate: iso(addMonths(today, 1)),
    renewalDate: iso(addMonths(today, 1)),
    noticePeriodDays: 60,
    nextDeadline: iso(addDays(today, 60)),
    summary:
      "Productivity suite covering email, collaboration, and endpoint security for all employees.",
    aiSummary:
      "M365 is a large annual commitment with standard audit and data processing terms. Renewal is manual, reducing auto-renewal risk but requiring close coordination with IT and finance.",
    clauses: ["Renewal", "Data Processing", "Liability", "Confidentiality"],
    timelineEvents: [
      {
        id: "m365-start",
        type: "start",
        date: iso(addMonths(today, -11)),
        label: "Initial term start"
      },
      {
        id: "m365-notice-open",
        type: "notice-window-open",
        date: iso(addDays(addMonths(today, 1), -60)),
        label: "Budget review window"
      },
      {
        id: "m365-end",
        type: "end",
        date: iso(addMonths(today, 1)),
        label: "Term end"
      }
    ],
    recentActivities: [
      {
        id: "m365-1",
        description: "Security reviewed updated DPA",
        timestamp: iso(addDays(today, -5)),
        relativeTime: "This week"
      }
    ]
  },
  {
    id: "office-lease",
    name: "HQ Office Lease Agreement",
    vendor: "Downtown Properties LLC",
    status: "active",
    riskLevel: "high",
    riskScore: 89,
    healthLabel: "High exposure",
    contractValue: 1_200_000,
    valuePeriod: "year",
    renewalType: "fixed-term",
    startDate: iso(addMonths(today, -30)),
    endDate: iso(addMonths(today, 3)),
    renewalDate: iso(addMonths(today, 3)),
    noticePeriodDays: 180,
    nextDeadline: iso(addDays(today, 10)),
    summary:
      "Long-term commercial lease for headquarters with strict restoration and holdover clauses.",
    aiSummary:
      "The HQ lease poses significant financial exposure with a long notice period and punitive holdover fees. Missing the upcoming notice date could lock the company into an additional multi‑year term.",
    clauses: ["Renewal", "Termination", "Liability"],
    timelineEvents: [
      {
        id: "lease-start",
        type: "start",
        date: iso(addMonths(today, -30)),
        label: "Lease start"
      },
      {
        id: "lease-notice-deadline",
        type: "notice-deadline",
        date: iso(addDays(today, 10)),
        label: "Non-renewal deadline",
        isCritical: true
      },
      {
        id: "lease-end",
        type: "end",
        date: iso(addMonths(today, 3)),
        label: "Lease end"
      }
    ],
    recentActivities: [
      {
        id: "lease-1",
        description: "Office lease marked for executive review",
        timestamp: iso(addDays(today, -0)),
        relativeTime: "1h ago"
      }
    ]
  },
  {
    id: "hubspot",
    name: "HubSpot Annual Plan",
    vendor: "HubSpot",
    status: "active",
    riskLevel: "medium",
    riskScore: 61,
    healthLabel: "Watchlist",
    contractValue: 90_000,
    valuePeriod: "year",
    renewalType: "auto-renewal",
    startDate: iso(addMonths(today, -5)),
    endDate: iso(addMonths(today, 7)),
    renewalDate: iso(addMonths(today, 7)),
    noticePeriodDays: 45,
    nextDeadline: iso(addDays(today, 75)),
    summary:
      "Marketing automation platform used by sales and growth teams for campaigns and CRM.",
    aiSummary:
      "HubSpot has an auto‑renewal structure with uplifts tied to usage tiers. Key risk is spend creep rather than legal exposure.",
    clauses: ["Renewal", "Data Processing", "SLA"],
    timelineEvents: [
      {
        id: "hubspot-start",
        type: "start",
        date: iso(addMonths(today, -5)),
        label: "Initial term start"
      },
      {
        id: "hubspot-renewal",
        type: "renewal",
        date: iso(addMonths(today, 7)),
        label: "Renewal"
      }
    ],
    recentActivities: [
      {
        id: "hubspot-1",
        description: "Usage exceeded MQL threshold — flagged for pricing review",
        timestamp: iso(addDays(today, -2)),
        relativeTime: "2d ago"
      }
    ]
  },
  {
    id: "notion",
    name: "Notion Enterprise Workspace",
    vendor: "Notion Labs",
    status: "active",
    riskLevel: "low",
    riskScore: 23,
    healthLabel: "Healthy",
    contractValue: 36_000,
    valuePeriod: "year",
    renewalType: "evergreen",
    startDate: iso(addMonths(today, -8)),
    endDate: undefined,
    renewalDate: undefined,
    noticePeriodDays: 30,
    nextDeadline: iso(addDays(today, 90)),
    summary:
      "Knowledge management and documentation platform with SSO and advanced security controls.",
    aiSummary:
      "Notion operates on an evergreen basis with flexible seat-based pricing. Legal risk is low; primary focus is data residency and access controls.",
    clauses: ["Data Processing", "Confidentiality", "SLA"],
    timelineEvents: [
      {
        id: "notion-start",
        type: "start",
        date: iso(addMonths(today, -8)),
        label: "Workspace created"
      }
    ],
    recentActivities: [
      {
        id: "notion-1",
        description: "DPA countersigned and stored in ContractGuardAI",
        timestamp: iso(addDays(today, -4)),
        relativeTime: "This week"
      }
    ]
  },
  {
    id: "payroll",
    name: "Global Payroll Services Agreement",
    vendor: "RemotePay International",
    status: "active",
    riskLevel: "high",
    riskScore: 94,
    healthLabel: "Critical",
    contractValue: 600_000,
    valuePeriod: "year",
    renewalType: "auto-renewal",
    startDate: iso(addMonths(today, -24)),
    endDate: iso(addMonths(today, 1)),
    renewalDate: iso(addMonths(today, 1)),
    noticePeriodDays: 120,
    nextDeadline: iso(addDays(today, 5)),
    summary:
      "Cross-border payroll, tax, and compliance services for global employees and contractors.",
    aiSummary:
      "This payroll agreement is business‑critical with stringent SLAs and broad indemnities. The upcoming notice deadline is high risk: missing it could extend the term despite open service quality issues.",
    clauses: ["Renewal", "Termination", "Liability", "Data Processing", "SLA"],
    timelineEvents: [
      {
        id: "payroll-start",
        type: "start",
        date: iso(addMonths(today, -24)),
        label: "Initial term start"
      },
      {
        id: "payroll-notice-deadline",
        type: "notice-deadline",
        date: iso(addDays(today, 5)),
        label: "Notice deadline",
        isCritical: true
      },
      {
        id: "payroll-renewal",
        type: "renewal",
        date: iso(addMonths(today, 1)),
        label: "Auto-renewal"
      }
    ],
    recentActivities: [
      {
        id: "payroll-1",
        description: "Incident logged — late payroll in EU region",
        timestamp: iso(addDays(today, -0)),
        relativeTime: "2m ago"
      },
      {
        id: "payroll-2",
        description: "Executive escalation created for renewal decision",
        timestamp: iso(addDays(today, -0)),
        relativeTime: "30m ago"
      }
    ]
  }
];

export const immediateAttentionContract = contracts.find(
  (c) => c.id === "payroll"
)!;

