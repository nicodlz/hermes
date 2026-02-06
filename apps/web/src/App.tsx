import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { LeadDetail } from "./pages/LeadDetail";
import { Tasks } from "./pages/Tasks";
import { Templates } from "./pages/Templates";
import { Analytics } from "./pages/Analytics";
import { Settings as SettingsPage } from "./pages/Settings";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { VerifyMagicLink } from "./pages/VerifyMagicLink";
import { AuthProvider, RequireAuth } from "./lib/auth";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { AppSidebar } from "./components/app-sidebar";
import { AppHeader } from "./components/app-header";

function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <AppSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <AppHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/stats" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hermes-ui-theme">
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/verify" element={<VerifyMagicLink />} />

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
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
