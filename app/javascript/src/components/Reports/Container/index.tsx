import React, { Fragment } from "react";

import { minToHHMM } from "helpers";
import { ClientsIcon } from "miruIcons";
import { Avatar } from "StyledComponents";

import EmptyStates from "common/EmptyStates";

import ReportRow from "./ReportRow";

import { useEntry } from "../context/EntryContext";

interface ContainerProps {
  selectedFilter?: any;
}

const ReportHeader = () => (
  <div className="grid grid-cols-5 items-center gap-2 border-b">
    <div className="py-5 pr-6 text-left text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      PROJECT/
      <br />
      CLIENT
    </div>
    <div className="col-span-2 px-6 py-5 text-left text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      NOTE
    </div>
    <div className="px-6 py-5 text-left text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      TEAM MEMBER/
      <br />
      DATE
    </div>
    <div className="py-5 pl-6 text-right text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      HOURS
      <br />
      LOGGED
    </div>
  </div>
);

const Container = ({ selectedFilter }: ContainerProps) => {
  const { timeEntryReport } = useEntry();

  const getTotalHoursLogged = label => {
    //to match the keys in filterOptions object
    let selectedGroupByFilter;
    switch (timeEntryReport.groupByTotalDuration.groupBy) {
      case "client":
        selectedGroupByFilter = "clients";
        break;
      case "team_member":
        selectedGroupByFilter = "teamMembers";
        break;
      case "project":
        selectedGroupByFilter = "projects";
        break;
    }

    //Extract the id for provided label
    const group = timeEntryReport.filterOptions[selectedGroupByFilter];
    const extractedIdForProvidedLabel = group?.filter(
      groupItem => groupItem.label == label
    )[0]?.value;

    //get the total duration in minutes
    const totalHoursForProvidedLabel =
      timeEntryReport.groupByTotalDuration.groupedDurations[
        extractedIdForProvidedLabel
      ];

    return minToHHMM(totalHoursForProvidedLabel || 0);
  };

  const getTableLogo = (groupedBy: string | null, clientLogo: string) => {
    const logo = {
      client: <Avatar classNameImg="mr-2 lg:mr-6" url={clientLogo} />,
      project: <ClientsIcon className="m-0 object-contain" size={40} />,
      team_member: <Avatar />,
    };

    return logo[groupedBy] ? (
      <div className="mr-6 md:h-10 md:w-10">{logo[groupedBy]}</div>
    ) : null;
  };

  const getEntryList = entries =>
    entries.map((timeEntry, index) => (
      <ReportRow key={`${timeEntry.client}-${index}`} timeEntry={timeEntry} />
    ));

  const getAlphabeticallySortedReportList = (reports: any[] | null = []) =>
    reports?.sort((a, b) => {
      const firstLabel = a.label.toLowerCase();
      const secondLabel = b.label.toLowerCase();

      if (firstLabel < secondLabel) return -1;
      else if (firstLabel > secondLabel) return 1;

      return 0;
    }) || [];

  return (
    <Fragment>
      {timeEntryReport.reports?.length > 0 ? (
        getAlphabeticallySortedReportList(timeEntryReport.reports)?.map(
          ({ label, entries }, index) => {
            const clientLogo = entries[0]?.clientLogo || "";

            return (
              <Fragment key={index}>
                {label !== "" && (
                  <div className="flex items-center justify-between border-b border-miru-han-purple-1000 py-5">
                    <div className="flex items-center">
                      {getTableLogo(
                        selectedFilter?.groupBy?.value || null,
                        clientLogo
                      )}
                      <h1 className="font-manrope text-xl font-bold text-miru-han-purple-1000">
                        {label}
                      </h1>
                    </div>
                    {entries?.length > 0 && (
                      <p className="text-right font-manrope text-base font-medium text-miru-dark-purple-1000">
                        Total Hours for {label} : &nbsp;
                        {getTotalHoursLogged(label)}
                      </p>
                    )}
                  </div>
                )}
                <ReportHeader />
                <div className="mb-6">
                  {entries.length > 0 && getEntryList(entries)}
                </div>
              </Fragment>
            );
          }
        )
      ) : (
        <EmptyStates
          showNoSearchResultState={timeEntryReport.filterCounter > 0}
          Message={
            timeEntryReport.filterCounter > 0
              ? "No results match current filters. Try removing some filters."
              : "There are no time entries added yet. You’ll see a summary of time entries added by your team."
          }
        />
      )}
    </Fragment>
  );
};

export default Container;
