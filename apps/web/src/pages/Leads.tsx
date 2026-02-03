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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-gray-500">
            {data?.total || 0} leads total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <select
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any score</option>
          <option value="15">Score ≥ 15</option>
          <option value="25">Score ≥ 25</option>
          <option value="35">Score ≥ 35</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : !data?.leads.length ? (
          <div className="p-8 text-center text-gray-500">No leads found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Lead</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Score</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
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
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="block group"
        >
          <div className="font-medium group-hover:text-blue-600 line-clamp-1">
            {lead.title}
          </div>
          {lead.author && (
            <div className="text-sm text-gray-500">{lead.author}</div>
          )}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{lead.source}</span>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500"
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
            lead.score >= 15 ? "text-yellow-500" : "text-gray-300"
          )} />
          <span className={cn(
            "font-medium",
            lead.score >= 30 ? "text-green-600" :
            lead.score >= 15 ? "text-blue-600" : "text-gray-500"
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
            <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 min-w-[140px]">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                    lead.status === status && "font-medium bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(lead.scrapedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </Link>
      </td>
    </tr>
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
