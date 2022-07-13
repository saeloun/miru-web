/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import ReportCard from "./reportCard";
const calendar = require("../../../../images/Calendar.svg"); // eslint-disable-line
const hours = require("../../../../images/Hours.svg");
const overdueOutstandingIcon = require("../../../../images/OverdueOutstanding.svg");
const revenue = require("../../../../images/Revenue.svg");

const listDetails = [{
  icon: calendar,
  title: "Time entry report",
  description: "A summary of the time entries added by your team.",
  url: "time-entry",
  show: true
}, {
  icon: overdueOutstandingIcon,
  title: "Outstanding & overdue invoices",
  description: "A detailed summary of outstanding and overdue of all clients for a period of time.",
  url: "outstanding-overdue-invoice",
  show: true
}, {
  icon: hours,
  title: "Total hours logged",
  description: "A detailed summary of billed, unbilled and non-billable hours by team grouped by project.",
  url: "total-hours",
  show: true
}, {
  icon: revenue,
  title: "Revenue by client",
  description: "A detailed report of revenue from each client.",
  url: "revenue-by-client",
  show: true
}];

const ReportsList = () => (
  <div>
    <div className="text-3xl font-bold mt-4">
      Reports
    </div>
    <div className="grid grid-cols-2">
      {listDetails.map((item, key) => (
        item.show && <div key={key} className="">
          <ReportCard
            icon={item.icon}
            title={item.title}
            description={item.description}
            url={item.url}
          />
        </div>
      ))
      }
    </div>
  </div>
);

export default ReportsList;
