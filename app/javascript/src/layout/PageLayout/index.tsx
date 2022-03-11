import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import Header from "./Header";
import Pagination from "./Pagination";

const PageLayout = ({ children }) => {
  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <React.Fragment>
      <Header/>
      {children}
      <Pagination />
    </React.Fragment>
  );
};

export default PageLayout;
