import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Project {
  id: number;
  name: string;
  billable: boolean;
  client_id: number;
}

interface Iprops {
  clients: Client[];
  client: string;
  setClient: (client: string) => void;
  clientName?: string;
  projects: Record<string, Project[]>; // Keyed by client name
  project: string;
  setProject: (project: string) => void;
  projectName?: string;
  setProjectId: () => void;
  setProjectSelected: (projectSelected: boolean) => void;
  newRowView?: boolean;
  setNewRowView?: (newRowView: boolean) => void;
  handleEditEntries?: () => void;
  isWeeklyEditing?: boolean;
  setIsWeeklyEditing?: (isWeeklyEditing: boolean) => void;
  onSaveEntry?: (duration: number, note: string) => void;
  selectedEmployeeId?: number;
}

const SelectProject: React.FC<Iprops> = ({
  clients,
  client,
  setClient,
  clientName,
  projects,
  project,
  setProject,
  projectName,
  setProjectId,
  setProjectSelected,
  newRowView,
  setNewRowView,
  handleEditEntries,
  isWeeklyEditing,
  setIsWeeklyEditing,
  onSaveEntry,
  selectedEmployeeId,
}) => {
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleCancelButton = () => {
    if (newRowView && setNewRowView) {
      setNewRowView(false);
    } else {
      setProjectSelected(true);
      if (clientName) setClient(clientName);

      if (projectName) setProject(projectName);
    }

    if (setIsWeeklyEditing) setIsWeeklyEditing(false);
    // Reset form fields
    setHours("");
    setMinutes("");
    setDescription("");
  };

  const handleSaveButton = () => {
    if (client && project && (hours || minutes)) {
      // Calculate total duration in minutes
      const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0");
      
      // Set the project as selected
      setProjectSelected(true);
      setProjectId();
      
      // Call the onSaveEntry callback with duration and description
      if (onSaveEntry) {
        onSaveEntry(totalMinutes, description);
      }
      
      if (!newRowView && handleEditEntries) handleEditEntries();
      
      // Reset form fields after save
      setHours("");
      setMinutes("");
      setDescription("");
    }
  };

  const handleClientChange = (value: string) => {
    setClient(value);
    // Projects are keyed by client name in the API response
    if (projects[value] && projects[value].length > 0) {
      setProject(projects[value][0].name);
    } else {
      setProject("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Select */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Client
          </label>
          <Select
            value={client || undefined}
            onValueChange={handleClientChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(clients) && clients.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Project Select */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Project
          </label>
          <Select
            value={project || undefined}
            onValueChange={value => {
              setProject(value);
              setProjectId();
            }}
            disabled={!client}
          >
            <SelectTrigger
              className={cn(
                "w-full",
                !client && "opacity-50 cursor-not-allowed"
              )}
            >
              <SelectValue placeholder={client ? "Select a project" : "Select a client first"} />
            </SelectTrigger>
            <SelectContent>
              {client &&
                projects[client] &&
                projects[client].map((p: any, i: number) => (
                  <SelectItem key={i} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Time Duration */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Duration
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                min="0"
                max="23"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                hours
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                max="59"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                mins
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
          className="min-h-[80px] resize-none"
        />
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={handleCancelButton}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveButton}
          disabled={!client || !project || (!hours && !minutes)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Add Entry
        </Button>
      </div>
    </div>
  );
};

export default SelectProject;
