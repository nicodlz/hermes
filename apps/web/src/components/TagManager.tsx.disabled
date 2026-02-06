import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, Trash2, Check } from "lucide-react";
import { api, type Tag } from "../lib/api";

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
];

interface TagManagerProps {
  onClose: () => void;
}

export function TagManager({ onClose }: TagManagerProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.tags.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.tags.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setIsCreating(false);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      api.tags.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createMutation.mutate({ name: newTagName.trim(), color: newTagColor });
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleUpdate = (id: string) => {
    if (!editTagName.trim()) return;
    updateMutation.mutate({
      id,
      data: { name: editTagName.trim(), color: editTagColor },
    });
  };

  const handleDelete = (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from ${tag._count?.leadTags || 0} leads.`)) return;
    deleteMutation.mutate(tag.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage Tags</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Create New Tag */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                autoFocus
                maxLength={50}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className="w-6 h-6 rounded-full border-2 transition"
                    style={{
                      backgroundColor: color,
                      borderColor: newTagColor === color ? "#fff" : color,
                      boxShadow: newTagColor === color ? "0 0 0 2px " + color : "none",
                    }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName("");
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <Plus className="w-5 h-5" />
              Create New Tag
            </button>
          )}

          {/* Tags List */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No tags yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {editingId === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        className="flex-1 px-3 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        maxLength={50}
                      />
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditTagColor(color)}
                            className="w-6 h-6 rounded-full border-2 transition"
                            style={{
                              backgroundColor: color,
                              borderColor: editTagColor === color ? "#fff" : color,
                              boxShadow: editTagColor === color ? "0 0 0 2px " + color : "none",
                            }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleUpdate(tag.id)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 font-medium text-slate-900 dark:text-white">
                        {tag.name}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {tag._count?.leadTags || 0} leads
                      </span>
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
