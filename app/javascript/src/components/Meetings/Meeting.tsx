/* eslint-disable no-unused-vars */
import React, { useState } from "react";

import { format } from "date-fns";
import dayjs from "dayjs";
import {
  CheckIcon,
  CheckedCheckboxSVG,
  UncheckedCheckboxSVG,
  XIcon,
} from "miruIcons";
import ReactTextareaAutosize from "react-textarea-autosize";
import { Button, TimeInput } from "StyledComponents";

import CustomDatePicker from "common/CustomDatePicker";

const Meeting = ({
  id,
  meeting,
  clients,
  updateClient,
  projects,
  updateProject,
  updateNote,
  updateDate,
  updateDuration,
  updateBillable,
  formatDataForTimeTracking,
  removeMeeting,
}) => {
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [projectBillable, setProjectBillable] = useState<boolean>(false);

  const handleDurationChange = val => {
    updateDuration(id, val);
  };

  return (
    <div className="mt-10 hidden min-h-24 justify-evenly rounded-lg p-4 shadow-2xl lg:flex">
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            className="h-8 w-64 rounded-sm bg-miru-gray-100"
            id="client"
            name="client"
            value={meeting.client || "Client"}
            onChange={e => {
              updateClient(
                id,
                e.target.value,
                projects ? projects[e.target.value][0]?.name : ""
              );

              setProjectBillable(
                projects ? projects[e.target.value][0]?.billable : false
              );
            }}
          >
            {!meeting.client && (
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
            value={meeting.project}
            onChange={e => {
              updateProject(id, e.target.value);
            }}
          >
            {!meeting.project && (
              <option disabled selected className="text-miru-gray-100">
                Project
              </option>
            )}
            {meeting.client &&
              projects[meeting.client]?.map((project, i) => (
                <option data-project-id={project.id} key={i.toString()}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>
        <ReactTextareaAutosize
          cols={60}
          name="notes"
          placeholder=" Notes"
          rows={5}
          value={meeting.note || meeting.title}
          className={`
              focus:miru-han-purple-1000 outline-none mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 p-2 px-1
            `}
          onChange={e => updateNote(id, e.target["value"])}
        />
      </div>
      <div className="w-60">
        <div className="mb-2 flex justify-between">
          <div>
            {displayDatePicker && (
              <div className="relative">
                <div className="h-100 w-100 absolute top-8 z-10">
                  <CustomDatePicker
                    date={dayjs().format("YYYY-MM-DD")}
                    setVisibility={displayDatePicker}
                    handleChange={date => {
                      setDisplayDatePicker(false);
                      updateDate(id, date);
                    }}
                  />
                </div>
              </div>
            )}
            <div
              className="formatted-date flex h-8 w-29 items-center justify-center rounded-sm bg-miru-gray-100 p-1 text-sm"
              id="formattedDate"
              onClick={() => {
                setDisplayDatePicker(!displayDatePicker);
              }}
            >
              {format(
                new Date(meeting.date || meeting.startDate),
                "dd MMM, yyyy"
              )}
            </div>
          </div>
          <TimeInput
            className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
            initTime={meeting.duration}
            name="timeInput"
            onTimeChange={handleDurationChange}
          />
        </div>
        <div className="mt-2 flex items-center">
          {meeting.billable ? (
            <img
              alt="checkbox"
              className="inline"
              id="check"
              src={CheckedCheckboxSVG}
              onClick={() => {
                updateBillable(id, false);
              }}
            />
          ) : (
            <img
              alt="checkbox"
              className="inline"
              id="uncheck"
              src={UncheckedCheckboxSVG}
              onClick={() => {
                if (projectBillable) updateBillable(id, true);
              }}
            />
          )}
          <h4>Billable</h4>
        </div>
      </div>
      <div className="-ml-0.5 w-0.5 bg-miru-gray-200" />
      <div className="flex items-center">
        <Button
          className="text-x mb-1 mr-3 h-8 rounded border py-1 px-3"
          disabled={!(meeting.project && meeting.client)}
          style="secondary"
          onClick={() => {
            formatDataForTimeTracking(meeting, false);
            removeMeeting(id);
          }}
        >
          <CheckIcon />
        </Button>
        <Button
          className="text-x mb-1 h-8 rounded border py-1 px-3"
          style="secondary"
          onClick={() => removeMeeting(id)}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
};

export default Meeting;
