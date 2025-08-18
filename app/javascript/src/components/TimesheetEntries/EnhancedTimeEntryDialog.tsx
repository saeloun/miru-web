import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Calendar, Clock, Timer, Tag } from "phosphor-react";
import { toast } from "sonner";
import { useUserContext } from "../../context/UserContext";
import timesheetEntryApi from "../../apis/timesheet-entry";
import dayjs from "dayjs";

interface TimeEntry {
  id?: string;
  date: string;
  client: string;
  project: string;
  task?: string;
  description: string;
  duration: number; // in minutes
  billable: boolean;
  status: "pending" | "approved" | "rejected";
  projectId: number;
}

interface EnhancedTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntry | null;
  selectedDate?: string;
  preselectedProject?: { id: number; name: string; client: string; billable: boolean };
}

const EnhancedTimeEntryDialog: React.FC<EnhancedTimeEntryDialogProps> = ({
  open,
  onOpenChange,
  entry = null,
  selectedDate,
  preselectedProject,
}) => {
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const isEditing = !!entry;

  // Form state
  const [formData, setFormData] = useState({
    date: selectedDate || dayjs().format('YYYY-MM-DD'),
    project: preselectedProject?.name || '',
    client: preselectedProject?.client || '',
    projectId: preselectedProject?.id || 0,
    task: '',
    description: '',
    hours: '',
    minutes: '',
    billable: preselectedProject?.billable || false,
  });

  // Fetch projects and clients
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        clients: [
          { id: 1, name: "Olson LLC" },
          { id: 2, name: "Marvin, Windler and Wintheiser" },
          { id: 3, name: "Prohaska, Collier and Pollich" },
        ],
        projects: [
          { id: 1, name: "Quo Lux Code Review", client: "Olson LLC", clientId: 1, billable: true },
          { id: 2, name: "Quo Lux Testing", client: "Olson LLC", clientId: 1, billable: true },
          { id: 3, name: "Quo Lux Documentation", client: "Olson LLC", clientId: 1, billable: false },
          { id: 4, name: "Voyatouch Testing", client: "Marvin, Windler and Wintheiser", clientId: 2, billable: false },
          { id: 5, name: "Voyatouch Development", client: "Marvin, Windler and Wintheiser", clientId: 2, billable: true },
          { id: 6, name: "It Documentation", client: "Prohaska, Collier and Pollich", clientId: 3, billable: true },
          { id: 7, name: "It Code Review", client: "Prohaska, Collier and Pollich", clientId: 3, billable: true },
          { id: 8, name: "It Meeting", client: "Prohaska, Collier and Pollich", clientId: 3, billable: false },
        ],
      };
    },
  });

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      const durationHours = Math.floor(entry.duration / 60);
      const durationMinutes = entry.duration % 60;
      
      setFormData({
        date: entry.date,
        project: entry.project,
        client: entry.client,
        projectId: entry.projectId || 0,
        task: entry.task || '',
        description: entry.description,
        hours: durationHours.toString(),
        minutes: durationMinutes.toString(),
        billable: entry.billable,
      });
    } else if (preselectedProject) {
      setFormData(prev => ({
        ...prev,
        project: preselectedProject.name,
        client: preselectedProject.client,
        projectId: preselectedProject.id,
        billable: preselectedProject.billable,
      }));
    }
  }, [entry, preselectedProject]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        date: selectedDate || dayjs().format('YYYY-MM-DD'),
        project: '',
        client: '',
        projectId: 0,
        task: '',
        description: '',
        hours: '',
        minutes: '',
        billable: false,
      });
    }
  }, [open, selectedDate]);

  const handleProjectChange = (projectName: string) => {
    const project = projectsData?.projects.find(p => p.name === projectName);
    if (project) {
      setFormData(prev => ({
        ...prev,
        project: projectName,
        client: project.client,
        projectId: project.id,
        billable: project.billable,
      }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const duration = parseInt(formData.hours || '0') * 60 + parseInt(formData.minutes || '0');
      
      if (duration === 0) {
        throw new Error("Duration must be greater than 0");
      }

      if (!formData.projectId) {
        throw new Error("Please select a project");
      }

      const entryData = {
        project_id: formData.projectId,
        timesheet_entry: {
          work_date: formData.date,
          duration,
          note: formData.description,
          bill_status: formData.billable ? "unbilled" : "non_billable",
        },
      };

      if (isEditing && entry?.id) {
        return await timesheetEntryApi.update(entry.id, entryData);
      } else {
        return await timesheetEntryApi.create(entryData, user?.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      toast.success(isEditing ? "Time entry updated successfully" : "Time entry created successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save time entry");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  // Get available projects for selected client
  const availableProjects = projectsData?.projects.filter(p => 
    formData.client ? p.client === formData.client : true
  ) || [];

  // Get unique clients
  const clients = projectsData?.clients || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer size={20} />
            {isEditing ? "Edit Time Entry" : "Add Time Entry"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your time entry details below."
              : "Track time spent on a project or task."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar size={16} />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select 
              value={formData.client} 
              onValueChange={(client) => {
                setFormData(prev => ({ 
                  ...prev, 
                  client, 
                  project: '', 
                  projectId: 0 
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.name}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select 
              value={formData.project} 
              onValueChange={handleProjectChange}
              disabled={!formData.client}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.name}>
                    <div className="flex items-center gap-2">
                      <Tag size={16} />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task (optional) */}
          <div className="space-y-2">
            <Label htmlFor="task">Task (optional)</Label>
            <Input
              id="task"
              value={formData.task}
              onChange={(e) => setFormData(prev => ({ ...prev, task: e.target.value }))}
              placeholder="e.g., Code Review, Testing, Documentation"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock size={16} />
              Duration
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="Hours"
                />
                <Label className="text-xs text-gray-500 mt-1">Hours</Label>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
                  placeholder="Minutes"
                />
                <Label className="text-xs text-gray-500 mt-1">Minutes</Label>
              </div>
            </div>
          </div>

          {/* Billable */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, billable: !!checked }))
              }
            />
            <Label htmlFor="billable" className="text-sm font-medium">
              Billable time
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : (isEditing ? "Update Entry" : "Add Entry")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedTimeEntryDialog;