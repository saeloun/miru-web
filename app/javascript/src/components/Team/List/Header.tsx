import React from "react";

import { PlusIcon } from "miruIcons";

import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const Header = () => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <h2 className="header__title ml-4">Team</h2>
      {isAdminUser && (
        <div className="flex">
          <button
            className="header__button"
            type="button"
            onClick={() => setModalState(TeamModalType.ADD_EDIT)}
          >
            <PlusIcon size={16} weight="fill" />
            <span className="ml-2 inline-block">NEW USER</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
