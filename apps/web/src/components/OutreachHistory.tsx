import { useQuery } from "@tanstack/react-query";
import { Mail, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { api, type Message } from "../lib/api";
import { cn } from "../lib/utils";

interface OutreachHistoryProps {
  leadId: string;
}

export function OutreachHistory({ leadId }: OutreachHistoryProps) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["outreach-messages", leadId],
    queryFn: () => api.outreach.getMessages(leadId),
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted dark:bg-card rounded w-1/3" />
          <div className="h-20 bg-muted dark:bg-card rounded" />
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Mail className="w-5 h-5 text-blue-500" />
          Outreach History
        </h2>
        <p className="text-sm text-secondary">
          No outreach sent yet. Use the panel above to send your first email.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <h2 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Mail className="w-5 h-5 text-blue-500" />
        Outreach History ({messages.length})
      </h2>
      
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "p-4 rounded-lg border",
              message.direction === "OUTBOUND"
                ? "bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary"
                : "bg-nested border-border"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusIcon status={message.status} />
                <span className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                  {getStatusLabel(message.status)}
                </span>
              </div>
              <span className="text-xs text-secondary">
                {message.sentAt ? new Date(message.sentAt).toLocaleString() : "Draft"}
              </span>
            </div>

            {/* Subject */}
            {message.subject && (
              <p className="font-medium text-sm mb-1 text-foreground">
                {message.subject}
              </p>
            )}

            {/* Content preview */}
            <p className="text-xs text-muted-foreground dark:text-slate-300 line-clamp-2">
              {message.content}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
              <span>{message.channel}</span>
              {message.templateId && (
                <>
                  <span>•</span>
                  <span>Template used</span>
                </>
              )}
              {message.externalId && (
                <>
                  <span>•</span>
                  <span className="font-mono">{message.externalId.substring(0, 8)}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SENT":
    case "DELIVERED":
      return <Send className="w-4 h-4 text-blue-600" />;
    case "READ":
    case "REPLIED":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "BOUNCED":
    case "FAILED":
      return <XCircle className="w-4 h-4 text-red-600" />;
    case "DRAFT":
    case "SCHEDULED":
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    default:
      return <Mail className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
