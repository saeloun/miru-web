import * as React from "react";

const SelectProject: React.FC<Iprops> = ({
  setClient,
  clientName,
  projects,
  project,
  setProject,
  projectName,
  projectId,
  setProjectId,
  setProjectSelected,
  newRowView,
  setNewRowView,
  handleEditEntries,
  isWeeklyEditing, // eslint-disable-line
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
    if (project) {
      setProjectSelected(true);
      setProjectId();
      if (!newRowView) handleEditEntries();
    }
  };

  return (
    <div className="flex justify-between p-4 rounded-md shadow-2xl content-center">
      {/* Clients */}
      {/* <select
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
      </select> */}
      {/* Projects */}
      <select
        onChange={e => {
          setProject(projects.find((i) => parseInt(e.target.value) === i.id).name);
          setProjectId();
        }}
        value={projectId}
        name="project"
        id="project"
        className="w-80 bg-miru-gray-100 rounded-sm h-8"
      >
        <option value={null} key={"none"} className="text-miru-gray-100">
          Select Project
        </option>
        {projects.map((project) => (
          <option value={project.id} key={project.id}>
            {project.name} ({project.clientName})
          </option>
        ))}
      </select>
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
          (project
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
  setClient: (client: string) => void;
  clientName: string;
  projects: any[];
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
