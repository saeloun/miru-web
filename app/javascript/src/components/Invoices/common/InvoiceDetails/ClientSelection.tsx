import React, { useEffect, useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import { SearchIcon, EditIcon } from "miruIcons";
import Select, { components, DropdownIndicatorProps } from "react-select";

import { reactSelectStyles } from "./Styles";

const ClientSelection = ({
  clientList,
  selectedClient,
  setSelectedClient,
  optionSelected,
  clientVisible,
}) => {
  const [isOptionSelected, setIsOptionSelected] =
    useState<boolean>(optionSelected);

  const [isClientVisible, setIsClientVisible] =
    useState<boolean>(clientVisible);
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setIsClientVisible(false), isClientVisible);

  useEffect(() => {
    const prePopulatedClient = window.location.search
      .split("?")
      .join("")
      .replace(/%20/g, " ");

    if (prePopulatedClient) {
      const selection = clientList.filter(
        client => client.label == prePopulatedClient
      );
      selection[0] && handleClientChange(selection[0]);
    }
  }, []);

  const handleSelectClientClick = async () => {
    setIsClientVisible(true);
    setIsOptionSelected(false);
  };

  const handleGetClientList = async () => {
    setIsClientVisible(true);
  };

  const handleClientChange = selection => {
    setSelectedClient(selection);
    setIsClientVisible(false);
    setIsOptionSelected(true);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <SearchIcon color="#1D1A31" size={20} />
    </components.DropdownIndicator>
  );

  return (
    <div className="group" ref={wrapperRef}>
      <p className="flex text-xs font-normal text-miru-dark-purple-1000">
        Billed to
        {isOptionSelected && (
          <button
            className="mx-1 hidden rounded  bg-miru-gray-1000 p-1 group-hover:block"
            onClick={handleSelectClientClick}
          >
            <EditIcon color="#1D1A31" size={13} />
          </button>
        )}
      </p>
      {isClientVisible && (
        <Select
          defaultMenuIsOpen
          isSearchable
          className="m-0 mt-2 w-52 text-white"
          classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
          components={{ DropdownIndicator, IndicatorSeparator: () => null }}
          defaultValue={null}
          options={clientList}
          placeholder="Search"
          styles={reactSelectStyles.InvoiceDetails}
          onChange={handleClientChange}
        />
      )}
      {!isOptionSelected && !isClientVisible && (
        <button
          className="mt-2 rounded-md border-2 border-dashed border-miru-dark-purple-200 bg-white py-5 px-6 text-base font-bold tracking-widest text-miru-dark-purple-200"
          data-cy="add-client-button"
          onClick={handleGetClientList}
        >
          + ADD CLIENT
        </button>
      )}
      {isOptionSelected && (
        <div>
          <p className="text-base font-bold text-miru-dark-purple-1000">
            {selectedClient.label}
          </p>
          <p className="w-52 text-xs font-normal text-miru-dark-purple-400">
            {selectedClient.address}
            <br />
            {selectedClient.phone}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientSelection;
