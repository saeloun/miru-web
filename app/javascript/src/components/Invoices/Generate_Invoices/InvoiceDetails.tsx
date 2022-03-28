import * as React from "react";
import Select, {
  components,
  DropdownIndicatorProps
} from "react-select";
import { MagnifyingGlass, PencilSimple } from "phosphor-react";
import Styles from "./Styles.js";

const InvoiceDetails = () => {
  //states
  const [selectedOption, setSelectedOption] = React.useState<any>(null);
  const [addClient, setaddClient] = React.useState<boolean>(false);
  const [issueDate, setissueDate] = React.useState<string>("");
  const [dueDate, setdueDate] = React.useState<string>("");

  //variables
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" }
  ];

  //functions

  const selectAction =(client,option)=>{
    setaddClient(client);
    setSelectedOption(option);
  };

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => (
    <components.DropdownIndicator {...props}>
      <MagnifyingGlass size={20} color="#1D1A31" />
    </components.DropdownIndicator>
  );

  const calculateDates = () => {
    setissueDate(
      new Date().getDate() +
      "." +
      (new Date().getMonth() + 1) +
      "." +
      new Date().getFullYear()
    );
    setdueDate(
      new Date().getDate() +
      "." +
      (new Date().getMonth() + 2) +
      "." +
      new Date().getFullYear()
    );

  };

  //useeffects

  React.useEffect(() => {
    calculateDates();
  }, []);

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Billed to
          {selectedOption ? (
            <button
              onClick={()=>selectAction(true,null)}
              className="bg-miru-gray-1000 rounded mx-1  p-1 hidden group-hover:block"
            >
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          ) : null}
        </p>

        {addClient ? (
          <Select
            defaultValue={selectedOption}
            onChange={val => selectAction(false,val)}
            options={options}
            placeholder="Search"
            menuIsOpen={true}
            isSearchable={true}
            className="m-0 w-52 text-white"
            classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
            defaultMenuIsOpen={true}
            styles={Styles.InvoiceDetails}
            components={{ DropdownIndicator, IndicatorSeparator: () => null }}
          />
        ) : null}
        {selectedOption == null && !addClient ? (
          <button
            className="py-4 mt-2 px-6 font-bold text-base text-miru-dark-purple-200 bg-white border-2 border-dashed rounded-md tracking-widest"
            onClick={() => setaddClient(true)}
          >
            + ADD CLIENT
          </button>
        ) : selectedOption ? (
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
        ) : null}
      </div>
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {issueDate}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-2">
          Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {dueDate}
        </p>
      </div>

      <div className="">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          6335 7871
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-3">
          Reference
        </p>
      </div>

      <div className="">
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
