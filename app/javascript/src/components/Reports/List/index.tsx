import React from "react";

import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import {
  ReportcalendarIcon,
  CalendarHoverIcon,
  HoursIcon,
  HoursHoverIcon,
  OverdueOutstandingIcon,
  OverdueOutstandingHoverIcon,
  RevenueIcon,
  RevenueHoverIcon,
  AccountsAgingIcon,
  AccountsAgingHoverIcon,
} from "miruIcons";

import ReportCard from "./reportCard";

const listDetails = [
  {
    icon: ReportcalendarIcon,
    iconHover: CalendarHoverIcon,
    title: "Time Entry Report",
    description: "A summary of the time entries added by your team.",
    url: "time-entry",
    show: true,
  },
  {
    icon: OverdueOutstandingIcon,
    iconHover: OverdueOutstandingHoverIcon,
    title: "Invoices Report",
    description:
      "A detailed summary of outstanding and overdue of all clients for a period of time.",
    url: "outstanding-overdue-invoice",
    show: true,
  },
  {
    icon: HoursIcon,
    iconHover: HoursHoverIcon,
    title: "Total hours logged",
    description:
      "A detailed summary of billed, unbilled and non-billable hours by team grouped by project.",
    url: "total-hours",
    show: false,
  },
  {
    icon: RevenueIcon,
    iconHover: RevenueHoverIcon,
    title: "Revenue Report",
    description: "A detailed report of revenue from each client.",
    url: "revenue-by-client",
    show: true,
  },
  {
    icon: AccountsAgingIcon,
    iconHover: AccountsAgingHoverIcon,
    title: "Accounts Aging",
    description: "Find out which client have been taking a long time to pay",
    url: "accounts-aging",
    show: true,
  },
];

const List = () => {
  const { isDesktop } = useUserContext();

  const ReportsLayout = () => (
    <div className="min-h-screen bg-background p-6">
      {isDesktop && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Access detailed insights and analytics for your business
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl">
        {listDetails.map(
          (item, key) =>
            item.show && (
              <ReportCard
                description={item.description}
                icon={item.icon}
                iconHover={item.iconHover}
                key={key}
                title={item.title}
                url={item.url}
              />
            )
        )}
      </div>
    </div>
  );

  const Main = withLayout(ReportsLayout, !isDesktop, !isDesktop);

  return isDesktop ? ReportsLayout() : <Main />;
};

export default List;
