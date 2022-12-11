import React, { Fragment } from "react";

import Logger from "js-logger";
import { PlusIcon } from "miruIcons";

import clientApi from "apis/clients";
import AutoSearch from "common/AutoSearch";

import SearchDataRow from "./SearchDataRow";

import { unmapClientListForDropdown } from "../../../mapper/client.mapper";

const Header = ({ setnewClient, isAdminUser }) => {
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
      className={
        isAdminUser
          ? "mt-6 mb-3 sm:flex sm:items-center sm:justify-between"
          : "mt-6 mb-3 sm:flex sm:items-center"
      }
    >
      <h2 className="header__title ml-4">Clients</h2>
      {isAdminUser && (
        <Fragment>
          <AutoSearch
            SearchDataRow={SearchDataRow}
            searchAction={fetchClients}
          />
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
        </Fragment>
      )}
    </div>
  );
};

export default Header;
