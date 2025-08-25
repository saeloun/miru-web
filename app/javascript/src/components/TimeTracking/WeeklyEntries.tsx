import React, { useState, useEffect } from "react";
import { Briefcase, Warning } from "phosphor-react";
import timesheetEntryApi from "apis/timesheet-entry";
import { Toastr } from "StyledComponents";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

import SelectProject from "./SelectProject";
import WeeklyEntriesCard from "./WeeklyEntriesCard";

interface Props {
  clients: any;
  projects: any;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  projectId?: number;
  clientName?: string;
  projectName?: string;
  entries?: any[];
  entryList?: any;
  setEntryList: React.Dispatch<React.SetStateAction<any>>;
  dayInfo: any[];
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
  weeklyData?: any;
  setWeeklyData?: React.Dispatch<React.SetStateAction<any>>;
  selectedEmployeeId: number;
  parseWeeklyViewData?: () => void;
}

const WeeklyEntries: React.FC<Props> = ({
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
  weeklyData,
  setWeeklyData,
  selectedEmployeeId,
  parseWeeklyViewData,
}) => {
  const [client, setClient] = useState(clientName || "");
  const [project, setProject] = useState(projectName || "");
  const [projectSelected, setProjectSelected] = useState(!!projectId);
  const [currentEntries, setCurrentEntries] = useState(entries || []);
  const [currentProjectId, setCurrentProjectId] = useState(projectId || -1);
  const [isProjectBillable, setIsProjectBillable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (projects[client]) {
      const selectedProject = projects[client].find(
        currentProject => currentProject.name === project
      );
      setIsProjectBillable(selectedProject?.billable || false);
    }
  }, [project, client, projects]);

  useEffect(() => {
    if (projectId && clientName && projectName) {
      setProjectSelected(true);
      setCurrentProjectId(projectId);
      setCurrentEntries(entries || []);
    }
  }, [projectId, clientName, projectName, entries]);

  const setProjectId = () => {
    const pid = projects[client]?.find(p => p.name === project)?.id;
    if (pid) {
      setCurrentProjectId(pid);

      return pid;
    }

    return -1;
  };

  const handleSaveNewEntry = (duration: number, note: string) => {
    // Create initial entries array with the duration and note for the first day
    const initialEntries = new Array(7).fill(null);
    initialEntries[0] = {
      duration,
      note,
      bill_status: "non_billable",
      id: null, // This will be created when saved
    };
    setCurrentEntries(initialEntries);
  };

  const getIds = () => {
    const ids = [];
    currentEntries.forEach(entry => {
      if (entry?.id) ids.push(entry.id);
    });

    return ids;
  };

  const handleEditEntries = async () => {
    try {
      setIsLoading(true);
      const ids = getIds();
      if (ids.length === 0) {
        Toastr.warning("No entries to update");

        return;
      }

      const res = await timesheetEntryApi.updateBulk(
        ids,
        { project_id: currentProjectId },
        selectedEmployeeId
      );

      if (res.status === 200) {
        const updatedEntries = res.data.entries;
        setEntryList(prevState => {
          const newState = { ...prevState };
          updatedEntries.forEach(entry => {
            const date = entry.work_date;
            if (newState[date]) {
              const index = newState[date].findIndex(e => e.id === entry.id);
              if (index !== -1) {
                newState[date][index] = entry;
              }
            }
          });

          return newState;
        });

        parseWeeklyViewData?.();
        Toastr.success("Entries updated successfully");
      }
    } catch (error) {
      console.error("Error updating entries:", error);
      Toastr.error("Failed to update entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    if (!projectSelected || currentProjectId === -1) {
      Toastr.warning("Please select a project first");

      return;
    }
    setProjectSelected(true);
    setNewRowView(false);
  };

  if (!projectSelected && newRowView) {
    return (
      <Card className="mt-4 border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Project Entry
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Select a client and project to start tracking time
              </p>
            </div>
          </div>
          <SelectProject
            client={client}
            clients={clients}
            project={project}
            projects={projects}
            setClient={setClient}
            setProject={setProject}
            setProjectSelected={setProjectSelected}
            setProjectId={setProjectId}
            newRowView={newRowView}
            setNewRowView={setNewRowView}
            onSaveEntry={handleSaveNewEntry}
            selectedEmployeeId={selectedEmployeeId}
          />
        </CardContent>
      </Card>
    );
  }

  if (projectSelected && newRowView) {
    return (
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
    );
  }

  if (currentEntries.length > 0) {
    return (
      <div className="relative">
        <WeeklyEntriesCard
          client={clientName}
          currentEntries={currentEntries}
          currentProjectId={currentProjectId}
          dayInfo={dayInfo}
          isProjectBillable={isProjectBillable}
          isWeeklyEditing={isWeeklyEditing}
          newRowView={false}
          project={projectName}
          selectedEmployeeId={selectedEmployeeId}
          setCurrentEntries={setCurrentEntries}
          setEntryList={setEntryList}
          setIsWeeklyEditing={setIsWeeklyEditing}
          setNewRowView={setNewRowView}
          setProjectSelected={setProjectSelected}
        />
        {isWeeklyEditing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <Alert className="max-w-md">
              <Warning className="h-4 w-4" />
              <AlertDescription>
                Editing mode is active. Complete your changes above.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default WeeklyEntries;
