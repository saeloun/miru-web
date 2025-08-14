import React, { Fragment } from "react";

import EmptyStates from "common/EmptyStates";
import { minToHHMM } from "helpers";
import { ClientsIcon } from "miruIcons";
import { Avatar, Pagination } from "StyledComponents";

import ReportMobileRow from "./ReportMobileRow";

import { useEntry } from "../context/EntryContext";

interface ContainerProps {
  selectedFilter?: any;
  paginationDetails?: any;
  handlePageClick: any;
}

const ReportHeader = () => (
  <div className="grid grid-cols-10 items-center gap-2 border-b py-4">
    <div className="col-span-4 text-left text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      PROJECT/
      <br />
      CLIENT
    </div>
    <div className="col-span-4 px-2 text-left text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      TEAM MEMBER/
      <br />
      DATE
    </div>
    <div className="col-span-2 text-right text-xs font-medium uppercase leading-4 tracking-widest text-miru-dark-purple-600">
      HOURS
      <br />
      LOGGED
    </div>
  </div>
);

export const TimeEntryReportMobileView = ({
  selectedFilter,
  paginationDetails,
  handlePageClick,
}: ContainerProps) => {
  const { timeEntryReport } = useEntry();

  const getTotalHoursLogged = entries => {
    const totalHours = entries?.reduce((totalDuration, currentEntry) => {
      if (currentEntry?.duration) {
        totalDuration += currentEntry.duration;
      }

      return totalDuration;
    }, 0);

    return minToHHMM(totalHours || 0);
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

  const getEntryList = (entries, clientLogo: string) => (
    <div className="flex flex-col border-b">
      {entries.map((timeEntry, index) => (
        <ReportMobileRow
          clientLogo={clientLogo}
          key={`${timeEntry.client}-${index}`}
          timeEntry={timeEntry}
        />
      ))}
    </div>
  );

  const getAlphabaticallySortedReportList = (reports: any[] | null = []) =>
    reports?.sort((a, b) => {
      const firstLabel = a.label.toLowerCase();
      const secondLabel = b.label.toLowerCase();

      if (firstLabel < secondLabel) return -1;
      else if (firstLabel > secondLabel) return 1;

      return 0;
    }) || [];

  return (
    <div className="h-full px-3">
      {timeEntryReport.reports?.length > 0 ? (
        getAlphabaticallySortedReportList(timeEntryReport.reports)?.map(
          (report, index) => (
            <Fragment key={index}>
              {report.label !== "" && (
                <div className="flex items-center justify-between border-b border-miru-han-purple-1000 py-2">
                  <div className="flex items-center">
                    {getTableLogo(
                      selectedFilter?.groupBy?.value || null,
                      report.clientLogo
                    )}
                    <span className="font-manrope text-lg font-bold text-miru-han-purple-1000">
                      {report.label}
                    </span>
                  </div>
                  {report.entries?.length > 0 && (
                    <p className="text-right font-manrope text-sm font-medium text-miru-dark-purple-1000">
                      Total Hours :{` ${getTotalHoursLogged(report.entries)}`}
                    </p>
                  )}
                </div>
              )}
              <ReportHeader />
              <div className="mb-6">
                {report.entries.length > 0 &&
                  getEntryList(report.entries, report.clientLogo)}
              </div>
            </Fragment>
          )
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
      <Pagination
        currentPage={paginationDetails?.page}
        handleClick={handlePageClick}
        isFirstPage={paginationDetails?.first}
        isLastPage={paginationDetails?.last}
        nextPage={paginationDetails?.next}
        prevPage={paginationDetails?.prev}
        totalPages={paginationDetails?.pages}
      />
    </div>
  );
};
