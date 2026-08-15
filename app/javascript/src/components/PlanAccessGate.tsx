import React from "react";

import Loader from "common/Loader";
import { useUserContext } from "context/UserContext";
import { Navigate } from "react-router-dom";

import { getStoredCompany, hasProAccess } from "../lib/planAccess";

type PlanAccessGateProps = {
  children: React.ReactNode;
  feature: string;
};

const PlanAccessGate: React.FC<PlanAccessGateProps> = ({
  children,
  feature,
}) => {
  const { company, loading } = useUserContext();
  const effectiveCompany = company || getStoredCompany();

  if (loading && !effectiveCompany) {
    return <Loader className="h-screen" />;
  }

  if (!hasProAccess(effectiveCompany)) {
    return <Navigate replace to={`/settings/billing?feature=${feature}`} />;
  }

  return <>{children}</>;
};

export default PlanAccessGate;
