import React, { Fragment } from "react";

import EmptyStates from "common/EmptyStates";
import { minToHHMM } from "helpers";

import ReportRow from "./ReportRow";

import { useEntry } from "../context/EntryContext";

interface ContainerProps {
  selectedFilter?: any;
}

const ReportHeader = () => (
  <div className="grid grid-cols-5 gap-2 border-b border-miru-gray-200 bg-miru-gray-50">
    <div className="py-4 pr-6 text-left">
      <span className="text-xs font-medium uppercase tracking-widest text-miru-black-1000">
        PROJECT / CLIENT
      </span>
    </div>
    <div className="col-span-2 px-6 py-4 text-left">
      <span className="text-xs font-medium uppercase tracking-widest text-miru-black-1000">
        NOTE
      </span>
    </div>
    <div className="px-6 py-4 text-left">
      <span className="text-xs font-medium uppercase tracking-widest text-miru-black-1000">
        TEAM MEMBER / DATE
      </span>
    </div>
    <div className="py-4 pl-6 text-right">
      <span className="text-xs font-medium uppercase tracking-widest text-miru-black-1000">
        HOURS
      </span>
    </div>
  </div>
);

const Container = ({ selectedFilter }: ContainerProps) => {
  const { timeEntryReport } = useEntry();

  const getTotalHoursLogged = id => {
    const totalHours =
      timeEntryReport?.groupByTotalDuration?.groupedDurations?.[id];

    return minToHHMM(totalHours || 0);
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
          ({ id, label, entries }, index) => {
            const clientLogo = entries[0]?.clientLogo || "";

            return (
              <Fragment key={index}>
                {label !== "" && (
                  <div className="flex items-center justify-between border-b border-miru-gray-300 bg-gradient-to-r from-miru-gray-100 to-miru-gray-50 px-4 py-3">
                    <div className="flex items-center">
                      <h1 className="text-base font-semibold text-miru-dark-purple-1000">
                        {label}
                      </h1>
                    </div>
                    {entries?.length > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-medium uppercase tracking-wide text-miru-dark-purple-500">
                          Total:
                        </span>
                        <span className="ml-2 text-base font-bold text-miru-dark-purple-1000">
                          {getTotalHoursLogged(id)}
                        </span>
                      </div>
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
