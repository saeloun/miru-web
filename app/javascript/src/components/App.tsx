import React, { Fragment, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { TOASTER_DURATION } from "constants/index";
import Main from "./Main";

const App = (props) => {

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <Fragment>
      <BrowserRouter>
        <ToastContainer autoClose={TOASTER_DURATION} />
        <Main {...props} />
      </BrowserRouter>
    </Fragment>
  );
};

export default App;
