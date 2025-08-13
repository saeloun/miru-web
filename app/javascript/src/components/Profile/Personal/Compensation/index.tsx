import React, { Fragment, useEffect, useState } from "react";

import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import StaticPage from "./StaticPage";

import DetailsHeader from "../../Common/DetailsHeader";

const CompensationDetails = () => {
  const { isDesktop, company } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { updateDetails, compensationDetails, isCalledFromSettings } =
    useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Effect to determine current user ID
  useEffect(() => {
    if (isCalledFromSettings) {
      // Use fresh user data from _me endpoint for settings
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    } else {
      // Use memberId for team view
      setCurrentUserId(memberId);
    }
  }, [isCalledFromSettings, currentUser, memberId]);

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
          href="edit"
          title="Compensation"
          backHref={
            isCalledFromSettings
              ? "/settings/"
              : `/team/${currentUserId || memberId}`
          }
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
