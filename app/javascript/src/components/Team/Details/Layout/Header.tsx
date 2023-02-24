import React from "react";

import { ArrowLeftIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import { useTeamDetails } from "context/TeamDetailsContext";

const Header = () => {
  const navigate = useNavigate();
  const {
    details: { personalDetails },
  } = useTeamDetails();

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex items-center ">
        <button
          className="mr-4"
          onClick={() => {
            navigate("/teams");
          }}
        >
          <ArrowLeftIcon size={20} />
        </button>
        <h2 className="header__title">
          {`${personalDetails.first_name} ${personalDetails.last_name}`}
        </h2>
      </div>
    </div>
  );
};
export default Header;
