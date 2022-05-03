import React, { useEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import Table from "./Table";
import fetchNewLineItems from "../api/generateInvoice";

const MultipleEntriesModal = ({
  selectedClient,
  setSelectedOption,
  selectedOption,
  setMultiLineItemModal
}) => {

  const [lineItems, setLineItems] = useState<any>([]);
  const [totalLineItems, setTotalLineItems] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [selectedLineItem, setSelectedLineItem] = useState<any>([]);
  const [allCheckboxSelected, setAllCheckboxSelected] = useState<boolean>(false);

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
    const selectedLineItem = lineItems.map(item => ({ ...item, checked: e.target.checked }));
    setLineItems(selectedLineItem);
    setSelectedLineItem(lineItems);
    setAllCheckboxSelected(e.target.checked);
  };

  useEffect(() => {
    fetchNewLineItems(selectedClient, pageNumber, selectedOption).then(async res => {
      setTotalLineItems(res.data.pagy.count);
      setPageNumber(pageNumber + 1);
      const items = res.data.new_line_item_entries.map(item => ({
        ...item, checked: allCheckboxSelected,
        lineTotal: (Number(item.qty) / 60 * Number(item.rate))
      }));
      setLineItems([...items, ...lineItems]);
    });
  }, []);

  const loadMore = () => {
    fetchNewLineItems(selectedClient, pageNumber, selectedOption).then(async res => {
      setTotalLineItems(res.data.pagy.count);
      setPageNumber(pageNumber + 1);
      const items = res.data.new_line_item_entries.map(item => ({
        ...item,
        checked: allCheckboxSelected,
        lineTotal: (Number(item.qty) / 60 * Number(item.rate))
      }));
      setLineItems([...items, ...lineItems]);
      if (allCheckboxSelected) {
        setSelectedLineItem(lineItems);
      }
    });
  };
  const handleSubmitModal = () => {
    setSelectedOption([...selectedOption, ...selectedLineItem]);
    setMultiLineItemModal(false);
  };

  return (
    <div style={{ background: "rgba(29, 26, 49,0.6)" }} className="px-52 py-20 w-full h-full fixed inset-0 flex justify-center z-50">
      <div className="bg-white rounded-lg w-full h-128 flex flex-col justify-between">
        <Header
          setShowMultilineModal={false}
        />
        <div className='mx-6'>
          {lineItems.length > 0 && <Table
            lineItems={lineItems}
            loadMore={loadMore}
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
