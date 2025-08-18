import React, { useState, useEffect } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import { minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";
import { PencilSimple } from "phosphor-react";
import { TimeInput } from "../ui/time-input";
import { Toastr } from "../ui/toastr";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

const WeeklyEntriesCard = ({
  client,
  project,
  currentEntries,
  setProjectSelected,
  currentProjectId,
  setEntryList,
  setCurrentEntries,
  newRowView,
  setNewRowView,
  dayInfo,
  isWeeklyEditing,
  setIsWeeklyEditing,
  selectedEmployeeId,
  isProjectBillable,
}: Iprops) => {
  const [selectedInputBox, setSelectedInputBox] = useState<number>(-1);
  const [note, setNote] = useState<string>("");
  const [duration, setDuration] = useState<string>("00:00");
  const [showNote, setShowNote] = useState<boolean>(false);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<number>(0);
  const [billable, setBillable] = useState<boolean>(false);
  const [dataChanged, setDataChanged] = useState<boolean>(false);

  const getPayload = () => ({
    project_id: currentProjectId,
    duration: minFromHHMM(duration),
    bill_status: billable ? "unbilled" : "non_billable",
    note,
  });

  const handleUpdateRow = entry => {
    setCurrentEntries(prevState => {
      const newState: any = [...prevState];
      newState[selectedInputBox] = entry;

      return newState;
    });
  };

  const handleDurationClick = (num: number) => {
    if (dataChanged) return;

    if (isWeeklyEditing) return;
    setSelectedInputBox(num);
    setShowNote(true);
    setNote(currentEntries[num] ? currentEntries[num]["note"] : "");
    setDuration(
      minToHHMM(currentEntries[num] ? currentEntries[num]["duration"] : 0)
    );

    if (
      currentEntries[num] &&
      ["unbilled", "billed"].includes(currentEntries[num]["bill_status"])
    ) {
      setBillable(true);
    } else {
      setBillable(false);
    }
  };

  const handleSaveEntry = async () => {
    try {
      const payload = getPayload();
      const message = validateTimesheetEntry(payload, client, currentProjectId);
      if (message) {
        Toastr.error(message);

        return;
      }
      payload["work_date"] = dayInfo[selectedInputBox]["fullDate"];
      const res = await timesheetEntryApi.create(payload, selectedEmployeeId);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState: any = { ...prevState };
          if (newState[res.data.entry.work_date]) {
            newState[res.data.entry.work_date] = [
              ...newState[res.data.entry.work_date],
              res.data.entry,
            ];
          } else {
            newState[res.data.entry.work_date] = [res.data.entry];
          }

          return newState;
        });
        handleUpdateRow(res.data.entry);
        if (newRowView) setNewRowView(false);
        setDataChanged(false);
        setShowNote(false);
        setIsWeeklyEditing(false);
      }
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleUpdateEntry = async () => {
    try {
      const timesheetEntryId = currentEntries[selectedInputBox]["id"];
      const payload = getPayload();
      const message = validateTimesheetEntry(payload, client, currentProjectId);
      if (message) {
        Toastr.error(message);

        return;
      }
      const res = await timesheetEntryApi.update(timesheetEntryId, payload);
      if (res.status === 200) {
        setEntryList(prevState => {
          const newState: any = { ...prevState };
          newState[res.data.entry.work_date] = newState[
            res.data.entry.work_date
          ].map(entry =>
            entry.id === res.data.entry.id ? res.data.entry : entry
          );

          return newState;
        });
        handleUpdateRow(res.data.entry);
        setDataChanged(false);
        setShowNote(false);
        setIsWeeklyEditing(false);
      }
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const calculateTotalWeeklyDuration = () => {
    setWeeklyTotalHours(
      currentEntries.reduce((acc, cv) => (cv ? cv["duration"] + acc : 0), 0)
    );
  };

  const handleDurationChange = val => {
    setDuration(val);
    setDataChanged(true);
  };

  const handleSetFocus = () => {
    if (selectedInputBox === -1) return;
    document.getElementById("selectedInput")?.focus();
  };

  useEffect(() => {
    handleSetFocus();
  }, [selectedInputBox]);

  useEffect(() => {
    calculateTotalWeeklyDuration();
  }, [currentEntries]);

  useEffect(() => {
    handleSetFocus();
  }, [selectedInputBox]);

  useEffect(() => {
    handleSetFocus();
  }, []);

  return (
    <Card className="mt-4 w-full group hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex w-full items-center justify-between gap-4">
          {/* Project Info */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-base font-medium">{client}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-base font-medium">{project}</span>
          </div>
          {/* Time Inputs */}
          <div className="flex flex-1 items-center justify-between gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((num: number) =>
              num === selectedInputBox ? (
                <TimeInput
                  className={cn(
                    "h-12 w-20 text-center rounded-md border-2 border-primary",
                    "bg-muted font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                  id="selectedInput"
                  initTime={duration}
                  key={num}
                  name="timeInput"
                  onTimeChange={handleDurationChange}
                />
              ) : (
                <button
                  id={`inputClick_${num}`}
                  key={num}
                  className={cn(
                    "h-12 w-20 rounded-md border-2 border-transparent",
                    "bg-muted font-semibold text-lg transition-colors",
                    "hover:bg-accent hover:border-accent-foreground/20",
                    currentEntries[num]
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => handleDurationClick(num)}
                >
                  {currentEntries[num]
                    ? minToHHMM(currentEntries[num]["duration"])
                    : "00:00"}
                </button>
              )
            )}
          </div>
          {/* Total Hours */}
          <div className="min-w-[80px] text-center">
            <span className="text-lg font-bold">
              {minToHHMM(weeklyTotalHours)}
            </span>
          </div>
          {/* Edit Button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (!isWeeklyEditing) setProjectSelected(false);
              }}
            >
              <PencilSimple className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showNote && (
          <div className="mt-4 mx-auto max-w-2xl">
            <Card className="border-2">
              <CardContent className="p-0">
                <Textarea
                  className="min-h-[100px] rounded-b-none border-0 resize-none focus-visible:ring-0"
                  placeholder="Add a note..."
                  value={note}
                  onChange={e => {
                    setNote(e.target.value);
                    setDataChanged(true);
                  }}
                />
                <div className="flex items-center justify-between border-t bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="weekly-billable"
                      checked={billable && isProjectBillable}
                      disabled={!isProjectBillable}
                      onCheckedChange={checked => {
                        setBillable(checked as boolean);
                        setDataChanged(true);
                      }}
                    />
                    <Label
                      htmlFor="weekly-billable"
                      className={cn(
                        "text-sm font-medium cursor-pointer",
                        !isProjectBillable &&
                          "text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      Billable
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNote("");
                        setShowNote(false);
                        setDataChanged(false);
                        setSelectedInputBox(-1);
                        setBillable(false);
                        setIsWeeklyEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    {currentEntries[selectedInputBox] ? (
                      <Button
                        size="sm"
                        disabled={!(dataChanged && duration)}
                        onClick={handleUpdateEntry}
                      >
                        Update
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!(dataChanged && duration && note)}
                        onClick={handleSaveEntry}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface Iprops {
  client: string;
  project: string;
  isProjectBillable: boolean;
  selectedEmployeeId: number;
  currentEntries: Array<any>;
  setCurrentEntries: React.Dispatch<React.SetStateAction<[]>>;
  currentProjectId: number;
  setProjectSelected: React.Dispatch<React.SetStateAction<boolean>>;
  newRowView: boolean;
  setNewRowView: React.Dispatch<React.SetStateAction<boolean>>;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default WeeklyEntriesCard;
