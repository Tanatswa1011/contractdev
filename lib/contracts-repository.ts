import { Contract, ContractStatus, RenewalType, RiskLevel } from "@/types/contract";
import { contracts as demoContracts } from "@/data/contracts";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type ContractRow = {
  id: string;
  owner_id: string;
  name: string;
  vendor: string;
  status: ContractStatus;
  risk_level: RiskLevel;
  risk_score: number;
  health_label: string;
  contract_value: number;
  value_period: Contract["valuePeriod"];
  renewal_type: RenewalType;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  notice_period_days: number;
  next_deadline: string;
  summary: string;
  ai_summary: string;
  clauses: Contract["clauses"] | null;
  timeline_events: Contract["timelineEvents"] | null;
  recent_activities: Contract["recentActivities"] | null;
  contract_type: string | null;
  owner_name: string | null;
};

export type ContractsSource = "supabase" | "demo";

export interface ContractsLoadResult {
  contracts: Contract[];
  source: ContractsSource;
  warning: string | null;
}

function rowToContract(row: ContractRow): Contract {
  return {
    id: row.id,
    name: row.name,
    vendor: row.vendor,
    status: row.status,
    riskLevel: row.risk_level,
    riskScore: row.risk_score,
    healthLabel: row.health_label,
    contractValue: row.contract_value,
    valuePeriod: row.value_period,
    renewalType: row.renewal_type,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    renewalDate: row.renewal_date ?? undefined,
    noticePeriodDays: row.notice_period_days,
    nextDeadline: row.next_deadline,
    summary: row.summary,
    aiSummary: row.ai_summary,
    clauses: row.clauses ?? [],
    timelineEvents: row.timeline_events ?? [],
    recentActivities: row.recent_activities ?? []
  };
}

function contractToRow(contract: Contract, ownerId: string) {
  return {
    id: contract.id,
    owner_id: ownerId,
    name: contract.name,
    vendor: contract.vendor,
    status: contract.status,
    risk_level: contract.riskLevel,
    risk_score: contract.riskScore,
    health_label: contract.healthLabel,
    contract_value: contract.contractValue,
    value_period: contract.valuePeriod,
    renewal_type: contract.renewalType,
    start_date: contract.startDate,
    end_date: contract.endDate ?? null,
    renewal_date: contract.renewalDate ?? null,
    notice_period_days: contract.noticePeriodDays,
    next_deadline: contract.nextDeadline,
    summary: contract.summary,
    ai_summary: contract.aiSummary,
    clauses: contract.clauses,
    timeline_events: contract.timelineEvents,
    recent_activities: contract.recentActivities
  };
}

async function getClientWithUser() {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return null;
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export async function loadContracts(): Promise<ContractsLoadResult> {
  const auth = await getClientWithUser();
  if (!auth) {
    return { contracts: demoContracts, source: "demo", warning: null };
  }

  const { client } = auth;
  const { data, error } = await client
    .from("contracts")
    .select("*")
    .order("next_deadline", { ascending: true });

  if (error) {
    return { contracts: [], source: "supabase", warning: error.message };
  }

  const mapped = ((data ?? []) as ContractRow[]).map(rowToContract);
  return { contracts: mapped, source: "supabase", warning: null };
}

export async function upsertContract(contract: Contract) {
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client, userId } = auth;
  await client.from("contracts").upsert(contractToRow(contract, userId));
}

export async function bulkArchiveContracts(ids: string[]) {
  if (!ids.length) return;
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client } = auth;
  await client
    .from("contracts")
    .update({ status: "expired" })
    .in("id", ids);
}

export async function bulkAssignOwner(ids: string[], ownerName: string) {
  if (!ids.length) return;
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client } = auth;
  await client
    .from("contracts")
    .update({ owner_name: ownerName })
    .in("id", ids);
}

export async function saveContractReminder(contractId: string, title: string, dueAt: string) {
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client, userId } = auth;
  await client.from("contract_reminders").insert({
    contract_id: contractId,
    owner_id: userId,
    title,
    due_at: dueAt,
    status: "scheduled"
  });
}

export async function saveContractFile(contractId: string, file: File) {
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client, userId } = auth;
  await client.from("contract_files").insert({
    contract_id: contractId,
    owner_id: userId,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type || "application/octet-stream"
  });
}
