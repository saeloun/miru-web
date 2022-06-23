import ReactGA4 from "react-ga4";

ReactGA4.initialize("G-KXG1PCPVHT");

export const sendGAPageView = () => ReactGA4.send("pageview");
