import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  Zap,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/templates", label: "Templates", icon: FileText },
  { path: "/stats", label: "Analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Hermes</h1>
          <p className="text-xs text-muted-foreground">SDR Agent CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {/* Theme Toggle */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator className="mb-3" />

        {/* User Info */}
        {user && (
          <div className="mb-3 rounded-lg bg-muted px-3 py-2">
            <p className="truncate text-sm font-medium">{user.email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.orgName}
            </p>
          </div>
        )}

        {/* Settings & Logout */}
        <div className="space-y-1">
          <Link to="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
