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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">SDR performance overview</p>
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
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Tasks
            {stats?.tasks.overdue ? (
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {stats.tasks.overdue} overdue
              </span>
            ) : null}
          </h2>
          <div className="space-y-3">
            {pendingTasks?.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {!pendingTasks?.length && (
              <p className="text-gray-500 text-sm">No pending tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold mb-4">Pipeline Status</h2>
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
        "p-6 rounded-lg border",
        highlight
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <Icon className={cn("w-5 h-5", highlight ? "text-green-600" : "text-gray-400")} />
      </div>
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      {trend !== undefined && trendLabel && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp
            className={cn(
              "w-4 h-4",
              trendUp ? "text-green-500" : "text-gray-400"
            )}
          />
          <span className="text-xs text-gray-500">
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
      <div className="w-24 text-sm font-medium text-gray-600">{stage}</div>
      <div className="flex-1">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-3"
            style={{ width: `${Math.max(rate, 5)}%` }}
          >
            <span className="text-xs font-medium text-white">{count}</span>
          </div>
        </div>
      </div>
      <div className="w-16 text-right text-sm text-gray-500">
        {isFirst ? "" : `${rate}%`}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: any }) {
  const priorityColors = {
    URGENT: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          task.priority === "URGENT"
            ? "bg-red-500"
            : task.priority === "HIGH"
            ? "bg-orange-500"
            : "bg-gray-400"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.lead && (
          <p className="text-xs text-gray-500 truncate">{task.lead.title}</p>
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
    NEW: "bg-gray-100 text-gray-700",
    QUALIFIED: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-purple-100 text-purple-700",
    FOLLOWUP_1: "bg-orange-100 text-orange-700",
    FOLLOWUP_2: "bg-orange-100 text-orange-700",
    RESPONDED: "bg-green-100 text-green-700",
    CALL_SCHEDULED: "bg-cyan-100 text-cyan-700",
    CALL_DONE: "bg-cyan-100 text-cyan-700",
    PROPOSAL_SENT: "bg-indigo-100 text-indigo-700",
    NEGOTIATING: "bg-yellow-100 text-yellow-700",
    WON: "bg-emerald-100 text-emerald-700",
    LOST: "bg-red-100 text-red-700",
    ARCHIVED: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
