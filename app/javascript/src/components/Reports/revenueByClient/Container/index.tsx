import React, { Fragment } from "react";
import TotalHeader from "common/TotalHeader";
import TableRow from "./TableRow";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        scope="col"
        className="w-3/5 pr-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        CLIENT
      </th>
      <th
        scope="col"
        className="w-2/5 px-0 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
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
  const dumRep = [{
    "name": "Neflix",
    "unpaidAmt": "$446.41",
    "paidAmt": "$60113",
    "total": "$655.29"
  }];

  const getEntryList = (entries) =>
    entries.map((timeEntry, index) => (
      <TableRow key={`${timeEntry.client}-${index}`} {...timeEntry} />
    ));

  return (
    <Fragment>
      <TotalHeader
        firstTitle={"TOTAL UNPAID AMOUNT"}
        firstAmount={"$35.5K"}
        secondTitle={"TOTAL PAID AMOUNT"}
        secondAmount={"$35.5K"}
        thirdTitle={"TOTAL REVENUE"}
        thirdAmount={"$71.0K"}
      />
      <div>
      </div>
      {
        dumRep.map((report, index) => (
          <Fragment key={index}>
            <table className="min-w-full divide-y divide-gray-200 mt-4">
              <TableHeader />
              <tbody className="bg-white divide-y divide-gray-200">
                {dumRep.length > 0 && getEntryList(dumRep)}
              </tbody>
            </table>
          </Fragment>
        ))
      }
    </Fragment>
  );
};

export default Container;
