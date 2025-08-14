import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const NoInvoices = ({ isDesktop, filterParamsStr, handleReset, params }) => {
  const navigate = useNavigate();

  const appliedFilter = filterParamsStr.length > 0;
  const appliedSearch = params.query.length > 0;

  return (
    <EmptyStates
      showNoSearchResultState={appliedFilter || appliedSearch}
      Message={
        appliedFilter || appliedSearch
          ? "No results found"
          : "No invoice has been generated yet."
      }
    >
      {appliedFilter ? (
        <Button
          className="flex items-center justify-center"
          size={isDesktop ? "large" : "small"}
          style="primary"
          onClick={() => handleReset()}
        >
          <span>RESET</span>
        </Button>
      ) : (
        !appliedSearch && (
          <Button
            className="flex items-center justify-center"
            size={isDesktop ? "large" : "small"}
            style="primary"
            onClick={() => navigate("/invoices/generate")}
          >
            <PlusIcon className="mr-2.5" size={isDesktop ? 16 : 12} />
            <span>Create New Invoice</span>
          </Button>
        )
      )}
    </EmptyStates>
  );
};

export default NoInvoices;
