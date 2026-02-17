/* eslint-disable */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { minFromHHMM, minToHHMM, validateTimesheetEntry } from "helpers";
import { EditIcon, ClockIcon, CalendarIcon } from "miruIcons";
import { Toastr } from "StyledComponents";
import AnimatedTimeInput from "../../ui/animated-time-input";
import { Card, CardHeader, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { AnimatedButton } from "../../ui/animated-button";
import AnimatedCheckbox from "../../ui/animated-checkbox";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { cn } from "../../../lib/utils";
import { timesheetEntryApi } from "apis/api";

const WeeklyEntriesCard = ({
  client,
  project,
  currentEntries,
  setProjectSelected,
  currentProjectId,
  entryList,
  setEntryList,
  setCurrentEntries,
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

    currentEntries[num] &&
    ["unbilled", "billed"].includes(currentEntries[num]["bill_status"])
      ? setBillable(true)
      : setBillable(false);
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
      handleUpdateRow(res.data.entry);
      setDataChanged(false);
      setShowNote(false);
      setIsWeeklyEditing(false);
      setSelectedInputBox(-1);
      setEntryList(prevState => {
        const newState: any = { ...prevState };
        const {
          data: { entry },
        } = res;
        const { work_date } = entry;

        if (newState[work_date]) {
          newState[work_date] = [...newState[work_date], entry];
        } else {
          newState[work_date] = [entry];
        }

        return newState;
      });
    } catch (error) {}
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
      const updatedEntry = res.data.entry;
      handleUpdateRow(updatedEntry);
      setDataChanged(false);
      setShowNote(false);
      setIsWeeklyEditing(false);
      setSelectedInputBox(-1);
      const allEntries = { ...entryList };
      allEntries[updatedEntry.work_date] = allEntries[
        updatedEntry.work_date
      ].map(entry => {
        if (entry.id == updatedEntry.id) {
          return { ...entry, ...updatedEntry };
        }
        return entry;
      });
      setEntryList(allEntries);
    } catch (error) {}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="mt-4 w-full shadow-lg border-0 bg-gradient-to-r from-white to-gray-50/50 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <ClockIcon className="h-5 w-5 text-primary" />
                </motion.div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-foreground">
                      {client}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {project}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 rounded-lg bg-muted/50 px-3 py-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {minToHHMM(weeklyTotalHours)}
                </span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => {
                    if (!isWeeklyEditing) setProjectSelected(false);
                  }}
                >
                  <EditIcon size={16} weight="bold" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <Separator className="mx-6" />

        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, index) => (
                <div key={day} className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {day}
                  </div>
                  <AnimatePresence mode="wait">
                    {index === selectedInputBox ? (
                      <motion.div
                        key={`input-${index}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="w-full"
                      >
                        <AnimatedTimeInput
                          initTime={duration}
                          name="timeInput"
                          onTimeChange={handleDurationChange}
                          allowModeSwitch={false}
                          defaultMode="hhmm"
                          autoFocus={true}
                          placeholder="HH:MM"
                          className="text-center"
                        />
                      </motion.div>
                    ) : (
                      <motion.button
                        key={`button-${index}`}
                        type="button"
                        id={`inputClick_${index}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          },
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "w-full h-14 flex items-center justify-center rounded-lg border-2 border-transparent transition-all duration-200 font-bold",
                          currentEntries[index]
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-muted text-muted-foreground/50 hover:bg-muted/80"
                        )}
                        onClick={() => handleDurationClick(index)}
                      >
                        <div className="text-center">
                          <div className="text-sm font-mono">
                            {currentEntries[index]
                              ? minToHHMM(currentEntries[index]["duration"])
                              : "00:00"}
                          </div>
                          {currentEntries[index] && (
                            <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-1" />
                          )}
                        </div>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>

          <AnimatePresence>
            {showNote && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden"
              >
                <Separator className="my-6" />

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Add Notes
                    </label>
                    <Textarea
                      placeholder="Describe your work..."
                      value={note}
                      className="min-h-[80px] resize-none border-border/50 focus:border-primary transition-colors"
                      onChange={e => {
                        setNote(e.target.value);
                        setDataChanged(true);
                      }}
                    />
                  </div>

                  <motion.div
                    className="flex items-center justify-between rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 p-4 border border-border/30"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center space-x-4">
                      <AnimatedCheckbox
                        id="billable-weekly"
                        checked={billable && isProjectBillable}
                        disabled={!isProjectBillable}
                        onCheckedChange={checked => {
                          if (isProjectBillable) {
                            setBillable(checked);
                            setDataChanged(true);
                          }
                        }}
                        label="Billable Time"
                      />

                      {billable && isProjectBillable && (
                        <Badge variant="default" className="text-xs">
                          Billable
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <AnimatedButton
                        variant="outline"
                        size="sm"
                        animation="scale"
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
                      </AnimatedButton>

                      {currentEntries[selectedInputBox] ? (
                        <AnimatedButton
                          size="sm"
                          animation="bounce"
                          disabled={!(dataChanged && duration)}
                          onClick={handleUpdateEntry}
                        >
                          Update Entry
                        </AnimatedButton>
                      ) : (
                        <AnimatedButton
                          size="sm"
                          animation="bounce"
                          disabled={!(dataChanged && duration && note)}
                          onClick={handleSaveEntry}
                        >
                          Save Entry
                        </AnimatedButton>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
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
  entryList: any;
  setEntryList: React.Dispatch<React.SetStateAction<[]>>;
  dayInfo: Array<any>;
  isWeeklyEditing: boolean;
  setIsWeeklyEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default WeeklyEntriesCard;
