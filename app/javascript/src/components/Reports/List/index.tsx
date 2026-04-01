import React from "react";

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

import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { i18n } from "../../../i18n";

import ReportCard from "./reportCard";

const getListDetails = () => [
  {
    icon: ReportcalendarIcon,
    iconHover: CalendarHoverIcon,
    title: i18n.t("reports.timeEntryReportTitle"),
    description: i18n.t("reports.timeEntryReportDesc"),
    url: "time-entry",
    show: true,
  },
  {
    icon: OverdueOutstandingIcon,
    iconHover: OverdueOutstandingHoverIcon,
    title: i18n.t("reports.invoicesReport"),
    description: i18n.t("reports.invoicesReportDesc"),
    url: "outstanding-overdue-invoices",
    show: true,
  },
  {
    icon: HoursIcon,
    iconHover: HoursHoverIcon,
    title: i18n.t("reports.totalHoursLoggedTitle"),
    description: i18n.t("reports.totalHoursLoggedDesc"),
    url: "total-hours",
    show: false,
  },
  {
    icon: RevenueIcon,
    iconHover: RevenueHoverIcon,
    title: i18n.t("reports.revenueReport"),
    description: i18n.t("reports.revenueReportDesc"),
    url: "revenue-by-client",
    show: true,
  },
  {
    icon: AccountsAgingIcon,
    iconHover: AccountsAgingHoverIcon,
    title: i18n.t("reports.accountsAging"),
    description: i18n.t("reports.accountsAgingDesc"),
    url: "accounts-aging",
    show: true,
  },
];

const List = () => {
  const { isDesktop } = useUserContext();

  const ReportsLayout = () => (
    <div className="p-4">
      {isDesktop && <div className="mt-4 text-3xl font-bold">{i18n.t("reports.reports")}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-4">
        {getListDetails().map(
          (item, key) =>
            item.show && (
              <div key={key}>
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

  const Main = withLayout(ReportsLayout, !isDesktop, !isDesktop);

  return isDesktop ? ReportsLayout() : <Main />;
};

export default List;
