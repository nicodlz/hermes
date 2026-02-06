import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Trophy, 
  AlertTriangle,
  TrendingUp,
  Clock
} from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.stats.dashboard,
  });

  const { data: pendingTasks } = useQuery({
    queryKey: ["pending-tasks"],
    queryFn: api.tasks.pending,
  });

  const { data: funnel } = useQuery({
    queryKey: ["funnel"],
    queryFn: () => api.stats.funnel(),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-nested rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-card border border-border rounded-lg shadow-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview = stats?.overview;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-secondary text-sm sm:text-base">SDR performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={overview?.totalLeads || 0}
          subtitle={`${overview?.qualifiedLeads || 0} qualified`}
          icon={Users}
          trend={overview?.qualifiedLeads ? Math.round((overview.qualifiedLeads / overview.totalLeads) * 100) : 0}
          trendLabel="qualification rate"
        />
        <StatCard
          title="Contacted"
          value={overview?.contactedLeads || 0}
          subtitle={`${overview?.responseRate || 0}% response rate`}
          icon={MessageSquare}
          trend={overview?.responseRate || 0}
          trendLabel="response rate"
          trendUp={overview?.responseRate ? overview.responseRate > 20 : false}
        />
        <StatCard
          title="Responses"
          value={overview?.respondedLeads || 0}
          subtitle="leads replied"
          icon={Phone}
        />
        <StatCard
          title="Deals Won"
          value={overview?.dealsWon || 0}
          subtitle={`${overview?.winRate || 0}% win rate`}
          icon={Trophy}
          trend={overview?.winRate || 0}
          trendLabel="win rate"
          trendUp={overview?.winRate ? overview.winRate > 30 : false}
          highlight
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6 shadow-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Conversion Funnel
          </h2>
          <div className="space-y-3">
            {funnel && funnel.map((step, i) => (
              <FunnelStep
                key={step.stage}
                stage={step.label}
                count={step.count}
                rate={step.rate}
                isFirst={i === 0}
              />
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Tasks
            {stats?.tasks.overdue ? (
              <span className="ml-auto text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">
                {stats.tasks.overdue} overdue
              </span>
            ) : null}
          </h2>
          <div className="space-y-3">
            {pendingTasks?.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {!pendingTasks?.length && (
              <p className="text-secondary text-sm">No pending tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-card">
        <h2 className="font-semibold mb-4 text-foreground">Pipeline Status</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats?.pipeline || {}).map(([status, count]) => (
            <div
              key={status}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                getStatusColor(status)
              )}
            >
              {status.replace(/_/g, " ")}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  trendUp,
  highlight,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  trendUp?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-6 rounded-lg border shadow-card",
        highlight
          ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-secondary">{title}</span>
        <Icon className={cn("w-5 h-5", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-tertiary")} />
      </div>
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      <p className="text-sm text-secondary mt-1">{subtitle}</p>
      {trend !== undefined && trendLabel && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp
            className={cn(
              "w-4 h-4",
              trendUp ? "text-emerald-500" : "text-tertiary"
            )}
          />
          <span className="text-xs text-tertiary">
            {trend}% {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function FunnelStep({
  stage,
  count,
  rate,
  isFirst,
}: {
  stage: string;
  count: number;
  rate: number;
  isFirst: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-sm font-medium text-secondary">{stage}</div>
      <div className="flex-1">
        <div className="h-8 bg-nested rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary rounded-full flex items-center justify-end pr-3"
            style={{ width: `${Math.max(rate, 5)}%` }}
          >
            <span className="text-xs font-medium text-primary-foreground">{count}</span>
          </div>
        </div>
      </div>
      <div className="w-16 text-right text-sm text-tertiary">
        {isFirst ? "" : `${rate}%`}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: any }) {
  const priorityColors = {
    URGENT: "bg-destructive/20 text-destructive font-medium",
    HIGH: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 font-medium",
    MEDIUM: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-medium",
    LOW: "bg-nested text-secondary",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-nested border border-border">
      <div
        className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          task.priority === "URGENT"
            ? "bg-red-500"
            : task.priority === "HIGH"
            ? "bg-orange-500"
            : "bg-slate-400 dark:bg-slate-600"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{task.title}</p>
        {task.lead && (
          <p className="text-xs text-tertiary truncate">{task.lead.title}</p>
        )}
      </div>
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
          priorityColors[task.priority as keyof typeof priorityColors]
        )}
      >
        {task.type}
      </span>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: "bg-nested text-secondary border border-border",
    QUALIFIED: "bg-primary/20 text-primary border border-primary/30",
    CONTACTED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700",
    FOLLOWUP_1: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-300 dark:border-yellow-700",
    FOLLOWUP_2: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-300 dark:border-yellow-700",
    RESPONDED: "bg-green-600/20 text-green-700 dark:text-green-500 border border-green-300 dark:border-green-700",
    CALL_SCHEDULED: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700",
    CALL_DONE: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700",
    PROPOSAL_SENT: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700",
    NEGOTIATING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700",
    WON: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700",
    LOST: "bg-destructive/20 text-destructive border border-destructive/30",
    ARCHIVED: "bg-nested text-tertiary border border-border",
  };
  return colors[status] || "bg-nested text-secondary border border-border";
}
