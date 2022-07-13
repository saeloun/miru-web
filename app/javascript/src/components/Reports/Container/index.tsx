import React, { Fragment } from "react";
import TableRow from "./TableRow";
import { useEntry } from "../context/EntryContext";
import { getReports } from "../Header/fetchReport";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        scope="col"
        className="w-2/5 pr-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        PROJECT/
        <br />
        CLIENT
      </th>
      <th
        scope="col"
        className="w-2/5 px-10 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        NOTE
      </th>
      <th
        scope="col"
        className="w-1/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        TEAM MEMBER/
        <br />
        DATE
      </th>
      <th
        scope="col"
        className="w-1/5 pl-6 py-5 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        HOURS
        <br />
        LOGGED
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { timeEntryReport, revenueByClientReport, currentReport, totalHoursLoggedReport } = useEntry();

  const selectedReport = getReports({ currentReport, timeEntryReport, revenueByClientReport, totalHoursLoggedReport });

  const getEntryList = (entries) =>
    entries.map((timeEntry, index) => (
      <TableRow key={`${timeEntry.client}-${index}`} {...timeEntry} />
    ));

  return (
    <Fragment>
      {
        selectedReport.reports.map((report, index) => (
          <Fragment key={index}>
            {report.label !== "" && <h1 className="text-miru-han-purple-1000 font-bold text-xl py-5 border-b border-miru-han-purple-1000">{report.label}</h1>}
            <table className="min-w-full divide-y divide-gray-200 mt-4">
              <TableHeader />
              <tbody className="bg-white divide-y divide-gray-200">
                {report.entries.length > 0 && getEntryList(report.entries)}
              </tbody>
            </table>
          </Fragment>
        ))
      }
    </Fragment>
  );
};

export default Container;
