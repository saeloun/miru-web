import React, { Fragment } from "react";
import TableRow from "./TableRow";
import { useEntry } from "../context/EntryContext";

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
        className="w-3/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
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
        className="pl-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        HOURS
        <br />
        LOGGED
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { reports } = useEntry();

  const getEntryList = (entries) => {
    if (entries.length > 0) {
      return entries.map((timeEntry, index) => (
        <TableRow key={index} {...timeEntry} />
      ));
    }
  };

  return (
    <Fragment>
      {
        reports.map(report => (
          <Fragment>
            {report.label !== "" && <h1 className="text-miru-han-purple-1000 font-bold text-xl py-5 border-b border-miru-han-purple-1000">{report.label}</h1>}
            <table className="min-w-full divide-y divide-gray-200 mt-4">
              <TableHeader />
              <tbody className="bg-white divide-y divide-gray-200">
                {getEntryList(report.entries)}
              </tbody>
            </table>
          </Fragment>
        ))
      }
    </Fragment>
  );
};

export default Container;
