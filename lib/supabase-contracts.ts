import { supabase } from "@/lib/supabase";
import type { Contract } from "@/types/contract";

export interface DbContract {
  id: string;
  user_id: string;
  name: string;
  vendor: string;
  status: string;
  risk_level: string;
  risk_score: number;
  health_label: string;
  contract_value: number;
  value_period: string;
  renewal_type: string;
  contract_type: string;
  owner: string;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  notice_period_days: number;
  next_deadline: string;
  summary: string;
  ai_summary: string;
  clauses: string[];
  is_reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchContracts(): Promise<DbContract[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch contracts:", error.message);
    return null;
  }
  return data;
}

export async function updateContractReviewed(
  contractId: string,
  isReviewed: boolean
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("contracts")
    .update({ is_reviewed: isReviewed, updated_at: new Date().toISOString() })
    .eq("id", contractId);
  if (error) {
    console.error("Failed to update contract:", error.message);
    return false;
  }
  return true;
}

export async function createContractActivity(
  contractId: string,
  userId: string,
  description: string,
  activityType: string = "general"
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("contract_activities").insert({
    contract_id: contractId,
    user_id: userId,
    description,
    activity_type: activityType,
  });
  if (error) {
    console.error("Failed to create activity:", error.message);
    return false;
  }
  return true;
}
