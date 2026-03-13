import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export interface WorkspaceSettingsData {
  workspaceName: string;
  notificationChannels: Record<string, boolean>;
  notificationEvents: Record<string, boolean>;
  aiSettings: Record<string, string | boolean>;
  integrations: Record<string, string>;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "Active" | "Invited";
  dateAdded: string;
}

const defaultSettings: WorkspaceSettingsData = {
  workspaceName: "ContractGuardAI",
  notificationChannels: {
    email: true,
    "in-app": true,
    slack: false,
    teams: false
  },
  notificationEvents: {
    expiring: true,
    risk: true,
    uploaded: false,
    renewal: true,
    clause: true
  },
  aiSettings: {
    autoAnalyze: false,
    secureMode: false,
    metadataOnly: false,
    retainHistory: true,
    riskSensitivity: "Medium",
    clauseDepth: "Standard",
    language: "Auto-detect",
    summaryStyle: "Concise"
  },
  integrations: {
    google: "Connected",
    slack: "Not connected",
    zapier: "Not connected",
    webhooks: "Active"
  }
};

async function getClientWithUser() {
  const client = getSupabaseBrowserClient();
  if (!client || !isSupabaseConfigured()) return null;
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export async function loadWorkspaceSettings() {
  const auth = await getClientWithUser();
  if (!auth) return { settings: defaultSettings, source: "local" as const, warning: null };
  const { client, userId } = auth;

  const { data, error } = await client
    .from("workspace_settings")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    return { settings: defaultSettings, source: "local" as const, warning: error.message };
  }

  if (!data) {
    return { settings: defaultSettings, source: "supabase" as const, warning: null };
  }

  return {
    settings: {
      workspaceName: data.workspace_name ?? defaultSettings.workspaceName,
      notificationChannels: data.notification_channels ?? defaultSettings.notificationChannels,
      notificationEvents: data.notification_events ?? defaultSettings.notificationEvents,
      aiSettings: data.ai_settings ?? defaultSettings.aiSettings,
      integrations: data.integrations ?? defaultSettings.integrations
    },
    source: "supabase" as const,
    warning: null
  };
}

export async function saveWorkspaceSettings(settings: WorkspaceSettingsData) {
  const auth = await getClientWithUser();
  if (!auth) return;
  const { client, userId } = auth;
  await client.from("workspace_settings").upsert({
    owner_id: userId,
    workspace_name: settings.workspaceName,
    notification_channels: settings.notificationChannels,
    notification_events: settings.notificationEvents,
    ai_settings: settings.aiSettings,
    integrations: settings.integrations
  });
}

export async function listWorkspaceMembers() {
  const auth = await getClientWithUser();
  if (!auth) {
    return [
      {
        id: "1",
        name: "Workspace owner",
        role: "Admin",
        email: "team@contractguard.ai",
        dateAdded: "2026-03-04",
        status: "Active" as const
      }
    ];
  }
  const { client, userId } = auth;
  const { data } = await client
    .from("workspace_members")
    .select("*")
    .eq("owner_id", userId)
    .order("date_added", { ascending: false });

  return (data ?? []).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    email: member.email,
    status: member.status,
    dateAdded: member.date_added
  })) as WorkspaceMember[];
}

export async function inviteWorkspaceMember(email: string, role = "Member") {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client, userId } = auth;
  const { data } = await client
    .from("workspace_members")
    .insert({
      owner_id: userId,
      email,
      role,
      name: email.split("@")[0],
      status: "Invited",
      date_added: new Date().toISOString()
    })
    .select("*")
    .single();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    email: data.email,
    status: data.status,
    dateAdded: data.date_added
  } as WorkspaceMember;
}
