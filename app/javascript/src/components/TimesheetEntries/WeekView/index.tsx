import React from "react";

import { VacationIconSVG } from "miruIcons";

import TimeoffEntryManager from "components/TimeoffEntries/TimeoffEntryManager";
import { useTimesheetEntries } from "context/TimesheetEntries";

import WeeklyEntries from "./WeeklyEntries";

const WeekView = () => {
  const {
    projectId,
    projectName,
    clientName,
    dayInfo,
    entries,
    isWeeklyEditing,
    newRowView,
    projects,
    selectedEmployeeId,
    setEntryList,
    setIsWeeklyEditing,
    setNewRowView,
    weeklyData,
    clients,
    editTimeoffEntryId,
    parseWeeklyViewData,
    leaveTypeHashObj,
    holidaysHashObj,
    newTimeoffEntryView,
    setNewTimeoffEntryView,
    weeklyTimeoffEntries,
  } = useTimesheetEntries();

  return (
    <>
      {!newTimeoffEntryView && (
        <div className="flex">
          <button
            className="h-14 w-full border-2 border-miru-han-purple-600 p-4 text-lg font-bold tracking-widest text-miru-han-purple-600"
            onClick={() => setNewRowView(true)}
          >
            + NEW ROW
          </button>
          <button
            className="ml-2 flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-lg font-bold uppercase tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
            onClick={() => {
              setNewTimeoffEntryView(true);
            }}
          >
            <img className="icon" src={VacationIconSVG} />
            <span className="ml-2">Mark Time Off</span>
          </button>
        </div>
      )}
      {newRowView && (
        <WeeklyEntries
          clientName={clientName || ""}
          clients={clients}
          dayInfo={dayInfo}
          entries={entries || []}
          isWeeklyEditing={isWeeklyEditing}
          newRowView={newRowView}
          projectId={projectId || null}
          projectName={projectName || ""}
          projects={projects}
          selectedEmployeeId={selectedEmployeeId}
          setEntryList={setEntryList}
          setIsWeeklyEditing={setIsWeeklyEditing}
          setNewRowView={setNewRowView}
        />
      )}
      <div>
        {weeklyData?.map((entry, index) => (
          <WeeklyEntries
            key={index}
            {...entry}
            clients={clients}
            dayInfo={dayInfo}
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
        {weeklyTimeoffEntries?.map(entry => (
          <TimeoffEntryManager
            showDateLabelForWeekView
            holidayDetails={holidaysHashObj[entry?.holiday_info_id || null]}
            isDisplayEditTimeoffEntryForm={editTimeoffEntryId === entry?.id}
            key={entry.id}
            leaveTypeDetails={leaveTypeHashObj[entry?.leave_type_id] || null}
            timeoffEntry={entry}
          />
        ))}
      </div>
    </>
  );
};

export default WeekView;
