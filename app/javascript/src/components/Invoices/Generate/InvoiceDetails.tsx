import React, { useState, useEffect } from "react";
import Select from "react-select";
import dayjs from "dayjs";
import { PencilSimple } from "phosphor-react";

import { DropdownIndicator } from "./CustomComponents";
import { reactSelectStyles } from "./Styles";

const InvoiceDetails = () => {

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [addClient, setAddClient] = useState<boolean>(false);
  const [issueDate, setissueDate] = useState<string>(dayjs().format("DD.MM.YYYY"));
  const [dueDate, setdueDate] = useState<string>(dayjs().add(1, "month").format("DD.MM.YYYY"));
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" }
  ];

  const selectAction = (client, option) => {
    setAddClient(client);
    setSelectedOption(option);
  };

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Billed to
          {selectedOption &&
            <button
              onClick={() => selectAction(true, null)}
              className="bg-miru-gray-1000 rounded mx-1  p-1 hidden group-hover:block"
            >
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          }
        </p>

        {addClient && (
          <Select
            defaultValue={selectedOption}
            onChange={val => selectAction(false, val)}
            options={options}
            placeholder="Search"
            menuIsOpen={true}
            isSearchable={true}
            className="m-0 mt-2 w-52 text-white"
            classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
            defaultMenuIsOpen={true}
            styles={reactSelectStyles.InvoiceDetails}
            components={{ DropdownIndicator, IndicatorSeparator: () => null }}
          />
        )}
        {!selectedOption && !addClient ? (
          <button
            className="py-5 mt-2 px-6 font-bold text-base text-miru-dark-purple-200 bg-white border-2 border-dashed border-miru-dark-purple-200 rounded-md tracking-widest"
            onClick={() => setAddClient(true)}
          >
            + ADD CLIENT
          </button>
        ) : selectedOption &&
        <div>
          <p className="font-bold text-base text-miru-dark-purple-1000">
            Microsoft
          </p>
          <p className="font-normal text-xs text-miru-dark-purple-400 w-52">
            One Microsoft Way <br />
            Redmond,Washington <br />
            98052-6399
          </p>
        </div>
        }
      </div>
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {issueDate}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {dueDate}
        </p>
      </div>

      <div>
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          6335 7871
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Reference
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          -
        </p>
      </div>

      <div>
        <p className="font-normal text-xs text-miru-dark-purple-1000 text-right">
          Amount
        </p>
        <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-6">
          $90.00
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
