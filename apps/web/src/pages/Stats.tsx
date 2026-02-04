import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Trophy,
  Calendar
} from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

export function Stats() {
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.stats.dashboard,
  });

  const { data: dailyStats } = useQuery({
    queryKey: ["daily-stats"],
    queryFn: () => api.stats.daily(30),
  });

  const { data: funnel } = useQuery({
    queryKey: ["funnel"],
    queryFn: () => api.stats.funnel(),
  });

  const overview = dashboard?.overview;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Performance metrics and conversion data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={overview?.totalLeads || 0}
          icon={Users}
        />
        <MetricCard
          title="Response Rate"
          value={`${overview?.responseRate || 0}%`}
          icon={MessageSquare}
          target={25}
          current={overview?.responseRate}
        />
        <MetricCard
          title="Win Rate"
          value={`${overview?.winRate || 0}%`}
          icon={Trophy}
          target={30}
          current={overview?.winRate}
          highlight
        />
        <MetricCard
          title="Active Pipeline"
          value={
            (overview?.qualifiedLeads || 0) +
            (overview?.contactedLeads || 0) -
            (overview?.respondedLeads || 0)
          }
          icon={Calendar}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Conversion Funnel
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {funnel && funnel.map((step, i) => (
            <div key={step.stage} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="w-full sm:w-28 text-sm font-medium text-slate-600 dark:text-slate-300">
                {step.label}
              </div>
              <div className="flex-1">
                <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-500",
                      i === 0 ? "bg-blue-500" :
                      i === funnel.length - 1 ? "bg-emerald-500" :
                      "bg-blue-400"
                    )}
                    style={{ width: `${Math.max(step.rate, 3)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="font-bold text-white mix-blend-difference">
                      {step.count}
                    </span>
                    {i > 0 && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {step.rate}% from previous
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-20 text-right">
                {i > 0 && (
                  <div className={cn(
                    "flex items-center justify-end gap-1 text-sm",
                    step.rate >= 50 ? "text-emerald-600 dark:text-emerald-400" :
                    step.rate >= 25 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {step.rate >= 50 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {step.rate}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-4 sm:mb-6 text-slate-900 dark:text-white">Daily Activity (Last 30 Days)</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="pb-3">Date</th>
                <th className="pb-3 text-center">Scraped</th>
                <th className="pb-3 text-center">Qualified</th>
                <th className="pb-3 text-center">Contacted</th>
                <th className="pb-3 text-center">Responded</th>
                <th className="pb-3 text-center">Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {dailyStats?.slice(-14).reverse().map((day) => (
                <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                  <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                      {day.leadsScraped}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-blue-700 dark:text-blue-300">
                      {day.leadsQualified}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded text-purple-700 dark:text-purple-300">
                      {day.leadsContacted}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-green-700 dark:text-green-300">
                      {day.leadsResponded}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    {day.dealsWon > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded text-emerald-700 dark:text-emerald-300 font-medium">
                        🎉 {day.dealsWon}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Pipeline Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Object.entries(dashboard?.pipeline || {}).map(([status, count]) => (
            <div
              key={status}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700 text-center"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {status.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  target,
  current,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  target?: number;
  current?: number;
  highlight?: boolean;
}) {
  const isGood = target && current ? current >= target : undefined;

  return (
    <div
      className={cn(
        "p-6 rounded-lg border shadow-sm",
        highlight
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-700"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <Icon className={cn("w-5 h-5", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")} />
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
      {target !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isGood ? "bg-emerald-500" : "bg-yellow-500"
              )}
              style={{ width: `${Math.min((current || 0) / target * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">/{target}%</span>
        </div>
      )}
    </div>
  );
}
