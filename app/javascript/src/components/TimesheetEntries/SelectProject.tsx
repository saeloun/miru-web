import React from "react";

import { Button, BUTTON_STYLES } from "StyledComponents";

const SelectProject = ({
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
  isWeeklyEditing, // eslint-disable-line
  setIsWeeklyEditing,
}: Iprops) => {
  const handleCancelButton = () => {
    if (newRowView) {
      setNewRowView(false);
    } else {
      setProjectSelected(true);
      setClient(clientName);
      setProject(projectName);
    }
    setIsWeeklyEditing(false);
  };

  const handleSaveButton = () => {
    if (client && project) {
      setProjectSelected(true);
      setProjectId();
      if (!newRowView) handleEditEntries();
    }
  };

  const handleClientChange = e => {
    setClient(e.target.value);
    if (projects[e.target.value].length > 0) {
      setProject(projects[e.target.value][0]["name"]);
    } else {
      setProject("");
    }
  };

  return (
    <div className="flex content-center justify-between rounded-md p-4 shadow-2xl">
      {/* Clients */}
      <select
        className="h-8 w-80 rounded-sm bg-miru-gray-100"
        id="client"
        name="client"
        value={client || "Client"}
        onChange={handleClientChange}
      >
        {!client && (
          <option disabled className="text-miru-gray-100">
            Client
          </option>
        )}
        {clients.map((c, i) => (
          <option key={i.toString()}>{c["name"]}</option>
        ))}
      </select>
      {/* Projects */}
      <select
        className="h-8 w-80 rounded-sm bg-miru-gray-100"
        id="project"
        name="project"
        value={project || "Project"}
        onChange={e => {
          setProject(e.target.value);
          setProjectId();
        }}
      >
        {!project && (
          <option disabled className="text-miru-gray-100">
            Project
          </option>
        )}
        {client &&
          projects[client] &&
          projects[client].map((p, i) => (
            <option data-project-id={p.id} key={i.toString()}>
              {p.name}
            </option>
          ))}
      </select>
      <Button
        className="h-8 w-38 rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-xs font-bold tracking-widest text-miru-han-purple-600 hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
        style={BUTTON_STYLES.secondary}
        onClick={handleCancelButton}
      >
        CANCEL
      </Button>
      <Button
        style={BUTTON_STYLES.primary}
        className={`h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
          client && project
            ? "bg-miru-han-purple-1000 hover:border-transparent"
            : "bg-miru-gray-1000"
        }`}
        onClick={handleSaveButton}
      >
        SAVE
      </Button>
    </div>
  );
};

interface Iprops {
  clients: [];
  client: string;
  setClient: (client: string) => void;
  clientName: string;
  projects: object;
  project: string;
  setProject: (project: string) => void;
  projectName: string;
  setProjectId: () => void;
  setProjectSelected: (projectSelected: boolean) => void;
  newRowView: boolean;
  setNewRowView: (newRowView: boolean) => void;
  handleEditEntries: () => void;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: (isWeeklyEditing: boolean) => void;
}

export default SelectProject;
