import React, { MutableRefObject, useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useTimeEntryForm } from "context/TimesheetEntries/TimeEntryFormContext";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useOutsideClick, validateTimesheetEntry } from "helpers";
import { CheckedCheckboxSVG, UncheckedCheckboxSVG } from "miruIcons";
import TextareaAutosize from "react-textarea-autosize";
import { Button, BUTTON_STYLES, TimeInput } from "StyledComponents";

const DesktopTimeEntryForm = () => {
  const {
    clients,
    projects,
    editEntryId,
    setNewEntryView,
    setEditEntryId,
    setUpdateView,
  } = useTimesheetEntries();

  const {
    getPayload,
    projectBillable,
    displayDatePicker,
    setDisplayDatePicker,
    project,
    projectId,
    submitting,
    setProject,
    client,
    setClient,
    note,
    setNote,
    billable,
    setBillable,
    selectedDate,
    duration,
    setDuration,
    handleSave,
    handleEdit,
    setSubmitting,
    setSelectedDate,
  } = useTimeEntryForm();
  const datePickerRef: MutableRefObject<any> = useRef();
  useOutsideClick(datePickerRef, () => {
    setDisplayDatePicker(false);
  });

  const handleDurationChange = val => {
    setDuration(val);
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
    setUpdateView(false);
  };

  const handleDisableBtn = () => {
    const tse = getPayload();
    const message = validateTimesheetEntry(tse, client, projectId);
    if (message || submitting) {
      return true;
    }

    return false;
  };

  return (
    <div
      className={`
       hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex ${
         editEntryId ? "mt-10" : ""
       }`}
    >
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
            {clients?.map((client, i) => (
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
              projects[client]?.map((project, i) => (
                <option data-project-id={project.id} key={i.toString()}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>
        <TextareaAutosize
          cols={60}
          name="notes"
          placeholder=" Notes"
          rows={5}
          value={note}
          className={`
            focus:miru-han-purple-1000 outline-none mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 px-1 ${
              editEntryId ? "h-auto" : "h-8"
            }
          `}
          onChange={e => setNote(e.target["value"])}
        />
      </div>
      <div className="w-60">
        <div className="mb-2 flex justify-between">
          <div>
            {displayDatePicker && (
              <div className="relative" ref={datePickerRef}>
                <div className="h-100 w-100 absolute top-8 z-10">
                  <CustomDatePicker
                    date={dayjs(selectedDate).toDate()}
                    handleChange={handleDateChangeFromDatePicker}
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
              {format(new Date(selectedDate), "do MMM, yyyy")}
            </div>
          </div>
          <TimeInput
            className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
            initTime={duration}
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
            <img
              alt="checkbox"
              className="inline"
              id="uncheck"
              src={UncheckedCheckboxSVG}
              onClick={() => {
                if (projectBillable) setBillable(true);
              }}
            />
          )}
          <h4>Billable</h4>
        </div>
      </div>
      <div className="max-w-min">
        {editEntryId === 0 ? (
          <Button
            disabled={handleDisableBtn()}
            style={BUTTON_STYLES.primary}
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              handleDisableBtn()
                ? "cursor-not-allowed bg-miru-gray-1000"
                : "bg-miru-han-purple-1000 hover:border-transparent"
            }`}
            onClick={() => {
              setSubmitting(true);
              handleSave();
            }}
          >
            SAVE
          </Button>
        ) : (
          <Button
            disabled={handleDisableBtn()}
            style={BUTTON_STYLES.primary}
            className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold tracking-widest text-white ${
              handleDisableBtn()
                ? "cursor-not-allowed bg-miru-gray-1000"
                : "bg-miru-han-purple-1000 hover:border-transparent"
            }`}
            onClick={() => handleEdit()}
          >
            UPDATE
          </Button>
        )}
        <Button
          className="mt-1 h-8 w-38 rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-xs font-bold tracking-widest text-miru-han-purple-600 hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
          style={BUTTON_STYLES.secondary}
          onClick={() => {
            setNewEntryView(false);
            setEditEntryId(0);
          }}
        >
          CANCEL
        </Button>
      </div>
    </div>
  );
};

export default DesktopTimeEntryForm;
