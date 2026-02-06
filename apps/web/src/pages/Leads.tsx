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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground dark:text-primary-foreground">Leads</h1>
          <p className="text-slate-500 dark:text-muted-foreground text-sm sm:text-base">
            {data?.total || 0} leads {hasActiveFilters ? "filtered" : "total"}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground hover:bg-muted dark:hover:bg-card rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, company, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Any score</option>
            <option value="15">Score ≥ 15</option>
            <option value="25">Score ≥ 25</option>
            <option value="35">Score ≥ 35</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              className="px-3 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              className="px-3 py-2 rounded-lg border border-border bg-card text-foreground dark:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-muted-foreground">Loading...</div>
        ) : !data?.leads.length ? (
          <div className="p-8 text-center text-slate-500 dark:text-muted-foreground">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-background dark:bg-card/50 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-muted-foreground"></th>
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
    <tr className="hover:bg-background dark:hover:bg-card/50">
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="block group"
        >
          <div className="font-medium text-foreground dark:text-primary-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
            {lead.title}
          </div>
          {lead.author && (
            <div className="text-sm text-slate-500 dark:text-muted-foreground">{lead.author}</div>
          )}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground dark:text-slate-300">{lead.source}</span>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground dark:text-slate-500 hover:text-blue-500"
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
            lead.score >= 15 ? "text-yellow-500" : "text-slate-300 dark:text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium",
            lead.score >= 30 ? "text-emerald-600 dark:text-emerald-400" :
            lead.score >= 15 ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-muted-foreground"
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
            <div className="absolute top-full left-0 mt-1 z-20 bg-card rounded-lg border border-border shadow-lg py-1 min-w-[140px]">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setShowStatusMenu(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm text-foreground dark:text-slate-200 hover:bg-muted dark:hover:bg-card",
                    lead.status === status && "font-medium bg-background dark:bg-card"
                  )}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-muted-foreground">
        {new Date(lead.scrapedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <Link
          to={`/leads/${lead.id}`}
          className="p-2 rounded-lg hover:bg-muted dark:hover:bg-card"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground dark:text-slate-500" />
        </Link>
      </td>
    </tr>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: "bg-muted dark:bg-card text-foreground dark:text-slate-300",
    QUALIFIED: "bg-primary/20 dark:bg-primary/40 text-primary dark:text-primary",
    CONTACTED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    FOLLOWUP_1: "bg-yellow-500/20 dark:bg-yellow-500/40 text-yellow-600 dark:text-yellow-500",
    FOLLOWUP_2: "bg-yellow-500/20 dark:bg-yellow-500/40 text-yellow-600 dark:text-yellow-500",
    RESPONDED: "bg-green-600/20 dark:bg-green-600/40 text-green-600 dark:text-green-500",
    CALL_SCHEDULED: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    CALL_DONE: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    PROPOSAL_SENT: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
    NEGOTIATING: "bg-yellow-500/20 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    WON: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    LOST: "bg-destructive/20 dark:bg-destructive/40 text-destructive dark:text-destructive",
    ARCHIVED: "bg-muted dark:bg-card text-slate-500 dark:text-muted-foreground",
  };
  return colors[status] || "bg-muted dark:bg-card text-foreground dark:text-slate-300";
}
