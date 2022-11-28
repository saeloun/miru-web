import * as React from "react";

import { SearchIcon, PlusIcon } from "miruIcons";

import clientApi from "apis/clients";
import AutoComplete from "common/AutoComplete";

import { unmapClientListForDropdown } from "../../../mapper/client.mapper";

const Header = ({ setnewClient, isAdminUser }) => {
  const searchCallBack = async (searchString, setDropdownItems) => {
    await clientApi.get(`?q=${searchString}`).then(res => {
      const dropdownList = unmapClientListForDropdown(res);
      setDropdownItems(dropdownList);
    });
  };

  return (
    <div
      className={
        isAdminUser
          ? "mt-6 mb-3 sm:flex sm:items-center sm:justify-between"
          : "mt-6 mb-3 sm:flex sm:items-center"
      }
    >
      <h2 className="header__title ml-4">Clients</h2>
      {isAdminUser && (
        <React.Fragment>
          <div className="header__searchWrap">
            <div className="header__searchInnerWrapper">
              <AutoComplete searchCallBack={searchCallBack} />
              <button className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3">
                <SearchIcon size={12} />
              </button>
            </div>
          </div>
          <div className="flex">
            <button
              className="header__button"
              type="button"
              onClick={() => setnewClient(true)}
            >
              <PlusIcon size={16} weight="fill" />
              <span className="ml-2 inline-block">NEW CLIENT</span>
            </button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Header;
