import { useUser } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  useTaskStore,
  initializeTaskSync,
  Priority,
  TaskStatus,
  Task,
} from "@/store/taskStore";
import { useProjectStore } from "@/store/projectStore";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/TaskCard";
import AddTaskForm from "@/components/AddTaskForm";
import TaskFilter from "@/components/TaskFilter";
import Navbar from "@/components/Navbar";
import ProgressChart from "@/components/ProgressChart";
import { useNotifications } from "@/hooks/useNotifications";
import { CheckCircle2, Clock, ListTodo, ArrowLeft, Info } from "lucide-react";
import ProjectInfoModal from "@/components/ProjectInfoModal";

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { tasks, updateTask, deleteTask, toggleTaskStatus } = useTaskStore();
  const { projects } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // ✅ Firestore live sync setup with cleanup
  useEffect(() => {
    if (!isLoaded || !user || !projectId) return;
    const unsubscribe = initializeTaskSync(projectId);
    return () => {
      console.log("🧹 Unsubscribing from Firestore for project:", projectId);
      unsubscribe();
    };
  }, [user, isLoaded, projectId]);

  const currentProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate("/");
    } else if (isLoaded && !currentProject && projectId) {
      navigate("/projects");
    }
  }, [user, isLoaded, currentProject, projectId, navigate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.projectId !== projectId) return false;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectId]);

  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const stats = {
    total: filteredTasks.length,
    pending: pendingTasks.length,
    completed: completedTasks.length,
  };

  // Enable deadline notifications
  useNotifications(tasks.filter((t) => t.projectId === projectId));

  if (!isLoaded || !user || !currentProject) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {currentProject.name}
              </h1>
              <p className="text-muted-foreground">
                {currentProject.description || "Manage tasks for this project"}
              </p>
            </div>
            {(currentProject.keyPeople?.length ||
              currentProject.resources?.length ||
              currentProject.startDate ||
              currentProject.deadline) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInfoModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Project Info
              </Button>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ProgressChart
              total={stats.total}
              pending={stats.pending}
              completed={stats.completed}
            />
            <AddTaskForm
              onUpdateTask={updateTask}
              editingTask={editingTask}
              onCancelEdit={() => setEditingTask(null)}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <TaskFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
              />
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">
                  All ({filteredTasks.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>

              {["all", "pending", "completed"].map((tab) => {
                const list =
                  tab === "all"
                    ? filteredTasks
                    : tab === "pending"
                    ? pendingTasks
                    : completedTasks;

                return (
                  <TabsContent key={tab} value={tab} className="space-y-4">
                    {list.length === 0 ? (
                      <Card className="text-center py-12">
                        <CardContent className="pt-6">
                          {tab === "completed" ? (
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          ) : tab === "pending" ? (
                            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          ) : (
                            <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          )}
                          <p className="text-muted-foreground">
                            {tab === "completed"
                              ? "No completed tasks yet"
                              : tab === "pending"
                              ? "No pending tasks"
                              : "No tasks found. Create one to get started!"}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      list.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleStatus={toggleTaskStatus}
                          onEdit={setEditingTask}
                          onDelete={deleteTask}
                        />
                      ))
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </main>

      <ProjectInfoModal
        project={currentProject}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
