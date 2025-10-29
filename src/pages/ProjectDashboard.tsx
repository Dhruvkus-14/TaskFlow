import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProjectStore, KeyPerson, Resource } from "@/store/projectStore";
import { useTaskStore } from "@/store/taskStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FolderOpen, Trash2, ChevronDown, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const ProjectDashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { projects, addProject, deleteProject, verifyProjectKey } = useProjectStore();
  const { tasks } = useTaskStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [keyPeople, setKeyPeople] = useState<KeyPerson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const { generateKey } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [enteredKey, setEnteredKey] = useState("");
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate("/");
    } else if (user) {
      const unsubscribe = useProjectStore.getState().subscribeToProjects();
      return () => unsubscribe();
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (isCreateOpen && !projectKey) {
      setProjectKey(generateKey());
    }
  }, [isCreateOpen, projectKey, generateKey]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    if (!projectKey.trim()) {
      toast({
        title: "Error",
        description: "Project key is required",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      try {
        await addProject({
          name: projectName,
          description: projectDescription,
          userId: user.id,
          key: projectKey,
          keyPeople: keyPeople.length > 0 ? keyPeople : undefined,
          resources: resources.length > 0 ? resources : undefined,
          startDate: startDate || undefined,
          deadline: deadline || undefined,
        });

        toast({
          title: "Success",
          description: `Project created! Key: ${projectKey}`,
        });

        setProjectName("");
        setProjectDescription("");
        setProjectKey("");
        setStartDate("");
        setDeadline("");
        setKeyPeople([]);
        setResources([]);
        setIsInfoExpanded(false);
        setIsCreateOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? All tasks in this project will be deleted.`)) {
      try {
        await deleteProject(projectId);
        const taskStore = useTaskStore.getState();
        taskStore.deleteTasksByProject(projectId);
        
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenProject = (project: any) => {
    // If user created the project, allow direct access
    if (project.userId === user?.id) {
      navigate(`/project/${project.id}`);
    } else {
      // Otherwise, require access key
      setSelectedProjectId(project.id);
      setEnteredKey("");
      setIsKeyDialogOpen(true);
    }
  };

  const handleVerifyKey = () => {
    if (!selectedProjectId) return;

    if (verifyProjectKey(selectedProjectId, enteredKey)) {
      toast({
        title: "Access Granted",
        description: "Opening project...",
      });
      setIsKeyDialogOpen(false);
      navigate(`/project/${selectedProjectId}`);
      setEnteredKey("");
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

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Projects</h1>
            <p className="text-muted-foreground">Organize your tasks into projects</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g., Portfolio Website"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-description">Description (Optional)</Label>
                    <Textarea
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="What's this project about?"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-key">Project Access Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="project-key"
                        value={projectKey}
                        onChange={(e) => setProjectKey(e.target.value)}
                        placeholder="Auto-generated key"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProjectKey(generateKey())}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share this key with team members to grant access
                    </p>
                  </div>

                  <Collapsible open={isInfoExpanded} onOpenChange={setIsInfoExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        Project References / Key Info (Optional)
                        <ChevronDown className={`h-4 w-4 transition-transform ${isInfoExpanded ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      {/* Timeline */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Key People */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Key Team Members</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyPeople([...keyPeople, { name: "", role: "", email: "" }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Person
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {keyPeople.map((person, index) => (
                            <div key={index} className="flex gap-2 p-3 bg-muted rounded-lg">
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="Name"
                                  value={person.name}
                                  onChange={(e) => {
                                    const updated = [...keyPeople];
                                    updated[index].name = e.target.value;
                                    setKeyPeople(updated);
                                  }}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Role"
                                    value={person.role}
                                    onChange={(e) => {
                                      const updated = [...keyPeople];
                                      updated[index].role = e.target.value;
                                      setKeyPeople(updated);
                                    }}
                                  />
                                  <Input
                                    placeholder="Email"
                                    type="email"
                                    value={person.email}
                                    onChange={(e) => {
                                      const updated = [...keyPeople];
                                      updated[index].email = e.target.value;
                                      setKeyPeople(updated);
                                    }}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setKeyPeople(keyPeople.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resources */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Important Resources</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setResources([...resources, { title: "", link: "" }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Resource
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {resources.map((resource, index) => (
                            <div key={index} className="flex gap-2 p-3 bg-muted rounded-lg">
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="Title"
                                  value={resource.title}
                                  onChange={(e) => {
                                    const updated = [...resources];
                                    updated[index].title = e.target.value;
                                    setResources(updated);
                                  }}
                                />
                                <Input
                                  placeholder="URL"
                                  type="url"
                                  value={resource.link}
                                  onChange={(e) => {
                                    const updated = [...resources];
                                    updated[index].link = e.target.value;
                                    setResources(updated);
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setResources(resources.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button onClick={handleCreateProject} className="w-full">
                    Create Project
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first project to start organizing your tasks
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create New Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const stats = getProjectStats(project.id);
              const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="truncate">{project.name}</span>
                        {project.userId === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                            Owner
                          </span>
                        )}
                      </div>
                      {project.userId === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                    <Button
                      className="w-full"
                      onClick={() => handleOpenProject(project)}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Open Project
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Access Key Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Project Access Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-key">Access Key</Label>
              <Input
                id="access-key"
                type="text"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                placeholder="Enter the project access key"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerifyKey();
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsKeyDialogOpen(false);
                  setEnteredKey("");
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleVerifyKey}>
                Verify & Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDashboard;
