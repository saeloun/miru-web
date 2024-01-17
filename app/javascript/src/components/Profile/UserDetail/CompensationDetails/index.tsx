import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfile } from "components/Profile/context/EntryContext";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";

import StaticPage from "./StaticPage";

const CompensationDetails = () => {
  const { isDesktop, company } = useUserContext();
  const { setUserState, compensationDetails } = useProfile();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const getDetails = async () => {
    //fetch compensation details from backend and store it in compensationData
    const compensationData = {
      earnings: [
        { type: "Monthly Salary", amount: "125000" },
        { type: "SGST (9%)", amount: "11250" },
        { type: "CGST (9%)", amount: "11250" },
      ],
      deductions: [{ type: "TDS", amount: "12500" }],
      total: {
        amount: "147500",
      },
    };
    setUserState("compensationDetails", compensationData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDetails();
  }, []);

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader
          showButtons
          isDisableUpdateBtn={false}
          subTitle=""
          title="Compensation"
          editAction={() =>
            navigate(`/settings/compensation/edit`, { replace: true })
          }
        />
      ) : (
        <MobileEditHeader
          backHref="/settings/"
          href="/settings/compensation/edit"
          title="Compensation"
        />
      )}
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <StaticPage
          compensationDetails={compensationDetails}
          currency={company?.base_currency}
        />
      )}
    </Fragment>
  );
};
export default CompensationDetails;
