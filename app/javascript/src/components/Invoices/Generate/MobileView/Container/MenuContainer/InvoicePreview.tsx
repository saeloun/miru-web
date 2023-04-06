import React from "react";

import { currencyFormat } from "helpers";
import { FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Button } from "StyledComponents";

import { sections } from "../../utils";

const InvoicePreview = ({
  setActiveSection,
  total,
  currency,
  setIsInvoicePreviewCall,
  handleSaveInvoice,
  selectedClient,
  handleSendButtonClick,
}) => (
  <div className="bg-miru-gray-100 p-4">
    <div className="flex justify-between pb-5">
      <span
        className="w-1/2 text-left text-xs font-bold leading-4 text-miru-han-purple-1000"
        onClick={() => {
          if (selectedClient) {
            setActiveSection(sections.invoicePreview);
            setIsInvoicePreviewCall(true);
          }
        }}
      >
        Invoice Preview
      </span>
      <div className="flex w-1/2 justify-between pl-2">
        <span className="text-right text-sm font-normal leading-5 text-miru-dark-purple-1000">
          Total
        </span>
        <span className="text-right text-sm font-bold leading-5 text-miru-dark-purple-1000">
          {currencyFormat(currency, total)}
        </span>
      </div>
    </div>
    <div className="flex w-full justify-between">
      <Button
        className="mr-2 flex w-1/2 items-center justify-center px-4 py-2"
        style="primary"
        onClick={handleSaveInvoice}
      >
        <FloppyDiskIcon className="text-white" size={16} weight="bold" />
        <span className="ml-2 text-center text-base font-bold leading-5 text-white">
          Save
        </span>
      </Button>
      <Button
        className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
        style="primary"
        onClick={() => {
          handleSendButtonClick();
        }}
      >
        <PaperPlaneTiltIcon className="text-white" size={16} weight="bold" />
        <span className="ml-2 text-center text-base font-bold leading-5 text-white">
          Send to
        </span>
      </Button>
    </div>
  </div>
);

export default InvoicePreview;
