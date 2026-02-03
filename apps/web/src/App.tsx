import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  Settings,
  Zap,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { LeadDetail } from "./pages/LeadDetail";
import { Tasks } from "./pages/Tasks";
import { Templates } from "./pages/Templates";
import { Stats } from "./pages/Stats";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AuthProvider, useAuth, RequireAuth } from "./lib/auth";
import { cn } from "./lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/templates", label: "Templates", icon: FileText },
  { path: "/stats", label: "Analytics", icon: BarChart3 },
];

function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 lg:hidden">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          <span className="text-lg font-bold">Hermes</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">Hermes</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">SDR Agent CRM</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-slate-200 dark:border-slate-700">
          {user && (
            <div className="mb-2 px-3 py-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.orgName}</p>
            </div>
          )}
          <Link
            to="/settings"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
