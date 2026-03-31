import React, { useEffect, useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import { SearchIcon } from "miruIcons";
import Select, { components, DropdownIndicatorProps } from "react-select";

import { CustomAdvanceInput } from "common/CustomAdvanceInput";

import { reactSelectStyles } from "./Styles";
import { i18n } from "../../../../i18n";

const ClientSelection = ({
  clientList,
  selectedClient,
  setSelectedClient,
  setClientCurrency,
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
      if (selection[0]) {
        handleClientChange(selection[0]);
      }
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
    if (prePopulatedClient?.id == client.id) {
      setInvoiceNumber(prePopulatedInvoiceNumber);
    } else {
      if (previousInvoiceNumber) {
        const lastDigitIndex = previousInvoiceNumber.search(/\d+$/);
        const remaining = previousInvoiceNumber.slice(0, lastDigitIndex);
        const lastDigits = previousInvoiceNumber.slice(lastDigitIndex);

        if (lastDigits && !isNaN(lastDigits)) {
          const incrementedDigits = (parseInt(lastDigits) + 1).toString();
          const hasLeadingZeros = lastDigits[0] === "0";

          const numZeros = hasLeadingZeros
            ? lastDigits.length - incrementedDigits.length
            : 0;
          const leadingZeros = "0".repeat(numZeros);
          setInvoiceNumber(remaining + leadingZeros + incrementedDigits);
        } else {
          setInvoiceNumber("");
        }
      } else {
        setInvoiceNumber("");
      }
    }
  };

  const handleClientChange = selection => {
    const client = clientList.find(client => client.id == selection.value);
    setSelectedClient(client);
    if (setClientCurrency && client?.clientCurrency) {
      setClientCurrency(client.clientCurrency);
    }
    setIsClientVisible(false);
    setIsOptionSelected(true);
    autoGenerateInvoiceNumber(client);
  };

  const createClientList = () =>
    clientList.map(client => ({
      label: client.name,
      value: client.id,
    }));

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
    <div className="group w-full lg:w-4/12 lg:pr-4">
      <div
        className="relative h-full"
        onClick={() => {
          setIsClientVisible(true);
        }}
      >
        <CustomAdvanceInput
          id="BilledTo"
          label={i18n.t("invoices.billedTo")}
          wrapperClassName="h-full cursor-pointer"
          value={
            isOptionSelected &&
            selectedClient && (
              <div className="h-full overflow-y-auto">
                <p className="text-base font-bold text-foreground">
                  {selectedClient.name}
                </p>
                {selectedClient?.address ? (
                  <p className="w-full text-sm font-normal text-muted-foreground lg:w-52">
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
              autoFocus
              defaultMenuIsOpen
              isSearchable
              className="client-select m-0 mt-2  w-full text-white"
              classNamePrefix="m-0 truncate font-medium text-sm text-foreground bg-white"
              components={{ DropdownIndicator, IndicatorSeparator: () => null }}
              defaultValue={null}
              inputId="clientSelect"
              options={createClientList()}
              placeholder={i18n.t("search")}
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
