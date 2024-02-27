import React from "react";

import { PlusIcon } from "miruIcons";

import teamApi from "apis/team";
import AutoSearch from "common/AutoSearch";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";

import SearchDataRow from "./SearchDataRow";

const Header = () => {
  const { setModalState } = useList();

  const fetchTeamList = async searchString => {
    const res = await teamApi.search(searchString);
    const dropdownList = unmapList(res);

    return dropdownList;
  };

  return (
    <div className="mt-6 mb-3 flex items-center justify-between">
      <h2 className="header__title hidden lg:inline">Team</h2>
      <AutoSearch SearchDataRow={SearchDataRow} searchAction={fetchTeamList} />
      <div className="flex justify-end">
        <button
          className="header__button"
          type="button"
          onClick={() => setModalState(TeamModalType.ADD_EDIT)}
        >
          <PlusIcon size={16} weight="fill" />
          <span className="ml-2 hidden lg:inline-block">NEW USER</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
