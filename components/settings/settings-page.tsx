"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  User,
  Upload,
  Search,
  Download,
  UserPlus,
  Trash2,
  Calendar,
  MessageSquare,
  Zap,
  Webhook,
} from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/components/settings/use-theme";
import { useAppData } from "@/components/app/app-data-provider";
import { createDownload } from "@/lib/app-data";
import { AiSettings, NotificationPreferences, WorkspaceMember } from "@/types/contract";

const TABS = [
  "General",
  "Notifications",
  "Members",
  "Integrations",
  "AI Settings",
  "Billing",
  "Danger Zone",
] as const;
type TabId = (typeof TABS)[number];

const INTEGRATION_META = [
  {
    id: "google",
    name: "Google Calendar",
    desc: "Sync contract deadlines and reminders to your calendar.",
    icon: Calendar,
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Send alerts to channels when contracts change state.",
    icon: MessageSquare,
  },
  {
    id: "zapier",
    name: "Zapier",
    desc: "Trigger workflows in thousands of external tools.",
    icon: Zap,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    desc: "Send structured events to your own systems.",
    icon: Webhook,
  },
] as const;

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("General");
  const [darkMode, setDarkMode] = useTheme();
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [dangerMessage, setDangerMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isReady,
    workspace,
    profile,
    settings,
    members,
    contracts,
    saveGeneralSettings,
    saveNotificationSettings,
    saveAiSettings,
    saveBillingInfo,
    toggleIntegration,
    inviteMember,
    deleteAllContractData,
  } = useAppData();
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [notificationDraft, setNotificationDraft] =
    useState<NotificationPreferences | null>(null);
  const [aiDraft, setAiDraft] = useState<AiSettings | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatId, setVatId] = useState("");

  useEffect(() => {
    if (!profile || !workspace || !settings) {
      return;
    }

    setFullName(profile.fullName);
    setWorkspaceName(workspace.name);
    setNotificationDraft(settings.notificationPreferences);
    setAiDraft(settings.aiSettings);
    setBillingEmail(settings.billingSnapshot.billingEmail);
    setCompanyName(settings.billingSnapshot.companyName);
    setVatId(settings.billingSnapshot.vatId);
  }, [profile, settings, workspace]);

  const triggerAvatarUpload = () => fileInputRef.current?.click();

  if (!isReady || !workspace || !profile || !settings || !notificationDraft || !aiDraft) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </main>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">Settings</CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            Manage your workspace, notifications, integrations, AI preferences, and billing.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Dark mode</span>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
              darkMode ? "bg-foreground" : "bg-muted"
            )}
            aria-label="Toggle dark mode"
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-sm ring-0 transition-transform translate-y-0.5",
                darkMode ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </CardHeader>

      <nav className="flex gap-1 overflow-x-auto border-b border-border px-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-3 py-3 text-xs font-medium transition-colors",
              activeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      <CardContent className="p-6">
        {activeTab === "General" && (
          <GeneralTab
            profile={profile}
            fullName={fullName}
            workspaceName={workspaceName}
            generalMessage={generalMessage}
            fileInputRef={fileInputRef}
            avatarFile={avatarFile}
            onAvatarFileChange={setAvatarFile}
            onAvatarClick={triggerAvatarUpload}
            onFullNameChange={setFullName}
            onWorkspaceNameChange={setWorkspaceName}
            onSave={async () => {
              await saveGeneralSettings({
                fullName,
                workspaceName,
                avatarFile,
              });
              setGeneralMessage("Profile and workspace settings saved.");
              setAvatarFile(null);
            }}
          />
        )}
        {activeTab === "Notifications" && (
          <NotificationsTab
            draft={notificationDraft}
            message={notificationMessage}
            onChange={setNotificationDraft}
            onSave={async () => {
              await saveNotificationSettings(notificationDraft);
              setNotificationMessage("Notification preferences updated.");
            }}
          />
        )}
        {activeTab === "Members" && <MembersTab members={members} inviteMember={inviteMember} />}
        {activeTab === "Integrations" && (
          <IntegrationsTab
            integrations={settings.integrations}
            onToggle={toggleIntegration}
          />
        )}
        {activeTab === "AI Settings" && (
          <AISettingsTab
            draft={aiDraft}
            message={aiMessage}
            onChange={setAiDraft}
            onSave={async () => {
              await saveAiSettings(aiDraft);
              setAiMessage("AI defaults saved.");
            }}
          />
        )}
        {activeTab === "Billing" && (
          <BillingTab
            contractCount={contracts.length}
            billingSnapshot={settings.billingSnapshot}
            billingEmail={billingEmail}
            companyName={companyName}
            vatId={vatId}
            message={billingMessage}
            onBillingEmailChange={setBillingEmail}
            onCompanyNameChange={setCompanyName}
            onVatIdChange={setVatId}
            onSave={async () => {
              await saveBillingInfo({
                billingEmail,
                companyName,
                vatId,
              });
              setBillingMessage("Billing contact information saved.");
            }}
          />
        )}
        {activeTab === "Danger Zone" && (
          <DangerZoneTab
            contractCount={contracts.length}
            message={dangerMessage}
            onDeleteAllContracts={async () => {
              await deleteAllContractData();
              setDangerMessage("All contract data has been removed from this workspace.");
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function GeneralTab({
  profile,
  fullName,
  workspaceName,
  generalMessage,
  avatarFile,
  onAvatarClick,
  fileInputRef,
  onAvatarFileChange,
  onFullNameChange,
  onWorkspaceNameChange,
  onSave,
}: {
  profile: ReturnType<typeof useAppData>["profile"];
  fullName: string;
  workspaceName: string;
  generalMessage: string | null;
  avatarFile: File | null;
  onAvatarClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAvatarFileChange: (file: File | null) => void;
  onFullNameChange: (value: string) => void;
  onWorkspaceNameChange: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatarUrl ?? null;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Profile & avatar</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Your avatar is shown in the workspace and in the top navigation.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onAvatarFileChange(event.target.files?.[0] ?? null)}
            aria-label="Upload avatar"
          />
          <button
            type="button"
            onClick={onAvatarClick}
            className="flex h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-foreground/40 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <User className="h-8 w-8" />
              </span>
            )}
          </button>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onAvatarClick}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {previewUrl ? "Change avatar" : "Upload avatar"}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Workspace</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Workspace name and basic preferences.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Full name</label>
            <Input
              className="mt-1 max-w-sm"
              value={fullName}
              onChange={(event) => onFullNameChange(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Workspace name</label>
            <Input
              className="mt-1 max-w-sm"
              placeholder="ContractGuardAI"
              value={workspaceName}
              onChange={(event) => onWorkspaceNameChange(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onSave}>
              Save changes
            </Button>
            {generalMessage && (
              <span className="text-[11px] text-muted-foreground">{generalMessage}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const NOTIFICATION_ITEMS = [
  { id: "expiring", label: "Contract expiring soon" },
  { id: "risk", label: "Risk level changed" },
  { id: "uploaded", label: "New contract uploaded" },
  { id: "renewal", label: "Renewal reminder" },
  { id: "clause", label: "Key clause flagged" },
];

const NOTIFICATION_CHANNELS = [
  { id: "email", name: "Email", desc: "Receive notifications by email.", available: true },
  { id: "in-app", name: "In-app", desc: "Notifications in the dashboard and bell icon.", available: true },
  { id: "slack", name: "Slack", desc: "Send alerts to a Slack channel. Connect in Integrations.", available: true },
  { id: "teams", name: "Microsoft Teams", desc: "Post updates to a Teams channel.", available: true },
  { id: "whatsapp", name: "WhatsApp", desc: "Get critical alerts on WhatsApp.", available: false },
  { id: "sms", name: "SMS", desc: "SMS alerts for urgent contract events.", available: false },
];

function NotificationsTab({
  draft,
  message,
  onChange,
  onSave,
}: {
  draft: NotificationPreferences;
  message: string | null;
  onChange: (next: NotificationPreferences) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Notification channels</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose where you receive notifications. Enable or disable each channel and fine-tune what you get.
        </p>
      </section>

      {NOTIFICATION_CHANNELS.map((channel) => (
        <section
          key={channel.id}
          className={cn(
            "rounded-[var(--radius)] border border-border p-4",
            channel.available ? "bg-muted/20" : "bg-muted/10 opacity-90"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-foreground">{channel.name}</h4>
              {!channel.available && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Coming soon
                </Badge>
              )}
            </div>
            {channel.available && (
              <button
                type="button"
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border",
                  draft.channels[channel.id] ? "bg-foreground" : "bg-muted"
                )}
                onClick={() =>
                  onChange({
                    ...draft,
                    channels: {
                      ...draft.channels,
                      [channel.id]: !draft.channels[channel.id],
                    },
                  })
                }
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm",
                    draft.channels[channel.id] ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{channel.desc}</p>
          {channel.available && (channel.id === "email" || channel.id === "in-app") && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <p className="text-[11px] font-medium text-muted-foreground">Notify me when</p>
              {NOTIFICATION_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <span className="text-xs text-foreground">{item.label}</span>
                  <button
                    type="button"
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-border",
                      draft.events[item.id] ? "bg-foreground" : "bg-muted"
                    )}
                    onClick={() =>
                      onChange({
                        ...draft,
                        events: {
                          ...draft.events,
                          [item.id]: !draft.events[item.id],
                        },
                      })
                    }
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 translate-y-0.5 rounded-full bg-background shadow-sm",
                        draft.events[item.id] ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave}>
          Save notification settings
        </Button>
        {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}

function MembersTab({
  members,
  inviteMember,
}: {
  members: WorkspaceMember[];
  inviteMember: ReturnType<typeof useAppData>["inviteMember"];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceMember["role"]>("member");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const filteredMembers = members.filter((member) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !(
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q)
      )
    ) {
      return false;
    }

    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    if (statusFilter !== "all" && member.status !== statusFilter) return false;
    return true;
  });

  const admins = members.filter((member) => member.role === "admin").length;
  const workspaceMembers = members.filter((member) => member.role === "member").length;
  const viewers = members.filter((member) => member.role === "viewer").length;

  const exportMembers = () => {
    const csv = [
      ["Name", "Role", "Status", "Email", "Created at"],
      ...filteredMembers.map((member) => [
        member.name,
        member.role,
        member.status,
        member.email,
        member.createdAt,
      ]),
    ]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    createDownload("workspace-members.csv", csv, "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Team overview</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          High level breakdown of roles in the workspace.
        </p>
        <div className="mt-4 flex gap-6">
          <div>
            <span className="text-2xl font-semibold text-foreground">{admins}</span>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div>
            <span className="text-2xl font-semibold text-foreground">{workspaceMembers}</span>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div>
            <span className="text-2xl font-semibold text-foreground">{viewers}</span>
            <p className="text-xs text-muted-foreground">Viewers</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Members</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Invite your team and manage access to contracts and workspaces.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportMembers}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowInvite((value) => !value)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite member
          </Button>
        </div>
        {showInvite && (
          <div className="mt-4 flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
            <Input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="sm:max-w-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as WorkspaceMember["role"])
              }
              className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              size="sm"
              onClick={async () => {
                if (!inviteEmail.trim()) return;
                await inviteMember({ email: inviteEmail.trim(), role: inviteRole });
                setInviteEmail("");
                setInviteRole("member");
                setInviteMessage("Invitation saved to the workspace member list.");
              }}
            >
              Save invitation
            </Button>
          </div>
        )}
        {inviteMessage && (
          <p className="mt-2 text-[11px] text-muted-foreground">{inviteMessage}</p>
        )}
        <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground">Member</th>
                <th className="px-4 py-3 font-medium text-foreground">Role</th>
                <th className="px-4 py-3 font-medium text-foreground">Date added</th>
                <th className="px-4 py-3 font-medium text-foreground">Email address</th>
                <th className="px-4 py-3 font-medium text-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="bg-card">
                  <td className="px-4 py-3 text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(m.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status === "active" ? "success" : "outline"}>
                      {m.status === "active" ? "Active" : "Invited"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Showing {filteredMembers.length === 0 ? 0 : 1}–{filteredMembers.length} · Page 1
        </p>
      </section>
    </div>
  );
}

function IntegrationsTab({
  integrations,
  onToggle,
}: {
  integrations: NonNullable<ReturnType<typeof useAppData>["settings"]>["integrations"];
  onToggle: ReturnType<typeof useAppData>["toggleIntegration"];
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Connect tools to automate workflows and sync contract events.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATION_META.map((int) => {
          const Icon = int.icon;
          const integrationState = integrations[int.id];
          const isConnected =
            integrationState?.status === "connected" || integrationState?.status === "active";
          return (
          <Card key={int.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{int.name}</span>
              </div>
              <Badge variant={isConnected ? "success" : "default"}>
                {integrationState?.status === "active"
                  ? "Active"
                  : integrationState?.status === "connected"
                  ? "Connected"
                  : "Not connected"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{int.desc}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {integrationState?.note ?? "No setup notes saved yet."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onToggle(int.id)}
            >
              {isConnected ? "Disconnect" : "Save connection state"}
            </Button>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

function AISettingsTab({
  draft,
  message,
  onChange,
  onSave,
}: {
  draft: AiSettings;
  message: string | null;
  onChange: (next: AiSettings) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">AI contract analysis</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Control how AI analyses are run on newly uploaded and existing contracts.
        </p>
        <div className="mt-4 space-y-4">
          <SettingRow label="Auto-analyze contracts on upload" desc="Run analysis when a contract is uploaded.">
            <Toggle
              checked={draft.autoAnalyzeOnUpload}
              onToggle={() =>
                onChange({ ...draft, autoAnalyzeOnUpload: !draft.autoAnalyzeOnUpload })
              }
            />
          </SettingRow>
          <SettingRow label="Risk sensitivity" desc="Higher sensitivity flags more contracts as risky.">
            <Select
              options={["Low", "Medium", "High"]}
              value={draft.riskSensitivity}
              onChange={(value) =>
                onChange({ ...draft, riskSensitivity: value as AiSettings["riskSensitivity"] })
              }
            />
          </SettingRow>
          <SettingRow label="Clause extraction depth" desc="Choose the level of data for extracted clauses.">
            <Select
              options={["Basic", "Standard", "Full"]}
              value={draft.clauseExtractionDepth}
              onChange={(value) =>
                onChange({
                  ...draft,
                  clauseExtractionDepth: value as AiSettings["clauseExtractionDepth"],
                })
              }
            />
          </SettingRow>
          <SettingRow label="Language detection" desc="Automatically detect the contract language or set manually.">
            <Select
              options={["Auto-detect", "English", "Other"]}
              value={draft.languageDetection}
              onChange={(value) =>
                onChange({
                  ...draft,
                  languageDetection: value as AiSettings["languageDetection"],
                })
              }
            />
          </SettingRow>
          <SettingRow label="Summary style" desc="Control how contract summaries are provided.">
            <Select
              options={["Concise", "Detailed"]}
              value={draft.summaryStyle}
              onChange={(value) =>
                onChange({ ...draft, summaryStyle: value as AiSettings["summaryStyle"] })
              }
            />
          </SettingRow>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-foreground">Privacy & processing</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Enterprise-ready privacy controls for how contracts are stored and analyzed.
        </p>
        <div className="mt-4 space-y-4">
          <SettingRow label="Enable secure analysis mode" desc="Process data in a isolated environment.">
            <Toggle
              checked={draft.secureAnalysisMode}
              onToggle={() =>
                onChange({ ...draft, secureAnalysisMode: !draft.secureAnalysisMode })
              }
            />
          </SettingRow>
          <SettingRow label="Store extracted metadata only" desc="Do not store full contract text.">
            <Toggle
              checked={draft.metadataOnlyStorage}
              onToggle={() =>
                onChange({ ...draft, metadataOnlyStorage: !draft.metadataOnlyStorage })
              }
            />
          </SettingRow>
          <SettingRow label="Retain AI analysis history" desc="Keep history of past analyses.">
            <Toggle
              checked={draft.retainAnalysisHistory}
              onToggle={() =>
                onChange({ ...draft, retainAnalysisHistory: !draft.retainAnalysisHistory })
              }
            />
          </SettingRow>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave}>
          Save AI settings
        </Button>
        {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
        checked ? "bg-foreground" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm",
          checked ? "translate-x-6" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function Select({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-[120px] rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function BillingTab({
  contractCount,
  billingSnapshot,
  billingEmail,
  companyName,
  vatId,
  message,
  onBillingEmailChange,
  onCompanyNameChange,
  onVatIdChange,
  onSave,
}: {
  contractCount: number;
  billingSnapshot: NonNullable<ReturnType<typeof useAppData>["settings"]>["billingSnapshot"];
  billingEmail: string;
  companyName: string;
  vatId: string;
  message: string | null;
  onBillingEmailChange: (value: string) => void;
  onCompanyNameChange: (value: string) => void;
  onVatIdChange: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  const [billingPanel, setBillingPanel] = useState<"plans" | "payment" | "contact" | null>(
    null
  );

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Billing</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your subscription, payment details, invoices, and usage.
        </p>
      </section>

      {/* Current subscription */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Current subscription
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {billingSnapshot.planName}
              </span>
              <Badge
                variant={
                  billingSnapshot.planStatus === "Active" ? "success" : "outline"
                }
              >
                {billingSnapshot.planStatus}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {billingSnapshot.renewalDate
                ? `Renews on ${format(new Date(billingSnapshot.renewalDate), "MMM d, yyyy")}.`
                : "Billing renewal is not connected yet. Save your billing contact details to prepare the workspace."}
            </p>
            <div className="mt-4 grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-xs text-foreground">Contracts included</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Up to {billingSnapshot.contractsLimit}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground">AI analyses / month</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {billingSnapshot.aiAnalysesLimit} included
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground">Storage</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {billingSnapshot.storageLimitGb} GB included
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button variant="primary" size="sm" onClick={() => setBillingPanel("plans")}>
              Upgrade plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBillingPanel("contact")}
            >
              Manage billing
            </Button>
          </div>
        </div>
      </section>

      {/* Usage this month */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Usage this month</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Approximate usage across contracts, AI analysis, and storage.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Contracts analyzed</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{contractCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              of {billingSnapshot.contractsLimit} included
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">AI analysis used</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {billingSnapshot.aiAnalysesUsed}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Standard AI precision and rate limits</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Storage used</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {billingSnapshot.storageUsedGb} GB
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Legal docs and attachments</p>
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Payment method</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add or update the card used for subscription charges.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Payment methods are not connected in-app yet. Save your billing contact so finance knows where to continue setup.
          </p>
          <Button variant="primary" size="sm" onClick={() => setBillingPanel("payment")}>
            Add payment method
          </Button>
        </div>
      </section>

      {/* Billing information */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Billing information</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Details used on invoices and billing communications.
        </p>
        <div className="mt-4 grid gap-4 text-[11px] text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="text-xs text-foreground">Billing email</p>
            <Input
              className="mt-2"
              value={billingEmail}
              onChange={(event) => onBillingEmailChange(event.target.value)}
              placeholder="billing@company.com"
            />
          </div>
          <div>
            <p className="text-xs text-foreground">Company</p>
            <Input
              className="mt-2"
              value={companyName}
              onChange={(event) => onCompanyNameChange(event.target.value)}
              placeholder="Legal entity name"
            />
          </div>
          <div>
            <p className="text-xs text-foreground">VAT ID</p>
            <Input
              className="mt-2"
              value={vatId}
              onChange={(event) => onVatIdChange(event.target.value)}
              placeholder="Optional VAT or tax ID"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onSave}>
            Update billing info
          </Button>
          {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
        </div>
      </section>

      {/* Invoices & billing history */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Invoices &amp; billing history</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Download invoices here once a billing system or external portal is connected to this workspace.
        </p>
        {billingSnapshot.invoices.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-foreground">Description</th>
                  <th className="px-4 py-3 font-medium text-foreground">Amount</th>
                  <th className="px-4 py-3 font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {billingSnapshot.invoices.map((invoice) => (
                  <tr key={invoice.id} className="bg-card">
                    <td className="px-4 py-3 text-muted-foreground">{invoice.date}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.description}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.amount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invoice.status === "Paid" ? "success" : "outline"}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          createDownload(
                            `${invoice.id}.txt`,
                            `${invoice.description}\n${invoice.amount}\n${invoice.date}`,
                            "text/plain;charset=utf-8"
                          )
                        }
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--radius)] border border-dashed border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">No invoices available yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Save your billing contact details first, then connect billing manually when you are ready to generate invoices.
            </p>
          </div>
        )}
      </section>

      {/* Need more capacity */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Need more capacity?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upgrade your plan to unlock higher limits and advanced capabilities.
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>Higher contract and storage limits.</li>
          <li>More generous AI analysis quotas.</li>
          <li>Priority support for enterprise contracts.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => setBillingPanel("plans")}>
            View plans
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setBillingPanel("contact")}>
            Contact sales
          </Button>
        </div>
      </section>
      {billingPanel && (
        <section className="rounded-[var(--radius)] border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground">
            {billingPanel === "plans"
              ? "Plan options"
              : billingPanel === "payment"
              ? "Payment method guidance"
              : "Manual billing support"}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {billingPanel === "plans"
              ? "Billing plan changes are not automated in-app yet. Use this panel as the current placeholder and coordinate plan changes after manual setup."
              : billingPanel === "payment"
              ? "Self-serve payment method setup is still a TODO. Save your billing contact above so the right team can continue configuration."
              : "Use the saved billing email and company details in this tab as the source of truth until a live billing portal is connected."}
          </p>
        </section>
      )}
    </div>
  );
}

function DangerZoneTab({
  contractCount,
  message,
  onDeleteAllContracts,
}: {
  contractCount: number;
  message: string | null;
  onDeleteAllContracts: () => Promise<void>;
}) {
  const [activeAction, setActiveAction] = useState<"workspace" | "account" | "contracts" | null>(
    null
  );
  const [confirmation, setConfirmation] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
        <p className="mt-1 text-xs text-danger/90">
          These actions are destructive and cannot be undone. Proceed with caution.
        </p>
      </div>
      <div className="space-y-0 divide-y divide-border rounded-[var(--radius)] border border-border">
        <DangerRow
          title="Delete workspace"
          desc="Remove this workspace and all configuration. Contracts and billing data remain available to the account owner."
          action="Delete"
          onClick={() => setActiveAction("workspace")}
        />
        <DangerRow
          title="Delete account"
          desc="Permanently delete your account and all associated data."
          action="Delete"
          onClick={() => setActiveAction("account")}
        />
        <DangerRow
          title="Remove all contract data"
          desc="Delete all uploaded contracts and analysis from this workspace."
          action="Delete"
          onClick={() => setActiveAction("contracts")}
        />
      </div>
      {activeAction && (
        <section className="rounded-[var(--radius)] border border-border bg-card p-4">
          <p className="text-xs font-semibold text-foreground">
            {activeAction === "contracts"
              ? "Confirm contract data removal"
              : activeAction === "workspace"
              ? "Workspace deletion placeholder"
              : "Account deletion placeholder"}
          </p>
          {activeAction === "contracts" ? (
            <>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Type <strong>DELETE CONTRACTS</strong> to remove {contractCount} contract
                {contractCount === 1 ? "" : "s"} and related activity from this workspace.
              </p>
              <Input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-3 max-w-sm"
                placeholder="DELETE CONTRACTS"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirmation !== "DELETE CONTRACTS"}
                  onClick={async () => {
                    await onDeleteAllContracts();
                    setConfirmation("");
                  }}
                >
                  Confirm deletion
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-2 space-y-3 text-[11px] text-muted-foreground">
              <p>
                TODO: this flow needs a server-side cleanup path before it can safely delete the
                workspace or the authenticated account. The button now opens the correct panel with
                the next implementation note instead of doing nothing.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setActiveAction(null)}>
                Close panel
              </Button>
            </div>
          )}
        </section>
      )}
      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}
    </div>
  );
}

function DangerRow({
  title,
  desc,
  action,
  onClick,
}: {
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Button variant="danger" size="sm" onClick={onClick}>
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        {action}
      </Button>
    </div>
  );
}
