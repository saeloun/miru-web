import * as React from "react";
import SyncAutoComplete from "common/SyncAutoComplete";

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
  isWeeklyEditing, // eslint-disable-line
  setIsWeeklyEditing
}) => {
  const clientList = clients.map(client => ({ value: client["name"], label: client["name"] }));
  const projectList = project ? projects[client].map(project => ({ value: project.name, label: project.name })) : [];

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

  return (
    <div className="flex justify-between p-4 rounded-md shadow-2xl content-center">
      {/* Clients */}
      <SyncAutoComplete
        options={clientList}
        handleValue={(clientName: string) => {
          if (clientName) {
            setClient(clientName);
            setProject(projects[clientName][0]["name"]);
          }
        }}
        defaultValue={{ value: client, label: client }}
        size="lg"
      />
      {/* Projects */}
      <SyncAutoComplete
        options={projectList}
        handleValue={setProject}
        defaultValue={{ value: project, label: project }}
        size="lg"
      />
      {/* Buttons */}
      <button
        onClick={handleCancelButton}
        className="h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
      >
        CANCEL
      </button>
      <button
        onClick={handleSaveButton}
        className={
          "h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
          (client && project
            ? "bg-miru-han-purple-1000 hover:border-transparent"
            : "bg-miru-gray-1000")
        }
      >
        SAVE
      </button>
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
  projectId: number;
  setProjectId: () => void;
  projectSelected: boolean;
  setProjectSelected: (projectSelected: boolean) => void;
  newRowView: boolean;
  setNewRowView: (newRowView: boolean) => void;
  handleEditEntries: () => void;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: (isWeeklyEditing: boolean) => void;
}

export default SelectProject;
