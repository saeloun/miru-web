/* eslint-disable no-unused-vars */
import React, { useState } from "react";

import { format } from "date-fns";
import dayjs from "dayjs";
import {
  CheckedCheckboxSVG,
  CheckIcon,
  UncheckedCheckboxSVG,
  XIcon,
} from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";
import { Button, TimeInput } from "StyledComponents";

import CustomDatePicker from "common/CustomDatePicker";

const MeetingList = () => {
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [billable, setBillable] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [projectId, setProjectId] = useState<number>(0);
  const [projectBillable, setProjectBillable] = useState<boolean>(true);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState<boolean>(false);

  return (
    <>
      <div className="mt-3 flex justify-between">
        7 meetings and tasks
        <Button className="px-4 py-1 font-bold" style="secondary">
          Add All Meetings
        </Button>
      </div>
      <div className="mt-10 hidden min-h-24 justify-evenly rounded-lg p-4 shadow-2xl lg:flex">
        <div className="w-1/2">
          <div className="mb-2 flex w-129 justify-between">
            <select
              className="h-8 w-64 rounded-sm bg-miru-gray-100"
              id="client"
              name="client"
              value={client || "Client"}
              onChange={e => {
                setClient(e.target.value);
                // setProject(projects ? projects[e.target.value][0]?.name : "");
              }}
            >
              {!client && (
                <option disabled selected className="text-miru-gray-100">
                  Client
                </option>
              )}
              {clients.map((client, i) => (
                <option key={i.toString()}>{client["name"]}</option>
              ))}
            </select>
            <select
              className="h-8 w-64 rounded-sm bg-miru-gray-100"
              id="project"
              name="project"
              value={project}
              onChange={e => {
                setProject(e.target.value);
              }}
            >
              {!project && (
                <option disabled selected className="text-miru-gray-100">
                  Project
                </option>
              )}
              {/* {client &&
                projects[client].map((project, i) => (
                  <option data-project-id={project.id} key={i.toString()}>
                    {project.name}
                  </option>
                ))} */}
            </select>
          </div>
          <TextareaAutosize
            cols={60}
            name="notes"
            placeholder=" Notes"
            rows={5}
            value={note}
            className={`
            focus:miru-han-purple-1000 outline-none mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 p-2 px-1
          `}
            onChange={e => setNote(e.target["value"])}
          />
        </div>
        <div className="w-60">
          <div className="mb-2 flex justify-between">
            <div>
              {displayDatePicker && (
                <div className="relative">
                  <div className="h-100 w-100 absolute top-8 z-10">
                    <CustomDatePicker
                      date={dayjs("2023-09-09").toDate()}
                      handleChange={() =>
                        setDisplayDatePicker(!displayDatePicker)
                      }
                    />
                  </div>
                </div>
              )}
              <div
                className="formatted-date flex h-8 w-29 items-center justify-center rounded-sm bg-miru-gray-100 p-1 text-sm"
                id="formattedDate"
                onClick={() => {
                  setDisplayDatePicker(true);
                }}
              >
                {format(new Date("2023-09-26"), "dd MMM, yyyy")}
              </div>
            </div>
            <TimeInput
              className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
              initTime={duration}
              name="timeInput"
              // onTimeChange={handleDurationChange}
            />
          </div>
          <div className="mt-2 flex items-center">
            {billable ? (
              <img
                alt="checkbox"
                className="inline"
                id="check"
                src={CheckedCheckboxSVG}
                onClick={() => {
                  setBillable(false);
                }}
              />
            ) : (
              <>
                <img
                  alt="checkbox"
                  className="inline"
                  id="uncheck"
                  src={UncheckedCheckboxSVG}
                  onClick={() => {
                    if (projectBillable) setBillable(true);
                  }}
                />
                <h4>Billable</h4>
              </>
            )}
          </div>
        </div>
        <div className="-ml-0.5 w-0.5 bg-miru-gray-200" />
        <div className="flex items-center">
          <Button
            className="text-x mb-1 mr-3 h-8 rounded border py-1 px-3"
            style="secondary"
          >
            <CheckIcon />
          </Button>
          <Button
            className="text-x mb-1 h-8 rounded border py-1 px-3"
            style="secondary"
          >
            <XIcon />
          </Button>
        </div>
      </div>
    </>
  );
};

export default MeetingList;
