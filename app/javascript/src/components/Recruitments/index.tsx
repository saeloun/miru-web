import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import { TOASTER_DURATION } from "constants/index";
import Tab from "./Tab";

const Recruitments = ({ isAdminUser }) => {

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Tab isAdminUser={isAdminUser} />
    </>
  );
};

export default Recruitments;
