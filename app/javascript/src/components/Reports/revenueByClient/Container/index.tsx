import React, { Fragment } from "react";
import TotalHeader from "common/TotalHeader";
import TableRow from "./TableRow";
import { useEntry } from "../../context/EntryContext";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        scope="col"
        className="w-2/5 pr-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        CLIENT
      </th>
      <th
        scope="col"
        className="w-2/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        UNPAID AMOUNT
      </th>
      <th
        scope="col"
        className="w-1/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        PAID AMOUNT
      </th>
      <th
        scope="col"
        className="w-1/5 pl-6 py-5 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        TOTAL AMOUNT
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { timeEntryReport } = useEntry();

  const getEntryList = (entries) =>
    entries.map((timeEntry, index) => (
      <TableRow key={`${timeEntry.client}-${index}`} {...timeEntry} />
    ));

  return (
    <Fragment>
      <TotalHeader
        firstTitle={"TOTAL UNPAID AMOUNT"}
        firstAmount={"1000K"}
        secondTitle={"TOTAL PAID AMOUNT"}
        secondAmount={"1000K"}
        thirdTitle={"TOTAL REVENUE"}
        thirdAmount={"1500K"}
      />
      <div>
      </div>
      {
        timeEntryReport.reports.map((report, index) => (
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
