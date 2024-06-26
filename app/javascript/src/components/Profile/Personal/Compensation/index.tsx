import React, { Fragment, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";

import StaticPage from "./StaticPage";

import DetailsHeader from "../../Common/DetailsHeader";

const CompensationDetails = () => {
  const { isDesktop, company } = useUserContext();
  const { updateDetails, compensationDetails, isCalledFromSettings } =
    useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();
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
    updateDetails("compensationDetails", compensationData);
    setIsLoading(false);
  };

  const handleEditClick = () => {
    navigate(`edit`, { replace: true });
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
          editAction={handleEditClick}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Compensation"
        />
      ) : (
        <MobileEditHeader
          backHref={isCalledFromSettings ? "/settings/" : `/team/${memberId}`}
          href="edit"
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
