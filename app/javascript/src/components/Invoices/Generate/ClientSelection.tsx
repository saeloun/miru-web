import React, { useState, useRef } from "react";
import Select from "react-select";
import { PencilSimple } from "phosphor-react";

import { DropdownIndicator } from "./CustomComponents";
import { reactSelectStyles } from "./Styles";
import useOutsideClick from "../../../helpers/outsideClick";

const ClientSelection = ({ clientList }) => {
  const [isOptionSelected, setOptionSelection] = useState<boolean>(false);
  const [isClientVisible, setClientVisible] = useState<boolean>(false);
  const [clientInfo, setClientInfo] = useState<any>();
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setClientVisible(false), isClientVisible);

  const handleSelectClientClick = async () => {
    setClientVisible(true);
    setOptionSelection(false);
  };

  const handleGetClientList = async () => {
    setClientVisible(true);
  };

  const handleClientChange = (selection) => {
    setClientInfo(selection);
    setClientVisible(false);
    setOptionSelection(true);
  };

  return (
    <div className="group" ref={wrapperRef}>
      <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
      Billed to
        {isOptionSelected &&
        <button
          onClick={handleSelectClientClick}
          className="bg-miru-gray-1000 rounded mx-1  p-1 hidden group-hover:block"
        >
          <PencilSimple size={13} color="#1D1A31" />
        </button>
        }
      </p>

      {isClientVisible && (
        <Select
          defaultValue={null}
          onChange={handleClientChange}
          options={clientList}
          placeholder="Search"
          isSearchable={true}
          className="m-0 mt-2 w-52 text-white"
          classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
          defaultMenuIsOpen={true}
          styles={reactSelectStyles.InvoiceDetails}
          components={{ DropdownIndicator, IndicatorSeparator: () => null }}
        />
      )}
      {!isOptionSelected && !isClientVisible &&
      <button
        className="py-5 mt-2 px-6 font-bold text-base text-miru-dark-purple-200 bg-white border-2 border-dashed border-miru-dark-purple-200 rounded-md tracking-widest"
        onClick={handleGetClientList}
      >
        + ADD CLIENT
      </button>
      }
      { isOptionSelected && <div>
        <p className="font-bold text-base text-miru-dark-purple-1000">
          {clientInfo.label}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-400 w-52">
          {clientInfo.address}<br/>
          {clientInfo.phone}
        </p>
      </div>
      }
    </div>
  );
};

export default ClientSelection;
