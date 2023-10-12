/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";

import Logger from "js-logger";
import { Button } from "StyledComponents";

import timeTrackingApi from "apis/timeTracking";

import Meeting from "./Meeting";

const MeetingList = ({ meetings, setMeetings }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any>({});

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

  return (
    <>
      <div className="mt-6 flex justify-between">
        {meetings?.length} meetings and tasks
        <Button className="px-4 py-1 font-bold" style="secondary">
          Add All Meetings
        </Button>
      </div>
      {meetings?.map((meeting, idx) => (
        <Meeting
          clients={clients}
          id={idx}
          key={idx}
          meeting={meeting}
          projects={projects}
          updateBillable={updateBillable}
          updateClient={updateClient}
          updateDate={updateDate}
          updateDuration={updateDuration}
          updateNote={updateNote}
          updateProject={updateProject}
        />
      ))}
    </>
  );
};

export default MeetingList;
