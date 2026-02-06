import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  Palette, 
  Shield,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Zap
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useTheme } from "../components/theme-provider";
import { cn } from "../lib/utils";

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "api" | "notifications" | "appearance">("profile");
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: api.settings.listApiKeys,
  });

  const createKeyMutation = useMutation({
    mutationFn: (name: string) => api.settings.createApiKey(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setCreatedKey(data.key);
      setNewKeyName("");
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => api.settings.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: SettingsIcon },
    { id: "api", label: "API Keys", icon: Key },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-secondary">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-card text-blue-600 dark:text-blue-400 border border-border border-b-white dark:border-b-slate-800 -mb-px"
                  : "text-secondary hover:text-foreground dark:hover:text-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Account Information
          </h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-background dark:bg-card text-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={user?.orgName || ""}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-background dark:bg-card text-secondary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="font-medium text-foreground mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background dark:bg-card rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {apiKeys?.length || 0}
                </div>
                <div className="text-xs text-secondary">API Keys</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-500" />
              API Keys
            </h2>
            <p className="text-sm text-secondary mb-4">
              Use API keys to integrate Hermes with your tools and scripts.
            </p>

            {/* Create new key */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., 'Scraper Bot')"
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName || createKeyMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {/* Newly created key warning */}
            {createdKey && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  ⚠️ Copy your API key now — you won't see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-card rounded border border-amber-200 dark:border-amber-600 text-sm font-mono text-foreground">
                    {createdKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKey)}
                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-800 rounded"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-amber-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Existing keys */}
            <div className="space-y-3">
              {keysLoading ? (
                <div className="animate-pulse h-16 bg-nested rounded-lg" />
              ) : apiKeys?.length === 0 ? (
                <p className="text-secondary text-center py-8">
                  No API keys yet. Create one to get started.
                </p>
              ) : (
                apiKeys?.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-background dark:bg-card rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{key.name}</p>
                      <p className="text-xs text-secondary">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="p-2 text-red-500 hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* API Usage Example */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">Usage Example</h3>
            <pre className="p-4 bg-background rounded-lg text-sm text-green-400 overflow-x-auto">
{`curl -X GET https://hermes.ndlz.net/api/leads \\
  -H "X-API-Key: hms_your_api_key_here"`}
            </pre>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-500" />
            Notification Preferences
          </h2>
          
          <div className="space-y-4">
            <NotificationToggle
              label="New Lead Alerts"
              description="Get notified when new qualified leads are found"
              defaultChecked={true}
            />
            <NotificationToggle
              label="Response Notifications"
              description="Alert when a lead responds to your outreach"
              defaultChecked={true}
            />
            <NotificationToggle
              label="Task Reminders"
              description="Reminders for upcoming and overdue tasks"
              defaultChecked={true}
            />
            <NotificationToggle
              label="Weekly Digest"
              description="Weekly summary of pipeline activity"
              defaultChecked={false}
            />
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-500" />
            Appearance
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-3">
                Theme
              </label>
              <div className="flex gap-3">
                <ThemeButton 
                  icon={Sun} 
                  label="Light" 
                  active={theme === "light"} 
                  onClick={() => setTheme("light")}
                />
                <ThemeButton 
                  icon={Moon} 
                  label="Dark" 
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                <ThemeButton 
                  icon={Zap} 
                  label="System" 
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 bg-background dark:bg-card rounded-lg">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-secondary">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-card transition-transform",
            enabled ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function ThemeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
        active
          ? "border-blue-500 bg-primary/10 dark:bg-blue-900/30"
          : "border-border hover:border-slate-300 dark:hover:border-slate-500"
      )}
    >
      <Icon className={cn("w-6 h-6", active ? "text-blue-600 dark:text-blue-400" : "text-slate-500")} />
      <span className={cn("text-sm font-medium", active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
