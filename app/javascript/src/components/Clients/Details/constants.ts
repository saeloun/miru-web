import { i18n } from "../../../i18n";

export const tableHeader = [
  {
    Header: i18n.t("project").toUpperCase(),
    accessor: "col1", // accessor is the "key" in the data
    cssClass: "md:w-1/3",
  },
  {
    Header: i18n.t("projects.team").toUpperCase(),
    accessor: "col2",
    cssClass: "md:w-1/3",
  },
  {
    Header: i18n.t("clients.hoursLogged").toUpperCase(),
    accessor: "col3",
    cssClass: "text-right  md:w-1/5", // accessor is the "key" in the data
  },
];

export const mobileTableHeader = [
  {
    Header: i18n.t("project").toUpperCase(),
    accessor: "col1", // accessor is the "key" in the data
    cssClass: "md:w-1/3",
  },
  {
    Header: i18n.t("hours").toUpperCase(),
    accessor: "col2",
    cssClass: "text-right md:w-1/5", // accessor is the "key" in the data
  },
];
