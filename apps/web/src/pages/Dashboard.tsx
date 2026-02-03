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
    queryFn: api.stats.funnel,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">SDR performance overview</p>
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Conversion Funnel
          </h2>
          <div className="space-y-3">
            {funnel?.map((step, i) => (
              <FunnelStep
                key={step.stage}
                stage={step.stage}
                count={step.count}
                rate={step.rate}
                isFirst={i === 0}
              />
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Tasks
            {stats?.tasks.overdue ? (
              <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                {stats.tasks.overdue} overdue
              </span>
            ) : null}
          </h2>
          <div className="space-y-3">
            {pendingTasks?.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {!pendingTasks?.length && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No pending tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Pipeline Status</h2>
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
        "p-6 rounded-lg border shadow-sm",
        highlight
          ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <Icon className={cn("w-5 h-5", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")} />
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      {trend !== undefined && trendLabel && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp
            className={cn(
              "w-4 h-4",
              trendUp ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"
            )}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
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
      <div className="w-24 text-sm font-medium text-slate-600 dark:text-slate-300">{stage}</div>
      <div className="flex-1">
        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-3"
            style={{ width: `${Math.max(rate, 5)}%` }}
          >
            <span className="text-xs font-medium text-white">{count}</span>
          </div>
        </div>
      </div>
      <div className="w-16 text-right text-sm text-slate-500 dark:text-slate-400">
        {isFirst ? "" : `${rate}%`}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: any }) {
  const priorityColors = {
    URGENT: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    HIGH: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    MEDIUM: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    LOW: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          task.priority === "URGENT"
            ? "bg-red-500"
            : task.priority === "HIGH"
            ? "bg-orange-500"
            : "bg-slate-400"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-slate-900 dark:text-white">{task.title}</p>
        {task.lead && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{task.lead.title}</p>
        )}
      </div>
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full",
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
    NEW: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
    QUALIFIED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    CONTACTED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    FOLLOWUP_1: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    FOLLOWUP_2: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    RESPONDED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    CALL_SCHEDULED: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    CALL_DONE: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    PROPOSAL_SENT: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
    NEGOTIATING: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    WON: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    LOST: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    ARCHIVED: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  };
  return colors[status] || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
}
