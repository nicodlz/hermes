const API_URL = import.meta.env.VITE_API_URL || "";

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // Include cookies for session auth
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    // If unauthorized, redirect to login
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Leads
  leads: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<{ leads: Lead[]; total: number }>(`/api/leads${qs}`);
    },
    get: (id: string) => fetcher<LeadDetail>(`/api/leads/${id}`),
    create: (data: CreateLead) => fetcher<Lead>("/api/leads", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UpdateLead) => fetcher<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetcher(`/api/leads/${id}`, { method: "DELETE" }),
    addNote: (id: string, data: { content: string; type?: string }) => 
      fetcher(`/api/leads/${id}/notes`, { method: "POST", body: JSON.stringify(data) }),
    pipeline: () => fetcher<Record<string, number>>("/api/leads/stats/pipeline"),
    enrich: (id: string) => fetcher<EnrichmentResult>(`/api/leads/${id}/enrich`, { method: "POST" }),
  },

  // Tasks
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<Task[]>(`/api/tasks${qs}`);
    },
    pending: () => fetcher<Task[]>("/api/tasks/pending"),
    overdue: () => fetcher<Task[]>("/api/tasks/overdue"),
    create: (data: CreateTask) => fetcher<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTask) => fetcher<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    complete: (id: string) => fetcher<Task>(`/api/tasks/${id}/complete`, { method: "POST" }),
    delete: (id: string) => fetcher(`/api/tasks/${id}`, { method: "DELETE" }),
  },

  // Templates
  templates: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<Template[]>(`/api/templates${qs}`);
    },
    get: (id: string) => fetcher<Template>(`/api/templates/${id}`),
    create: (data: CreateTemplate) => fetcher<Template>("/api/templates", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateTemplate>) => fetcher<Template>(`/api/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    render: (id: string, variables: Record<string, string>) => 
      fetcher<{ subject: string; content: string }>(`/api/templates/${id}/render`, { method: "POST", body: JSON.stringify(variables) }),
    delete: (id: string) => fetcher(`/api/templates/${id}`, { method: "DELETE" }),
  },

  // Stats
  stats: {
    dashboard: () => fetcher<DashboardStats>("/api/stats/dashboard"),
    daily: (days?: number) => fetcher<DailyStats[]>(`/api/stats/daily${days ? `?days=${days}` : ""}`),
    funnel: (params?: { since?: string; until?: string }) => {
      const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
      return fetcher<FunnelStep[]>(`/api/stats/funnel${qs}`);
    },
    timeline: (params?: { days?: number; groupBy?: "day" | "week" }) => {
      const qs = params ? `?${new URLSearchParams({ 
        days: params.days?.toString() || "30",
        groupBy: params.groupBy || "day"
      })}` : "";
      return fetcher<TimelineData[]>(`/api/stats/timeline${qs}`);
    },
    templates: () => fetcher<TemplateStats[]>("/api/stats/templates"),
    sources: (params?: { since?: string; until?: string }) => {
      const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : "";
      return fetcher<SourceStats[]>(`/api/stats/sources${qs}`);
    },
    conversionTime: () => fetcher<ConversionTimeStats>("/api/stats/conversion-time"),
    exportCSV: (type: "leads" | "timeline", params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams({ type, ...params })}` : `?type=${type}`;
      return fetch(`${API_URL}/api/stats/export${qs}`, { credentials: "include" })
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `hermes-${type}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });
    },
  },

  // AI
  ai: {
    nextActions: () => fetcher<NextActions>("/api/ai/next-actions"),
    digest: () => fetcher<Digest>("/api/ai/digest"),
    qualify: (id: string, data: QualifyData) => 
      fetcher(`/api/ai/qualify/${id}`, { method: "POST", body: JSON.stringify(data) }),
  },

  // Settings
  settings: {
    listApiKeys: () => fetcher<ApiKey[]>("/api/auth/api-keys"),
    createApiKey: (name: string) => fetcher<{ key: string; id: string }>("/api/auth/api-keys", { 
      method: "POST", 
      body: JSON.stringify({ name }) 
    }),
    deleteApiKey: (id: string) => fetcher(`/api/auth/api-keys/${id}`, { method: "DELETE" }),
  },

  // Outreach
  outreach: {
    getDraft: (leadId: string, template?: string) => {
      const qs = template ? `?template=${template}` : "";
      return fetcher<EmailDraft>(`/api/outreach/leads/${leadId}/draft${qs}`);
    },
    saveDraft: (leadId: string, data: { subject: string; body: string; recipientEmail?: string; templateId?: string }) =>
      fetcher<Message>(`/api/outreach/leads/${leadId}/draft`, { method: "POST", body: JSON.stringify(data) }),
    sendEmail: (leadId: string, data: { subject: string; body: string; recipientEmail: string; recipientName?: string; templateId?: string }) =>
      fetcher<{ success: boolean; messageId: string; resendId: string }>(`/api/outreach/leads/${leadId}/send`, { method: "POST", body: JSON.stringify(data) }),
    getMessages: (leadId: string) => fetcher<Message[]>(`/api/outreach/leads/${leadId}/messages`),
    getTemplates: () => fetcher<OutreachTemplate[]>("/api/outreach/templates"),
  },
};

// Types
export interface Lead {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  description?: string;
  author?: string;
  authorUrl?: string;
  score: number;
  scoreReasons?: string;
  status: LeadStatus;
  email?: string;
  emailSource?: string;
  emailEnrichedAt?: string;
  phone?: string;
  company?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  tags?: string;
  scrapedAt: string;
  qualifiedAt?: string;
  contactedAt?: string;
  respondedAt?: string;
  closedAt?: string;
  _count?: { notes: number; tasks: number; messages: number };
}

export interface LeadDetail extends Lead {
  notes: Note[];
  tasks: Task[];
  messages: Message[];
  proposals: Proposal[];
}

export type LeadStatus = 
  | "NEW" | "QUALIFIED" | "CONTACTED" | "FOLLOWUP_1" | "FOLLOWUP_2" 
  | "RESPONDED" | "CALL_SCHEDULED" | "CALL_DONE" | "PROPOSAL_SENT" 
  | "NEGOTIATING" | "WON" | "LOST" | "ARCHIVED";

export interface CreateLead {
  source: string;
  sourceUrl: string;
  title: string;
  description?: string;
  author?: string;
  score?: number;
}

export interface UpdateLead {
  status?: LeadStatus;
  score?: number;
  scoreReasons?: string;
  email?: string;
  phone?: string;
  company?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export interface Note {
  id: string;
  content: string;
  type: "MANUAL" | "AI_ANALYSIS" | "AI_RESEARCH" | "SYSTEM";
  aiModel?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  leadId?: string;
  lead?: { id: string; title: string; author?: string; status: LeadStatus };
  title: string;
  description?: string;
  type: "FOLLOWUP" | "CALL" | "EMAIL" | "RESEARCH" | "PROPOSAL" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateTask {
  leadId?: string;
  title: string;
  description?: string;
  type?: Task["type"];
  priority?: Task["priority"];
  dueAt?: string;
}

export interface UpdateTask extends Partial<CreateTask> {
  status?: Task["status"];
}

export interface Message {
  id: string;
  channel: string;
  direction: "OUTBOUND" | "INBOUND";
  subject?: string;
  content: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  templateId?: string;
  template?: Template;
  externalId?: string;
}

export interface Proposal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  channel?: string;
  subject?: string;
  content: string;
  variables?: string;
  usageCount: number;
  replyRate?: number | null;
  isActive: boolean;
}

export interface CreateTemplate {
  name: string;
  description?: string;
  type: string;
  channel?: string;
  subject?: string;
  content: string;
  variables?: string;
}

export interface DashboardStats {
  overview: {
    totalLeads: number;
    qualifiedLeads: number;
    contactedLeads: number;
    respondedLeads: number;
    dealsWon: number;
    dealsLost: number;
    responseRate: number;
    winRate: number;
  };
  tasks: { pending: number; overdue: number };
  pipeline: Record<string, number>;
}

export interface DailyStats {
  date: string;
  leadsScraped: number;
  leadsQualified: number;
  leadsContacted: number;
  leadsResponded: number;
  dealsWon: number;
}

export interface FunnelStep {
  stage: string;
  label: string;
  count: number;
  rate: number;
}

export interface TimelineData {
  date: string;
  new: number;
  qualified: number;
  contacted: number;
  responded: number;
  won: number;
  lost: number;
}

export interface TemplateStats {
  id: string;
  name: string;
  type: string;
  usageCount: number;
  sent: number;
  replied: number;
  replyRate: number;
}

export interface SourceStats {
  source: string;
  total: number;
  avgScore: number;
  qualified: number;
  contacted: number;
  responded: number;
  won: number;
  conversionRate: number;
}

export interface ConversionTimeStats {
  stages: {
    stage: string;
    avgDays: number;
    count: number;
  }[];
  totalAvg: number;
}

export interface NextActions {
  tasks: Task[];
  toQualify: Lead[];
  toContact: Lead[];
  toFollowUp: Lead[];
  summary: Record<string, number>;
}

export interface Digest {
  date: string;
  summary: Record<string, number>;
  pipeline: Record<string, number>;
  actions: Record<string, boolean>;
}

export interface QualifyData {
  score: number;
  reasons: string[];
  analysis?: string;
  aiModel?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface EmailDraft {
  id?: string;
  subject: string;
  body: string;
  templateId?: string;
  templateName?: string;
  recipientEmail?: string;
  recipientName?: string;
  isExisting: boolean;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  subject: string | null;
  preview: string;
  usageCount: number;
  replyRate: number | null;
}

export interface EnrichmentResult {
  success?: boolean;
  email?: string;
  confidence?: number;
  source?: string;
  message?: string;
  error?: string;
}
