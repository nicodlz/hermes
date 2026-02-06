import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, MessageSquare, Plus, Eye } from "lucide-react";
import { api, type Template } from "../lib/api";
import { cn } from "../lib/utils";

export function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.templates.list(),
  });

  const typeIcons: Record<string, React.ElementType> = {
    INITIAL_OUTREACH: Mail,
    FOLLOWUP_1: MessageSquare,
    FOLLOWUP_2: MessageSquare,
    FOLLOWUP_3: MessageSquare,
    PROPOSAL: FileText,
    CLOSING: FileText,
    REJECTION: FileText,
    CUSTOM: FileText,
  };

  const groupedTemplates = templates?.reduce((acc, t) => {
    const group = t.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(t);
    return acc;
  }, {} as Record<string, Template[]>) || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground dark:text-primary-foreground">Templates</h1>
          <p className="text-slate-500 dark:text-muted-foreground text-sm sm:text-base">Message and proposal templates</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center text-slate-500 dark:text-muted-foreground shadow-sm">
              Loading...
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center text-slate-500 dark:text-muted-foreground shadow-sm">
              No templates yet
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([type, temps]) => {
              const Icon = typeIcons[type] || FileText;
              return (
                <div
                  key={type}
                  className="bg-card rounded-lg border border-border shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground dark:text-slate-500" />
                    <span className="font-semibold text-foreground dark:text-primary-foreground">{type.replace(/_/g, " ")}</span>
                    <span className="text-sm text-slate-500 dark:text-muted-foreground">({temps.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {temps.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-background dark:hover:bg-card/50 transition-colors",
                          selectedTemplate?.id === template.id && "bg-primary/10 dark:bg-blue-900/30"
                        )}
                      >
                        <div className="font-medium text-foreground dark:text-primary-foreground">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-slate-500 dark:text-muted-foreground line-clamp-1">
                            {template.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground dark:text-slate-500">
                          {template.channel && (
                            <span className="px-2 py-0.5 bg-muted dark:bg-card rounded text-muted-foreground dark:text-slate-300">
                              {template.channel}
                            </span>
                          )}
                          <span>Used {template.usageCount}×</span>
                          {template.replyRate !== null && template.replyRate !== undefined && (
                            <span>{template.replyRate}% reply rate</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Template Preview */}
        <div className="lg:sticky lg:top-8 space-y-4">
          {selectedTemplate ? (
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-muted-foreground dark:text-slate-500" />
                  <span className="font-semibold text-foreground dark:text-primary-foreground">Preview</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-muted-foreground">{selectedTemplate.name}</span>
              </div>
              
              {/* Variables */}
              {selectedTemplate.variables && (
                <div className="px-4 py-3 border-b border-border bg-background dark:bg-card/50">
                  <p className="text-xs text-slate-500 dark:text-muted-foreground mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedTemplate.variables).map((v: string) => (
                      <input
                        key={v}
                        type="text"
                        placeholder={v}
                        value={previewVars[v] || ""}
                        onChange={(e) =>
                          setPreviewVars({ ...previewVars, [v]: e.target.value })
                        }
                        className="px-2 py-1 text-sm rounded border border-border bg-card text-foreground dark:text-primary-foreground placeholder:text-muted-foreground"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {selectedTemplate.subject && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mb-1">Subject:</p>
                    <p className="font-medium text-foreground dark:text-primary-foreground">
                      {renderWithVariables(selectedTemplate.subject, previewVars)}
                    </p>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-background dark:bg-card text-slate-800 dark:text-slate-200 p-4 rounded-lg">
                    {renderWithVariables(selectedTemplate.content, previewVars)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background dark:bg-card/50 rounded-lg border border-dashed border-slate-300 dark:border-border p-8 text-center text-slate-500 dark:text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a template to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderWithVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, value);
    }
  }
  return result;
}
