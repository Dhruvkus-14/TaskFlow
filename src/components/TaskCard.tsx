import { Task } from "@/store/taskStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, CheckCircle2, Circle, Calendar } from "lucide-react";
import { format } from "date-fns";
/**
 * Project: TaskFlow
 * Author: Dhruv Kushwaha
 * Copyright © 2025
 * This code is for educational showcase only.
 */

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  high: { variant: "destructive" as const, label: "High" },
  medium: { variant: "warning" as const, label: "Medium" },
  low: { variant: "success" as const, label: "Low" },
};

const TaskCard = ({ task, onToggleStatus, onEdit, onDelete }: TaskCardProps) => {
  const priority = priorityConfig[task.priority];
  const isCompleted = task.status === "completed";

  return (
    <Card className={`shadow-md hover:shadow-lg transition-all duration-300 ${isCompleted ? "opacity-75" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onToggleStatus(task.id)}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              <CardTitle className={`text-lg truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={priority.variant}>{priority.label}</Badge>
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM dd, yyyy")}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {task.description && (
        <CardContent>
          <CardDescription className={isCompleted ? "line-through" : ""}>
            {task.description}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  );
};

export default TaskCard;
