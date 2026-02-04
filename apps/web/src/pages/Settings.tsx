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
import { cn } from "../lib/utils";

export function Settings() {
  const { user } = useAuth();
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800 -mb-px"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Account Information
          </h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={user?.orgName || ""}
                disabled
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {apiKeys?.length || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">API Keys</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-500" />
              API Keys
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Use API keys to integrate Hermes with your tools and scripts.
            </p>

            {/* Create new key */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., 'Scraper Bot')"
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                onClick={() => createKeyMutation.mutate(newKeyName)}
                disabled={!newKeyName || createKeyMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded border border-amber-200 dark:border-amber-600 text-sm font-mono text-slate-900 dark:text-white">
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
                <div className="animate-pulse h-16 bg-slate-100 dark:bg-slate-700 rounded-lg" />
              ) : apiKeys?.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No API keys yet. Create one to get started.
                </p>
              ) : (
                apiKeys?.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{key.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* API Usage Example */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Usage Example</h3>
            <pre className="p-4 bg-slate-900 rounded-lg text-sm text-green-400 overflow-x-auto">
{`curl -X GET https://hermes.ndlz.net/api/leads \\
  -H "X-API-Key: hms_your_api_key_here"`}
            </pre>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
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
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-500" />
            Appearance
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Theme
              </label>
              <div className="flex gap-3">
                <ThemeButton icon={Sun} label="Light" active={false} />
                <ThemeButton icon={Moon} label="Dark" active={true} />
                <ThemeButton icon={Zap} label="System" active={false} />
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
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
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
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
      )}
    >
      <Icon className={cn("w-6 h-6", active ? "text-blue-600 dark:text-blue-400" : "text-slate-500")} />
      <span className={cn("text-sm font-medium", active ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400")}>
        {label}
      </span>
    </button>
  );
}
