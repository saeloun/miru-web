import React, { useEffect, useState, useRef } from "react";
import generateInvoice from "apis/generateInvoice";

import ManualEntry from "./ManualEntry";
import NewLineItemRow from "./NewLineItemRow";
import NewLineItemTable from "./NewLineItemTable";

import useOutsideClick from "../../../helpers/outsideClick";

const fetchNewLineItems = async (
  selectedClient,
  setLineItems,
  lineItems,
  setTotalLineItems,
  pageNumber,
  setPageNumber,
  selectedEntries = [],
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach((entries) => {
      selectedEntriesString += `&selected_entries[]=${entries.id}`;
    });

    await generateInvoice.getLineItems(selectedClient.value, pageNumber, selectedEntriesString).then(async res => {
      await setTotalLineItems(res.data.pagy.count);
      await setPageNumber(pageNumber+1);
      await setLineItems([...res.data.new_line_item_entries, ...lineItems]);
    });
  }
};

const InvoiceTable = ({ selectedClient, setSelectedOption, selectedOption ,setShowMultilineModal, setLineItems, lineItems }) => {

  const [addNew, setAddNew] = useState<boolean>(false);
  const [showItemInputs, setShowItemInputs] = useState<boolean>(false);
  const [totalLineItems, setTotalLineItems] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (addNew) {
      fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, selectedOption);
    }
  }, [addNew]);

  const loadMoreItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, selectedOption);
  };

  useOutsideClick(wrapperRef, () => {
    setAddNew(false);
    setPageNumber(1);
    //setLineItems([]);
  }, addNew);

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems) {
      return <NewLineItemTable
        showItemInputs={showItemInputs}
        setShowItemInputs={setShowItemInputs}
        addNew={addNew}
        setAddNew={setAddNew}
        lineItems= {lineItems}
        loadMoreItems={loadMoreItems}
        totalLineItems= {totalLineItems}
        pageNumber = {pageNumber}
        setSelectedOption={setSelectedOption}
        selectedOption={selectedOption}
        setShowMultilineModal={setShowMultilineModal}
      />;
    }
    return (
      <div className="h-48 flex items-center justify-center">Please select Client to add line item.</div>
    );
  };

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <thead className="my-2">
          <tr>
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
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              QTY
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              LINE TOTAL
            </th>
          </tr>
        </thead>

        <tbody className="w-full">
          <tr className="w-full ">
            <td colSpan={6} className="py-4 relative">
              {
                addNew && <div ref={wrapperRef} className="box-shadow rounded absolute m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white top-0 w-full">
                  {getNewLineItemDropdown()}
                </div>
              }
              <button
                className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
                onClick={() => {
                  setAddNew(!addNew);
                }}
              >
                + NEW LINE ITEM
              </button>
            </td>
          </tr>
          {showItemInputs
            && <ManualEntry
              setShowItemInputs={setShowItemInputs}
              setSelectedOption={setSelectedOption}
              selectedOption={selectedOption}
            />
          }
          {selectedOption.length > 0
            && selectedOption.map(item => (
              <NewLineItemRow
                item={item}
              />
            ))}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default InvoiceTable;
