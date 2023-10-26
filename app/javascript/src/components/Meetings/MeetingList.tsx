import React, { useEffect, useState } from "react";

import { minFromHHMM } from "helpers";
import Logger from "js-logger";
import { Button } from "StyledComponents";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import { useUserContext } from "context/UserContext";

import AddAllMeetingsModal from "./AddAllMeetingsModal";
import Meeting from "./Meeting";

const MeetingList = ({ meetings, setMeetings }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any>({});
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const { user } = useUserContext();

  const fetchTimeTrackingData = async () => {
    try {
      const {
        data: { clients, projects },
      } = await timeTrackingApi.get();

      setClients(clients);
      setProjects(projects);
    } catch (error) {
      Logger.error(error);
    }
  };

  useEffect(() => {
    fetchTimeTrackingData();
  }, []);

  const updateClient = (id, client, project) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = {
      ...updatedMeetings[id],
      client,
      project,
    };
    setMeetings(updatedMeetings);
  };

  const updateProject = (id, project) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = { ...updatedMeetings[id], project };
    setMeetings(updatedMeetings);
  };

  const updateNote = (id, note) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = { ...updatedMeetings[id], note };
    setMeetings(updatedMeetings);
  };

  const updateDate = (id, date) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = { ...updatedMeetings[id], date };
    setMeetings(updatedMeetings);
  };

  const updateDuration = (id, duration) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = { ...updatedMeetings[id], duration };
    setMeetings(updatedMeetings);
  };

  const updateBillable = (id, billable) => {
    const updatedMeetings = [...meetings];
    updatedMeetings[id] = { ...updatedMeetings[id], billable };
    setMeetings(updatedMeetings);
  };

  const formatDataForTimeTracking = async (
    data,
    isMultipleMeetings: boolean
  ) => {
    let timeTrackingFormat;

    if (isMultipleMeetings) {
      timeTrackingFormat = data.map(el => ({
        bill_status: el.billable ? "unbilled" : "non_billable",
        duration: minFromHHMM(el.duration),
        note: el.title || el.note,
        work_date: el.startDate,
        project_id: getProjectId(el),
      }));

      await timesheetEntryApi.createBulk(
        {
          bulk_action: {
            timesheet_entry: timeTrackingFormat,
          },
        },
        user.id
      );
    } else {
      timeTrackingFormat = {
        timesheet_entry: {
          bill_status: data.billable ? "unbilled" : "non_billable",
          duration: minFromHHMM(data.duration),
          note: data.title || data.note,
          work_date: data.startDate,
        },
        projectId: getProjectId(data),
      };

      await timesheetEntryApi.create(
        {
          timesheet_entry: timeTrackingFormat.timesheet_entry,
          project_id: timeTrackingFormat.projectId,
        },
        user.id
      );
    }
  };

  const getProjectId = data =>
    projects[data.client].find(
      currentProject => currentProject.name === data.project
    ).id;

  const checkPresenceInArray = (key: string) =>
    meetings.filter(el => Object.keys(el).includes(key)).length <
    meetings.length;

  const removeMeeting = id => {
    const filteredMeetings = meetings.filter((_value, idx) => idx !== id);
    localStorage.setItem("calendarEvents", JSON.stringify(filteredMeetings));
    setMeetings(filteredMeetings);
  };

  return (
    <>
      <div className="mt-6 flex justify-between">
        {meetings?.length} meetings and tasks
        <Button
          className="px-4 py-1 font-bold"
          disabled={meetings?.length === 0 || checkPresenceInArray("project")}
          style="secondary"
          onClick={() => setShowDialog(true)}
        >
          Add All Meetings
        </Button>
      </div>
      {meetings?.map((meeting, idx) => (
        <Meeting
          clients={clients}
          formatDataForTimeTracking={formatDataForTimeTracking}
          id={idx}
          key={idx}
          meeting={meeting}
          projects={projects}
          removeMeeting={removeMeeting}
          updateBillable={updateBillable}
          updateClient={updateClient}
          updateDate={updateDate}
          updateDuration={updateDuration}
          updateNote={updateNote}
          updateProject={updateProject}
        />
      ))}
      {showDialog && (
        <AddAllMeetingsModal
          formatDataForTimeTracking={formatDataForTimeTracking}
          meetings={meetings}
          setShowDialog={setShowDialog}
          showDialog={showDialog}
        />
      )}
    </>
  );
};

export default MeetingList;
