import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, ExternalLink, Calendar, Users, FileText } from "lucide-react";
import { Project } from "@/store/projectStore";
import { format } from "date-fns";

interface ProjectInfoModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}
/**
 * Project: TaskFlow
 * Author: Dhruv Kushwaha
 * Copyright © 2025
 * This code is for educational showcase only.
 */

const ProjectInfoModal = ({ project, isOpen, onClose }: ProjectInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Overview */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          {(project.startDate || project.deadline) && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Timeline</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {project.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                      <p className="font-medium">
                        {format(new Date(project.startDate), "PPP")}
                      </p>
                    </div>
                  )}
                  {project.deadline && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                      <p className="font-medium">
                        {format(new Date(project.deadline), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Key People */}
          {project.keyPeople && project.keyPeople.length > 0 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Key Team Members</h4>
                </div>
                <div className="space-y-3">
                  {project.keyPeople.map((person, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <Badge variant="secondary" className="mt-1">
                          {person.role}
                        </Badge>
                      </div>
                      <a
                        href={`mailto:${person.email}`}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {person.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Resources */}
          {project.resources && project.resources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Important Resources</h4>
              </div>
              <div className="space-y-2">
                {project.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <span className="font-medium">{resource.title}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectInfoModal;
