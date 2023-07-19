import React from "react";

import { InputErrors } from "common/FormikFields";
import LineItemTableHeader from "components/Invoices/common/LineItemTableHeader";

import LineItemRow from "./LineItemRow";

import { sections } from "../../utils";

const LineItems = ({
  selectedClient,
  setActiveSection,
  selectedLineItems,
  setEditItem,
  manualEntryArr,
  dateFormat,
  currency,
  isInvoicePreviewCall,
  strikeAmount = "",
}) => (
  <table
    className={`bg-miru-han-1000 ${
      selectedClient ? "mb-6" : "mb-0"
    } w-full table-fixed border-collapse`}
  >
    <LineItemTableHeader />
    <tbody>
      {!isInvoicePreviewCall && (
        <>
          <tr>
            <td className="w-full pt-4" colSpan={6}>
              <button
                disabled={!selectedClient}
                className={`w-full rounded border border-dashed  bg-white py-3 text-center text-xs font-bold tracking-widest ${
                  selectedClient
                    ? "border-miru-dark-purple-200 text-miru-dark-purple-200"
                    : "border-miru-dark-purple-100 text-miru-dark-purple-100"
                }`}
                onClick={() => {
                  setEditItem({});
                  setActiveSection(sections.addLineItem);
                }}
              >
                + Add New Line Item
              </button>
            </td>
          </tr>
          <tr>
            <td colSpan={6}>
              <InputErrors
                fieldErrors="Please add client before adding line items."
                fieldTouched={!selectedClient}
              />
            </td>
          </tr>
        </>
      )}
      {manualEntryArr[0]?.name &&
        manualEntryArr.map(
          (item, index) =>
            !item._destroy && (
              <LineItemRow
                currency={currency}
                dateFormat={dateFormat}
                isInvoicePreviewCall={isInvoicePreviewCall}
                item={item}
                key={index}
                setActiveSection={setActiveSection}
                setEditItem={setEditItem}
                strikeAmount={strikeAmount}
              />
            )
        )}
      {selectedLineItems.length > 0 &&
        selectedLineItems.map(
          (item, index) =>
            !item._destroy && (
              <LineItemRow
                currency={currency}
                dateFormat={dateFormat}
                isInvoicePreviewCall={isInvoicePreviewCall}
                item={item}
                key={index}
                setActiveSection={setActiveSection}
                setEditItem={setEditItem}
                strikeAmount={strikeAmount}
              />
            )
        )}
    </tbody>
  </table>
);

export default LineItems;
