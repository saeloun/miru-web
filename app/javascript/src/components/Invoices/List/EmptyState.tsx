import React from "react";

import { EmptyStateInvoices, PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const EmptyState = ({ isDesktop }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-6 flex h-5/6 items-center justify-center bg-miru-gray-100">
      <div className="flex flex-col items-center justify-between">
        <img src={EmptyStateInvoices} />
        <span className="mt-10 mb-5 text-center text-base font-semibold leading-5 text-miru-dark-purple-200 lg:text-lg lg:leading-7">
          No invoice has been generated yet.
        </span>
        <Button
          className="flex items-center justify-center"
          size={isDesktop ? "large" : "small"}
          style="primary"
          onClick={() => navigate("/invoices/generate")}
        >
          <PlusIcon className="mr-2.5" size={isDesktop ? 16 : 12} />
          <span>Create New Invoice</span>
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
