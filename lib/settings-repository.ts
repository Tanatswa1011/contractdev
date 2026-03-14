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
  workspaceName: "My Workspace",
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
    google: "Not connected",
    slack: "Not connected",
    zapier: "Not connected",
    webhooks: "Not connected"
  }
};

async function getClientWithUser() {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { client, userId: data.user.id };
}

export async function loadWorkspaceSettings() {
  const auth = await getClientWithUser();
  if (!auth) return { settings: defaultSettings, source: "local" as const, warning: null };
  const { client, userId } = auth;

  // Also load the workspace name from the workspaces table
  const [settingsResult, workspaceResult] = await Promise.all([
    client
      .from("workspace_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("workspaces")
      .select("name")
      .eq("owner_id", userId)
      .maybeSingle()
  ]);

  if (settingsResult.error) {
    return { settings: defaultSettings, source: "local" as const, warning: settingsResult.error.message };
  }

  const data = settingsResult.data;
  const workspaceName =
    workspaceResult.data?.name ?? data?.workspace_name ?? defaultSettings.workspaceName;

  if (!data) {
    return {
      settings: { ...defaultSettings, workspaceName },
      source: "supabase" as const,
      warning: null
    };
  }

  return {
    settings: {
      workspaceName,
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

  // Save settings row
  await client.from("workspace_settings").upsert({
    user_id: userId,
    workspace_name: settings.workspaceName,
    notification_channels: settings.notificationChannels,
    notification_events: settings.notificationEvents,
    ai_settings: settings.aiSettings,
    integrations: settings.integrations
  });

  // Also update the workspaces table name
  await client
    .from("workspaces")
    .update({ name: settings.workspaceName })
    .eq("owner_id", userId);
}

export async function listWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const auth = await getClientWithUser();
  if (!auth) {
    return [
      {
        id: "demo",
        name: "Workspace owner",
        role: "Admin",
        email: "you@example.com",
        dateAdded: new Date().toISOString().split("T")[0],
        status: "Active" as const
      }
    ];
  }
  const { client, userId } = auth;

  // Get the user's workspace first
  const { data: wsData } = await client
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!wsData?.id) return [];

  const { data } = await client
    .from("workspace_members")
    .select("id, user_id, role, invited_at, joined_at, profiles(email, full_name)")
    .eq("workspace_id", wsData.id)
    .order("invited_at", { ascending: false });

  return ((data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    role: string;
    invited_at: string;
    joined_at: string | null;
    profiles: { email: string; full_name: string | null } | null;
  }>).map((member) => ({
    id: member.id,
    name: member.profiles?.full_name ?? member.profiles?.email?.split("@")[0] ?? "Unknown",
    role: member.role.charAt(0).toUpperCase() + member.role.slice(1),
    email: member.profiles?.email ?? "",
    status: member.joined_at ? ("Active" as const) : ("Invited" as const),
    dateAdded: member.invited_at.split("T")[0]
  }));
}

export async function inviteWorkspaceMember(email: string, role = "member"): Promise<WorkspaceMember | null> {
  const auth = await getClientWithUser();
  if (!auth) return null;
  const { client, userId } = auth;

  // Get workspace id
  const { data: wsData } = await client
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!wsData?.id) return null;

  // Find the profile for the given email
  const { data: profileData } = await client
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!profileData) return null;

  const { data, error } = await client
    .from("workspace_members")
    .insert({
      workspace_id: wsData.id,
      user_id: profileData.id,
      role
    })
    .select("id, user_id, role, invited_at")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: profileData.full_name ?? profileData.email.split("@")[0],
    role: data.role.charAt(0).toUpperCase() + data.role.slice(1),
    email: profileData.email,
    status: "Invited" as const,
    dateAdded: data.invited_at.split("T")[0]
  };
}
