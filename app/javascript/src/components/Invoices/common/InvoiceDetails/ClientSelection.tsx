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
  setInvoiceNumber,
  invoiceNumber,
}) => {
  const [isOptionSelected, setIsOptionSelected] =
    useState<boolean>(optionSelected);

  //storing prepopulated values before editing invoice
  const [prePopulatedClient, setPrePopulatedClient] = useState<any>();
  const [prePopulatedInvoiceNumber, setPrePopulatedInvoiceNumber] =
    useState<any>();

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

    if (selectedClient) {
      setPrePopulatedClient(selectedClient);
      setPrePopulatedInvoiceNumber(invoiceNumber);
    }
  }, []);

  useEffect(() => {
    handleAlreadySelectedClient();
  }, [selectedClient]);

  const autoGenerateInvoiceNumber = client => {
    const { previousInvoiceNumber } = client;
    // on edit invoice page: invoice number should not be incremented for same client
    if (prePopulatedClient.value == client.value) {
      setInvoiceNumber(prePopulatedInvoiceNumber);
    } else {
      if (previousInvoiceNumber) {
        //extracting last character of invoice
        const lastChar = parseInt(
          previousInvoiceNumber.charAt(previousInvoiceNumber.length - 1)
        );

        //extracting remaining invoice number
        const remaining = previousInvoiceNumber.slice(
          0,
          previousInvoiceNumber.length - 1
        );

        //incrementing invoice number
        if (!isNaN(lastChar)) {
          setInvoiceNumber(remaining.concat(lastChar + 1));
        } else {
          setInvoiceNumber("");
        }
      } else {
        setInvoiceNumber("");
      }
    }
  };

  const handleClientChange = selection => {
    setSelectedClient(selection);
    setIsClientVisible(false);
    setIsOptionSelected(true);
    autoGenerateInvoiceNumber(selection);
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

  const { address_line_1, address_line_2, city, state, country, pin } =
    selectedClient?.address ?? {};

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
            isOptionSelected &&
            selectedClient && (
              <div className="h-full overflow-y-scroll">
                <p className="text-base font-bold text-miru-dark-purple-1000">
                  {selectedClient.label}
                </p>
                {selectedClient?.address ? (
                  <p className="w-52 text-sm font-normal text-miru-dark-purple-600">
                    {`${address_line_1}${
                      address_line_2 ? `, ${address_line_2}` : ""
                    }
                ${
                  address_line_2 ? "," : ""
                }\n ${city}, ${state}, ${country},\n ${pin}`}
                    <br />
                    {selectedClient.phone}
                  </p>
                ) : (
                  "-"
                )}
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
