import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface Iprops {
  clients: any[];
  client: string;
  setClient: (client: string) => void;
  clientName?: string;
  projects: any;
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
}) => {
  const handleCancelButton = () => {
    if (newRowView && setNewRowView) {
      setNewRowView(false);
    } else {
      setProjectSelected(true);
      if (clientName) setClient(clientName);

      if (projectName) setProject(projectName);
    }

    if (setIsWeeklyEditing) setIsWeeklyEditing(false);
  };

  const handleSaveButton = () => {
    if (client && project) {
      setProjectSelected(true);
      setProjectId();
      if (!newRowView && handleEditEntries) handleEditEntries();
    }
  };

  const handleClientChange = (value: string) => {
    setClient(value);
    if (projects[value] && projects[value].length > 0) {
      setProject(projects[value][0]["name"]);
    } else {
      setProject("");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Client Select */}
          <div className="flex-1">
            <Select
              value={client || undefined}
              onValueChange={handleClientChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c, i) => (
                  <SelectItem key={i} value={c["name"]}>
                    {c["name"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Project Select */}
          <div className="flex-1">
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
                <SelectValue placeholder="Select a project" />
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
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveButton}
              disabled={!client || !project}
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectProject;
