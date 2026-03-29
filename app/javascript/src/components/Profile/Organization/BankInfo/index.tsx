import React from "react";
import { Navigate } from "react-router-dom";

const BankInfo = () => (
  <Navigate replace to="/settings/organization/edit#bank-info" />
);

export default BankInfo;
