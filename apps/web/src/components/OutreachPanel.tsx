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
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Génération de l'email...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
          <Mail className="w-5 h-5 text-blue-500" />
          Cold Outreach
        </h2>
        <div className="flex items-center gap-2">
          {templates && (
            <select
              value={selectedTemplate || "auto"}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="auto">Auto-detect</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetchDraft()}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Régénérer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Recipient Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Email destinataire
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="contact@company.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900 dark:text-white">
                {editedSubject || draft?.subject || "Sans sujet"}
              </span>
              <Edit2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6">
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
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Sauvegarder draft
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
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
                  ? "bg-blue-400 text-white"
                  : sendMutation.isSuccess
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700",
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
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{(sendMutation.error as Error).message}</span>
        </div>
      )}

      {/* Template hint */}
      {draft?.templateName && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Template: {draft.templateName}
        </p>
      )}
    </div>
  );
}
