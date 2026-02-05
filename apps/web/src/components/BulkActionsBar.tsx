import { useState } from "react";
import { ChevronDown, Tag as TagIcon, Trash2, X } from "lucide-react";
import type { LeadStatus, Tag } from "../lib/api";
import { cn } from "../lib/utils";

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW", "QUALIFIED", "CONTACTED", "FOLLOWUP_1", "FOLLOWUP_2",
  "RESPONDED", "CALL_SCHEDULED", "CALL_DONE", "PROPOSAL_SENT",
  "NEGOTIATING", "WON", "LOST", "ARCHIVED"
];

interface BulkActionsBarProps {
  selectedCount: number;
  tags: Tag[];
  onStatusChange: (status: LeadStatus) => void;
  onAddTag: (tagId: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function BulkActionsBar({
  selectedCount,
  tags,
  onStatusChange,
  onAddTag,
  onDelete,
  onCancel,
}: BulkActionsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} selected</span>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-700 rounded transition"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Change Status */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowTagMenu(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            Change Status
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-lg py-1 min-w-[160px] max-h-64 overflow-y-auto">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(status);
                      setShowStatusMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add Tag */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTagMenu(!showTagMenu);
              setShowStatusMenu(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <TagIcon className="w-4 h-4" />
            Add Tag
            <ChevronDown className="w-4 h-4" />
          </button>
          {showTagMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTagMenu(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-lg py-1 min-w-[200px] max-h-64 overflow-y-auto">
                {tags.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    No tags available. Create one first!
                  </div>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        onAddTag(tag.id);
                        setShowTagMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {tag.name}
                      </span>
                      <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                        {tag._count?.leadTags || 0}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
