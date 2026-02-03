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
    queryFn: api.stats.funnel,
  });

  const overview = dashboard?.overview;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">Performance metrics and conversion data</p>
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
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Conversion Funnel
        </h2>
        <div className="space-y-4">
          {funnel?.map((step, i) => (
            <div key={step.stage} className="flex items-center gap-4">
              <div className="w-28 text-sm font-medium text-gray-600">
                {step.stage}
              </div>
              <div className="flex-1">
                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-500",
                      i === 0 ? "bg-blue-500" :
                      i === funnel.length - 1 ? "bg-green-500" :
                      "bg-blue-400"
                    )}
                    style={{ width: `${Math.max(step.rate, 3)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="font-bold text-white mix-blend-difference">
                      {step.count}
                    </span>
                    {i > 0 && (
                      <span className="text-sm font-medium text-gray-500">
                        {step.rate}% from previous
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-20 text-right">
                {i > 0 && (
                  <div className={cn(
                    "flex items-center justify-end gap-1 text-sm",
                    step.rate >= 50 ? "text-green-600" :
                    step.rate >= 25 ? "text-yellow-600" :
                    "text-red-600"
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
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold mb-6">Daily Activity (Last 30 Days)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-3">Date</th>
                <th className="pb-3 text-center">Scraped</th>
                <th className="pb-3 text-center">Qualified</th>
                <th className="pb-3 text-center">Contacted</th>
                <th className="pb-3 text-center">Responded</th>
                <th className="pb-3 text-center">Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dailyStats?.slice(-14).reverse().map((day) => (
                <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {day.leadsScraped}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400">
                      {day.leadsQualified}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-400">
                      {day.leadsContacted}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                      {day.leadsResponded}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    {day.dealsWon > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-700 dark:text-emerald-400 font-medium">
                        🎉 {day.dealsWon}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold mb-4">Pipeline Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(dashboard?.pipeline || {}).map(([status, count]) => (
            <div
              key={status}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center"
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-gray-500 mt-1">
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
        "p-6 rounded-lg border",
        highlight
          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <Icon className={cn("w-5 h-5", highlight ? "text-green-600" : "text-gray-400")} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {target !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isGood ? "bg-green-500" : "bg-yellow-500"
              )}
              style={{ width: `${Math.min((current || 0) / target * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">/{target}%</span>
        </div>
      )}
    </div>
  );
}
