import React from "react";

import { PlusIcon } from "miruIcons";

import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const Header = () => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();

  return (
    <div className="mt-6 mb-3 lg:flex lg:items-center lg:justify-between">
      <h2 className="header__title ml-4 hidden lg:inline">Team</h2>
      {isAdminUser && (
        <div className="flex justify-end pr-6 lg:pr-0">
          <button
            className="header__button"
            type="button"
            onClick={() => setModalState(TeamModalType.ADD_EDIT)}
          >
            <PlusIcon size={16} weight="fill" />
            <span className="ml-2 hidden lg:inline-block">NEW USER</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
