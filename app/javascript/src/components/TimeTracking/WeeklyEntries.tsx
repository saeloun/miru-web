 
 
import React, { useState, useEffect } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import { Toastr } from "StyledComponents";

import SelectProject from "./SelectProject";
import WeeklyEntriesCard from "./WeeklyEntriesCard";

const WeeklyEntries = ({
  clients,
  projects,
  newRowView,
  setNewRowView,
  projectId,
  clientName,
  projectName,
  entries,
  entryList, //eslint-disable-line
  setEntryList,
  dayInfo,
  isWeeklyEditing,
  setIsWeeklyEditing,
  weeklyData, //eslint-disable-line
  setWeeklyData, //eslint-disable-line
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

  const getIds = () => {
    const ids = [];
    currentEntries.forEach(entry => {
      if (entry) ids.push(entry["id"]);
    });

    return ids;
  };

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

  // const handleDeleteEntries = async () => {
  //   try {
  //     if (!currentEntries.length) return;
  //     const ids = getIds();
  //     const delRes = await timesheetEntryApi.destroyBulk({ ids: ids });
  //     if (delRes.status === 200) {
  //       const getRes = await timesheetEntryApi.list(dayInfo[0]["fullDate"], dayInfo[6]["fullDate"]);
  //       if (getRes.status === 200) {
  //         const newState = { ...entryList, ...getRes.data.entries };
  //         setEntryList(newState);
  //       }
  //     }
  //   } catch (error) {
  //     Logger.error(error.message);
  //   }
  // };

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
  entryList: object;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
  weeklyData: any[];
  setWeeklyData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default WeeklyEntries;
