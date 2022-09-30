import { Roles, Paths } from "constants/index";

import ErrorPage from "common/Error";

import ClientDetails from "../components/Clients/Details";
import ClientList from "../components/Clients/List";
import DevicesList from "../components/Devices/List";
import EngagementDashboard from "../components/Engagements/Dashboard";
import EngagementList from "../components/Engagements/List";
import EditInvoice from "../components/Invoices/Edit";
import GenerateInvoices from "../components/Invoices/Generate";
import Invoice from "../components/Invoices/Invoice";
import InvoicesList  from "../components/Invoices/List";
import LeadActions from "../components/Leads/Actions";
import LeadDetails from "../components/Leads/Details";
import LeadQuoteDetails from "../components/Leads/Details";
import LeadList from "../components/Leads/List";
import Payments from "../components/payments";
import ProfileLayout from "../components/Profile/Layout";
import ProjectDetails from "../components/Projects/Details";
import ProjectList from "../components/Projects/List";
import RecruitmentMain from "../components/Recruitment";
import CandidateList from "../components/Recruitment/Candidates";
import CandidateDetails from "../components/Recruitment/Candidates/Details";
import ConsultancyList from "../components/Recruitment/Consultancies";
import OutstandingInvoiceReport from "../components/Reports/outstandingInvoices";
import ReportList from "../components/Reports/reportList";
import RevenueByClientReport from "../components/Reports/revenueByClient";
import TimeEntryReports from "../components/Reports/timeEntry";
import TotalHoursReport from "../components/Reports/totalHoursLogged";
import SpaceUsages from "../components/SpaceUsages/Index";
import PlanSelection from "../components/Subscriptions/PlanSelection";
import TeamRouteConfig from "../components/Team/RouteConfig";
import TimeTracking from "../components/time-tracking/Index";

const ClientsRoutes = [
  { path: "" ,Component: ClientList },
  { path: ":clientId" ,Component: ClientDetails }
];

const ReportsRoutes = [
  { path: "" ,Component: ReportList },
  { path: "time-entry" ,Component: TimeEntryReports },
  { path: "revenue-by-client" ,Component: RevenueByClientReport },
  { path: "outstanding-overdue-invoice" ,Component: OutstandingInvoiceReport },
  { path: "total-hours" ,Component: TotalHoursReport }
];

const InvoicesRoutes = [
  { path: "" , Component: InvoicesList },
  { path: "generate" ,Component: GenerateInvoices },
  { path: ":id/edit" ,Component: EditInvoice },
  { path: ":id" ,Component: Invoice },
  { path: "*" ,Component: ErrorPage }
];

const ProjectsRoutes = [
  { path: "" ,Component: ProjectList },
  { path: ":projectId" ,Component: ProjectDetails },
  { path: "*" ,Component: ErrorPage }
];

const SubscriptionsRoutes = [
  { path: "" ,Component: PlanSelection },
  { path: "*" ,Component: ErrorPage }
];

const PaymentsRoutes = [
  { path: "" ,Component: Payments },
  { path: "*" ,Component: ErrorPage }
];

const TimeTrackingRoutes = [
  { path: "" ,Component: TimeTracking },
  { path: "*" ,Component: ErrorPage }
];

const TeamRoutes = [
  { path: "*" ,Component: TeamRouteConfig }
];

const ProfileRoutes = [
  { path: "*" ,Component: ProfileLayout }
];

const SpacesRoutes = [
  { path: "", Component: SpaceUsages },
];

const DevicesRoutes = [
  { path: "", Component: DevicesList },
];

const EngagementRoutes = [
  { path: "" , Component: EngagementList },
  { path: "dashboard" ,Component: EngagementDashboard },
];

const LeadsRoutes = [
  { path: "" , Component: LeadList },
  { path: "actions" ,Component: LeadActions },
  { path: ":leadId" ,Component: LeadDetails },
  { path: ":leadId/timelines" ,Component: LeadDetails },
  { path: ":leadId/line-items" ,Component: LeadDetails },
  { path: ":leadId/quotes" ,Component: LeadDetails },
  { path: ":leadId/quotes/:quoteId" ,Component: LeadQuoteDetails },
];

const RecruitmentRoutes = [
  { path: "" , Component: RecruitmentMain },
  { path: "consultancies" ,Component: ConsultancyList },
  // { path: "consultancies/:consultancyId" ,Component: ConsultancyDetail },
  { path: "candidates" ,Component: CandidateList },
  { path: "candidates/:candidateId" ,Component: CandidateDetails },
  { path: "candidates/:candidateId/timelines" ,Component: CandidateDetails },
];

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE } = Roles;

const ROUTES = [
  { path: Paths.CLIENTS ,subRoutes: ClientsRoutes, authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.INVOICES ,subRoutes: InvoicesRoutes, authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER] },
  { path: Paths.REPORTS ,subRoutes: ReportsRoutes, authorisedRoles: [ADMIN, OWNER] },
  { path: Paths.PROJECTS ,subRoutes: ProjectsRoutes, authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.SUBSCRIPTIONS ,subRoutes: SubscriptionsRoutes, authorisedRoles: [ADMIN, OWNER] },
  { path: Paths.PAYMENTS ,subRoutes: PaymentsRoutes, authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER] },
  { path: Paths.TIME_TRACKING ,subRoutes: TimeTrackingRoutes, authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER] },
  { path: Paths.TEAM, subRoutes: TeamRoutes , authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.PROFILE, subRoutes: ProfileRoutes,  authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.SPACES, subRoutes: SpacesRoutes,  authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.DEVICES, subRoutes: DevicesRoutes,  authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.ENGAGEMENTS, subRoutes: EngagementRoutes,  authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.LEADS, subRoutes: LeadsRoutes,  authorisedRoles: [ADMIN, OWNER, EMPLOYEE] },
  { path: Paths.RECRUITMENT, subRoutes: RecruitmentRoutes, authorisedRoles: [ADMIN, OWNER] },
];

export default ROUTES;
