import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { api, type Task } from "../lib/api";
import { cn } from "../lib/utils";

export function Tasks() {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.tasks.list(),
  });

  const { data: overdue } = useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: api.tasks.overdue,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.tasks.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const pending = tasks?.filter((t) => t.status === "PENDING") || [];
  const inProgress = tasks?.filter((t) => t.status === "IN_PROGRESS") || [];
  const completed = tasks?.filter((t) => t.status === "COMPLETED").slice(0, 10) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          {pending.length} pending • {overdue?.length || 0} overdue
        </p>
      </div>

      {/* Overdue Alert */}
      {overdue && overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => completeMutation.mutate(task.id)}
                isOverdue
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-white">Pending</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">({pending.length})</span>
          </div>
          <div className="p-4 space-y-3">
            {isLoading ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No pending tasks</p>
            ) : (
              pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => completeMutation.mutate(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="font-semibold text-slate-900 dark:text-white">In Progress</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">({inProgress.length})</span>
          </div>
          <div className="p-4 space-y-3">
            {inProgress.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No tasks in progress</p>
            ) : (
              inProgress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => completeMutation.mutate(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">Completed</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">(recent)</span>
          </div>
          <div className="p-4 space-y-3">
            {completed.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">No completed tasks</p>
            ) : (
              completed.map((task) => (
                <TaskCard key={task.id} task={task} completed />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onComplete,
  isOverdue,
  completed,
}: {
  task: Task;
  onComplete?: () => void;
  isOverdue?: boolean;
  completed?: boolean;
}) {
  const priorityColors = {
    URGENT: "border-l-red-500",
    HIGH: "border-l-orange-500",
    MEDIUM: "border-l-yellow-500",
    LOW: "border-l-slate-300 dark:border-l-slate-600",
  };

  const typeIcons = {
    FOLLOWUP: "📧",
    CALL: "📞",
    EMAIL: "✉️",
    RESEARCH: "🔍",
    PROPOSAL: "📄",
    OTHER: "📌",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border-l-4",
        priorityColors[task.priority],
        completed
          ? "bg-slate-50 dark:bg-slate-700/50 opacity-60"
          : isOverdue
          ? "bg-red-50 dark:bg-red-900/20"
          : "bg-slate-50 dark:bg-slate-700"
      )}
    >
      <div className="flex items-start gap-3">
        {!completed && onComplete && (
          <button
            onClick={onComplete}
            className="mt-0.5 w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-colors"
          >
            <Check className="w-3 h-3 text-emerald-500 opacity-0 hover:opacity-100" />
          </button>
        )}
        {completed && (
          <div className="mt-0.5 w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span>{typeIcons[task.type]}</span>
            <span className={cn("font-medium text-sm text-slate-900 dark:text-white", completed && "line-through text-slate-500 dark:text-slate-400")}>
              {task.title}
            </span>
          </div>
          {task.lead && (
            <Link
              to={`/leads/${task.lead.id}`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
            >
              {task.lead.title}
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          {task.dueAt && (
            <div className={cn(
              "text-xs mt-1",
              isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-500 dark:text-slate-400"
            )}>
              Due: {new Date(task.dueAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            task.priority === "URGENT"
              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              : task.priority === "HIGH"
              ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
              : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
          )}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}
