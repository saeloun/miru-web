import React from "react";

import { TeamModalType } from "constants/index";

// import Logger from "js-logger";
// import { unmapList } from "mapper/team.mapper";
// import teamApi from "apis/team";
import { Plus } from "phosphor-react";

import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const Header = () => {
  const { isAdminUser } = useUserContext();
  const { setModalState } = useList();

  // const searchCallBack = async (searchString, setDropdownItems) => {
  //   try {
  //     if (!searchString) return;
  //     const res = await teamApi.search(searchString);
  //     const dropdownList = unmapList(res);
  //     const searchList = dropdownList.map(item => ({
  //       label: item.name,
  //       value: item.id
  //     }));
  //     setDropdownItems(searchList);
  //   } catch (err) {
  //     Logger.error(err);
  //   }
  // };

  return (
    <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
      <h2 className="header__title ml-4">Team</h2>
      {/* <div className="header__searchWrap mx-auto">
        <div className="header__searchInnerWrapper">
          <AutoComplete searchCallBack={searchCallBack} />
          <button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
            <MagnifyingGlass size={12} />
          </button>
        </div>
      </div> */}
      {isAdminUser && (
        <div className="flex">
          <button
            type="button"
            className="header__button"
            data-cy="add-new-user-button"
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
