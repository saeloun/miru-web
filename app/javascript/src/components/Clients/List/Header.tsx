import * as React from "react";

import { SearchIcon, PlusIcon } from "miruIcons";

import clientApi from "apis/clients";
import AutoComplete from "common/AutoComplete";

import { unmapClientListForDropdown } from "../../../mapper/client.mapper";

const Header = ({ setnewClient, isAdminUser }) => {
  const searchCallBack = async (searchString, setDropdownItems) => {
    await clientApi.get(`?q=${searchString}`).then((res) => {
      const dropdownList = unmapClientListForDropdown(res);
      setDropdownItems(dropdownList);
    });
  };

  return (
    <div
      className={
        isAdminUser
          ? "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
          : "sm:flex mt-6 mb-3 sm:items-center"
      }
    >
      <h2 className="header__title ml-4">Clients</h2>

      {isAdminUser && (
        <React.Fragment>
          <div className="header__searchWrap">
            <div className="header__searchInnerWrapper">
              <AutoComplete searchCallBack={searchCallBack} />
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                <SearchIcon size={12} />
              </button>
            </div>
          </div>
          <div className="flex">
            <button
              type="button"
              className="header__button"
              onClick={() => setnewClient(true)}
            >
              <PlusIcon weight="fill" size={16} />
              <span className="ml-2 inline-block">NEW CLIENT</span>
            </button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Header;
