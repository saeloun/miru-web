import React from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";

import EntryCard from "../EntryCard";
import EntryForm from "../TimeEntryForm";
import WeeklyEntries from "../WeeklyEntries";

const TimeEntryManager = () => {
  const {
    view,
    projectId,
    projectName,
    clientName,
    dayInfo,
    entries,
    entryList,
    isWeeklyEditing,
    key,
    newRowView,
    projects,
    selectedEmployeeId,
    setEntryList,
    setIsWeeklyEditing,
    setNewRowView,
    setWeeklyData,
    weeklyData,
    clients,
    editEntryId,
    handleDeleteEntry,
    selectedFullDate,
    setEditEntryId,
    setNewEntryView,
    handleDuplicate,
    parseWeeklyViewData,
  } = useTimesheetEntries();

  return (
    <>
      {view === "week" ? (
        <>
          {newRowView && (
            <WeeklyEntries
              clientName={clientName || ""}
              clients={clients}
              dayInfo={dayInfo}
              entries={entries || []}
              entryList={entryList}
              isWeeklyEditing={isWeeklyEditing}
              key={key || 0}
              newRowView={newRowView}
              projectId={projectId || null}
              projectName={projectName || ""}
              projects={projects}
              selectedEmployeeId={selectedEmployeeId}
              setEntryList={setEntryList}
              setIsWeeklyEditing={setIsWeeklyEditing}
              setNewRowView={setNewRowView}
              setWeeklyData={setWeeklyData}
              weeklyData={weeklyData}
            />
          )}
          <div>
            {weeklyData?.map((entry, weekCounter) => (
              <WeeklyEntries
                key={weekCounter + 1}
                {...entry}
                clients={clients}
                dayInfo={dayInfo}
                entryList={entryList}
                isWeeklyEditing={isWeeklyEditing}
                newRowView={newRowView}
                parseWeeklyViewData={parseWeeklyViewData}
                projects={projects}
                selectedEmployeeId={selectedEmployeeId}
                setEntryList={setEntryList}
                setIsWeeklyEditing={setIsWeeklyEditing}
                setNewRowView={setNewRowView}
              />
            ))}
          </div>
        </>
      ) : (
        // Entry cards for day and month
        entryList[selectedFullDate] &&
        entryList[selectedFullDate]?.map((entry, weekCounter) =>
          editEntryId === entry.id ? (
            // Edit time entry form
            <EntryForm key={entry.id} />
          ) : (
            <EntryCard
              currentUserRole={entryList["currentUserRole"]}
              handleDeleteEntry={handleDeleteEntry}
              handleDuplicate={handleDuplicate}
              key={weekCounter}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
              {...entry}
            />
          )
        )
      )}
    </>
  );
};

export default TimeEntryManager;
