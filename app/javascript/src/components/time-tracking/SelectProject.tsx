import * as React from "react";

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
  setIsWeeklyEditing
}) => {
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

  const handleClientChange = (e) => {
    setClient(e.target.value);
    setProject(projects[e.target.value][0]["name"]);
  };

  return (
    <div className="flex justify-between p-4 rounded-md shadow-2xl content-center">
      {/* Clients */}
      <select
        onChange={handleClientChange}
        value={client || "Client"}
        name="client"
        id="client"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!client && (
          <option disabled selected className="text-miru-gray-100">
            Client
          </option>
        )}
        {clients.map((c, i) => (
          <option key={i.toString()}>{c["name"]}</option>
        ))}
      </select>
      {/* Projects */}
      <select
        onChange={e => {
          setProject(e.target.value);
          setProjectId();
        }}
        value={project}
        name="project"
        id="project"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        {!project && (
          <option disabled selected className="text-miru-gray-100">
            Project
          </option>
        )}
        {client && projects[client] &&
          projects[client].map((p, i) => (
            <option data-project-id={p.id} key={i.toString()}>
              {p.name}
            </option>
          ))}
      </select>

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
      <button
        onClick={handleCancelButton}
        className="h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest"
      >
        CANCEL
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
