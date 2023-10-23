import ErrorPage from "common/Error";
import PlanSelection from "components/Subscriptions/PlanSelection";

export const SubscriptionsRoutes = [
  { path: "", Component: PlanSelection },
  { path: "*", Component: ErrorPage },
];
