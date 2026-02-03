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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Templates</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Message and proposal templates</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              Loading...
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              No templates yet
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([type, temps]) => {
              const Icon = typeIcons[type] || FileText;
              return (
                <div
                  key={type}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{type.replace(/_/g, " ")}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">({temps.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {temps.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                          selectedTemplate?.id === template.id && "bg-blue-50 dark:bg-blue-900/30"
                        )}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {template.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                          {template.channel && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
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
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">Preview</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{selectedTemplate.name}</span>
              </div>
              
              {/* Variables */}
              {selectedTemplate.variables && (
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Variables:</p>
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
                        className="px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {selectedTemplate.subject && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Subject:</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {renderWithVariables(selectedTemplate.subject, previewVars)}
                    </p>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-4 rounded-lg">
                    {renderWithVariables(selectedTemplate.content, previewVars)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-slate-500 dark:text-slate-400">
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
