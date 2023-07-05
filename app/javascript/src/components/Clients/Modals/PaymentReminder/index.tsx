import React, { useState } from "react";

import cn from "classnames";
import { CheckCircleIcon, XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";

import InvoicesList from "./InvoicesList";
import SendPaymentReminder from "./SendPaymentReminder";

const PaymentReminder = ({
  sendPaymentReminder,
  setSendPaymentReminder,
  client,
  clientInvoices,
}) => {
  const invoiceStatus = ["overdue", "viewed", "sent"];
  const invoices = clientInvoices.filter(invoice =>
    invoiceStatus.includes(invoice.status)
  );
  const [activeTab, setActiveTab] = useState<string>("select_invoices");
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>(
    invoices
      .filter(invoice => invoice.status === "overdue")
      .map(invoice => invoice.id)
  );
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const deselectInvoices = (invoiceIds: number[]) =>
    setSelectedInvoices(
      selectedInvoices.filter(id => !invoiceIds.includes(id))
    );

  const handleCheck = event => {
    if (event.target.checked) {
      selectAllInvoices();
      setIsChecked(true);
    } else {
      deselectAllInvoices();
      setIsChecked(false);
    }
  };

  const selectInvoices = (invoiceIds: number[]) => {
    setSelectedInvoices(
      Array.from(new Set(selectedInvoices.concat(invoiceIds)))
    );
  };

  const selectAllInvoices = () => {
    setSelectedInvoices(invoices.map(invoice => invoice.id));
  };

  const deselectAllInvoices = () => {
    deselectInvoices(
      invoices
        .filter(invoice => invoice.status !== "overdue")
        .map(invoice => invoice.id)
    );
  };

  const renderSelectedForm = () => {
    if (activeTab === "select_invoices") {
      return (
        <table className="min-w-full divide-y divide-gray-200 overflow-x-scroll overflow-y-scroll lg:mt-4">
          <thead>
            <tr>
              <th className="py-5" scope="col">
                <CustomCheckbox
                  isUpdatedDesign
                  checkboxValue={1}
                  handleCheck={handleCheck}
                  id={1}
                  isChecked={isChecked}
                  text=""
                  wrapperClassName="h-8 w-8 m-auto rounded-3xl hover:bg-miru-gray-1000"
                />
              </th>
              <th
                className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
                scope="col"
              >
                INVOICE NO.
              </th>
              <th
                className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
                scope="col"
              >
                ISSUE DATE
              </th>
              <th
                className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:pr-2"
                scope="col"
              >
                DUE DATE
              </th>
              <th
                className="hidden w-1/6 px-2 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
                scope="col"
              >
                AMOUNT
              </th>
              <th
                className="hidden w-1/6 px-2 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
                scope="col"
              >
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, idx) => (
              <InvoicesList
                deselectInvoices={deselectInvoices}
                invoice={invoice}
                key={idx}
                selectInvoices={selectInvoices}
                isSelected={
                  selectedInvoices.includes(invoice.id) ||
                  invoice.status === "overdue"
                }
              />
            ))}
          </tbody>
        </table>
      );
    }

    // render email preview
    return (
      <SendPaymentReminder
        client={client}
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        setActiveTab={setActiveTab}
        setSendPaymentReminder={setSendPaymentReminder}
      />
    );
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle min-w-1008"
      isOpen={sendPaymentReminder}
      onClose={() => setSendPaymentReminder(false)}
    >
      <div onClick={e => e.stopPropagation()}>
        <div className="mt-2 mb-6 flex items-center justify-between">
          <h6 className="form__title">Send Payment Reminder</h6>
          <div className="flex">
            <div className="flex">
              {selectedInvoices.length >= 1 && (
                <CheckCircleIcon className="mt-1 text-green-600" size={18} />
              )}
              <h6
                className={cn("mx-2 cursor-pointer", {
                  "text-green-600": selectedInvoices.length >= 1,
                  "text-miru-han-purple-1000": selectedInvoices.length === 0,
                })}
                onClick={() => setActiveTab("select_invoices")}
              >
                Select Invoices
              </h6>
            </div>
            <h6
              className={cn("cursor-pointer text-miru-han-purple-1000", {
                "font-bold": activeTab === "email_preview",
              })}
              onClick={() => setActiveTab("email_preview")}
            >
              Email Preview
            </h6>
          </div>
          <button
            className="text-miru-gray-1000"
            type="button"
            onClick={() => setSendPaymentReminder(false)}
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>
        {renderSelectedForm()}
        <div className="flex justify-between">
          {activeTab === "select_invoices" && (
            <>
              <small className="mt-10">
                {selectedInvoices.length} invoices selected
              </small>
              <div className="mt-6 text-right">
                <Button
                  className="py-2 px-10 text-base"
                  disabled={selectedInvoices.length < 1}
                  style="primary"
                  onClick={() => setActiveTab("email_preview")}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentReminder;
