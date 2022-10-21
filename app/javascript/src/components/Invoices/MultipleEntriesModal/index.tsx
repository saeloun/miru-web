import React, { useEffect, useState } from "react";

import Footer from "./Footer";
import Header from "./Header";
import Table from "./Table";

import { fetchMultipleNewLineItems } from "../common/utils";

const MultipleEntriesModal = ({
  selectedClient,
  selectedOption,
  setSelectedOption,
  setMultiLineItemModal
}) => {
  const filterIntialValues = {
    teamMembers: [],
    dateRange: { label: "All", value: "all", from: "", to: "" },
    searchTerm: ""
  };

  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [allCheckboxSelected, setAllCheckboxSelected] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<any>([]);
  const [filterParams, setFilterParams] = useState(filterIntialValues);
  const [selectedInput, setSelectedInput] = React.useState("from-input");
  const [loading, setLoading] = useState(true);

  const handleItemSelection = (id) => {
    const checkboxes = lineItems.map(item => {
      if (item.timesheet_entry_id === id) {
        if (item.checked) {
          const selectedItem = selectedLineItems.filter(lineItem => lineItem.timesheet_entry_id !== item.timesheet_entry_id);
          setSelectedLineItems(selectedItem);
          setAllCheckboxSelected(false);
          return { ...item, checked: false };
        }
        else {
          const selectedItem = [...selectedLineItems, item];
          setSelectedLineItems(selectedItem);
          setAllCheckboxSelected(selectedItem.length == lineItems.length);
          return { ...item, checked: true };
        }
      }
      return item;
    });

    setLineItems(checkboxes);
  };

  const handleSelectAll = (e) => {
    const checkedLineItems = lineItems.map(item => ({ ...item, checked: e.target.checked }));
    if (e.target.checked) {
      setSelectedLineItems(lineItems);
    }
    else {
      setSelectedLineItems([]);
    }
    setLineItems(checkedLineItems);
    setAllCheckboxSelected(e.target.checked);
  };

  useEffect(() => {
    setLoading(true);
    loadMore();
  }, [filterParams]);

  const loadMore = () => {
    fetchMultipleNewLineItems(
      setLoading,
      handleFilterParams,
      selectedLineItems,
      setSelectedLineItems,
      setLineItems,
      allCheckboxSelected,
      setTeamMembers
    );
  };

  const handleSubmitModal = () => {
    if (selectedLineItems.length > 0) {
      setSelectedOption([...selectedOption, ...selectedLineItems]);
      setMultiLineItemModal(false);
    }
  };

  const handleFilterParams = () => {
    let filterQueryParams = "";

    filterQueryParams += `client_id=${selectedClient.value}`;

    selectedOption.forEach((entry) => {
      if (!entry._destroy){
        filterQueryParams += `&selected_entries[]=${entry.timesheet_entry_id}`;
      }
    });

    filterQueryParams += `&search_term=${filterParams.searchTerm}`;

    filterParams.teamMembers.forEach((member) => {
      filterQueryParams+= `&team_member[]=${member.value}`;
    });

    const { value, from, to } = filterParams.dateRange;

    if (value != "all" && value != "custom"){
      filterQueryParams += `&date_range=${value}`;
    }

    if (value === "custom" && from && to) {
      filterQueryParams += `&date_range=${value}`;
      filterQueryParams += `&from=${from}`;
      filterQueryParams += `&to=${to}`;
    }
    return `${filterQueryParams}`;
  };

  return (
    <div style={{ background: "rgba(29, 26, 49,0.6)" }} className="px-52 py-20 w-full h-full fixed inset-0 flex justify-center z-50">
      <div className="bg-white rounded-lg w-full h-160 flex flex-col justify-between">
        <Header
          setMultiLineItemModal={setMultiLineItemModal}
          teamMembers={teamMembers}
          filterParams={filterParams}
          setFilterParams={setFilterParams}
          selectedInput={selectedInput}
          setSelectedInput={setSelectedInput}
          filterIntialValues={filterIntialValues}
        />
        {loading ?
          <p className="flex items-center justify-center text-miru-han-purple-1000 tracking-wide text-base font-medium">
            Loading...
          </p>
          :
          <div className='mx-6 overflow-y-scroll'>
            {lineItems.length > 0 ?
              <Table
                lineItems={lineItems}
                handleItemSelection={handleItemSelection}
                handleSelectAll={handleSelectAll}
                allCheckboxSelected={allCheckboxSelected}
              />
              :
              <p className="flex items-center justify-center text-miru-han-purple-1000 tracking-wide text-base font-medium">No Data Found</p>
            }
          </div>
        }
        <Footer
          selectedRowCount={selectedLineItems.length}
          handleSubmitModal={handleSubmitModal}
          handleSelectAll={handleSelectAll}
        />
      </div>
    </div>
  );
};

export default MultipleEntriesModal;
