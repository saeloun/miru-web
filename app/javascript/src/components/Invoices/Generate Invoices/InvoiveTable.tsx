import * as React from "react";
import Select, { components, DropdownIndicatorProps } from "react-select";
import { MagnifyingGlass, PencilSimple } from "phosphor-react";

const InvoiceTable = () => {
  //States
  const [Addnew, setAddnew] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [ShowItemInputs, setShowItemInputs] = React.useState(false);
  const [Name, setName] = React.useState("");
  const [Date, setDate] = React.useState("");
  const [Description, setDescription] = React.useState("");
  const [Rate, setRate] = React.useState("");
  const [Qty, setQty] = React.useState("");
  const [LineTotal, setLineTotal] = React.useState("$0");
  const [NewLineItems, setNewLineItems] = React.useState([]);

  const options = [
    {
      value: "Jake",
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    },
    {
      name: "Jake",
      date: "20-1-2022",
      description: "I am description",
      total: "5 Hours"
    }
  ];

  // Functions
  const DropdownIndicator = (props: DropdownIndicatorProps<true>) => {
    return (
      <components.DropdownIndicator {...props}>
        <MagnifyingGlass size={20} color="#1D1A31" />
      </components.DropdownIndicator>
    );
  };

  const ManualEntryButton = props => {
    return (
      <components.MenuList {...props}>
        <button
          className="px-3 py-2 font-bold text-xs text-miru-han-purple-600 tracking-widest cursor-pointer"
          onClick={() => {
            setShowItemInputs(!ShowItemInputs);
            setAddnew(!Addnew);
          }}
        >
          ADD MANUAL ENTRY
        </button>
        {props.children}
      </components.MenuList>
    );
  };

  const MultiLineButton = props => {
    return (
      <components.Control {...props}>
        {props.children}
        <button className=" mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
          CLICK TO ADD MULTIPLE ENTRIES
        </button>
      </components.Control>
    );
  };

  const CustomOption = props => {
    const { innerProps, innerRef } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100"
      >
        <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
          {props.data.name}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-600 text-left w-1/2">
          {props.data.description}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          {props.data.date}
        </span>
        <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          {props.data.total}
        </span>
      </div>
    );
  };

  const onEnter = val => {
    if (val.key == "Enter") {
      const newItem = [...NewLineItems];
      newItem.push({
        Name: Name,
        Date: Date,
        Description: Description,
        Rate: Rate,
        Qty: Qty,
        LineTotal: LineTotal
      });

      setNewLineItems(newItem);
      setName("");
      setDate("");
      setDescription("");
      setRate("");
      setQty("");
      setLineTotal("$0");
      setShowItemInputs(false);
    }
  };

  return (
    <>
      <table className="w-full table-fixed">
        <thead className="my-2">
          <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
            NAME
          </th>
          <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
            DATE
          </th>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
            DESCRIPTION
          </th>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
            RATE
          </th>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest pr-3">
            QTY
          </th>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
            LINE TOTAL
          </th>
        </thead>

        <tbody className="w-full">
          {Addnew ? (
            <tr>
              <td colSpan={6}>
                <Select
                  defaultValue={selectedOption}
                  onChange={val => {
                    setSelectedOption(val);
                  }}
                  options={options}
                  placeholder="Type a name..."
                  menuIsOpen={true}
                  isSearchable={true}
                  className="mt-5 w-full "
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
                    option: (
                      styles,
                      { data, isDisabled, isFocused, isSelected }
                    ) => ({
                      ...styles,
                      backgroundColor: isSelected ? "#F5F7F9" : null,
                      color: "#1D1A31"
                    }),
                    placeholder: defaultStyles => ({
                      ...defaultStyles,
                      padding: 0,
                      paddingLeft: 2,
                      margin: 0,
                      borderTopLeftRadius: "4px",
                      borderBottomLeftRadius: "4px"
                    }),
                    valueContainer: (provided, state) => ({
                      ...provided,
                      background: "#F5F7F9",
                      padding: "1px",
                      paddingLeft: 5,
                      margin: 0,
                      borderTopLeftRadius: "4px",
                      borderBottomLeftRadius: "4px",
                      border: "1px solid #CDD6DF",
                      borderRight: "0px"
                    }),
                    dropdownIndicator: base => ({
                      ...base,
                      background: "#F5F7F9",
                      margin: 0,
                      padding: "5px",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      border: "1px solid #CDD6DF",
                      borderLeft: "0px"
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
                  components={{
                    DropdownIndicator,
                    IndicatorSeparator: () => null,
                    Control: MultiLineButton,
                    MenuList: ManualEntryButton,
                    Option: CustomOption
                  }}
                />
              </td>
            </tr>
          ) : (
            <tr className="w-full ">
              <td colSpan={6} className="py-4">
                <button
                  className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
                  onClick={() => {
                    setAddnew(!Addnew);
                  }}
                >
                  + NEW LINE ITEM
                </button>
              </td>
            </tr>
          )}

          {ShowItemInputs ? (
            <tr className="w-full my-1">
              <td className="p-1  w-full">
                <input
                  type="text"
                  placeholder="Name"
                  className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 "
                  value={Name}
                  onChange={val => setName(val.target.value)}
                />
              </td>
              <td className=" w-full">
                <input
                  type="date"
                  placeholder="Date"
                  className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
                  value={Date}
                  onChange={val => setDate(val.target.value)}
                  onSubmit={() => {
                    console.log(Date);
                  }}
                />
              </td>
              <td className="p-1 w-full">
                <input
                  type="text"
                  placeholder="Description"
                  className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
                  value={Description}
                  onChange={val => setDescription(val.target.value)}
                  onSubmit={() => {
                    console.log(Description);
                  }}
                />
              </td>
              <td className=" w-full">
                <input
                  type="text"
                  placeholder="Rate"
                  className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
                  value={Rate}
                  onChange={val => setRate(val.target.value)}
                  onSubmit={() => {
                    console.log(Rate);
                  }}
                />
              </td>
              <td className="p-1 w-full">
                <input
                  type="text"
                  placeholder="Qty"
                  className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
                  value={Qty}
                  onChange={val => setQty(val.target.value)}
                  onKeyDown={val => onEnter(val)}
                />
              </td>
              <td className="text-right font-normal text-base text-miru-dark-purple-1000">
                $90
              </td>
            </tr>
          ) : null}

          {NewLineItems.length > 0
            ? NewLineItems.map(item => {
              return (
                <tr>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
                    {item.Name}
                  </td>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
                    {item.Date}
                  </td>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-center ">
                    {item.Description}
                  </td>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
                    {item.Rate}
                  </td>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
                    {item.Qty}
                  </td>
                  <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
                    {item.LineTotal}
                  </td>
                </tr>
              );
            })
            : null}
        </tbody>
      </table>
    </>
  );
};

export default InvoiceTable;
