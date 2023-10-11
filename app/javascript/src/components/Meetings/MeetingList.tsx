/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import Logger from "js-logger";
import { Button } from "StyledComponents";

import timeTrackingApi from "apis/timeTracking";

import Meeting from "./Meeting";

const MeetingList = ({ meetings, setMeetings }) => {
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [billable, setBillable] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [clients, setClients] = useState<any[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [projectBillable, setProjectBillable] = useState<boolean>(true);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState<boolean>(false);
  const [projects, setProjects] = useState<any>({});
  const [selectDate, setSelectDate] = useState<number>(dayjs().weekday());

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

  const handleDurationChange = val => {
    setDuration(val);
  };

  useEffect(() => {
    fetchTimeTrackingData();
  }, []);

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
          billable={billable}
          client={meeting?.client}
          clients={clients}
          displayDatePicker={displayDatePicker}
          duration={duration}
          handleDurationChange={handleDurationChange}
          key={idx}
          meeting={meeting}
          note={note}
          project={meeting?.project}
          projectBillable={projectBillable}
          projects={projects}
          selectDate={selectDate}
          setBillable={setBillable}
          setClient={setClient}
          setClients={setClients}
          setDisplayDatePicker={setDisplayDatePicker}
          setDuration={setDuration}
          setNote={setNote}
          setProject={setProject}
          setProjectBillable={setProjectBillable}
          setProjects={setProjects}
          setSelectDate={setSelectDate}
        />
      ))}
    </>
  );
};

export default MeetingList;
