import React, { Fragment } from "react";

import { minToHHMM } from "helpers";
import { ClientsIcon } from "miruIcons";
import { Avatar } from "StyledComponents";

import EmptyStates from "common/EmptyStates";
import { i18n } from "../../../i18n";

import ReportRow from "./ReportRow";

import { useEntry } from "../context/EntryContext";

interface ContainerProps {
  selectedFilter?: any;
}

const ReportHeader = () => (
  <div className="grid grid-cols-5 items-center gap-2 border-b">
    <div className="py-5 pr-6 text-left text-xs font-medium uppercase leading-4 tracking-widest text-muted-foreground">
      {i18n.t("reports.projectClient")}
    </div>
    <div className="col-span-2 px-6 py-5 text-left text-xs font-medium uppercase leading-4 tracking-widest text-muted-foreground">
      {i18n.t("reports.noteHeader")}
    </div>
    <div className="px-6 py-5 text-left text-xs font-medium uppercase leading-4 tracking-widest text-muted-foreground">
      {i18n.t("reports.teamMemberDate")}
    </div>
    <div className="py-5 pl-6 text-right text-xs font-medium uppercase leading-4 tracking-widest text-muted-foreground">
      {i18n.t("reports.hoursLogged")}
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

  const getTableLogo = (groupedBy: string | null, clientLogo: string) => {
    const logo = {
      client: <Avatar classNameImg="mr-2 lg:mr-6" url={clientLogo} />,
      project: <ClientsIcon className="m-0 object-contain" size={40} />,
      team_member: <Avatar />,
    };

    return logo[groupedBy] ? (
      <div className="mr-3 h-8 w-8 sm:mr-4 sm:h-10 sm:w-10">
        {logo[groupedBy]}
      </div>
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
          ({ id, label, entries }, index) => {
            const clientLogo = entries[0]?.clientLogo || "";

            return (
              <Fragment key={index}>
                {label !== "" && (
                  <div className="flex items-center justify-between border-b border-primary py-5">
                    <div className="flex items-center">
                      {getTableLogo(
                        selectedFilter?.groupBy?.value || null,
                        clientLogo
                      )}
                      <h1 className="font-sans text-xl font-bold text-primary">
                        {label}
                      </h1>
                    </div>
                    {entries?.length > 0 && (
                      <p className="text-right font-sans text-base font-medium text-foreground">
                        {i18n.t("reports.totalHours")} {label} : &nbsp;
                        {getTotalHoursLogged(id)}
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
              ? i18n.t("reports.noResultsMatchFilters")
              : i18n.t("reports.noTimeEntriesYet")
          }
        />
      )}
    </Fragment>
  );
};

export default Container;
