import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { DropdownHeader } from "./CustomComponents";

const NewLineItemTable = ({ showItemInputs, setShowItemInputs, addNew, setAddNew, lineItems, loadMoreItems, totalLineItems, pageNumber, selectedOption, setSelectedOption }) => {
  const hasMoreItems = lineItems.length === totalLineItems;
  const selectRowId = (items) => {
    const option = { ...items, lineTotal: (Number(items.qty)/60 * Number(items.rate)) };
    setAddNew(false);
    setSelectedOption([...selectedOption, option]);
  };

<<<<<<< HEAD
  return (
    <div>
      <DropdownHeader/>
      <div>
        <button onClick={() => {
=======
const NewLineItemTable = ({ showItemInputs, setShowItemInputs, addNew, setAddNew, selectedOption, setSelectedOption, setShowMultilineModal }) => {

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

  const multipleEntryButton = props => (
    <components.Control {...props}>
      {props.children}
      <button
        onClick={() => {
          setAddNew(!addNew);
          setShowMultilineModal(true);
        }}
        className=" mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">
        CLICK TO ADD MULTIPLE ENTRIES
      </button>
    </components.Control>
  );

  const manualEntryButton = props => (
    <components.MenuList {...props}>
      <button
        className="px-3 py-2 font-bold text-xs text-miru-han-purple-600 tracking-widest cursor-pointer"
        onClick={() => {
>>>>>>> Add entries functionality added
          setShowItemInputs(!showItemInputs);
          setAddNew(!addNew);
        }} className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000">Add Manual Entry</button>
      </div>
      <div className="overflow-scroll mt-4 relative">
        <InfiniteScroll
          dataLength={pageNumber*10}
          next={loadMoreItems}
          hasMore={!hasMoreItems}
          loader={
            <div className="text-center py-2">
              <h4>Loading...</h4>
            </div>
          }
          height={250}
          endMessage={
            <p className="text-center py-2">
              <b>End of the list</b>
            </p>
          }
        >
          {lineItems.map(items => (
            <div onClick = {() => {selectRowId(items);}} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100">
              <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
                {items.first_name} {items.last_name}
              </span>
              <span className="font-medium text-xs text-miru-dark-purple-600 text-left w-1/2">
                {items.description}
              </span>
              <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
                {items.date}
              </span>
              <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
                ${items.rate}
              </span>
            </div>
          ))
          }
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default NewLineItemTable;
