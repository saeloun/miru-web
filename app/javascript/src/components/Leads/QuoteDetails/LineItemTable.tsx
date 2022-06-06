import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leadLineItems from "apis/lead-line-items";
import leadQuotes from "apis/lead-quotes";

import LineItemTableHeader from "./LineItemTableHeader";
import ManualEntry from "./ManualEntry";
import NewLineItemRow from "./NewLineItemRow";
import NewLineItemTable from "./NewLineItemTable";

import useOutsideClick from "../../../helpers/outsideClick";
import { unmapQuoteLineItemList } from "../../../mapper/editQuote.mapper";
import { unmapLeadLineItemList } from "../../../mapper/lead.lineItem.mapper";

const LineItemTable = () => {

  const [lineItems, setLineItems] = useState<any>(null);
  const { leadId } = useParams();
  const { quoteId } = useParams();
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leadLineItems.index(leadId, "")
      .then((res) => {
        const sanitized = unmapLeadLineItemList(res);
        setLineItems(sanitized.itemList);
      });
    leadQuotes.edit(leadId, quoteId)
      .then((res) => {
        const sanitized = unmapQuoteLineItemList(res);
        setSelectedLineItems(sanitized.itemList);
      });
  }, [leadId]);

  const [addNew, setAddNew] = useState<boolean>(false);
  const [manualEntry, setManualEntry] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => {
    setAddNew(false);
  }, addNew);

  const getNewLineItemDropdown = () => <NewLineItemTable
    lineItems={lineItems}
    setLineItems={setLineItems}
    selectedLineItems={selectedLineItems}
    setSelectedLineItems={setSelectedLineItems}
    addNew={addNew}
    setAddNew={setAddNew}
    setManualEntry={setManualEntry}
  />;

  const getAddNewButton = () => {
    if (addNew) {
      return <div ref={wrapperRef} className="box-shadow rounded absolute m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white top-0 w-full">
        {getNewLineItemDropdown()}
      </div>;
    } else {
      return <button
        className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
        onClick={() => {
          setAddNew(!addNew);
        }}
      >
        + NEW LINE ITEM
      </button>;
    }
  };

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <LineItemTableHeader />
        <tbody className="w-full">
          <tr className="w-full">
            <td colSpan={6} className="py-4 relative">
              {getAddNewButton()}
            </td>
          </tr>
          {manualEntry
            && <ManualEntry
              setShowItemInputs={setManualEntry}
              setSelectedOption={setSelectedLineItems}
              selectedOption={selectedLineItems}
            />
          }
          {
            selectedLineItems.map((item, index) => (
              <NewLineItemRow
                item={item}
                selectedOption={selectedLineItems}
                setSelectedOption={setSelectedLineItems}
                key={index}
              />
            ))}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default LineItemTable;
