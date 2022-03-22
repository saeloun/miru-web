import * as React from "react";
import Select, {
  components,
  DropdownIndicatorProps,
  SingleValueProps
} from "react-select";
import { MagnifyingGlass, PencilSimple } from "phosphor-react";

const SubComp2 = () => {
  //states
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [addClient, setaddClient] = React.useState(false);
  const [dateEdit, setdateEdit] = React.useState(false);
  const [issueDate, setissueDate] = React.useState("");
  const [dueDate, setdueDate] = React.useState("");
  //variables
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" }
  ];

  //functions

  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => {
    return (
      <components.DropdownIndicator {...props}>
        <MagnifyingGlass size={20} color="#1D1A31" />
      </components.DropdownIndicator>
    );
  };

  const calculateDates = (date, type) => {
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

    if (date) {
      console.log(date);
    }
  };

  //useeffects

  React.useEffect(() => {
    calculateDates(null, null);
  }, []);

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Billed to
          {selectedOption ? (
            <button
              onClick={() => {
                setaddClient(true);
                setSelectedOption(null);
              }}
              className="bg-miru-gray-1000 rounded mx-1  p-1 hidden group-hover:block"
            >
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          ) : null}
        </p>

        {addClient ? (
          <Select
            defaultValue={selectedOption}
            onChange={val => {
              console.log(val);
              setSelectedOption(val);
              setaddClient(false);
            }}
            options={options}
            placeholder="Search"
            menuIsOpen={true}
            isSearchable={true}
            className="m-0 w-52 text-white"
            classNamePrefix="m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white"
            defaultMenuIsOpen={true}
            styles={{
              menu: base => ({
                ...base,
                marginTop: 0,
                borderRadius: 0,
                borderBottomLeftRadius: "8px",
                borderBottomRightRadius: "8px",
                border: 0,
                boxShadow: "none"
              }),
              placeholder: defaultStyles => ({
                ...defaultStyles,
                background: "#F5F7F9",
                padding: 5,
                margin: 0,
                borderTopLeftRadius: "4px",
                borderBottomLeftRadius: "4px"
              }),
              valueContainer: (provided, state) => ({
                ...provided,
                background: "#F5F7F9",
                padding: 0,
                margin: 0,
                borderTopLeftRadius: "4px",
                borderBottomLeftRadius: "4px"
              }),
              dropdownIndicator: base => ({
                ...base,
                background: "#F5F7F9",
                margin: 0,
                padding: 5,
                borderTopRightRadius: "4px",
                borderBottomRightRadius: "4px"
              }),
              control: (provided, state) => ({
                ...provided,
                boxShadow: "none",
                border: 0,
                borderRadius: 0,
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                padding: 10,
                display: "flex"
              })
            }}
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

export default SubComp2;
