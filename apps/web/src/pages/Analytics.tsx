import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Mail,
  Target
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Funnel,
  FunnelChart,
} from "recharts";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  indigo: "#6366f1",
};

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function Analytics() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [timelineGroupBy, setTimelineGroupBy] = useState<"day" | "week">("day");

  // Calculate date filters
  const getDateFilter = () => {
    if (dateRange === "all") return {};
    const days = parseInt(dateRange);
    const since = new Date();
    since.setDate(since.getDate() - days);
    return { since: since.toISOString(), until: new Date().toISOString() };
  };

  const dateFilter = getDateFilter();

  // Fetch data
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.stats.dashboard,
  });

  const { data: funnel } = useQuery({
    queryKey: ["funnel", dateFilter],
    queryFn: () => api.stats.funnel(dateFilter),
  });

  const { data: timeline } = useQuery({
    queryKey: ["timeline", dateRange, timelineGroupBy],
    queryFn: () => api.stats.timeline({ 
      days: dateRange === "all" ? 365 : parseInt(dateRange),
      groupBy: timelineGroupBy 
    }),
  });

  const { data: templates } = useQuery({
    queryKey: ["template-stats"],
    queryFn: api.stats.templates,
  });

  const { data: sources } = useQuery({
    queryKey: ["source-stats", dateFilter],
    queryFn: () => api.stats.sources(dateFilter),
  });

  const { data: conversionTime } = useQuery({
    queryKey: ["conversion-time"],
    queryFn: api.stats.conversionTime,
  });

  const handleExport = (type: "leads" | "timeline") => {
    api.stats.exportCSV(type, { days: dateRange === "all" ? "365" : dateRange.replace("d", "") });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-secondary mt-1">
            Performance metrics and conversion insights
          </p>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            {["7d", "30d", "90d", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as typeof dateRange)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  dateRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-card"
                )}
              >
                {range === "all" ? "All time" : range}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExport("timeline")}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={dashboard?.overview.totalLeads || 0}
          subtitle={`${dashboard?.overview.qualifiedLeads || 0} qualified`}
          icon={Target}
          color="primary"
        />
        <KPICard
          title="Response Rate"
          value={`${dashboard?.overview.responseRate || 0}%`}
          subtitle={`${dashboard?.overview.respondedLeads || 0} responses`}
          icon={Mail}
          color="purple"
        />
        <KPICard
          title="Conversion Rate"
          value={`${dashboard?.overview.winRate || 0}%`}
          subtitle={`${dashboard?.overview.dealsWon || 0} deals won`}
          icon={TrendingUp}
          color="success"
        />
        <KPICard
          title="Avg. Cycle Time"
          value={`${conversionTime?.totalAvg || 0}d`}
          subtitle="Lead to close"
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Timeline Chart */}
      <Card title="Lead Pipeline Timeline" icon={Activity}>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTimelineGroupBy("day")}
            className={cn(
              "px-3 py-1 text-sm rounded-md",
              timelineGroupBy === "day"
                ? "bg-primary/20 dark:bg-primary/40 text-primary dark:text-primary"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-card"
            )}
          >
            Daily
          </button>
          <button
            onClick={() => setTimelineGroupBy("week")}
            className={cn(
              "px-3 py-1 text-sm rounded-md",
              timelineGroupBy === "week"
                ? "bg-primary/20 dark:bg-primary/40 text-primary dark:text-primary"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-card"
            )}
          >
            Weekly
          </button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeline || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-slate-600 dark:fill-slate-400"
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis className="text-xs fill-slate-600 dark:fill-slate-400" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgb(30 41 59)", 
                border: "1px solid rgb(51 65 85)",
                borderRadius: "8px",
                color: "white"
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Area type="monotone" dataKey="new" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} name="New" />
            <Area type="monotone" dataKey="qualified" stackId="1" stroke={COLORS.purple} fill={COLORS.purple} name="Qualified" />
            <Area type="monotone" dataKey="contacted" stackId="1" stroke={COLORS.cyan} fill={COLORS.cyan} name="Contacted" />
            <Area type="monotone" dataKey="responded" stackId="1" stroke={COLORS.success} fill={COLORS.success} name="Responded" />
            <Area type="monotone" dataKey="won" stackId="1" stroke="#10b981" fill="#10b981" name="Won" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Conversion Funnel" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnel || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis type="number" className="text-xs fill-slate-600 dark:fill-slate-400" />
              <YAxis 
                dataKey="label" 
                type="category" 
                width={100}
                className="text-xs fill-slate-600 dark:fill-slate-400" 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgb(30 41 59)", 
                  border: "1px solid rgb(51 65 85)",
                  borderRadius: "8px",
                  color: "white"
                }}
              />
              <Bar dataKey="count" fill={COLORS.primary} radius={[0, 8, 8, 0]}>
                {funnel?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Conversion rates */}
          <div className="mt-4 space-y-2">
            {funnel?.slice(1).map((step, i) => (
              <div key={step.stage} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{step.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-nested rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", step.rate >= 50 ? "bg-green-600" : step.rate >= 25 ? "bg-yellow-500" : "bg-red-500")}
                      style={{ width: `${step.rate}%` }}
                    />
                  </div>
                  <span className="font-medium w-12 text-right">{step.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Conversion Time */}
        <Card title="Average Conversion Time" icon={Clock}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionTime?.stages || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis 
                dataKey="stage" 
                className="text-xs fill-slate-600 dark:fill-slate-400"
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs fill-slate-600 dark:fill-slate-400"
                label={{ value: "Days", angle: -90, position: "insideLeft" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgb(30 41 59)", 
                  border: "1px solid rgb(51 65 85)",
                  borderRadius: "8px",
                  color: "white"
                }}
                formatter={(value: number | undefined) => [`${value || 0} days`, "Avg. Time"]}
              />
              <Bar dataKey="avgDays" fill={COLORS.warning} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 text-center">
            <div className="text-3xl font-bold text-foreground">
              {conversionTime?.totalAvg || 0} days
            </div>
            <div className="text-sm text-secondary">
              Average total cycle time
            </div>
          </div>
        </Card>
      </div>

      {/* Sources & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <Card title="Top Lead Sources" icon={PieChartIcon}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sources?.slice(0, 6) || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.source}: ${entry.total}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total"
              >
                {sources?.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgb(30 41 59)", 
                  border: "1px solid rgb(51 65 85)",
                  borderRadius: "8px",
                  color: "white"
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Source details */}
          <div className="mt-4 space-y-2">
            {sources?.slice(0, 5).map((source, i) => (
              <div key={source.source} className="flex items-center justify-between p-2 bg-background dark:bg-card/50 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {source.source}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary">
                  <span>{source.total} leads</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {source.conversionRate}% won
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Template Performance */}
        <Card title="Email Template Performance" icon={Mail}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={templates?.slice(0, 8) || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-slate-600 dark:fill-slate-400"
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs fill-slate-600 dark:fill-slate-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgb(30 41 59)", 
                  border: "1px solid rgb(51 65 85)",
                  borderRadius: "8px",
                  color: "white"
                }}
              />
              <Legend />
              <Bar dataKey="sent" fill={COLORS.cyan} name="Sent" />
              <Bar dataKey="replied" fill={COLORS.success} name="Replied" />
            </BarChart>
          </ResponsiveContainer>

          {/* Template stats table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-secondary border-b border-border">
                <tr>
                  <th className="pb-2 font-medium">Template</th>
                  <th className="pb-2 font-medium text-center">Sent</th>
                  <th className="pb-2 font-medium text-center">Replied</th>
                  <th className="pb-2 font-medium text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {templates?.slice(0, 5).map((template) => (
                  <tr key={template.id} className="text-foreground dark:text-slate-300">
                    <td className="py-2 max-w-[200px] truncate">{template.name}</td>
                    <td className="py-2 text-center">{template.sent}</td>
                    <td className="py-2 text-center">{template.replied}</td>
                    <td className="py-2 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        template.replyRate >= 25 ? "bg-green-600/20 dark:bg-green-600/40 text-green-600 dark:text-green-500" :
                        template.replyRate >= 15 ? "bg-yellow-500/20 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" :
                        "bg-destructive/20 dark:bg-destructive/40 text-destructive dark:text-destructive"
                      )}>
                        {template.replyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <h2 className="font-semibold mb-6 flex items-center gap-2 text-foreground">
        <Icon className="w-5 h-5 text-blue-500" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType; 
  color: keyof typeof COLORS;
}) {
  const colorClasses = {
    blue: "bg-primary/10 dark:bg-blue-900/30 border-primary dark:border-primary text-blue-600 dark:text-blue-400",
    green: "bg-green-600/10 dark:bg-green-900/30 border-green-600 dark:border-green-700 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400",
    cyan: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400",
    primary: "bg-background dark:bg-card/30 border-border text-muted-foreground",
    success: "bg-green-600/10 dark:bg-green-900/30 border-green-600 dark:border-green-700 text-green-600 dark:text-green-400",
    warning: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400",
    danger: "bg-destructive/10 dark:bg-destructive/30 border-destructive dark:border-destructive text-red-600 dark:text-red-400",
    indigo: "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className={cn("p-6 rounded-lg border shadow-card", colorClasses[color])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground dark:text-slate-300">{title}</span>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <p className="text-sm text-secondary mt-1">{subtitle}</p>
    </div>
  );
}
