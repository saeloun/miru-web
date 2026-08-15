import React from "react";

import PlanAccessGate from "components/PlanAccessGate";

const ReportsAccessGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <PlanAccessGate feature="reports">{children}</PlanAccessGate>;

export default ReportsAccessGate;
