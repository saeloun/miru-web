import ReactGA4 from "react-ga4";
import { MIRU_GA_MEASUREMENT_ID } from "constants/index";

ReactGA4.initialize(MIRU_GA_MEASUREMENT_ID);

export const sendGAPageView = () => ReactGA4.send("pageview");
