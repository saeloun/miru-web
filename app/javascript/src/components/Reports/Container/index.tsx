import React, { Fragment } from "react";

import ReportRow from "./ReportRow";

import { useEntry } from "../context/EntryContext";

const ReportHeader = () => (
  <div className="grid grid-cols-5 gap-2 border-b">
    <div className="py-5 pr-6 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600">
      PROJECT/
      <br />
      CLIENT
    </div>
    <div className="col-span-2 px-6 py-5 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600">
      NOTE
    </div>
    <div className="px-6 py-5 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600">
      TEAM MEMBER/
      <br />
      DATE
    </div>
    <div className="py-5 pl-6 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
      HOURS
      <br />
      LOGGED
    </div>
  </div>
);

const Container = () => {
  const { timeEntryReport } = useEntry();

  const getEntryList = entries =>
    entries.map((timeEntry, index) => (
      <ReportRow key={`${timeEntry.client}-${index}`} {...timeEntry} />
    ));

  return (
    <Fragment>
      {timeEntryReport.reports.map((report, index) => (
        <Fragment key={index}>
          {report.label !== "" && (
            <h1 className="border-b border-miru-han-purple-1000 py-5 text-xl font-bold text-miru-han-purple-1000">
              {report.label}
            </h1>
          )}
          <ReportHeader />
          {report.entries.length > 0 && getEntryList(report.entries)}
        </Fragment>
      ))}
    </Fragment>
  );
};

export default Container;
