import { Contract, ContractStatus, RenewalType, RiskLevel } from "@/types/contract";
import { contracts as demoContracts } from "@/data/contracts";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type ContractRow = {
  id: string;
  workspace_id: string;
  owner_id: string | null;
  created_by: string | null;
  name: string;
  vendor: string;
  status: ContractStatus;
  risk_level: RiskLevel;
  risk_score: number;
  health_label: string | null;
  contract_value: number | null;
  value_period: Contract["valuePeriod"] | null;
  renewal_type: RenewalType | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  notice_period_days: number;
  next_deadline: string | null;
  summary: string | null;
  ai_summary: string | null;
  file_url: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed by contracts_with_urgency view
  days_until_expiry?: number | null;
  days_until_renewal?: number | null;
  in_notice_window?: boolean;
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
    healthLabel: row.health_label ?? "",
    contractValue: row.contract_value ?? 0,
    valuePeriod: row.value_period ?? undefined,
    renewalType: row.renewal_type ?? undefined,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? undefined,
    renewalDate: row.renewal_date ?? undefined,
    noticePeriodDays: row.notice_period_days,
    nextDeadline: row.next_deadline ?? "",
    summary: row.summary ?? "",
    aiSummary: row.ai_summary ?? "",
    fileUrl: row.file_url ?? undefined,
    clauses: [],
    timelineEvents: [],
    recentActivities: []
  };
}

function contractToRow(contract: Partial<Contract>, workspaceId: string, userId: string) {
  return {
    ...(contract.id ? { id: contract.id } : {}),
    workspace_id: workspaceId,
    owner_id: userId,
    created_by: userId,
    name: contract.name ?? "",
    vendor: contract.vendor ?? "",
    status: contract.status ?? "draft",
    risk_level: contract.riskLevel ?? "low",
    risk_score: contract.riskScore ?? 0,
    health_label: contract.healthLabel ?? null,
    contract_value: contract.contractValue ?? null,
    value_period: contract.valuePeriod ?? null,
    renewal_type: contract.renewalType ?? null,
    start_date: contract.startDate ?? null,
    end_date: contract.endDate ?? null,
    renewal_date: contract.renewalDate ?? null,
    notice_period_days: contract.noticePeriodDays ?? 30,
    next_deadline: contract.nextDeadline ?? contract.endDate ?? null,
    summary: contract.summary ?? null,
    ai_summary: contract.aiSummary ?? null,
    file_url: (contract as Contract & { fileUrl?: string }).fileUrl ?? null
  };
}

async function getClientWithUser() {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data } = await client.auth.getUser();
  if (!data.user) return null;

  // Get the user's workspace id
  const { data: memberData } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (!memberData?.workspace_id) return null;

  return { client, userId: data.user.id, workspaceId: memberData.workspace_id as string };
}

export async function loadContracts(): Promise<ContractsLoadResult> {
  const auth = await getClientWithUser();
  if (!auth) {
    return { contracts: demoContracts, source: "demo", warning: null };
  }

  const { client, workspaceId } = auth;
  const { data, error } = await client
    .from("contracts_with_urgency")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("end_date", { ascending: true });

  if (error) {
    // Fall back to plain contracts table if view is unavailable
    const fallback = await client
      .from("contracts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (fallback.error) {
      return { contracts: [], source: "supabase", warning: fallback.error.message };
    }
    const mapped = ((fallback.data ?? []) as ContractRow[]).map(rowToContract);
    return { contracts: mapped, source: "supabase", warning: null };
  }

  const mapped = ((data ?? []) as ContractRow[]).map(rowToContract);
  return { contracts: mapped, source: "supabase", warning: null };
}

export async function loadContractById(id: string): Promise<Contract | null> {
  const auth = await getClientWithUser();
  if (!auth) {
    return demoContracts.find((c) => c.id === id) ?? null;
  }

  const { client } = auth;
  const { data, error } = await client
    .from("contracts_with_urgency")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToContract(data as ContractRow);
}

export async function upsertContract(contract: Partial<Contract>): Promise<{ id: string } | null> {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client, userId, workspaceId } = auth;

  const row = contractToRow(contract, workspaceId, userId);
  const { data, error } = await client
    .from("contracts")
    .upsert(row)
    .select("id")
    .single();

  if (error) {
    console.error("upsertContract error:", error.message);
    return null;
  }
  return data as { id: string };
}

export async function deleteContract(id: string): Promise<boolean> {
  const auth = await getClientWithUser();
  if (!auth) return false;
  const { client } = auth;

  const { error } = await client.from("contracts").delete().eq("id", id);
  if (error) {
    console.error("deleteContract error:", error.message);
    return false;
  }
  return true;
}

export async function bulkArchiveContracts(ids: string[]) {
  if (!ids.length) return;
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client } = auth;
  await client
    .from("contracts")
    .update({ status: "expired", archived_at: new Date().toISOString() })
    .in("id", ids);
}

export async function bulkAssignOwner(ids: string[], ownerName: string) {
  if (!ids.length) return;
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client } = auth;
  // owner_name is not a column; update owner_id by looking up profile by name is complex.
  // For MVP, store the owner display name in health_label or skip.
  // This is a post-MVP enhancement once team member profiles are properly wired.
  void ownerName;
  void ids;
  void client;
}

export async function loadReminders(contractId: string) {
  const auth = await getClientWithUser();
  if (!auth) return [];
  const { client, userId } = auth;

  const { data, error } = await client
    .from("contract_reminders")
    .select("*")
    .eq("contract_id", contractId)
    .eq("user_id", userId)
    .order("due_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function saveContractReminder(contractId: string, title: string, dueAt: string) {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client, userId } = auth;

  const { data, error } = await client
    .from("contract_reminders")
    .insert({
      contract_id: contractId,
      user_id: userId,
      title,
      due_at: dueAt,
      status: "scheduled"
    })
    .select("id")
    .single();

  if (error) {
    console.error("saveContractReminder error:", error.message);
    return null;
  }
  return data as { id: string };
}

export async function deleteReminder(id: string): Promise<boolean> {
  const auth = await getClientWithUser();
  if (!auth) return false;
  const { client } = auth;

  const { error } = await client
    .from("contract_reminders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteReminder error:", error.message);
    return false;
  }
  return true;
}

export async function saveContractFile(contractId: string, file: File, fileUrl?: string) {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client, userId } = auth;

  const { data, error } = await client
    .from("contract_files")
    .insert({
      contract_id: contractId,
      user_id: userId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      file_url: fileUrl ?? null
    })
    .select("id")
    .single();

  if (error) {
    console.error("saveContractFile error:", error.message);
    return null;
  }
  return data as { id: string };
}

export async function uploadContractFile(
  contractId: string,
  file: File
): Promise<{ fileUrl: string | null; error: string | null }> {
  const auth = await getClientWithUser();
  if (!auth) return { fileUrl: null, error: "Not authenticated" };
  const { client, userId } = auth;

  const filePath = `${userId}/${contractId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await client.storage
    .from("contracts")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    console.error("uploadContractFile error:", uploadError.message);
    return { fileUrl: null, error: uploadError.message };
  }

  const { data: urlData } = client.storage
    .from("contracts")
    .getPublicUrl(filePath);

  const fileUrl = urlData?.publicUrl ?? null;

  // Record the file in contract_files table
  await saveContractFile(contractId, file, fileUrl ?? undefined);

  // Update the contract row's file_url to point to the latest file
  await client
    .from("contracts")
    .update({ file_url: fileUrl })
    .eq("id", contractId);

  return { fileUrl, error: null };
}

export async function getDashboardStats(workspaceId?: string) {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client } = auth;
  const wsId = workspaceId ?? auth.workspaceId;

  const { data, error } = await client
    .from("workspace_contract_stats")
    .select("*")
    .eq("workspace_id", wsId)
    .maybeSingle();

  if (error) return null;
  return data as {
    workspace_id: string;
    total_contracts: number;
    active_contracts: number;
    high_risk_contracts: number;
    renewing_in_30_days: number;
    avg_risk_score: number;
  } | null;
}
