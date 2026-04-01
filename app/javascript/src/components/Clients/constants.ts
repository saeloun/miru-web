import { i18n } from "../../i18n";

export const tableHeader = [
  {
    Header: i18n.t("client").toUpperCase(),
    accessor: "col1",
    cssClass: "md:w-1/3 capitalize",
  },
  {
    Header: i18n.t("clients.hoursTracked").toUpperCase(),
    accessor: "col2",
    cssClass: "text-right md:w-1/5",
  },
];

export const employeeTableHeader = [
  {
    Header: i18n.t("client").toUpperCase(),
    accessor: "col1",
    cssClass: "",
  },
  {
    Header: i18n.t("clients.hoursTracked").toUpperCase(),
    accessor: "col2",
    cssClass: "text-right",
  },
];
export const mobileEmployeeTableHeader = [
  {
    Header: i18n.t("client").toUpperCase(),
    accessor: "col1",
    cssClass: "",
  },
  {
    Header: i18n.t("clients.hoursTracked").toUpperCase(),
    accessor: "col3",
    cssClass: "text-right",
  },
];
export const mobileTableHeader = [
  {
    Header: i18n.t("client").toUpperCase(),
    accessor: "col1",
    cssClass: "table__header font-medium",
  },
  {
    Header: i18n.t("hours").toUpperCase(),
    accessor: "col3",
    cssClass: "table__header font-medium text-right",
  },
  {
    Header: "",
    accessor: "col4",
    cssClass: "font-medium text-right",
  },
];
