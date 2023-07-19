import ReactGA4 from "react-ga4";

ReactGA4.initialize("G-RE7G4EBX10");

export const sendGAPageView = () => ReactGA4.send("pageview");
