import * as React from "react";
import Select from "react-select";

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
  const clientList = clients.map(client => ({ value: client.name, label: client.name }));
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
      <Select
        placeholder="Select Client"
        options={clientList}
        onChange={e => {setClient(e.value); setProject(projects[e.value][0]["name"]); }}
        isClearable
        className="w-80 h-8 bg-miru-gray-100 rounded-md text-xs text-miru-han-purple-600"
        styles={{ menu: (base: any) => ({
          ...base,
          zIndex: 9999,
          border: "none",
          boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.1)",
          ...(base.isFocused && {
            borderRadius: "0.25rem",
            backgroundColor: "#4A485A",
            color: "#5B34EA"
          })
        })
        }}
        {...( client ? { defaultValue: { value: client, label: client } } : {} ) }
      />
      {/* Projects */}
      <Select
        placeholder="Select Project"
        options={projectList}
        onChange={e => setProject(e["value"]) }
        isClearable
        className="w-80 h-8 bg-miru-gray-100 rounded-md text-xs text-miru-han-purple-600"
        styles={{ menu: (base: any) => ({
          ...base,
          zIndex: 9999,
          height: "32px",
          border: "none",
          boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.1)",
          ...(base.isFocused && {
            borderRadius: "0.25rem",
            backgroundColor: "#4A485A",
            color: "#5B34EA"
          })
        })
        }}
        {...( project ? { defaultValue: { value: project, label: project } } : {} ) }
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
