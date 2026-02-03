import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
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
  Plus
} from "lucide-react";
import { api, type LeadStatus } from "../lib/api";
import { cn } from "../lib/utils";

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: lead, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-gray-500">Lead not found</p>
        <Link to="/leads" className="text-blue-600 hover:underline mt-2 inline-block">
          ← Back to leads
        </Link>
      </div>
    );
  }

  const scoreReasons = lead.scoreReasons ? JSON.parse(lead.scoreReasons) : [];
  const tags = lead.tags ? JSON.parse(lead.tags) : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link
          to="/leads"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold break-words">{lead.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
            <span>{lead.source}</span>
            <a
              href={lead.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
            {lead.author && (
              <span>by {lead.author}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Star className={cn(
              "w-4 h-4",
              lead.score >= 30 ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
            )} />
            <span className="font-bold">{lead.score}</span>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {lead.description && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold mb-3">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {lead.description}
              </p>
            </div>
          )}

          {/* Score Reasons */}
          {scoreReasons.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold mb-3">Qualification Reasons</h2>
              <div className="flex flex-wrap gap-2">
                {scoreReasons.map((reason: string, i: number) => (
                  <span
                    key={i}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      reason.startsWith("+")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            
            {/* Add note form */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {lead.notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-4 rounded-lg",
                    note.type === "AI_ANALYSIS"
                      ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                      : "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
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
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {!lead.notes.length && (
                <p className="text-gray-500 text-sm">No notes yet</p>
              )}
            </div>
          </div>

          {/* Messages */}
          {lead.messages.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages ({lead.messages.length})
              </h2>
              <div className="space-y-3">
                {lead.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-4 rounded-lg",
                      msg.direction === "OUTBOUND"
                        ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                        : "bg-gray-50 dark:bg-gray-800 mr-8"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <span>{msg.direction === "OUTBOUND" ? "→ Sent" : "← Received"}</span>
                      <span>•</span>
                      <span>{msg.channel}</span>
                      <span>•</span>
                      <span>{msg.sentAt ? new Date(msg.sentAt).toLocaleString() : "Draft"}</span>
                    </div>
                    {msg.subject && (
                      <p className="font-medium mb-1">{msg.subject}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold mb-4">Contact Info</h2>
            <div className="space-y-3">
              <ContactField
                icon={Mail}
                label="Email"
                value={lead.email}
                editable
                onSave={(v) => updateMutation.mutate({ email: v })}
              />
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
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold mb-4">Budget</h2>
            {lead.budgetMin || lead.budgetMax ? (
              <p className="text-2xl font-bold">
                ${lead.budgetMin?.toLocaleString() || "?"} - ${lead.budgetMax?.toLocaleString() || "?"}
              </p>
            ) : (
              <p className="text-gray-500">Not specified</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold mb-4">Timeline</h2>
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
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {lead.tasks.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="font-semibold mb-4">Tasks ({lead.tasks.length})</h2>
              <div className="space-y-2">
                {lead.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      task.status === "COMPLETED"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-gray-50 dark:bg-gray-800"
                    )}
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.type} • {task.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
        <Icon className="w-4 h-4 text-gray-400" />
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
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        editable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1 rounded"
      )}
      onClick={() => editable && setEditing(true)}
    >
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={cn("text-sm", !value && "text-gray-400 italic")}>
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
          date ? "bg-green-500" : "bg-gray-300"
        )}
      />
      <span className="text-gray-500">{label}</span>
      {date && (
        <span className="ml-auto text-gray-400">
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: "bg-gray-100 text-gray-700",
    QUALIFIED: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-purple-100 text-purple-700",
    RESPONDED: "bg-green-100 text-green-700",
    WON: "bg-emerald-100 text-emerald-700",
    LOST: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
