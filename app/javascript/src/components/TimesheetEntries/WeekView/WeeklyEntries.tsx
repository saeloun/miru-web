import React, { useState, useEffect } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import { Toastr } from "StyledComponents";

import WeeklyEntriesCard from "./WeeklyEntriesCard";

import SelectProject from "../SelectProject";

const WeeklyEntries = ({
  clients,
  projects,
  newRowView,
  setNewRowView,
  projectId,
  clientName,
  projectName,
  entries,
  entryList,
  setEntryList,
  dayInfo,
  isWeeklyEditing,
  setIsWeeklyEditing,
  selectedEmployeeId,
}: Props) => {
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [projectSelected, setProjectSelected] = useState(false);
  const [currentEntries, setCurrentEntries] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(-1);
  const [isProjectBillable, setIsProjectBillable] = useState<boolean>(false);

  useEffect(() => {
    if (projects[client]) {
      const selectedProject = projects[client].find(
        currentProject => currentProject.name === project
      );
      setIsProjectBillable(selectedProject?.billable);
    }
  }, [project, client]);

  const setProjectId = () => {
    const pid = projects[client].find(p => p.name === project).id;
    setCurrentProjectId(pid);

    return pid;
  };

  const getIds = () =>
    currentEntries?.map(entry => entry && entry["id"])?.filter(Boolean) || [];

  const handleEditEntries = async () => {
    try {
      const ids = getIds();
      const res = await timesheetEntryApi.updateBulk({
        project_id: setProjectId(),
        ids,
      });
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState = { ...prevState, ...res.data.entries };

          return newState;
        });
      }
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleSetData = () => {
    if (projectId) {
      setCurrentProjectId(projectId);
      setProject(projectName);
      setClient(clientName);
      setProjectSelected(true);
      setCurrentEntries(entries);
    }
  };

  useEffect(() => {
    handleSetData();
  }, [entries]);

  return projectSelected ? (
    <WeeklyEntriesCard
      client={client}
      currentEntries={currentEntries}
      currentProjectId={currentProjectId}
      dayInfo={dayInfo}
      entryList={entryList}
      isProjectBillable={isProjectBillable}
      isWeeklyEditing={isWeeklyEditing}
      newRowView={newRowView}
      project={project}
      selectedEmployeeId={selectedEmployeeId}
      setCurrentEntries={setCurrentEntries}
      setEntryList={setEntryList}
      setIsWeeklyEditing={setIsWeeklyEditing}
      setNewRowView={setNewRowView}
      setProjectSelected={setProjectSelected}
    />
  ) : (
    <SelectProject
      client={client}
      clientName={clientName}
      clients={clients}
      handleEditEntries={handleEditEntries}
      isWeeklyEditing={isWeeklyEditing}
      newRowView={newRowView}
      project={project}
      projectName={projectName}
      projects={projects}
      setClient={setClient}
      setIsWeeklyEditing={setIsWeeklyEditing}
      setNewRowView={setNewRowView}
      setProject={setProject}
      setProjectId={setProjectId}
      setProjectSelected={setProjectSelected}
    />
  );
};

interface Props {
  clients: [];
  selectedEmployeeId: number;
  projects: object;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: number;
  clientName: string;
  projectName: string;
  entries: [];
  entryList: any;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default WeeklyEntries;
