import React, { useState, useEffect } from "react";

import { useDebounce } from "helpers";
import { XIcon, FilterIcon, PlusIcon, MinusIcon, SearchIcon } from "miruIcons";
import { SidePanel, Button } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";
import { useEntry } from "components/Reports/context/EntryContext";

const FilterSideBar = ({
  setIsFilterVisible,
  selectedFilter,
  setSelectedFilter,
  setFilterCounter,
  resetFilter,
}) => {
  const { accountsAgingReport } = useEntry();

  const [isClientOpen, setIsClientOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClients, setSelectedClients] = useState<null | any[]>(
    selectedFilter
  );

  const [filteredClientList, setFilteredClientList] = useState<null | any[]>(
    accountsAgingReport.clientList
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery && filteredClientList.length > 0) {
      const newClientList = filteredClientList.filter(client =>
        client.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

      newClientList.length > 0
        ? setFilteredClientList(newClientList)
        : setFilteredClientList([]);
    } else {
      setFilteredClientList(accountsAgingReport.clientList);
    }
  }, [debouncedSearchQuery]);

  const handleSelectClient = selectedClient => {
    if (selectedClients.includes(selectedClient)) {
      const newarr = selectedClients.filter(
        client => client.id != selectedClient.id
      );
      setSelectedClients(newarr);
    } else {
      setSelectedClients([...selectedClients, selectedClient]);
    }
  };

  const handleApply = () => {
    setSelectedFilter(selectedClients);
    setFilterCounter(selectedClients.length);
    setIsFilterVisible(false);
  }; //eslint-disable-line

  const handleReset = () => {}; //eslint-disable-line

  return (
    <SidePanel setFilterVisibilty={setIsFilterVisible}>
      <SidePanel.Header className="mb-7 flex items-center justify-between px-5 pt-5 font-bold text-miru-dark-purple-1000">
        <h4 className="flex items-center text-base">
          <FilterIcon className="mr-2.5" size={16} /> Filters
        </h4>
        <Button style="ternary" onClick={() => setIsFilterVisible(false)}>
          <XIcon className="text-miru-dark-purple-1000" size={16} />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body hasFooter className="sidebar__filters">
        <div className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000">
          <div
            className="flex items-center justify-between px-5 hover:text-miru-han-purple-1000"
            onClick={() => {
              setIsClientOpen(!isClientOpen);
            }}
          >
            <h5 className="text-xs font-bold leading-4 tracking-wider">
              CLIENTS
            </h5>
            <div className="flex items-center">
              {selectedFilter.length > 0 && (
                <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                  {selectedFilter.length}
                </span>
              )}
              {isClientOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
            </div>
          </div>
          {isClientOpen && (
            <div className="md:mt-7">
              <div className="relative mt-2 flex w-full items-center px-5">
                <input
                  placeholder="Search"
                  type="text"
                  value={searchQuery}
                  className="focus:outline-none w-full rounded bg-miru-gray-100 p-2
            text-sm font-medium focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
                />
                {searchQuery ? (
                  <XIcon
                    className="absolute right-8"
                    color="#1D1A31"
                    size={16}
                    onClick={() => setSearchQuery("")}
                  />
                ) : (
                  <SearchIcon
                    className="absolute right-8"
                    color="#1D1A31"
                    size={16}
                  />
                )}
              </div>
              <div className="h-96 overflow-y-auto md:mt-7">
                {filteredClientList.length > 0 ? (
                  filteredClientList.map(client => (
                    <CustomCheckbox
                      checkboxValue={client.id}
                      handleCheck={() => handleSelectClient(client)}
                      id={client.id}
                      isChecked={selectedClients.includes(client)}
                      key={client.id}
                      labelClassName="ml-4"
                      name="clients"
                      text={client.name}
                      wrapperClassName="py-3 px-5 hover:bg-miru-gray-100 text-miru-dark-purple-1000"
                    />
                  ))
                ) : (
                  <div className="m-5">No results found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </SidePanel.Body>
      <SidePanel.Footer className="sidebar__footer">
        <Button
          className="mr-4 flex items-center justify-between"
          size="medium"
          style="secondary"
          onClick={resetFilter}
        >
          RESET
        </Button>
        <Button size="medium" style="primary" onClick={handleApply}>
          APPLY
        </Button>
      </SidePanel.Footer>
    </SidePanel>
  );
};

export default FilterSideBar;
