import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Mail, 
  Phone, 
  Building,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  AlertCircle,
  Search,
  Loader2,
  Trash2
} from "lucide-react";
import { api, type LeadStatus } from "../lib/api";
import { cn } from "../lib/utils";
import { OutreachPanel } from "../components/OutreachPanel";
import { OutreachHistory } from "../components/OutreachHistory";
import { ManualQualification } from "../components/ManualQualification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

/**
 * Safely parse JSON string, returning default value on error
 */
function safeJsonParse<T>(str: string | null | undefined, defaultValue: T): T {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.leads.get(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: LeadStatus; [key: string]: any }) =>
      api.leads.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      api.leads.addNote(id!, { content, type: "MANUAL" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setNewNote("");
    },
  });

  const enrichMutation = useMutation({
    mutationFn: () => api.leads.enrich(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      if (data.success) {
        alert(`✅ Email found: ${data.email}\nConfidence: ${data.confidence}%\nSource: ${data.source}`);
      } else {
        alert(`❌ ${data.message || "No email found"}`);
      }
    },
    onError: (error: Error) => {
      alert(`❌ Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.leads.delete(id!),
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      navigate("/leads");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-slate-700 dark:text-slate-300">Error loading lead</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error.message}</p>
          <Link to="/leads" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to leads
          </Link>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Lead not found</p>
        <Link to="/leads" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          ← Back to leads
        </Link>
      </div>
    );
  }

  // Safely parse JSON fields
  const scoreReasons = safeJsonParse<string[]>(lead.scoreReasons, []);
  const tags = safeJsonParse<string[]>(lead.tags, []);
  
  // Ensure arrays exist (defensive coding)
  const notes = lead.notes ?? [];
  const tasks = lead.tasks ?? [];
  const messages = lead.messages ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link
          to="/leads"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 self-start"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold break-words text-slate-900 dark:text-white">{lead.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{lead.source}</span>
            <a
              href={lead.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
            {lead.author && (
              <span>by {lead.author}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
            <Star className={cn(
              "w-4 h-4",
              lead.score >= 30 ? "text-yellow-500 fill-yellow-500" : "text-slate-400 dark:text-slate-500"
            )} />
            <span className="font-bold text-slate-900 dark:text-white">{lead.score}</span>
          </div>
          <select
            value={lead.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value as LeadStatus })}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium border-0",
              getStatusColor(lead.status)
            )}
          >
            {["NEW", "QUALIFIED", "CONTACTED", "FOLLOWUP_1", "FOLLOWUP_2",
              "RESPONDED", "CALL_SCHEDULED", "CALL_DONE", "PROPOSAL_SENT",
              "NEGOTIATING", "WON", "LOST", "ARCHIVED"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete lead"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {lead.description && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="font-semibold mb-3 text-slate-900 dark:text-white">Description</h2>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {lead.description}
              </p>
            </div>
          )}

          {/* Score Reasons */}
          {scoreReasons.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="font-semibold mb-3 text-slate-900 dark:text-white">Qualification Reasons</h2>
              <div className="flex flex-wrap gap-2">
                {scoreReasons.map((reason: string, i: number) => (
                  <span
                    key={i}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      reason.startsWith("+")
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                    )}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Notes</h2>
            
            {/* Add note form */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Note
              </button>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-4 rounded-lg",
                    note.type === "AI_ANALYSIS"
                      ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
                      : "bg-slate-50 dark:bg-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      {note.type === "AI_ANALYSIS" ? "🤖 AI Analysis" :
                       note.type === "AI_RESEARCH" ? "🔬 AI Research" :
                       note.type === "SYSTEM" ? "⚙️ System" : "📝 Note"}
                    </span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                    {note.aiModel && (
                      <>
                        <span>•</span>
                        <span>{note.aiModel}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">{note.content}</p>
                </div>
              ))}
              {!notes.length && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No notes yet</p>
              )}
            </div>
          </div>

          {/* Outreach History */}
          <OutreachHistory leadId={lead.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cold Outreach */}
          <OutreachPanel 
            leadId={lead.id} 
            leadEmail={lead.email}
            onEmailSent={() => queryClient.invalidateQueries({ queryKey: ["lead", id] })}
          />

          {/* Manual Qualification */}
          <ManualQualification
            leadId={lead.id}
            currentScore={lead.score}
            currentStatus={lead.status}
            currentScoreReasons={lead.scoreReasons}
            isManuallyScored={lead.scoreReasons?.includes("[Manual]")}
            qualifiedAt={lead.qualifiedAt}
          />

          {/* Contact Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">Contact Info</h2>
              {!lead.email && (
                <button
                  onClick={() => enrichMutation.mutate()}
                  disabled={enrichMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Find email using Hunter.io"
                >
                  {enrichMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Find Email
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <ContactField
                  icon={Mail}
                  label="Email"
                  value={lead.email}
                  editable
                  onSave={(v) => updateMutation.mutate({ email: v })}
                />
                {lead.emailSource && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                    Source: {lead.emailSource}
                    {lead.emailEnrichedAt && ` • ${new Date(lead.emailEnrichedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <ContactField
                icon={Phone}
                label="Phone"
                value={lead.phone}
                editable
                onSave={(v) => updateMutation.mutate({ phone: v })}
              />
              <ContactField
                icon={Building}
                label="Company"
                value={lead.company}
                editable
                onSave={(v) => updateMutation.mutate({ company: v })}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Budget</h2>
            {lead.budgetMin || lead.budgetMax ? (
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${lead.budgetMin?.toLocaleString() || "?"} - ${lead.budgetMax?.toLocaleString() || "?"}
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Not specified</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Timeline</h2>
            <div className="space-y-2 text-sm">
              <TimelineItem label="Scraped" date={lead.scrapedAt} />
              <TimelineItem label="Qualified" date={lead.qualifiedAt} />
              <TimelineItem label="Contacted" date={lead.contactedAt} />
              <TimelineItem label="Responded" date={lead.respondedAt} />
              <TimelineItem label="Closed" date={lead.closedAt} />
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">Tasks ({tasks.length})</h2>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      task.status === "COMPLETED"
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "bg-slate-50 dark:bg-slate-700"
                    )}
                  >
                    <div className="font-medium text-slate-900 dark:text-white">{task.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {task.type} • {task.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
              All associated notes, tasks, and messages will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
              disabled={deleteMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteMutation.mutate();
                setShowDeleteDialog(false);
              }}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Lead
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactField({
  icon: Icon,
  label,
  value,
  editable,
  onSave,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  editable?: boolean;
  onSave?: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  if (editing && editable) {
    return (
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            onSave?.(editValue);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave?.(editValue);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        editable && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 -mx-2 px-2 py-1 rounded"
      )}
      onClick={() => editable && setEditing(true)}
    >
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}:</span>
      <span className={cn("text-sm text-slate-700 dark:text-slate-200", !value && "text-slate-400 dark:text-slate-500 italic")}>
        {value || (editable ? "Click to add" : "—")}
      </span>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          date ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
        )}
      />
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      {date && (
        <span className="ml-auto text-slate-400 dark:text-slate-500">
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
    QUALIFIED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    CONTACTED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    RESPONDED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    WON: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    LOST: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  };
  return colors[status] || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
}
