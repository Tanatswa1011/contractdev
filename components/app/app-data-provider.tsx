"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  defaultWorkspaceSettings,
  getHealthLabel,
  getRelativeTime,
  getRiskLevelFromScore,
  slugifyContractName,
} from "@/lib/app-data";
import type {
  AiSettings,
  Contract,
  ContractFile,
  ContractReminder,
  NotificationPreferences,
  RecentActivity,
  TimelineEvent,
  Workspace,
  WorkspaceMember,
  WorkspaceProfile,
  WorkspaceSettings,
} from "@/types/contract";

interface CreateContractInput {
  name: string;
  vendor: string;
  contractType: string;
  owner: string;
  contractValue: number;
  valuePeriod: Contract["valuePeriod"];
  renewalType: Contract["renewalType"];
  startDate: string;
  renewalDate?: string | null;
  nextDeadline: string;
  noticePeriodDays: number;
  summary: string;
  clauses: string[];
  file?: File | null;
}

interface InviteMemberInput {
  email: string;
  role: WorkspaceMember["role"];
}

interface SaveGeneralSettingsInput {
  fullName: string;
  workspaceName: string;
  avatarFile?: File | null;
}

interface SaveBillingInfoInput {
  billingEmail: string;
  companyName: string;
  vatId: string;
}

interface AppDataContextValue {
  isReady: boolean;
  isRefreshing: boolean;
  workspace: Workspace | null;
  profile: WorkspaceProfile | null;
  settings: WorkspaceSettings | null;
  members: WorkspaceMember[];
  contracts: Contract[];
  refresh: () => Promise<void>;
  saveGeneralSettings: (input: SaveGeneralSettingsInput) => Promise<void>;
  saveNotificationSettings: (
    preferences: NotificationPreferences
  ) => Promise<void>;
  saveAiSettings: (settings: AiSettings) => Promise<void>;
  saveBillingInfo: (input: SaveBillingInfoInput) => Promise<void>;
  toggleIntegration: (integrationId: string) => Promise<void>;
  inviteMember: (input: InviteMemberInput) => Promise<void>;
  createContract: (input: CreateContractInput) => Promise<Contract>;
  uploadContractVersion: (contractId: string, file: File) => Promise<void>;
  createReminder: (contractIds: string[]) => Promise<void>;
  markContractReviewed: (contractId: string, reviewed: boolean) => Promise<void>;
  assignOwner: (contractIds: string[], owner: string) => Promise<void>;
  archiveContracts: (contractIds: string[]) => Promise<void>;
  deleteAllContractData: () => Promise<void>;
}

interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  display_name: string | null;
  role: WorkspaceMember["role"];
  status: WorkspaceMember["status"];
  created_at: string;
}

interface WorkspaceRow {
  id: string;
  name: string;
  created_by: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_path: string | null;
}

interface WorkspaceSettingsRow {
  workspace_id: string;
  notification_preferences: NotificationPreferences | null;
  ai_settings: AiSettings | null;
  integrations: WorkspaceSettings["integrations"] | null;
  billing_snapshot: WorkspaceSettings["billingSnapshot"] | null;
}

interface ContractRow {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  vendor: string;
  contract_type: string | null;
  owner_label: string | null;
  status: Contract["status"];
  risk_level: Contract["riskLevel"];
  risk_score: number;
  health_label: string | null;
  contract_value: number | null;
  value_period: Contract["valuePeriod"];
  renewal_type: Contract["renewalType"];
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  notice_period_days: number | null;
  next_deadline: string;
  summary: string | null;
  ai_summary: string | null;
  clauses: string[] | null;
  reviewed_at: string | null;
  archived_at: string | null;
}

interface ContractFileRow {
  id: string;
  contract_id: string;
  storage_path: string;
  filename: string;
  version_number: number;
  size_bytes: number | null;
  created_at: string;
}

interface ContractTimelineRow {
  id: string;
  contract_id: string;
  type: TimelineEvent["type"];
  label: string;
  event_date: string;
  is_critical: boolean | null;
}

interface ContractActivityRow {
  id: string;
  contract_id: string;
  description: string;
  created_at: string;
}

interface ContractReminderRow {
  id: string;
  contract_id: string;
  remind_on: string;
  channel: ContractReminder["channel"];
  note: string | null;
  status: ContractReminder["status"];
  created_at: string;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function dedupeSlug(baseSlug: string, contracts: Contract[]) {
  if (!contracts.some((contract) => contract.slug === baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  let nextSlug = `${baseSlug}-${index}`;
  while (contracts.some((contract) => contract.slug === nextSlug)) {
    index += 1;
    nextSlug = `${baseSlug}-${index}`;
  }

  return nextSlug;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isConfigured, isLoading: authLoading, user, supabase } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const ensureWorkspace = useCallback(async () => {
    if (!supabase || !user) {
      return null;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Workspace owner",
    });

    const { data: existingMemberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, user_id, email, display_name, role, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipError) {
      throw membershipError;
    }

    const membership = (existingMemberships as WorkspaceMemberRow[] | null)?.[0] ?? null;

    if (membership) {
      return membership.workspace_id;
    }

    const workspaceName =
      user.user_metadata.workspace_name ??
      `${user.email?.split("@")[0] ?? "ContractGuard"} workspace`;

    const { data: insertedWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName,
        created_by: user.id,
      })
      .select("id, name, created_by")
      .single();

    if (workspaceError) {
      throw workspaceError;
    }

    const workspaceRow = insertedWorkspace as WorkspaceRow;

    const { error: memberInsertError } = await supabase.from("workspace_members").insert({
      workspace_id: workspaceRow.id,
      user_id: user.id,
      email: user.email ?? "",
      display_name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Workspace owner",
      role: "admin",
      status: "active",
    });

    if (memberInsertError) {
      throw memberInsertError;
    }

    const defaults = defaultWorkspaceSettings(workspaceRow.id);
    const { error: settingsError } = await supabase.from("workspace_settings").upsert({
      workspace_id: workspaceRow.id,
      notification_preferences: defaults.notificationPreferences,
      ai_settings: defaults.aiSettings,
      integrations: defaults.integrations,
      billing_snapshot: defaults.billingSnapshot,
    });

    if (settingsError) {
      throw settingsError;
    }

    return workspaceRow.id;
  }, [supabase, user]);

  const refresh = useCallback(async () => {
    if (!isConfigured || !supabase || !user) {
      setWorkspace(null);
      setProfile(null);
      setSettings(null);
      setMembers([]);
      setContracts([]);
      setIsReady(true);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);

    try {
      const workspaceId = await ensureWorkspace();
      if (!workspaceId) {
        setWorkspace(null);
        setProfile(null);
        setSettings(null);
        setMembers([]);
        setContracts([]);
        setIsReady(true);
        setIsRefreshing(false);
        return;
      }

      const [
        profileResponse,
        workspaceResponse,
        settingsResponse,
        membersResponse,
        contractsResponse,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_path")
          .eq("id", user.id)
          .single(),
        supabase
          .from("workspaces")
          .select("id, name, created_by")
          .eq("id", workspaceId)
          .single(),
        supabase
          .from("workspace_settings")
          .select(
            "workspace_id, notification_preferences, ai_settings, integrations, billing_snapshot"
          )
          .eq("workspace_id", workspaceId)
          .maybeSingle(),
        supabase
          .from("workspace_members")
          .select("id, user_id, email, display_name, role, status, created_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true }),
        supabase
          .from("contracts")
          .select(
            "id, workspace_id, slug, name, vendor, contract_type, owner_label, status, risk_level, risk_score, health_label, contract_value, value_period, renewal_type, start_date, end_date, renewal_date, notice_period_days, next_deadline, summary, ai_summary, clauses, reviewed_at, archived_at"
          )
          .eq("workspace_id", workspaceId)
          .order("next_deadline", { ascending: true }),
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (workspaceResponse.error) throw workspaceResponse.error;
      if (settingsResponse.error) throw settingsResponse.error;
      if (membersResponse.error) throw membersResponse.error;
      if (contractsResponse.error) throw contractsResponse.error;

      const contractRows = (contractsResponse.data as ContractRow[] | null) ?? [];
      const activeContractRows = contractRows.filter((row) => !row.archived_at);
      const contractIds = activeContractRows.map((row) => row.id);

      const [filesResponse, timelineResponse, activitiesResponse, remindersResponse] =
        contractIds.length > 0
          ? await Promise.all([
              supabase
                .from("contract_files")
                .select(
                  "id, contract_id, storage_path, filename, version_number, size_bytes, created_at"
                )
                .in("contract_id", contractIds)
                .eq("is_current", true),
              supabase
                .from("contract_timeline_events")
                .select("id, contract_id, type, label, event_date, is_critical")
                .in("contract_id", contractIds)
                .order("event_date", { ascending: true }),
              supabase
                .from("contract_activities")
                .select("id, contract_id, description, created_at")
                .in("contract_id", contractIds)
                .order("created_at", { ascending: false }),
              supabase
                .from("contract_reminders")
                .select("id, contract_id, remind_on, channel, note, status, created_at")
                .in("contract_id", contractIds)
                .order("created_at", { ascending: false }),
            ])
          : [
              { data: [], error: null },
              { data: [], error: null },
              { data: [], error: null },
              { data: [], error: null },
            ];

      if (filesResponse.error) throw filesResponse.error;
      if (timelineResponse.error) throw timelineResponse.error;
      if (activitiesResponse.error) throw activitiesResponse.error;
      if (remindersResponse.error) throw remindersResponse.error;

      const fileRows = (filesResponse.data as ContractFileRow[] | null) ?? [];
      const timelineRows = (timelineResponse.data as ContractTimelineRow[] | null) ?? [];
      const activityRows = (activitiesResponse.data as ContractActivityRow[] | null) ?? [];
      const reminderRows = (remindersResponse.data as ContractReminderRow[] | null) ?? [];

      const currentFiles = new Map<string, ContractFile>();
      await Promise.all(
        fileRows.map(async (row) => {
          const { data } = await supabase.storage
            .from("contracts")
            .createSignedUrl(row.storage_path, 60 * 60);

          currentFiles.set(row.contract_id, {
            id: row.id,
            contractId: row.contract_id,
            filename: row.filename,
            storagePath: row.storage_path,
            versionNumber: row.version_number,
            createdAt: row.created_at,
            sizeBytes: row.size_bytes,
            publicUrl: data?.signedUrl ?? null,
          });
        })
      );

      const timelineByContract = new Map<string, TimelineEvent[]>();
      timelineRows.forEach((row) => {
        const items = timelineByContract.get(row.contract_id) ?? [];
        items.push({
          id: row.id,
          type: row.type,
          date: row.event_date,
          label: row.label,
          isCritical: row.is_critical ?? false,
        });
        timelineByContract.set(row.contract_id, items);
      });

      const activitiesByContract = new Map<string, RecentActivity[]>();
      activityRows.forEach((row) => {
        const items = activitiesByContract.get(row.contract_id) ?? [];
        items.push({
          id: row.id,
          description: row.description,
          timestamp: row.created_at,
          relativeTime: getRelativeTime(row.created_at),
        });
        activitiesByContract.set(row.contract_id, items);
      });

      const remindersByContract = new Map<string, ContractReminder[]>();
      reminderRows.forEach((row) => {
        const items = remindersByContract.get(row.contract_id) ?? [];
        items.push({
          id: row.id,
          contractId: row.contract_id,
          remindOn: row.remind_on,
          channel: row.channel,
          note: row.note ?? "",
          status: row.status,
          createdAt: row.created_at,
        });
        remindersByContract.set(row.contract_id, items);
      });

      const mappedContracts: Contract[] = activeContractRows.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        slug: row.slug,
        name: row.name,
        vendor: row.vendor,
        contractType: row.contract_type ?? "SaaS Subscription",
        owner: row.owner_label ?? "Legal",
        status: row.status,
        riskLevel: row.risk_level,
        riskScore: row.risk_score,
        healthLabel: row.health_label ?? getHealthLabel(row.risk_score),
        contractValue: row.contract_value ?? 0,
        valuePeriod: row.value_period,
        renewalType: row.renewal_type,
        startDate: row.start_date,
        endDate: row.end_date,
        renewalDate: row.renewal_date,
        noticePeriodDays: row.notice_period_days ?? 30,
        nextDeadline: row.next_deadline,
        summary: row.summary ?? "",
        aiSummary: row.ai_summary ?? "",
        clauses: row.clauses ?? [],
        reviewedAt: row.reviewed_at,
        archivedAt: row.archived_at,
        timelineEvents: timelineByContract.get(row.id) ?? [],
        recentActivities: activitiesByContract.get(row.id) ?? [],
        currentFile: currentFiles.get(row.id) ?? null,
        reminders: remindersByContract.get(row.id) ?? [],
      }));

      const workspaceRow = workspaceResponse.data as WorkspaceRow;
      const profileRow = profileResponse.data as ProfileRow;
      const settingsRow = settingsResponse.data as WorkspaceSettingsRow | null;
      const defaults = defaultWorkspaceSettings(workspaceId);

      const profileAvatarUrl = profileRow.avatar_path
        ? supabase.storage.from("avatars").getPublicUrl(profileRow.avatar_path).data
            .publicUrl ?? null
        : null;

      setWorkspace({
        id: workspaceRow.id,
        name: workspaceRow.name,
        createdBy: workspaceRow.created_by,
      });
      setProfile({
        id: profileRow.id,
        fullName: profileRow.full_name ?? user.email?.split("@")[0] ?? "Workspace owner",
        avatarPath: profileRow.avatar_path,
        avatarUrl: profileAvatarUrl,
      });
      setSettings({
        workspaceId,
        notificationPreferences:
          settingsRow?.notification_preferences ?? defaults.notificationPreferences,
        aiSettings: settingsRow?.ai_settings ?? defaults.aiSettings,
        integrations: settingsRow?.integrations ?? defaults.integrations,
        billingSnapshot: settingsRow?.billing_snapshot ?? defaults.billingSnapshot,
      });
      setMembers(
        ((membersResponse.data as WorkspaceMemberRow[] | null) ?? []).map((member) => ({
          id: member.id,
          userId: member.user_id,
          email: member.email,
          name: member.display_name ?? member.email,
          role: member.role,
          status: member.status,
          createdAt: member.created_at,
        }))
      );
      setContracts(mappedContracts);
    } finally {
      setIsReady(true);
      setIsRefreshing(false);
    }
  }, [ensureWorkspace, isConfigured, supabase, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refresh();
  }, [authLoading, refresh]);

  const upsertWorkspaceSettings = useCallback(
    async (nextSettings: WorkspaceSettings) => {
      if (!supabase) {
        return;
      }

      const { error } = await supabase.from("workspace_settings").upsert({
        workspace_id: nextSettings.workspaceId,
        notification_preferences: nextSettings.notificationPreferences,
        ai_settings: nextSettings.aiSettings,
        integrations: nextSettings.integrations,
        billing_snapshot: nextSettings.billingSnapshot,
      });

      if (error) {
        throw error;
      }

      setSettings(nextSettings);
    },
    [supabase]
  );

  const saveGeneralSettings = useCallback(
    async ({ fullName, workspaceName, avatarFile }: SaveGeneralSettingsInput) => {
      if (!supabase || !user || !workspace || !profile) {
        return;
      }

      let avatarPath = profile.avatarPath ?? null;
      let avatarUrl = profile.avatarUrl ?? null;

      if (avatarFile) {
        const nextPath = `${user.id}/${Date.now()}-${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(nextPath, avatarFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        avatarPath = nextPath;
        avatarUrl =
          supabase.storage.from("avatars").getPublicUrl(nextPath).data.publicUrl ?? null;
      }

      const [profileResponse, workspaceResponse] = await Promise.all([
        supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName,
          avatar_path: avatarPath,
        }),
        supabase.from("workspaces").update({ name: workspaceName }).eq("id", workspace.id),
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (workspaceResponse.error) throw workspaceResponse.error;

      setProfile({
        ...profile,
        fullName,
        avatarPath,
        avatarUrl,
      });
      setWorkspace({
        ...workspace,
        name: workspaceName,
      });
    },
    [profile, supabase, user, workspace]
  );

  const saveNotificationSettings = useCallback(
    async (notificationPreferences: NotificationPreferences) => {
      if (!settings) {
        return;
      }

      await upsertWorkspaceSettings({
        ...settings,
        notificationPreferences,
      });
    },
    [settings, upsertWorkspaceSettings]
  );

  const saveAiSettings = useCallback(
    async (aiSettings: AiSettings) => {
      if (!settings) {
        return;
      }

      await upsertWorkspaceSettings({
        ...settings,
        aiSettings,
      });
    },
    [settings, upsertWorkspaceSettings]
  );

  const saveBillingInfo = useCallback(
    async ({ billingEmail, companyName, vatId }: SaveBillingInfoInput) => {
      if (!settings) {
        return;
      }

      await upsertWorkspaceSettings({
        ...settings,
        billingSnapshot: {
          ...settings.billingSnapshot,
          billingEmail,
          companyName,
          vatId,
          contractsUsed: contracts.length,
        },
      });
    },
    [contracts.length, settings, upsertWorkspaceSettings]
  );

  const toggleIntegration = useCallback(
    async (integrationId: string) => {
      if (!settings) {
        return;
      }

      const current = settings.integrations[integrationId];
      const nextStatus =
        current?.status === "connected" || current?.status === "active"
          ? "not_connected"
          : integrationId === "webhooks"
          ? "active"
          : "connected";

      await upsertWorkspaceSettings({
        ...settings,
        integrations: {
          ...settings.integrations,
          [integrationId]: {
            status: nextStatus,
            note:
              nextStatus === "not_connected"
                ? "Connection disabled. Reconnect when you are ready to route events."
                : integrationId === "webhooks"
                ? "Webhook delivery is enabled. Configure your endpoint manually."
                : "Connection status saved. Complete third-party setup outside the app.",
          },
        },
      });
    },
    [settings, upsertWorkspaceSettings]
  );

  const inviteMember = useCallback(
    async ({ email, role }: InviteMemberInput) => {
      if (!supabase || !workspace) {
        return;
      }

      const displayName = email.split("@")[0].replace(/[._-]+/g, " ");
      const { error } = await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        email,
        display_name: displayName,
        role,
        status: "invited",
      });

      if (error) {
        throw error;
      }

      await refresh();
    },
    [refresh, supabase, workspace]
  );

  const createContract = useCallback(
    async (input: CreateContractInput) => {
      if (!supabase || !workspace || !user) {
        throw new Error("Supabase is not ready.");
      }

      const baseSlug = slugifyContractName(input.name) || "contract";
      const slug = dedupeSlug(baseSlug, contracts);
      const riskScore = Math.min(
        99,
        Math.max(
          10,
          Math.round(
            35 +
              input.noticePeriodDays / 4 +
              (input.renewalType === "auto-renewal" ? 15 : 0) +
              (input.contractValue > 100000 ? 10 : 0)
          )
        )
      );
      const riskLevel = getRiskLevelFromScore(riskScore);
      const aiSummary = input.summary
        ? `Uploaded contract summary: ${input.summary}`
        : "Contract uploaded. Add a summary after review to improve portfolio insights.";

      const { data: insertedContract, error: insertError } = await supabase
        .from("contracts")
        .insert({
          workspace_id: workspace.id,
          slug,
          name: input.name,
          vendor: input.vendor,
          contract_type: input.contractType,
          owner_label: input.owner,
          status: "active",
          risk_level: riskLevel,
          risk_score: riskScore,
          health_label: getHealthLabel(riskScore),
          contract_value: input.contractValue,
          value_period: input.valuePeriod,
          renewal_type: input.renewalType,
          start_date: input.startDate,
          renewal_date: input.renewalDate,
          notice_period_days: input.noticePeriodDays,
          next_deadline: input.nextDeadline,
          summary: input.summary,
          ai_summary: aiSummary,
          clauses: input.clauses,
        })
        .select(
          "id, workspace_id, slug, name, vendor, contract_type, owner_label, status, risk_level, risk_score, health_label, contract_value, value_period, renewal_type, start_date, end_date, renewal_date, notice_period_days, next_deadline, summary, ai_summary, clauses, reviewed_at, archived_at"
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      const contractRow = insertedContract as ContractRow;

      const timelinePayload = [
        {
          contract_id: contractRow.id,
          type: "start",
          label: "Contract start",
          event_date: input.startDate,
          is_critical: false,
        },
      ];

      if (input.renewalDate) {
        timelinePayload.push(
          {
            contract_id: contractRow.id,
            type: "notice-window-open",
            label: "Notice window opens",
            event_date: new Date(
              new Date(input.renewalDate).getTime() -
                input.noticePeriodDays * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10),
            is_critical: false,
          },
          {
            contract_id: contractRow.id,
            type: "renewal",
            label: "Renewal date",
            event_date: input.renewalDate,
            is_critical: false,
          }
        );
      }

      const { error: timelineError } = await supabase
        .from("contract_timeline_events")
        .insert(timelinePayload);

      if (timelineError) {
        throw timelineError;
      }

      const { error: activityError } = await supabase.from("contract_activities").insert({
        contract_id: contractRow.id,
        description: input.file
          ? "Contract uploaded with document attached"
          : "Contract created from manual intake form",
        created_by: user.id,
      });

      if (activityError) {
        throw activityError;
      }

      if (input.file) {
        const storagePath = `${workspace.id}/${contractRow.id}/v1-${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(storagePath, input.file, { upsert: false });

        if (uploadError) {
          throw uploadError;
        }

        const { error: fileError } = await supabase.from("contract_files").insert({
          contract_id: contractRow.id,
          storage_path: storagePath,
          filename: input.file.name,
          mime_type: input.file.type,
          size_bytes: input.file.size,
          version_number: 1,
          is_current: true,
          uploaded_by: user.id,
        });

        if (fileError) {
          throw fileError;
        }
      }

      await refresh();
      return {
        id: contractRow.id,
        workspaceId: contractRow.workspace_id,
        slug: contractRow.slug,
        name: contractRow.name,
        vendor: contractRow.vendor,
        contractType: contractRow.contract_type ?? input.contractType,
        owner: contractRow.owner_label ?? input.owner,
        status: contractRow.status,
        riskLevel: contractRow.risk_level,
        riskScore: contractRow.risk_score,
        healthLabel: contractRow.health_label ?? getHealthLabel(contractRow.risk_score),
        contractValue: contractRow.contract_value ?? input.contractValue,
        valuePeriod: contractRow.value_period,
        renewalType: contractRow.renewal_type,
        startDate: contractRow.start_date,
        endDate: contractRow.end_date,
        renewalDate: contractRow.renewal_date,
        noticePeriodDays: contractRow.notice_period_days ?? input.noticePeriodDays,
        nextDeadline: contractRow.next_deadline,
        summary: contractRow.summary ?? input.summary,
        aiSummary: contractRow.ai_summary ?? aiSummary,
        clauses: contractRow.clauses ?? input.clauses,
        reviewedAt: contractRow.reviewed_at,
        archivedAt: contractRow.archived_at,
        timelineEvents: [],
        recentActivities: [],
        currentFile: null,
        reminders: [],
      };
    },
    [contracts, refresh, supabase, user, workspace]
  );

  const uploadContractVersion = useCallback(
    async (contractId: string, file: File) => {
      if (!supabase || !workspace || !user) {
        return;
      }

      const existingFiles = contracts
        .filter((contract) => contract.id === contractId)
        .map((contract) => contract.currentFile)
        .filter(Boolean);
      const versionNumber = (existingFiles[0]?.versionNumber ?? 0) + 1;
      const storagePath = `${workspace.id}/${contractId}/v${versionNumber}-${Date.now()}-${file.name}`;

      if (existingFiles[0]) {
        const { error: currentError } = await supabase
          .from("contract_files")
          .update({ is_current: false })
          .eq("contract_id", contractId)
          .eq("is_current", true);

        if (currentError) {
          throw currentError;
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const [fileResponse, activityResponse] = await Promise.all([
        supabase.from("contract_files").insert({
          contract_id: contractId,
          storage_path: storagePath,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          version_number: versionNumber,
          is_current: true,
          uploaded_by: user.id,
        }),
        supabase.from("contract_activities").insert({
          contract_id: contractId,
          description: `Uploaded contract version ${versionNumber}`,
          created_by: user.id,
        }),
      ]);

      if (fileResponse.error) throw fileResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      await refresh();
    },
    [contracts, refresh, supabase, user, workspace]
  );

  const createReminder = useCallback(
    async (contractIds: string[]) => {
      if (!supabase || !user) {
        return;
      }

      const now = new Date().toISOString();
      const reminderRows = contractIds.map((contractId) => {
        const contract = contracts.find((item) => item.id === contractId);
        return {
          contract_id: contractId,
          remind_on: contract?.nextDeadline ?? now,
          channel: "email",
          note: contract
            ? `Reminder created for ${contract.name} renewal workflow.`
            : "Reminder created from workspace action.",
          status: "pending",
          created_by: user.id,
        };
      });

      const activityRows = contractIds.map((contractId) => ({
        contract_id: contractId,
        description: "Renewal reminder scheduled for owners",
        created_by: user.id,
      }));

      const [reminderResponse, activityResponse] = await Promise.all([
        supabase.from("contract_reminders").insert(reminderRows),
        supabase.from("contract_activities").insert(activityRows),
      ]);

      if (reminderResponse.error) throw reminderResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      await refresh();
    },
    [contracts, refresh, supabase, user]
  );

  const markContractReviewed = useCallback(
    async (contractId: string, reviewed: boolean) => {
      if (!supabase || !user) {
        return;
      }

      const reviewedAt = reviewed ? new Date().toISOString() : null;
      const [contractResponse, activityResponse] = await Promise.all([
        supabase
          .from("contracts")
          .update({
            reviewed_at: reviewedAt,
            reviewed_by: reviewed ? user.id : null,
          })
          .eq("id", contractId),
        supabase.from("contract_activities").insert({
          contract_id: contractId,
          description: reviewed ? "Contract marked as reviewed" : "Review status cleared",
          created_by: user.id,
        }),
      ]);

      if (contractResponse.error) throw contractResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      await refresh();
    },
    [refresh, supabase, user]
  );

  const assignOwner = useCallback(
    async (contractIds: string[], owner: string) => {
      if (!supabase || !user || contractIds.length === 0) {
        return;
      }

      const [updateResponse, activityResponse] = await Promise.all([
        supabase.from("contracts").update({ owner_label: owner }).in("id", contractIds),
        supabase.from("contract_activities").insert(
          contractIds.map((contractId) => ({
            contract_id: contractId,
            description: `Contract owner updated to ${owner}`,
            created_by: user.id,
          }))
        ),
      ]);

      if (updateResponse.error) throw updateResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      await refresh();
    },
    [refresh, supabase, user]
  );

  const archiveContracts = useCallback(
    async (contractIds: string[]) => {
      if (!supabase || !user || contractIds.length === 0) {
        return;
      }

      const archivedAt = new Date().toISOString();
      const [updateResponse, activityResponse] = await Promise.all([
        supabase
          .from("contracts")
          .update({ archived_at: archivedAt, status: "archived" })
          .in("id", contractIds),
        supabase.from("contract_activities").insert(
          contractIds.map((contractId) => ({
            contract_id: contractId,
            description: "Contract archived from active portfolio",
            created_by: user.id,
          }))
        ),
      ]);

      if (updateResponse.error) throw updateResponse.error;
      if (activityResponse.error) throw activityResponse.error;

      await refresh();
    },
    [refresh, supabase, user]
  );

  const deleteAllContractData = useCallback(async () => {
    if (!supabase || !workspace) {
      return;
    }

    const filesToDelete = contracts
      .map((contract) => contract.currentFile?.storagePath)
      .filter((path): path is string => Boolean(path));

    if (filesToDelete.length > 0) {
      await supabase.storage.from("contracts").remove(filesToDelete);
    }

    const contractIds = contracts.map((contract) => contract.id);
    if (contractIds.length > 0) {
      await Promise.all([
        supabase.from("contract_reminders").delete().in("contract_id", contractIds),
        supabase.from("contract_activities").delete().in("contract_id", contractIds),
        supabase
          .from("contract_timeline_events")
          .delete()
          .in("contract_id", contractIds),
        supabase.from("contract_files").delete().in("contract_id", contractIds),
      ]);
    }

    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("workspace_id", workspace.id);

    if (error) {
      throw error;
    }

    await refresh();
  }, [contracts, refresh, supabase, workspace]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      isReady,
      isRefreshing,
      workspace,
      profile,
      settings,
      members,
      contracts,
      refresh,
      saveGeneralSettings,
      saveNotificationSettings,
      saveAiSettings,
      saveBillingInfo,
      toggleIntegration,
      inviteMember,
      createContract,
      uploadContractVersion,
      createReminder,
      markContractReviewed,
      assignOwner,
      archiveContracts,
      deleteAllContractData,
    }),
    [
      archiveContracts,
      contracts,
      createContract,
      createReminder,
      deleteAllContractData,
      inviteMember,
      isReady,
      isRefreshing,
      markContractReviewed,
      members,
      profile,
      refresh,
      saveAiSettings,
      saveBillingInfo,
      saveGeneralSettings,
      saveNotificationSettings,
      settings,
      toggleIntegration,
      uploadContractVersion,
      workspace,
      assignOwner,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
