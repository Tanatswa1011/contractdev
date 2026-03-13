"use client";

import { useState, useRef } from "react";
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
  X,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useTheme } from "@/components/settings/use-theme";

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

const MOCK_MEMBERS = [
  {
    id: "1",
    name: "Workspace owner",
    role: "Admin",
    email: "team@contractguard.ai",
    dateAdded: "2026-03-04",
    status: "Active" as const,
  },
];

const INTEGRATIONS = [
  {
    id: "google",
    name: "Google Calendar",
    desc: "Sync contract deadlines and reminders to your calendar.",
    status: "Connected" as const,
    action: "Manage",
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Send alerts to channels when contracts change state.",
    status: "Not connected" as const,
    action: "Connect",
  },
  {
    id: "zapier",
    name: "Zapier",
    desc: "Trigger workflows in thousands of external tools.",
    status: "Not connected" as const,
    action: "Connect",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    desc: "Send structured events to your own systems.",
    status: "Active" as const,
    action: "Manage",
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("General");
  const [darkMode, setDarkMode] = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    showToast("Avatar updated.");
  };

  const triggerAvatarUpload = () => fileInputRef.current?.click();

  return (
    <>
      <Card className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Settings
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Manage your workspace, notifications, integrations, AI
              preferences, and billing.
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

        <nav className="flex gap-1 border-b border-border px-5">
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
              avatarUrl={avatarUrl}
              onAvatarClick={triggerAvatarUpload}
              fileInputRef={fileInputRef}
              onAvatarChange={handleAvatarChange}
              onSave={showToast}
            />
          )}
          {activeTab === "Notifications" && (
            <NotificationsTab onSave={showToast} />
          )}
          {activeTab === "Members" && <MembersTab onAction={showToast} />}
          {activeTab === "Integrations" && (
            <IntegrationsTab onAction={showToast} />
          )}
          {activeTab === "AI Settings" && (
            <AISettingsTab onSave={showToast} />
          )}
          {activeTab === "Billing" && <BillingTab onAction={showToast} />}
          {activeTab === "Danger Zone" && (
            <DangerZoneTab onAction={showToast} />
          )}
        </CardContent>
      </Card>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-foreground shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  );
}

function GeneralTab({
  avatarUrl,
  onAvatarClick,
  fileInputRef,
  onAvatarChange,
  onSave,
}: {
  avatarUrl: string | null;
  onAvatarClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (msg: string) => void;
}) {
  const [workspaceName, setWorkspaceName] = useState("ContractGuardAI");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Profile & avatar
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Your avatar is shown in the workspace and in the top navigation.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
            aria-label="Upload avatar"
          />
          <button
            type="button"
            onClick={onAvatarClick}
            className="flex h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-foreground/40 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <User className="h-8 w-8" />
              </span>
            )}
          </button>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAvatarClick}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {avatarUrl ? "Change avatar" : "Upload avatar"}
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
            <label className="text-xs text-muted-foreground">
              Workspace name
            </label>
            <Input
              className="mt-1 max-w-sm"
              placeholder="ContractGuardAI"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // TODO: Wire to Supabase workspace_settings update
              onSave(`Workspace name updated to "${workspaceName}".`);
            }}
          >
            Save changes
          </Button>
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
  {
    id: "email",
    name: "Email",
    desc: "Receive notifications by email.",
    available: true,
  },
  {
    id: "in-app",
    name: "In-app",
    desc: "Notifications in the dashboard and bell icon.",
    available: true,
  },
  {
    id: "slack",
    name: "Slack",
    desc: "Send alerts to a Slack channel. Connect in Integrations.",
    available: true,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    desc: "Post updates to a Teams channel.",
    available: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    desc: "Get critical alerts on WhatsApp.",
    available: false,
  },
  {
    id: "sms",
    name: "SMS",
    desc: "SMS alerts for urgent contract events.",
    available: false,
  },
];

function NotificationsTab({ onSave }: { onSave: (msg: string) => void }) {
  const [channelStates, setChannelStates] = useState<Record<string, boolean>>({
    email: true,
    "in-app": true,
    slack: false,
    teams: false,
  });

  const [eventStates, setEventStates] = useState<
    Record<string, Record<string, boolean>>
  >({
    email: {
      expiring: true,
      risk: true,
      uploaded: true,
      renewal: true,
      clause: true,
    },
    "in-app": {
      expiring: true,
      risk: true,
      uploaded: true,
      renewal: true,
      clause: true,
    },
  });

  const toggleChannel = (channelId: string) => {
    setChannelStates((prev) => {
      const next = { ...prev, [channelId]: !prev[channelId] };
      // TODO: Wire to Supabase workspace_settings.notifications
      onSave(
        `${channelId} notifications ${next[channelId] ? "enabled" : "disabled"}.`
      );
      return next;
    });
  };

  const toggleEvent = (channelId: string, eventId: string) => {
    setEventStates((prev) => {
      const channelEvents = prev[channelId] ?? {};
      const next = {
        ...prev,
        [channelId]: {
          ...channelEvents,
          [eventId]: !channelEvents[eventId],
        },
      };
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Notification channels
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose where you receive notifications. Enable or disable each
          channel and fine-tune what you get.
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
              <h4 className="text-xs font-semibold text-foreground">
                {channel.name}
              </h4>
              {!channel.available && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  Coming soon
                </Badge>
              )}
            </div>
            {channel.available && (
              <button
                type="button"
                onClick={() => toggleChannel(channel.id)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
                  channelStates[channel.id] ? "bg-foreground" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm transition-transform",
                    channelStates[channel.id]
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  )}
                />
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {channel.desc}
          </p>
          {channel.available &&
            (channel.id === "email" || channel.id === "in-app") && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Notify me when
                </p>
                {NOTIFICATION_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                  >
                    <span className="text-xs text-foreground">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleEvent(channel.id, item.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full border border-border transition-colors",
                        eventStates[channel.id]?.[item.id]
                          ? "bg-foreground"
                          : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 translate-y-0.5 rounded-full bg-background shadow-sm transition-transform",
                          eventStates[channel.id]?.[item.id]
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </section>
      ))}
    </div>
  );
}

function MembersTab({ onAction }: { onAction: (msg: string) => void }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleExportCsv = () => {
    const csv = [
      "Name,Role,Email,Date Added,Status",
      ...MOCK_MEMBERS.map(
        (m) =>
          `"${m.name}","${m.role}","${m.email}","${m.dateAdded}","${m.status}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInviteMember = () => {
    // TODO: Wire to Supabase invite flow
    onAction(
      "Invite member requires email service configuration. Set up Supabase email templates first."
    );
  };

  const filteredMembers = MOCK_MEMBERS.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q)
      )
        return false;
    }
    if (roleFilter !== "all" && m.role.toLowerCase() !== roleFilter)
      return false;
    if (statusFilter !== "all" && m.status.toLowerCase() !== statusFilter)
      return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Team overview
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          High level breakdown of roles in the workspace.
        </p>
        <div className="mt-4 flex gap-6">
          <div>
            <span className="text-2xl font-semibold text-foreground">1</span>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div>
            <span className="text-2xl font-semibold text-foreground">0</span>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div>
            <span className="text-2xl font-semibold text-foreground">0</span>
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
          <div className="relative min-w-[200px] flex-1">
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
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleInviteMember}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite member
          </Button>
        </div>
        <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground">
                  Member
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Date added
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Email address
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="bg-card">
                  <td className="px-4 py-3 text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.role}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(m.dateAdded), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{m.status}</Badge>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Showing {filteredMembers.length}–{filteredMembers.length} · Page 1
        </p>
      </section>
    </div>
  );
}

function IntegrationsTab({
  onAction,
}: {
  onAction: (msg: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Connect tools to automate workflows and sync contract events.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((int) => (
          <Card
            key={int.id}
            className="rounded-[var(--radius)] border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {int.id === "google" && (
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                )}
                {int.id === "slack" && (
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                )}
                {int.id === "zapier" && (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
                {int.id === "webhooks" && (
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {int.name}
                </span>
              </div>
              <Badge
                variant={
                  int.status === "Connected" || int.status === "Active"
                    ? "success"
                    : "default"
                }
              >
                {int.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{int.desc}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                // TODO: Wire integration OAuth/setup flows
                onAction(
                  int.status === "Connected" || int.status === "Active"
                    ? `Managing ${int.name} integration settings.`
                    : `${int.name} integration requires OAuth setup. Configure in your Supabase project first.`
                );
              }}
            >
              {int.action}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AISettingsTab({ onSave }: { onSave: (msg: string) => void }) {
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [riskSensitivity, setRiskSensitivity] = useState("Medium");
  const [clauseExtraction, setClauseExtraction] = useState("Standard");
  const [languageDetection, setLanguageDetection] = useState("Auto-detect");
  const [summaryStyle, setSummaryStyle] = useState("Concise");
  const [secureMode, setSecureMode] = useState(false);
  const [metadataOnly, setMetadataOnly] = useState(false);
  const [retainHistory, setRetainHistory] = useState(false);

  const handleSave = () => {
    // TODO: Wire to Supabase workspace_settings.ai_settings
    onSave("AI settings saved.");
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          AI contract analysis
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Control how AI analyses are run on newly uploaded and existing
          contracts.
        </p>
        <div className="mt-4 space-y-4">
          <SettingRow
            label="Auto-analyze contracts on upload"
            desc="Run analysis when a contract is uploaded."
          >
            <Toggle checked={autoAnalyze} onToggle={setAutoAnalyze} />
          </SettingRow>
          <SettingRow
            label="Risk sensitivity"
            desc="Higher sensitivity flags more contracts as risky."
          >
            <Select
              options={["Low", "Medium", "High"]}
              value={riskSensitivity}
              onChange={setRiskSensitivity}
            />
          </SettingRow>
          <SettingRow
            label="Clause extraction depth"
            desc="Choose the level of data for extracted clauses."
          >
            <Select
              options={["Basic", "Standard", "Full"]}
              value={clauseExtraction}
              onChange={setClauseExtraction}
            />
          </SettingRow>
          <SettingRow
            label="Language detection"
            desc="Automatically detect the contract language or set manually."
          >
            <Select
              options={["Auto-detect", "English", "Other"]}
              value={languageDetection}
              onChange={setLanguageDetection}
            />
          </SettingRow>
          <SettingRow
            label="Summary style"
            desc="Control how contract summaries are provided."
          >
            <Select
              options={["Concise", "Detailed"]}
              value={summaryStyle}
              onChange={setSummaryStyle}
            />
          </SettingRow>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-foreground">
          Privacy & processing
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Enterprise-ready privacy controls for how contracts are stored and
          analyzed.
        </p>
        <div className="mt-4 space-y-4">
          <SettingRow
            label="Enable secure analysis mode"
            desc="Process data in a isolated environment."
          >
            <Toggle checked={secureMode} onToggle={setSecureMode} />
          </SettingRow>
          <SettingRow
            label="Store extracted metadata only"
            desc="Do not store full contract text."
          >
            <Toggle checked={metadataOnly} onToggle={setMetadataOnly} />
          </SettingRow>
          <SettingRow
            label="Retain AI analysis history"
            desc="Keep history of past analyses."
          >
            <Toggle checked={retainHistory} onToggle={setRetainHistory} />
          </SettingRow>
        </div>
      </section>
      <Button variant="primary" size="sm" onClick={handleSave}>
        Save AI settings
      </Button>
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
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
  onToggle: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
        checked ? "bg-foreground" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm transition-transform",
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
  onChange: (val: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 min-w-[120px] rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function BillingTab({ onAction }: { onAction: (msg: string) => void }) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Billing</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your subscription, payment details, invoices, and usage.
        </p>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Current subscription
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Pro
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              €19 / month · Billed monthly. Renews on Apr 4, 2026.
            </p>
            <div className="mt-4 grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-xs text-foreground">Contracts included</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Up to 100
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground">
                  AI analyses / month
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  200 included
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground">Storage</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  10 GB included
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                onAction(
                  "Plan upgrades require billing integration. Connect a payment provider in your Supabase project."
                )
              }
            >
              Upgrade plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onAction(
                  "Billing management requires a payment provider to be configured."
                )
              }
            >
              Manage billing
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">
          Usage this month
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Approximate usage across contracts, AI analysis, and storage.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">
              Contracts analyzed
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">34</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              of 100 included
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">
              AI analysis used
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">84</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Standard AI precision and rate limits
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Storage used</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              3.4 GB
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Legal docs and attachments
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">
          Payment method
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add or update the card used for subscription charges.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            No payment method added yet.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              onAction(
                "Payment method setup requires Stripe or a similar billing provider to be integrated."
              )
            }
          >
            Add payment method
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">
          Billing information
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Details used on invoices and billing communications.
        </p>
        <div className="mt-4 grid gap-4 text-[11px] text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="text-xs text-foreground">Billing email</p>
            <p className="mt-1 text-xs text-muted-foreground">
              tanzdev@example.com
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground">Company</p>
            <p className="mt-1 text-xs text-muted-foreground">Not added</p>
          </div>
          <div>
            <p className="text-xs text-foreground">VAT ID</p>
            <p className="mt-1 text-xs text-muted-foreground">Not added</p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onAction(
                "Billing information update requires a billing provider to be configured."
              )
            }
          >
            Update billing info
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">
          Invoices & billing history
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your invoices and payment receipts will appear here once billing is
          active.
        </p>
        <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground">
                  Date
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-foreground">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-card">
                <td className="px-4 py-3 text-muted-foreground">
                  Mar 4, 2026
                </td>
                <td className="px-4 py-3 text-foreground">
                  Pro Monthly Plan
                </td>
                <td className="px-4 py-3 text-foreground">€19.00</td>
                <td className="px-4 py-3">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onAction(
                        "Invoice download requires billing integration to be active."
                      )
                    }
                  >
                    Download
                  </Button>
                </td>
              </tr>
              <tr className="bg-card">
                <td className="px-4 py-3 text-muted-foreground">
                  Feb 4, 2026
                </td>
                <td className="px-4 py-3 text-foreground">
                  Pro Monthly Plan
                </td>
                <td className="px-4 py-3 text-foreground">€19.00</td>
                <td className="px-4 py-3">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onAction(
                        "Invoice download requires billing integration to be active."
                      )
                    }
                  >
                    Download
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">
          Need more capacity?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upgrade your plan to unlock higher limits and advanced capabilities.
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>Higher contract and storage limits.</li>
          <li>More generous AI analysis quotas.</li>
          <li>Priority support for enterprise contracts.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              onAction(
                "Plan comparison requires billing integration to be set up."
              )
            }
          >
            View plans
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.href = "mailto:sales@contractguard.ai";
            }}
          >
            Contact sales
          </Button>
        </div>
      </section>
    </div>
  );
}

function DangerZoneTab({ onAction }: { onAction: (msg: string) => void }) {
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const handleDangerAction = (action: string) => {
    if (confirmTarget === action) {
      // TODO: Wire destructive actions to Supabase
      onAction(
        `"${action}" requires confirmation and backend integration. This action cannot be completed without Supabase being configured.`
      );
      setConfirmTarget(null);
    } else {
      setConfirmTarget(action);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
        <p className="mt-1 text-xs text-danger/90">
          These actions are destructive and cannot be undone. Proceed with
          caution.
        </p>
      </div>
      <div className="space-y-0 divide-y divide-border rounded-[var(--radius)] border border-border">
        {[
          {
            key: "Delete workspace",
            title: "Delete workspace",
            desc: "Remove this workspace and all configuration. Contracts and billing data remain available to the account owner.",
          },
          {
            key: "Delete account",
            title: "Delete account",
            desc: "Permanently delete your account and all associated data.",
          },
          {
            key: "Remove all contract data",
            title: "Remove all contract data",
            desc: "Delete all uploaded contracts and analysis from this workspace.",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-medium text-foreground">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {confirmTarget === item.key && (
                <>
                  <span className="text-[10px] text-danger">
                    Click again to confirm
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmTarget(null)}
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDangerAction(item.key)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {confirmTarget === item.key ? "Confirm delete" : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
