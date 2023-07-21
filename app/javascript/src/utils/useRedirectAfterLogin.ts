import { useEffect } from "react";

import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";

const useRedirectAfterLogin = () => {
  const location = useLocation();

  useEffect(() => {
    Cookies.set("lastVisitedPage", location.pathname, { expires: 7 }); // expires in 7 days
  }, [location]);

  const getLastVisitPage = () => Cookies.get("lastVisitedPage");

  return { getLastVisitPage };
};

export default useRedirectAfterLogin;
