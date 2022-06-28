import React, { Fragment } from "react";

import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { TOASTER_DURATION } from "constants/index";
import RouteConfig from "./RouteConfig";

const Reports = () => (
  <Fragment>
    <BrowserRouter>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <RouteConfig />
    </BrowserRouter>
  </Fragment>
);

export default Reports;
