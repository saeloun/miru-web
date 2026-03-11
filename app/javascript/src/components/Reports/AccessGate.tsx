import React from "react";

import { Navigate } from "react-router-dom";

import { useUserContext } from "context/UserContext";
import Loader from "common/Loader";

import { getStoredCompany, hasProAccess } from "../../lib/planAccess";

const ReportsAccessGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { company, loading } = useUserContext();
  const effectiveCompany = company || getStoredCompany();

  if (loading && !effectiveCompany) {
    return <Loader className="h-screen" />;
  }

  if (!hasProAccess(effectiveCompany)) {
    return <Navigate replace to="/settings/billing" />;
  }

  return <>{children}</>;
};

export default ReportsAccessGate;
