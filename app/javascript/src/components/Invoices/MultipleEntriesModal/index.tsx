import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { lineTotalCalc } from "helpers";

import generateInvoice from "apis/generateInvoice";

import Footer from "./Footer";
import Header from "./Header";
import Table from "./Table";

// import { fetchMultipleNewLineItems } from "../common/utils";

const MultipleEntriesModal = ({
  selectedClient,
  selectedOption,
  setSelectedOption,
  setMultiLineItemModal
}) => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "all", from: "", to: "" },
    teamMembers: []
  };

  const [lineItems, setLineItems] = useState<any>([]);
  const [totalLineItems, setTotalLineItems] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedLineItem, setSelectedLineItem] = useState<any>([]);
  const [allCheckboxSelected, setAllCheckboxSelected] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<any>([]);
  const [filterParams, setFilterParams] = useState(filterIntialValues);

  const handleItemSelection = (id) => {
    const checkboxes = lineItems.map(item => {
      if (item.timesheet_entry_id === id) {
        if (item.checked) {
          const selectedItem = selectedLineItem.filter(lineItem => lineItem.timesheet_entry_id !== item.timesheet_entry_id);
          setSelectedLineItem(selectedItem);
          setAllCheckboxSelected(false);
          return { ...item, checked: false };
        }
        else {
          setSelectedLineItem([...selectedLineItem, item]);
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
      setSelectedLineItem(lineItems);
    }
    else {
      setSelectedLineItem([]);
    }
    setLineItems(checkedLineItems);
    setAllCheckboxSelected(e.target.checked);
  };

  useEffect(() => {
    fetchMultipleNewLineItems();
  }, [filterParams]);

  // const loadMore = () => {
  //   console.log("more")
  //   fetchMultipleNewLineItems(
  //     handleFilterParams(),
  //     selectedClient,
  //     lineItems,
  //     setLineItems,
  //     setTotalLineItems,
  //     pageNumber,
  //     setPageNumber,
  //     // selectedOption,
  //     allCheckboxSelected,
  //     setSelectedLineItem,
  //     setTeamMembers
  //   );
  // };

  const fetchMultipleNewLineItems = async () => {
    const res = await generateInvoice.getLineItems(handleFilterParams());
    setPageNumber(pageNumber + 1);
    const items = res.data.new_line_item_entries.map(item => ({
      ...item,
      checked: allCheckboxSelected,
      lineTotal: lineTotalCalc(item.quantity, item.rate)
    }));
    const mergedItems = [...items, ...lineItems];
    const sortedData = mergedItems.sort((item1, item2) => dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1);
    setLineItems(sortedData);
    setTotalLineItems(res.data.total_new_line_items);
    if (allCheckboxSelected) {
      setSelectedLineItem(sortedData);
    }
    setTeamMembers(res.data.filter_options.team_members);
  };

  const handleSubmitModal = () => {
    if (selectedLineItem.length > 0) {
      setSelectedOption([...selectedOption, ...selectedLineItem]);
      setMultiLineItemModal(false);
    }
  };

  const handleFilterParams = () => {
    let filterQueryParams = "";

    filterQueryParams += `client_id=${selectedClient.value}&page=${pageNumber}`;

    selectedOption.forEach((entry) => {
      if (!entry._destroy){
        filterQueryParams += `&selected_entries[]=${entry.timesheet_entry_id}`;
      }
    });

    filterParams.teamMembers.forEach((member) => {
      filterQueryParams+= `&team_member[]=${member.value}`;
    });

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
        />
        <div className='mx-6'>
          {lineItems.length > 0 && <Table
            lineItems={lineItems}
            loadMore={fetchMultipleNewLineItems}
            totalLineItems={totalLineItems}
            pageNumber={pageNumber}
            handleItemSelection={handleItemSelection}
            handleSelectAll={handleSelectAll}
            allCheckboxSelected={allCheckboxSelected}
          />}
        </div>
        <Footer
          selectedRowCount={selectedLineItem.length}
          handleSubmitModal={handleSubmitModal}
        />
      </div>
    </div>
  );
};

export default MultipleEntriesModal;
