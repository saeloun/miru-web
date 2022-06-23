import React from "react";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import { MagnifyingGlass, Plus } from "phosphor-react";
import { TeamModalType } from "constants/index";

const Header = () => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();
  return (
    <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
      <h2 className="header__title">Team</h2>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper">
          <input
            type="search"
            className="header__searchInput"
            placeholder="Search"
          />

          <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
            <MagnifyingGlass size={12} />
          </button>
        </div>
      </div>
      {isAdminUser && (
        <div className="flex">
          <button
            type="button"
            className="header__button"
            onClick={() => setModalState(TeamModalType.ADD_EDIT)}
          >
            <Plus weight="fill" size={16} />
            <span className="ml-2 inline-block">NEW USER</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
