import React from "react";

import { ArrowLeftIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import { useProfileContext } from "context/Profile/ProfileContext";

const Header = () => {
  const navigate = useNavigate();
  const { personalDetails, isCalledFromSettings } = useProfileContext();

  const getHeaderContent = () => {
    if (isCalledFromSettings) {
      return <span className="text-32 font-bold">Profile & Settings</span>;
    }

    return (
      <div className="flex items-center">
        <Button
          className="mr-4"
          style="ternary"
          onClick={() => navigate("/teams")}
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <span className="text-32 font-bold">
          {`${personalDetails.first_name} ${personalDetails.last_name}`}
        </span>
      </div>
    );
  };

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      {getHeaderContent()}
    </div>
  );
};

export default Header;
