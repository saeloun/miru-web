import React from "react";

import { MinusIcon, PlusIcon, SearchIcon, XIcon } from "miruIcons";

import ClickableCheckboxText from "common/ClickableCheckboxText";

const ClientFilter = ({
  isClientOpen,
  searchQuery,
  setSearchQuery,
  filteredClientList,
  selectedClients,
  handleSelectClient,
  handleClientFilterToggle,
}) => {
  const isChecked = (selectedClients, client) =>
    selectedClients?.some(selectedClient => {
      if (client?.value) {
        return selectedClient?.value == client?.value;
      } else if (client?.id) {
        return selectedClient?.id == client?.id;
      }
    });

  return (
    <div className="cursor-pointer border-b border-miru-gray-200 pb-5 pt-6 text-miru-dark-purple-1000">
      <div
        className="flex items-center justify-between px-5 hover:text-miru-han-purple-1000"
        onClick={handleClientFilterToggle}
      >
        <h5 className="text-xs font-bold leading-4 tracking-wider">CLIENTS</h5>
        <div className="flex items-center">
          {selectedClients.length > 0 &&
            selectedClients[0].label != "All Clients" && (
              <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-miru-han-purple-1000 text-xs font-semibold text-white">
                {selectedClients.length}
              </span>
            )}
          {isClientOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
        </div>
      </div>
      {isClientOpen && (
        <div className="md:mt-7">
          <div className="relative mt-4 flex w-full items-center px-5 lg:mt-2">
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
          <div className="max-h-50v overflow-y-auto md:mt-7">
            {filteredClientList.length > 0 ? (
              filteredClientList.map((client, index) => (
                <div key={index}>
                  <ClickableCheckboxText
                    checkboxValue={client.id}
                    handleCheck={() => handleSelectClient(client)}
                    id={client.id}
                    isChecked={isChecked(selectedClients, client)}
                    key={client.id}
                    labelClassName="ml-4"
                    name="clients"
                    text={client?.label || client?.name}
                    wrapperClassName="py-3 px-5 flex items-center lg:hover:bg-miru-gray-100 text-miru-dark-purple-1000"
                  />
                </div>
              ))
            ) : (
              <div className="m-5">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientFilter;
