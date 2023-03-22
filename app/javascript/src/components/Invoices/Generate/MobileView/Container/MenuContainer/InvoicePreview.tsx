import React from "react";

import { FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Button } from "StyledComponents";

import { sections } from "../../utils";

const InvoicePreview = ({ setActiveSection }) => (
  <div className="bg-miru-gray-100 p-4">
    <div className="flex justify-between pb-5">
      <span
        className="w-1/2 text-left text-xs font-bold leading-4 text-miru-han-purple-1000"
        onClick={() => {
          setActiveSection(sections.InvoicePreview);
        }}
      >
        Invoice Preview
      </span>
      <div className="flex w-1/2 justify-between pl-2">
        <span className="text-right text-sm font-normal leading-5 text-miru-dark-purple-1000">
          Total
        </span>
        <span className="text-right text-sm font-bold leading-5 text-miru-dark-purple-1000">
          $0.00
        </span>
      </div>
    </div>
    <div className="flex w-full justify-between">
      <Button
        className="mr-2 flex w-1/2 items-center justify-center px-4 py-2"
        style="primary"
      >
        <FloppyDiskIcon className="text-white" size={16} weight="bold" />
        <span className="ml-2 text-center text-base font-bold leading-5 text-white">
          Save
        </span>
      </Button>
      <Button
        className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
        style="primary"
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
