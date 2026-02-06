import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Plus, X, CheckCircle2 } from "lucide-react";
import { api, type LeadStatus } from "../lib/api";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface ManualQualificationProps {
  leadId: string;
  currentScore: number;
  currentStatus: LeadStatus;
  currentScoreReasons?: string | null;
  isManuallyScored?: boolean;
  qualifiedAt?: string | null;
}

export function ManualQualification({
  leadId,
  currentScore,
  currentStatus,
  currentScoreReasons,
  isManuallyScored,
  qualifiedAt,
}: ManualQualificationProps) {
  const queryClient = useQueryClient();
  
  // Parse scoreReasons safely
  const parseReasons = (reasons?: string | null): string[] => {
    if (!reasons) return [];
    try {
      return JSON.parse(reasons);
    } catch {
      return [];
    }
  };

  const [score, setScore] = useState(currentScore);
  const [scoreReasons, setScoreReasons] = useState<string[]>(parseReasons(currentScoreReasons));
  const [newReason, setNewReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: { score?: number; scoreReasons?: string; status?: LeadStatus }) =>
      api.leads.update(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast.success("Lead updated successfully");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });

  const handleSaveScore = () => {
    // Add [Manual] tag if not present
    const reasons = scoreReasons.includes("[Manual]") 
      ? scoreReasons 
      : ["[Manual]", ...scoreReasons];
    
    updateMutation.mutate({
      score,
      scoreReasons: JSON.stringify(reasons),
    });
  };

  const handleMarkQualified = () => {
    updateMutation.mutate({
      status: "QUALIFIED",
    });
  };

  const handleAddReason = () => {
    if (!newReason.trim()) return;
    setScoreReasons([...scoreReasons, newReason.trim()]);
    setNewReason("");
  };

  const handleRemoveReason = (index: number) => {
    setScoreReasons(scoreReasons.filter((_, i) => i !== index));
  };

  const hasChanges = 
    score !== currentScore || 
    JSON.stringify(scoreReasons) !== JSON.stringify(parseReasons(currentScoreReasons));

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Manual Qualification</h2>
        {qualifiedAt && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Qualified
          </span>
        )}
      </div>

      {/* Score Editor */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-2">
          Score
        </label>
        <div className="flex items-center gap-3">
          <Star className={cn(
            "w-5 h-5",
            score >= 30 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground dark:text-slate-500"
          )} />
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => {
              setScore(Number(e.target.value));
              setIsEditing(true);
            }}
            className="w-20 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => {
              setScore(Number(e.target.value));
              setIsEditing(true);
            }}
            className="flex-1"
          />
        </div>
      </div>

      {/* Score Reasons */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-2">
          Qualification Reasons
        </label>
        
        {/* Existing reasons */}
        <div className="flex flex-wrap gap-2 mb-2">
          {scoreReasons.map((reason, index) => (
            <span
              key={index}
              className={cn(
                "px-3 py-1 rounded-full text-sm flex items-center gap-1",
                reason.startsWith("+") || reason === "[Manual]"
                  ? "bg-green-600/20 dark:bg-green-600/40 text-green-600 dark:text-green-500"
                  : reason.startsWith("-")
                  ? "bg-destructive/20 dark:bg-destructive/40 text-destructive dark:text-destructive"
                  : "bg-primary/20 dark:bg-primary/40 text-primary dark:text-primary"
              )}
            >
              {reason}
              {reason !== "[Manual]" && (
                <button
                  onClick={() => handleRemoveReason(index)}
                  className="hover:bg-black/10 dark:hover:bg-card/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Add reason */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddReason()}
            placeholder="Add reason (e.g., +High budget, -Too vague)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button
            onClick={handleAddReason}
            disabled={!newReason.trim()}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {hasChanges && (
          <button
            onClick={handleSaveScore}
            disabled={updateMutation.isPending}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary disabled:opacity-50 font-medium"
          >
            {updateMutation.isPending ? "Saving..." : "Save Score"}
          </button>
        )}
        
        {currentStatus !== "QUALIFIED" && (
          <button
            onClick={handleMarkQualified}
            disabled={updateMutation.isPending}
            className="w-full px-4 py-2 bg-green-600 text-primary-foreground rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {updateMutation.isPending ? "Updating..." : "Mark as Qualified"}
          </button>
        )}
      </div>

      {isManuallyScored && (
        <p className="text-xs text-secondary mt-3 text-center">
          This lead has been manually scored
        </p>
      )}
    </div>
  );
}
