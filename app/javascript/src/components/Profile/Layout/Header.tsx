import React from "react";

import { useProfileContext } from "context/Profile/ProfileContext";
import { ArrowLeftIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const Header = () => {
  const navigate = useNavigate();
  const { personalDetails, isCalledFromSettings } = useProfileContext();

  const getHeaderContent = () => {
    if (isCalledFromSettings) {
      return (
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Update profile, workspace, and preferences.
          </p>
        </div>
      );
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
        <span className="text-3xl font-bold tracking-tight text-foreground">
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
