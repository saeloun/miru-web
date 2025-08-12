import React, { Fragment } from "react";

import clientApi from "apis/clients";
import AutoSearch from "common/AutoSearch";
import Logger from "js-logger";
import { unmapClientListForDropdown } from "mapper/mappedIndex";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

import SearchDataRow from "./SearchDataRow";

const Header = ({ setnewClient, isAdminUser, setShowDialog }) => {
  const fetchClients = async searchString => {
    try {
      const res = await clientApi.get(`?query=${searchString}`);
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
      <h2 className="header__title ml-4 hidden text-2xl font-bold lg:inline">
        Clients
      </h2>
      {isAdminUser && (
        <Fragment>
          <AutoSearch
            SearchDataRow={SearchDataRow}
            searchAction={fetchClients}
          />
          <Button
            className="ml-2 flex items-center px-2 py-2 lg:ml-0 lg:px-4"
            style="secondary"
            onClick={() => {
              setShowDialog(true);
              setnewClient(true);
            }}
          >
            <PlusIcon size={16} weight="bold" />
            <span className="ml-2 hidden text-base font-bold tracking-widest lg:inline-block">
              New Client
            </span>
          </Button>
        </Fragment>
      )}
    </div>
  );
};

export default Header;
