import React, { useEffect, useState } from "react";

import Footer from "./Footer";
import Header from "./Header";
import Table from "./Table";

import { fetchMultipleNewLineItems } from "../common/utils";

const MultipleEntriesModal = ({
  selectedClient,
  selectedOption,
  setSelectedOption,
  setMultiLineItemModal,
}) => {
  const filterIntialValues = {
    teamMembers: [],
    dateRange: { label: "All", value: "all", from: "", to: "" },
    searchTerm: "",
  };

  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [allCheckboxSelected, setAllCheckboxSelected] =
    useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<any>([]);
  const [filterParams, setFilterParams] = useState(filterIntialValues);
  const [selectedInput, setSelectedInput] = useState("from-input");
  const [loading, setLoading] = useState(true);

  const handleItemSelection = id => {
    const checkboxes = lineItems.map(item => {
      if (item.timesheet_entry_id === id) {
        if (item.checked) {
          const selectedItem = selectedLineItems.filter(
            lineItem => lineItem.timesheet_entry_id !== item.timesheet_entry_id
          );
          setSelectedLineItems(selectedItem);
          setAllCheckboxSelected(false);

          return { ...item, checked: false };
        }
        const selectedItem = [...selectedLineItems, item];
        setSelectedLineItems(selectedItem);
        setAllCheckboxSelected(selectedItem.length == lineItems.length);

        return { ...item, checked: true };
      }

      return item;
    });

    setLineItems(checkboxes);
  };

  const handleSelectAll = e => {
    const checkedLineItems = lineItems.map(item => ({
      ...item,
      checked: e.target.checked,
    }));
    if (e.target.checked) {
      setSelectedLineItems(lineItems);
    } else {
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

    selectedOption.forEach(entry => {
      if (!entry._destroy) {
        filterQueryParams += `&selected_entries[]=${entry.timesheet_entry_id}`;
      }
    });

    filterQueryParams += `&search_term=${filterParams.searchTerm}`;

    filterParams.teamMembers.forEach(member => {
      filterQueryParams += `&team_member[]=${member.value}`;
    });

    const { value, from, to } = filterParams.dateRange;

    if (value != "all" && value != "custom") {
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
    <div
      className="fixed inset-0 z-50 flex h-full w-full justify-center px-10 py-20 md:px-52"
      style={{ background: "rgba(29, 26, 49,0.6)" }}
    >
      <div className="flex h-160 w-full flex-col justify-between rounded-lg bg-white">
        <Header
          filterIntialValues={filterIntialValues}
          filterParams={filterParams}
          selectedInput={selectedInput}
          setFilterParams={setFilterParams}
          setMultiLineItemModal={setMultiLineItemModal}
          setSelectedInput={setSelectedInput}
          teamMembers={teamMembers}
        />
        {loading ? (
          <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000">
            Loading...
          </p>
        ) : (
          <div className="mx-6 overflow-y-scroll">
            {lineItems.length > 0 ? (
              <Table
                allCheckboxSelected={allCheckboxSelected}
                handleItemSelection={handleItemSelection}
                handleSelectAll={handleSelectAll}
                lineItems={lineItems}
              />
            ) : (
              <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000">
                No Data Found
              </p>
            )}
          </div>
        )}
        <Footer
          handleSelectAll={handleSelectAll}
          handleSubmitModal={handleSubmitModal}
          selectedRowCount={selectedLineItems.length}
        />
      </div>
    </div>
  );
};

export default MultipleEntriesModal;
