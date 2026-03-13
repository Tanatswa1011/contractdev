"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Mock members
const MOCK_MEMBERS = [
  { id: "1", name: "Workspace owner", role: "Admin", email: "team@contractguard.ai", dateAdded: "2026-03-04", status: "Active" as const },
];
// Mock integrations
const INTEGRATIONS = [
  { id: "google", name: "Google Calendar", desc: "Sync contract deadlines and reminders to your calendar.", status: "Connected" as const, action: "Manage" },
  { id: "slack", name: "Slack", desc: "Send alerts to channels when contracts change state.", status: "Not connected" as const, action: "Connect" },
  { id: "zapier", name: "Zapier", desc: "Trigger workflows in thousands of external tools.", status: "Not connected" as const, action: "Connect" },
  { id: "webhooks", name: "Webhooks", desc: "Send structured events to your own systems.", status: "Active" as const, action: "Manage" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("General");
  const [darkMode, setDarkMode] = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const triggerAvatarUpload = () => fileInputRef.current?.click();

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
          />
        )}
        {activeTab === "Notifications" && <NotificationsTab />}
        {activeTab === "Members" && <MembersTab />}
        {activeTab === "Integrations" && <IntegrationsTab />}
        {activeTab === "AI Settings" && <AISettingsTab />}
        {activeTab === "Billing" && <BillingTab />}
        {activeTab === "Danger Zone" && <DangerZoneTab />}
      </CardContent>
    </Card>
  );
}

// --- General (with Avatar section) ---
function GeneralTab({
  avatarUrl,
  onAvatarClick,
  fileInputRef,
  onAvatarChange,
}: {
  avatarUrl: string | null;
  onAvatarClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
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
            onChange={onAvatarChange}
            aria-label="Upload avatar"
          />
          <button
            type="button"
            onClick={onAvatarClick}
            className="flex h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-foreground/40 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <User className="h-8 w-8" />
              </span>
            )}
          </button>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onAvatarClick}>
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
            <label className="text-xs text-muted-foreground">Workspace name</label>
            <Input className="mt-1 max-w-sm" placeholder="ContractGuardAI" defaultValue="ContractGuardAI" />
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Notifications ---
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

function NotificationsTab() {
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
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border bg-foreground"
              >
                <span className="inline-block h-5 w-5 translate-x-6 translate-y-0.5 rounded-full bg-background shadow-sm" />
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
                    className="relative inline-flex h-5 w-9 shrink-0 rounded-full border border-border bg-muted"
                  >
                    <span className="inline-block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-background shadow-sm" />
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

// --- Members ---
function MembersTab() {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Team overview</h3>
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground">
            <option>All roles</option>
          </select>
          <select className="h-9 rounded-full border border-border bg-secondary px-3 text-xs text-foreground">
            <option>All statuses</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite member
          </Button>
        </div>
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
              {MOCK_MEMBERS.map((m) => (
                <tr key={m.id} className="bg-card">
                  <td className="px-4 py-3 text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(m.dateAdded), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{m.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Showing 1–1 · Page 1</p>
      </section>
    </div>
  );
}

// --- Integrations ---
function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Connect tools to automate workflows and sync contract events.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((int) => (
          <Card key={int.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {int.id === "google" && <Calendar className="h-5 w-5 text-muted-foreground" />}
                {int.id === "slack" && <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                {int.id === "zapier" && <Zap className="h-5 w-5 text-muted-foreground" />}
                {int.id === "webhooks" && <Webhook className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">{int.name}</span>
              </div>
              <Badge variant={int.status === "Connected" || int.status === "Active" ? "success" : "default"}>
                {int.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{int.desc}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {int.action}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- AI Settings ---
function AISettingsTab() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-foreground">AI contract analysis</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Control how AI analyses are run on newly uploaded and existing contracts.
        </p>
        <div className="mt-4 space-y-4">
          <SettingRow label="Auto-analyze contracts on upload" desc="Run analysis when a contract is uploaded.">
            <Toggle off />
          </SettingRow>
          <SettingRow label="Risk sensitivity" desc="Higher sensitivity flags more contracts as risky.">
            <Select options={["Low", "Medium", "High"]} value="Medium" />
          </SettingRow>
          <SettingRow label="Clause extraction depth" desc="Choose the level of data for extracted clauses.">
            <Select options={["Basic", "Standard", "Full"]} value="Standard" />
          </SettingRow>
          <SettingRow label="Language detection" desc="Automatically detect the contract language or set manually.">
            <Select options={["Auto-detect", "English", "Other"]} value="Auto-detect" />
          </SettingRow>
          <SettingRow label="Summary style" desc="Control how contract summaries are provided.">
            <Select options={["Concise", "Detailed"]} value="Concise" />
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
            <Toggle off />
          </SettingRow>
          <SettingRow label="Store extracted metadata only" desc="Do not store full contract text.">
            <Toggle off />
          </SettingRow>
          <SettingRow label="Retain AI analysis history" desc="Keep history of past analyses.">
            <Toggle off />
          </SettingRow>
        </div>
      </section>
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

function Toggle({ off = false }: { off?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
        off ? "bg-muted" : "bg-foreground"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-background shadow-sm",
          off ? "translate-x-0.5" : "translate-x-6"
        )}
      />
    </button>
  );
}

function Select({ options, value }: { options: string[]; value: string }) {
  return (
    <select
      defaultValue={value}
      className="h-9 min-w-[120px] rounded-full border border-border bg-secondary px-3 text-xs text-foreground"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

// --- Billing ---
function BillingTab() {
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
              <span className="text-sm font-semibold text-foreground">Pro</span>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              €19 / month · Billed monthly. Renews on Apr 4, 2026.
            </p>
            <div className="mt-4 grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-xs text-foreground">Contracts included</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Up to 100</p>
              </div>
              <div>
                <p className="text-xs text-foreground">AI analyses / month</p>
                <p className="mt-1 text-sm font-semibold text-foreground">200 included</p>
              </div>
              <div>
                <p className="text-xs text-foreground">Storage</p>
                <p className="mt-1 text-sm font-semibold text-foreground">10 GB included</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button variant="primary" size="sm">Upgrade plan</Button>
            <Button variant="secondary" size="sm">
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
            <p className="mt-1 text-lg font-semibold text-foreground">34</p>
            <p className="mt-1 text-[11px] text-muted-foreground">of 100 included</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">AI analysis used</p>
            <p className="mt-1 text-lg font-semibold text-foreground">84</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Standard AI precision and rate limits</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Storage used</p>
            <p className="mt-1 text-lg font-semibold text-foreground">3.4 GB</p>
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
            No payment method added yet.
          </p>
          <Button variant="primary" size="sm">Add payment method</Button>
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
            <p className="mt-1 text-xs text-muted-foreground">tanzdev@example.com</p>
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
          <Button variant="secondary" size="sm">
            Update billing info
          </Button>
        </div>
      </section>

      {/* Invoices & billing history */}
      <section className="rounded-[var(--radius)] border border-border bg-muted/10 p-4">
        <p className="text-xs font-semibold text-foreground">Invoices &amp; billing history</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your invoices and payment receipts will appear here once billing is active.
        </p>
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
              <tr className="bg-card">
                <td className="px-4 py-3 text-muted-foreground">Mar 4, 2026</td>
                <td className="px-4 py-3 text-foreground">Pro Monthly Plan</td>
                <td className="px-4 py-3 text-foreground">€19.00</td>
                <td className="px-4 py-3">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </td>
              </tr>
              <tr className="bg-card">
                <td className="px-4 py-3 text-muted-foreground">Feb 4, 2026</td>
                <td className="px-4 py-3 text-foreground">Pro Monthly Plan</td>
                <td className="px-4 py-3 text-foreground">€19.00</td>
                <td className="px-4 py-3">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm">
                    Download
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          <Button variant="primary" size="sm">View plans</Button>
          <Button variant="secondary" size="sm">
            Contact sales
          </Button>
        </div>
      </section>
    </div>
  );
}

// --- Danger Zone ---
function DangerZoneTab() {
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
        />
        <DangerRow
          title="Delete account"
          desc="Permanently delete your account and all associated data."
          action="Delete"
        />
        <DangerRow
          title="Remove all contract data"
          desc="Delete all uploaded contracts and analysis from this workspace."
          action="Delete"
        />
      </div>
    </div>
  );
}

function DangerRow({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Button variant="danger" size="sm">
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        {action}
      </Button>
    </div>
  );
}
