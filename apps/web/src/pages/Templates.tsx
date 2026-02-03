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
          <h1 className="text-xl sm:text-2xl font-bold">Templates</h1>
          <p className="text-gray-500 text-sm sm:text-base">Message and proposal templates</p>
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
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
              No templates yet
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([type, temps]) => {
              const Icon = typeIcons[type] || FileText;
              return (
                <div
                  key={type}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">{type.replace(/_/g, " ")}</span>
                    <span className="text-sm text-gray-500">({temps.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {temps.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                          selectedTemplate?.id === template.id && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                      >
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {template.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {template.channel && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
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
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">Preview</span>
                </div>
                <span className="text-sm text-gray-500">{selectedTemplate.name}</span>
              </div>
              
              {/* Variables */}
              {selectedTemplate.variables && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 mb-2">Variables:</p>
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
                        className="px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {selectedTemplate.subject && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Subject:</p>
                    <p className="font-medium">
                      {renderWithVariables(selectedTemplate.subject, previewVars)}
                    </p>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {renderWithVariables(selectedTemplate.content, previewVars)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500">
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
