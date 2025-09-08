import React, { Fragment, useCallback } from "react";

import { clientApi } from "apis/api";
import { UnifiedSearch } from "../../ui/enhanced-search";
import Logger from "js-logger";
import { unmapClientListForDropdown } from "mapper/mappedIndex";
import { PlusIcon } from "miruIcons";
import { Button } from "StyledComponents";

import SearchDataRow from "common/SearchDataRow";

const Header = ({ setnewClient, isAdminUser, setShowDialog }) => {
  const fetchClients = useCallback(async searchString => {
    try {
      const res = await clientApi.get(`?query=${searchString}`);
      const dropdownList = unmapClientListForDropdown(res);

      // Transform for UnifiedSearch interface
      return (
        dropdownList?.map(client => ({
          id: client.value || client.id,
          label: client.label || client.name,
          type: "client" as const,
          subtitle: client.email || client.description,
          ...client,
        })) || []
      );
    } catch (error) {
      Logger.error(error);

      return [];
    }
  }, []);

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
          <UnifiedSearch
            searchAction={fetchClients}
            placeholder="Search clients..."
            renderItem={item => (
              <SearchDataRow
                item={item}
                urlPrefix="clients"
                displayField="label"
                idField="value"
              />
            )}
            onSelect={client => {
              // Handle client selection if needed
            }}
            className="w-64"
            variant="input"
            size="md"
            minSearchLength={1}
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
            <span className="ml-2 text-base font-bold tracking-widest">
              NEW CLIENT
            </span>
          </Button>
        </Fragment>
      )}
    </div>
  );
};

export default Header;
