import React from "react";

import { Button } from "components/ui/button";
import { Paths } from "constants/index";
import { useProfileContext } from "context/Profile/ProfileContext";
import { ArrowLeftIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const { personalDetails, isCalledFromSettings } = useProfileContext();

  const getHeaderContent = () => {
    if (isCalledFromSettings) {
      return null;
    }

    return (
      <div className="flex items-center">
        <Button
          className="mr-4"
          size="icon"
          type="button"
          variant="outline"
          onClick={() => navigate(Paths.TEAM.replace("/*", ""))}
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
