import React, { useEffect } from "react";

import { TOASTER_DURATION } from "constants/index";

import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import ConsultancyList from "./Consultancies";

const Recruitments = ({ isAdminUser }) => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <ConsultancyList isAdminUser={isAdminUser} />
    </>
  );
};

export default Recruitments;
