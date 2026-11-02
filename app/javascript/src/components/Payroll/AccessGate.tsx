import React from "react";

import { useUserContext } from "context/UserContext";
import { hasPayrollReviewAccess } from "../../lib/payrollAccess";

const PayrollAccessGate = ({ children }: { children: React.ReactNode }) => {
  const { company, user, companyRole } = useUserContext();

  if (
    !hasPayrollReviewAccess(company, user?.current_workspace_id, companyRole)
  ) {
    return (
      <div className="p-6 text-sm text-muted-foreground" role="status">
        Payroll review is unavailable in this workspace.
      </div>
    );
  }

  return <>{children}</>;
};

export default PayrollAccessGate;
