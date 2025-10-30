import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
/**
 * Project: TaskFlow
 * Author: Dhruv Kushwaha
 * Copyright © 2025
 * This code is for educational showcase only.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckSquare, FolderOpen, Lock, Plus } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useTaskStore } from "@/store/taskStore";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Landing = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { projects, verifyProjectKey } = useProjectStore();
  const { tasks } = useTaskStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [enteredKey, setEnteredKey] = useState("");
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = useProjectStore.getState().subscribeToProjects();
    return () => unsubscribe();
  }, []);

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEnteredKey("");
    setIsKeyDialogOpen(true);
  };

  const handleKeySubmit = () => {
    if (!selectedProjectId) return;

    if (!isSignedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in before accessing this project",
        variant: "destructive",
      });
      setIsKeyDialogOpen(false);
      return;
    }

    if (verifyProjectKey(selectedProjectId, enteredKey)) {
      toast({
        title: "Access Granted",
        description: "Opening project...",
      });
      setIsKeyDialogOpen(false);
      navigate(`/project/${selectedProjectId}`);
    } else {
      toast({
        title: "Invalid Key",
        description: "The project key you entered is incorrect",
        variant: "destructive",
      });
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const completed = projectTasks.filter((t) => t.status === "completed").length;
    const total = projectTasks.length;
    return { completed, total };
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            <CheckSquare className="h-7 w-7 text-primary" />
            TaskFlow
          </div>
          <div className="flex gap-3">
            {isSignedIn ? (
              <Button onClick={() => navigate("/projects")}>
                My Projects
              </Button>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Public Projects
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse projects and enter the project key to access tasks
            </p>
          </div>

          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Be the first to create a project
                </p>
                {isSignedIn ? (
                  <Button onClick={() => navigate("/projects")}>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Project
                  </Button>
                ) : (
                  <SignUpButton mode="modal">
                    <Button>
                      <Plus className="mr-2 h-5 w-5" />
                      Sign Up to Create
                    </Button>
                  </SignUpButton>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const stats = getProjectStats(project.id);
                const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

                return (
                  <Card
                    key={project.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="truncate">{project.name}</span>
                        <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Created: {format(new Date(project.createdAt), "MMM d, yyyy")}
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {stats.completed} / {stats.total} tasks
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Button className="w-full" onClick={(e) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}>
                        <Lock className="mr-2 h-4 w-4" />
                        Enter Project
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Project Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-key">Project Access Key</Label>
              <Input
                id="project-key"
                type="text"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Enter the project key"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleKeySubmit();
                  }
                }}
              />
            </div>
            <Button onClick={handleKeySubmit} className="w-full">
              Access Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
