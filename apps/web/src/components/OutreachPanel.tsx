import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, RefreshCw, Check, AlertCircle, Edit2 } from "lucide-react";
import { api, type EmailDraft, type OutreachTemplate } from "../lib/api";
import { cn } from "../lib/utils";

interface OutreachPanelProps {
  leadId: string;
  leadEmail?: string | null;
  onEmailSent?: () => void;
}

export function OutreachPanel({ leadId, leadEmail, onEmailSent }: OutreachPanelProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(leadEmail || "");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  // Fetch email draft
  const { data: draft, isLoading: draftLoading, refetch: refetchDraft } = useQuery<EmailDraft>({
    queryKey: ["outreach-draft", leadId, selectedTemplate],
    queryFn: () => api.outreach.getDraft(leadId, selectedTemplate),
  });

  // Update local state when draft loads
  useEffect(() => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
      if (draft.recipientEmail) setRecipientEmail(draft.recipientEmail);
    }
  }, [draft]);

  // Fetch templates
  const { data: templates } = useQuery<OutreachTemplate[]>({
    queryKey: ["outreach-templates"],
    queryFn: () => api.outreach.getTemplates()
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: () => api.outreach.sendEmail(leadId, {
      subject: editedSubject,
      body: editedBody,
      recipientEmail,
      recipientName: draft?.recipientName || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["outreach-draft", leadId] });
      setIsEditing(false);
      onEmailSent?.();
    }
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: () => api.outreach.saveDraft(leadId, {
      subject: editedSubject,
      body: editedBody,
      recipientEmail: recipientEmail || undefined
    }),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["outreach-draft", leadId] });
    }
  });

  const handleSend = () => {
    if (!recipientEmail) {
      alert("Email du destinataire requis");
      return;
    }
    if (!editedSubject || !editedBody) {
      alert("Sujet et corps de l'email requis");
      return;
    }
    sendMutation.mutate();
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId === "auto" ? undefined : templateId);
  };

  if (draftLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Génération de l'email...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-primary dark:border-primary p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-foreground">
          <Mail className="w-5 h-5 text-blue-500" />
          Cold Outreach
        </h2>
        <div className="flex items-center gap-2">
          {templates && (
            <select
              value={selectedTemplate || "auto"}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-border bg-card text-foreground"
            >
              <option value="auto">Auto-detect</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetchDraft()}
            className="p-1.5 rounded hover:bg-nested"
            title="Régénérer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Recipient Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
          Email destinataire
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="contact@company.com"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Email Preview/Edit */}
      <div className="space-y-3">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              placeholder="Sujet"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-background dark:hover:bg-card/50 rounded-lg p-3 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">
                {editedSubject || draft?.subject || "Sans sujet"}
              </span>
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-300 whitespace-pre-wrap line-clamp-6">
              {editedBody || draft?.body}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {isEditing ? (
          <>
            <button
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
              className="flex-1 px-4 py-2 bg-muted dark:bg-card text-foreground dark:text-slate-300 rounded-lg hover:bg-muted disabled:opacity-50"
            >
              Sauvegarder draft
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-500 hover:text-foreground"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-muted dark:bg-card text-foreground dark:text-slate-300 rounded-lg hover:bg-muted"
            >
              <Edit2 className="w-4 h-4 inline mr-1" />
              Modifier
            </button>
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || !recipientEmail}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2",
                sendMutation.isPending
                  ? "bg-primary text-primary-foreground"
                  : sendMutation.isSuccess
                  ? "bg-green-600 text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary",
                (!recipientEmail || sendMutation.isPending) && "opacity-50 cursor-not-allowed"
              )}
            >
              {sendMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : sendMutation.isSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendMutation.isPending ? "Envoi..." : sendMutation.isSuccess ? "Envoyé !" : "Envoyer"}
            </button>
          </>
        )}
      </div>

      {/* Error display */}
      {sendMutation.isError && (
        <div className="mt-3 p-3 bg-destructive/10 dark:bg-destructive/30 rounded-lg flex items-center gap-2 text-destructive dark:text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{(sendMutation.error as Error).message}</span>
        </div>
      )}

      {/* Template hint */}
      {draft?.templateName && (
        <p className="text-xs text-secondary mt-3">
          Template: {draft.templateName}
        </p>
      )}
    </div>
  );
}
