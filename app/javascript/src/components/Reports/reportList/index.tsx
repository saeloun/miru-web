/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import ReportCard from "./reportCard";

const calendar = require("../../../miruIcons/Calendar.svg");
const calendarHover = require("../../../miruIcons/CalendarHover.svg");
const hours = require("../../../miruIcons/Hours.svg");
const hoursHover = require("../../../miruIcons/HoursHover.svg");
const overdueOutstandingIcon = require("../../../miruIcons/OverdueOutstanding.svg");
const overdueOutstandingHover = require("../../../miruIcons/OverdueOutstandingHover.svg");
const revenue = require("../../../miruIcons/Revenue.svg");
const revenueHover = require("../../../miruIcons/RevenueHover.svg");

const listDetails = [
  {
    icon: calendar,
    iconHover: calendarHover,
    title: "Time Entry Report",
    description: "A summary of the time entries added by your team.",
    url: "time-entry",
    show: true,
  },
  {
    icon: overdueOutstandingIcon,
    iconHover: overdueOutstandingHover,
    title: "Invoices Report",
    description:
      "A detailed summary of outstanding and overdue of all clients for a period of time.",
    url: "outstanding-overdue-invoice",
    show: true,
  },
  {
    icon: hours,
    iconHover: hoursHover,
    title: "Total hours logged",
    description:
      "A detailed summary of billed, unbilled and non-billable hours by team grouped by project.",
    url: "total-hours",
    show: false,
  },
  {
    icon: revenue,
    iconHover: revenueHover,
    title: "Revenue Report",
    description: "A detailed report of revenue from each client.",
    url: "revenue-by-client",
    show: true,
  },
];

const ReportsList = () => (
  <div>
    <div className="mt-4 text-3xl font-bold">Reports</div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {listDetails.map(
        (item, key) =>
          item.show && (
            <div className="" key={key}>
              <ReportCard
                description={item.description}
                icon={item.icon}
                iconHover={item.iconHover}
                title={item.title}
                url={item.url}
              />
            </div>
          )
      )}
    </div>
  </div>
);

export default ReportsList;
