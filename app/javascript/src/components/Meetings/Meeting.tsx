/* eslint-disable no-unused-vars */
import React from "react";

import { format } from "date-fns";
import {
  CheckIcon,
  CheckedCheckboxSVG,
  UncheckedCheckboxSVG,
  XIcon,
} from "miruIcons";
import ReactTextareaAutosize from "react-textarea-autosize";

import CustomDatePicker from "common/CustomDatePicker";

import Button from "../../StyledComponents/Button";
import TimeInput from "../../StyledComponents/TimeInput";

const Meeting = ({
  meeting,
  displayDatePicker,
  setDisplayDatePicker,
  billable,
  setBillable,
  note,
  setNote,
  clients,
  setClients,
  duration,
  setDuration,
  client,
  setClient,
  project,
  setProject,
  projectBillable,
  setProjectBillable,
  projects,
  setProjects,
  selectDate,
  setSelectDate,
  handleDurationChange,
}) => (
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
            setProject(projects ? projects[e.target.value][0]?.name : "");
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
          {client &&
            projects[client].map((project, i) => (
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
        value={meeting.title}
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
                  date={selectDate}
                  setVisibility={displayDatePicker}
                  handleChange={date => {
                    setDisplayDatePicker(false);
                    setSelectDate(date);
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
            {format(new Date(meeting.startDate), "dd MMM, yyyy")}
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
);

export default Meeting;
