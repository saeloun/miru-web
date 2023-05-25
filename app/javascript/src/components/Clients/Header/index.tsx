import React, { Fragment } from "react";

import Logger from "js-logger";
import { PlusIcon } from "miruIcons";

import clientApi from "apis/clients";
import AutoSearch from "common/AutoSearch";
import { unmapClientListForDropdown } from "mapper/mappedIndex";

import SearchDataRow from "./SearchDataRow";

const Header = ({ setnewClient, isAdminUser, setShowDialog }) => {
  const fetchClients = async searchString => {
    try {
      const res = await clientApi.get(`?q=${searchString}`);
      const dropdownList = unmapClientListForDropdown(res);

      return dropdownList;
    } catch (error) {
      Logger.error(error);
    }
  };

  return (
    <div
      className={`m-4 flex items-center lg:mx-0 lg:mt-6 lg:mb-3 ${
        isAdminUser ? "justify-between" : ""
      }`}
    >
      <h2 className="header__title ml-4 hidden lg:inline">Clients</h2>
      {isAdminUser && (
        <Fragment>
          <AutoSearch
            SearchDataRow={SearchDataRow}
            searchAction={fetchClients}
          />
          <div className="flex">
            <button
              className="header__button md:px-2 "
              type="button"
              onClick={() => {
                setShowDialog(true);
                setnewClient(true);
              }}
            >
              <PlusIcon size={16} weight="fill" />
              <span className="ml-2 hidden md:inline">NEW CLIENT</span>
            </button>
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default Header;
