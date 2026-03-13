import { supabase } from "@/lib/supabase";

export interface WorkspaceSettings {
  id: string;
  user_id: string;
  workspace_name: string;
  dark_mode: boolean;
  notifications: {
    channels: Record<string, boolean>;
    events: Record<string, boolean>;
  };
  ai_settings: {
    auto_analyze: boolean;
    risk_sensitivity: string;
    clause_extraction: string;
    language_detection: string;
    summary_style: string;
    secure_mode: boolean;
    metadata_only: boolean;
    retain_history: boolean;
  };
}

export async function fetchWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workspace_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const { data: created, error: createError } = await supabase
        .from("workspace_settings")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (createError) {
        console.error("Failed to create settings:", createError.message);
        return null;
      }
      return created;
    }
    console.error("Failed to fetch settings:", error.message);
    return null;
  }
  return data;
}

export async function updateWorkspaceSettings(
  updates: Partial<Omit<WorkspaceSettings, "id" | "user_id">>
): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("workspace_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update settings:", error.message);
    return false;
  }
  return true;
}

export async function updateProfile(
  updates: { display_name?: string; avatar_url?: string }
): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile:", error.message);
    return false;
  }
  return true;
}
