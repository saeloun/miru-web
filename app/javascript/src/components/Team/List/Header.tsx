import { TeamModalType } from "constants/index";

import React from "react";

import teamApi from "apis/team";
import AutoSearch from "common/AutoSearch";
import { useList } from "context/TeamContext";
import { unmapList } from "mapper/team.mapper";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

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
        <Button
          className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
          style="secondary"
          onClick={() => setModalState(TeamModalType.ADD_EDIT)}
        >
          <PlusIcon size={16} weight="bold" />
          <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
            New User
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Header;
