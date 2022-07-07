import React, { Fragment, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { TOASTER_DURATION } from "constants/index";

const App = () => {

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <Fragment>
      <BrowserRouter>
        <ToastContainer autoClose={TOASTER_DURATION} />
        <h1>hello world</h1>
      </BrowserRouter>
    </Fragment>
  );
};

export default App;
