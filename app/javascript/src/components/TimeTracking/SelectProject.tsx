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
import { i18n } from "../../i18n";

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
      const totalMinutes =
        parseInt(hours || "0") * 60 + parseInt(minutes || "0");

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
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {i18n.t("client")}
          </label>
          <Select
            value={client || undefined}
            onValueChange={handleClientChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={i18n.t("timeTracking.selectClient")} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(clients) &&
                clients.map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {/* Project Select */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {i18n.t("project")}
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
              <SelectValue
                placeholder={
                  client ? i18n.t("timeTracking.selectProject") : i18n.t("timeTracking.selectClientFirst")
                }
              />
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
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {i18n.t("timeTracking.duration")}
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="0"
                min="0"
                max="23"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {i18n.t("hours")}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                max="59"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {i18n.t("mins")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {i18n.t("description")}
        </label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={i18n.t("timeTracking.whatDidYouWorkOn")}
          className="min-h-[80px] resize-none"
        />
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={handleCancelButton}>
          {i18n.t("cancel")}
        </Button>
        <Button
          onClick={handleSaveButton}
          disabled={!client || !project || (!hours && !minutes)}
        >
          {i18n.t("timeTracking.addEntry")}
        </Button>
      </div>
    </div>
  );
};

export default SelectProject;
