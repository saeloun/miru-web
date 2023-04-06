import React, { useEffect, useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import { SearchIcon } from "miruIcons";
import Select, { components, DropdownIndicatorProps } from "react-select";

import { CustomAdvanceInput } from "common/CustomAdvanceInput";

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

  useEffect(() => {
    handleAlreadySelectedClient();
  }, [selectedClient]);

  const handleClientChange = selection => {
    setSelectedClient(selection);
    setIsClientVisible(false);
    setIsOptionSelected(true);
  };

  const handleAlreadySelectedClient = () => {
    if (selectedClient) {
      setIsOptionSelected(true);
      setIsClientVisible(false);
    }
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <SearchIcon color="#1D1A31" size={20} />
    </components.DropdownIndicator>
  );

  return (
    <div className="group w-4/12 pr-4">
      <div
        className="relative h-full"
        onClick={() => {
          setIsClientVisible(true);
        }}
      >
        <CustomAdvanceInput
          id="BilledTo"
          label="Billed to"
          wrapperClassName="h-full cursor-pointer"
          value={
            isOptionSelected && (
              <div>
                <p className="text-base font-bold text-miru-dark-purple-1000">
                  {selectedClient.label}
                </p>
                <p className="w-52 text-sm font-normal text-miru-dark-purple-600">
                  {selectedClient.address}
                  <br />
                  {selectedClient.phone}
                </p>
              </div>
            )
          }
        />
        <div className="absolute top-2 w-full" ref={wrapperRef}>
          {isClientVisible && (
            <Select
              defaultMenuIsOpen
              isSearchable
              className="client-select m-0 mt-2  w-full text-white"
              classNamePrefix="m-0 truncate font-medium text-sm text-miru-dark-purple-1000 bg-white"
              components={{ DropdownIndicator, IndicatorSeparator: () => null }}
              defaultValue={null}
              inputId="clientSelect"
              options={clientList}
              placeholder="Search"
              styles={reactSelectStyles.InvoiceDetails}
              onChange={handleClientChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSelection;
