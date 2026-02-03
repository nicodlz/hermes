import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Star, 
  MoreHorizontal,
  ChevronDown
} from "lucide-react";
import { api, type Lead, type LeadStatus } from "../lib/api";
import { cn } from "../lib/utils";

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW", "QUALIFIED", "CONTACTED", "FOLLOWUP_1", "FOLLOWUP_2",
  "RESPONDED", "CALL_SCHEDULED", "CALL_DONE", "PROPOSAL_SENT",
  "NEGOTIATING", "WON", "LOST", "ARCHIVED"
];

export function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [minScore, setMinScore] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leads", statusFilter, minScore, search],
    queryFn: () => api.leads.list({
      ...(statusFilter && { status: statusFilter }),
      ...(minScore && { minScore }),
      ...(search && { search }),
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: LeadStatus } }) =>
      api.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Leads</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            {data?.total || 0} leads total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <select
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any score</option>
          <option value="15">Score ≥ 15</option>
          <option value="25">Score ≥ 25</option>
          <option value="35">Score ≥ 35</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading...</div>
        ) : !data?.leads.length ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Lead</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Source</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Score</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onStatusChange={(status) =>
                      updateMutation.mutate({ id: lead.id, data: { status } })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (status: LeadStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="block group"
        >
          <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
            {lead.title}
          </div>
          {lead.author && (
            <div className="text-sm text-slate-500 dark:text-slate-400">{lead.author}</div>
          )}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">{lead.source}</span>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 dark:text-slate-500 hover:text-blue-500"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Star className={cn(
            "w-4 h-4",
            lead.score >= 30 ? "text-yellow-500 fill-yellow-500" :
            lead.score >= 15 ? "text-yellow-500" : "text-slate-300 dark:text-slate-600"
          )} />
          <span className={cn(
            "font-medium",
            lead.score >= 30 ? "text-emerald-600 dark:text-emerald-400" :
            lead.score >= 15 ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {lead.score}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            getStatusColor(lead.status)
          )}
        >
          {lead.status.replace(/_/g, " ")}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showStatusMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowStatusMenu(false)}
            />
            <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-lg py-1 min-w-[140px]">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
                    lead.status === status && "font-medium bg-slate-50 dark:bg-slate-700"
                  )}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {new Date(lead.scrapedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </Link>
      </td>
    </tr>
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
