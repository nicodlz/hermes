import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Star, 
  MoreHorizontal,
  ChevronDown,
  Calendar,
  X
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">(
    (searchParams.get("status") as LeadStatus) || ""
  );
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("source") || "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (sourceFilter) params.source = sourceFilter;
    if (minScore) params.minScore = minScore;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter, sourceFilter, minScore, dateFrom, dateTo, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["leads", statusFilter, minScore, sourceFilter, debouncedSearch, dateFrom, dateTo],
    queryFn: () => api.leads.list({
      ...(statusFilter && { status: statusFilter }),
      ...(minScore && { minScore }),
      ...(sourceFilter && { source: sourceFilter }),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: LeadStatus } }) =>
      api.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  // Get unique sources from leads for filter dropdown
  const sources = data?.leads 
    ? Array.from(new Set(data.leads.map(lead => lead.source))).sort()
    : [];

  // Check if any filters are active
  const hasActiveFilters = !!(search || statusFilter || sourceFilter || minScore || dateFrom || dateTo);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setSourceFilter("");
    setMinScore("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-secondary text-sm sm:text-base">
            {data?.total || 0} leads {hasActiveFilters ? "filtered" : "total"}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-foreground hover:bg-nested rounded-lg transition-colors border border-border"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-card space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder="Search by title, company, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-nested text-foreground placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
            className="px-4 py-2 rounded-lg border border-border bg-nested text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-nested text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-nested text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Any score</option>
            <option value="15">Score ≥ 15</option>
            <option value="25">Score ≥ 25</option>
            <option value="35">Score ≥ 35</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-tertiary" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              className="px-3 py-2 rounded-lg border border-border bg-nested text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <span className="text-secondary text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              className="px-3 py-2 rounded-lg border border-border bg-nested text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-8 text-center text-secondary">Loading...</div>
        ) : !data?.leads.length ? (
          <div className="p-8 text-center text-secondary">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-nested text-left border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-secondary">Lead</th>
                  <th className="px-4 py-3 text-sm font-medium text-secondary">Source</th>
                  <th className="px-4 py-3 text-sm font-medium text-secondary">Score</th>
                  <th className="px-4 py-3 text-sm font-medium text-secondary">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-secondary">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-secondary"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
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
    <tr className="hover:bg-nested transition-colors">
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="block group"
        >
          <div className="font-medium text-foreground group-hover:text-primary line-clamp-1">
            {lead.title}
          </div>
          {lead.author && (
            <div className="text-sm text-tertiary">{lead.author}</div>
          )}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">{lead.source}</span>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tertiary hover:text-primary"
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
            lead.score >= 15 ? "text-yellow-500" : "text-tertiary"
          )} />
          <span className={cn(
            "font-medium",
            lead.score >= 30 ? "text-emerald-600 dark:text-emerald-400" :
            lead.score >= 15 ? "text-primary" : "text-tertiary"
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
            <div className="absolute top-full left-0 mt-1 z-20 bg-card rounded-lg border border-border shadow-card-hover py-1 min-w-[140px]">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-nested",
                    lead.status === status && "font-medium bg-nested"
                  )}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-tertiary">
        {new Date(lead.scrapedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="p-2 rounded-lg hover:bg-nested inline-block"
        >
          <MoreHorizontal className="w-4 h-4 text-tertiary hover:text-foreground" />
        </Link>
      </td>
    </tr>
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
