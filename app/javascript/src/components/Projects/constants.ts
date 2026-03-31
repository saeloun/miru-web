import { i18n } from "../../i18n";

export const tableHeader = [
  {
    Header: i18n.t("projects.teamMember").toUpperCase(),
    accessor: "col1",
    cssClass: "",
  },
  {
    Header: i18n.t("projects.hourlyRate").toUpperCase(),
    accessor: "col2",
    cssClass: "text-right",
  },
  {
    Header: i18n.t("projects.hoursLogged").toUpperCase(),
    accessor: "col3",
    cssClass: "text-right",
  },
  {
    Header: i18n.t("projects.cost").toUpperCase(),
    accessor: "col4",
    cssClass: "text-right",
  },
];

export const getAmountBox = (
  currencySymb: string,
  cashFormatter: any,
  overdueOutstandingAmount: any
) => [
  {
    title: i18n.t("projects.overdue"),
    amount:
      currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount),
  },
  {
    title: i18n.t("projects.outstanding"),
    amount:
      currencySymb +
      cashFormatter(overdueOutstandingAmount?.outstanding_amount),
  },
];
