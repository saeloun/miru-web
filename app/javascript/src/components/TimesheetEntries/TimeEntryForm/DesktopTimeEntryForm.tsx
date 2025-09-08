import React, { MutableRefObject, useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useTimeEntryForm } from "context/TimesheetEntries/TimeEntryFormContext";
import dayjs from "dayjs";
import { useOutsideClick, validateTimesheetEntry } from "helpers";
import AnimatedTimeInput from "../../ui/animated-time-input";
import AnimatedSelect from "../../ui/animated-select";
import AnimatedTextarea from "../../ui/animated-textarea";
import { AnimatedButton } from "../../ui/animated-button";
import AnimatedDatePicker from "../../ui/animated-date-picker";
import AnimatedCheckbox from "../../ui/animated-checkbox";
import { Card } from "../../ui/card";
import { cn } from "../../../lib/utils";

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

  const clientOptions =
    clients?.map(client => ({
      value: client.name,
      label: client.name,
    })) || [];

  const projectOptions =
    client && projects[client]
      ? projects[client].map(project => ({
          value: project.name,
          label: project.name,
          id: project.id,
        }))
      : [];

  return (
    <Card
      className={cn(
        "hidden min-h-24 justify-between p-6 shadow-lg lg:flex",
        editEntryId && "mt-10"
      )}
    >
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatedSelect
            options={clientOptions}
            value={client || ""}
            placeholder="Select a client"
            onChange={value => {
              setClient(value);
              if (projects && projects[value] && projects[value][0]) {
                setProject(projects[value][0].name);
              } else {
                setProject("");
              }
            }}
          />
          <AnimatedSelect
            options={projectOptions}
            value={project || ""}
            placeholder="Select a project"
            disabled={!client}
            onChange={setProject}
          />
        </div>
        <AnimatedTextarea
          name="notes"
          placeholder="Add notes..."
          value={note}
          autoResize
          className={cn(
            "w-full resize-none",
            editEntryId ? "min-h-[120px]" : "min-h-[80px]"
          )}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="space-y-6 ml-8">
        <div className="grid grid-cols-1 gap-4">
          <AnimatedDatePicker
            date={dayjs(selectedDate).toDate()}
            onDateChange={handleDateChangeFromDatePicker}
            className="w-[180px]"
          >
            <CustomDatePicker
              date={dayjs(selectedDate).toDate()}
              handleChange={handleDateChangeFromDatePicker}
            />
          </AnimatedDatePicker>

          <div className="w-[180px]">
            <AnimatedTimeInput
              initTime={duration}
              name="timeInput"
              onTimeChange={handleDurationChange}
              allowModeSwitch={false}
              defaultMode="hhmm"
              placeholder="Enter time"
            />
          </div>
        </div>

        <AnimatedCheckbox
          id="billable"
          checked={billable}
          disabled={!projectBillable}
          onCheckedChange={checked => setBillable(checked)}
          label="Billable"
          className="ml-1"
        />
      </div>

      <div className="flex flex-col gap-3 ml-8">
        {editEntryId === 0 ? (
          <AnimatedButton
            disabled={handleDisableBtn()}
            loading={submitting}
            animation="bounce"
            onClick={() => {
              setSubmitting(true);
              handleSave();
            }}
          >
            Save Entry
          </AnimatedButton>
        ) : (
          <AnimatedButton
            disabled={handleDisableBtn()}
            animation="bounce"
            onClick={() => handleEdit()}
          >
            Update Entry
          </AnimatedButton>
        )}
        <AnimatedButton
          variant="outline"
          animation="scale"
          onClick={() => {
            setNewEntryView(false);
            setEditEntryId(0);
          }}
        >
          Cancel
        </AnimatedButton>
      </div>
    </Card>
  );
};

export default DesktopTimeEntryForm;
