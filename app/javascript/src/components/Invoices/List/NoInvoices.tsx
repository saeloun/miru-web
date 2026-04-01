import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";
import { i18n } from "../../../i18n";

const NoInvoices = ({ isDesktop, filterParamsStr, handleReset, params }) => {
  const navigate = useNavigate();

  const appliedFilter = filterParamsStr.length > 0;
  const appliedSearch = params.query.length > 0;

  return (
    <EmptyStates
      showNoSearchResultState={appliedFilter || appliedSearch}
      Message={
        appliedFilter || appliedSearch
          ? i18n.t("noResultsFound")
          : i18n.t("invoices.noInvoiceGenerated")
      }
    >
      {appliedFilter ? (
        <Button
          className="flex items-center justify-center"
          size={isDesktop ? "large" : "small"}
          style="primary"
          onClick={() => handleReset()}
        >
          <span>{i18n.t("reset")}</span>
        </Button>
      ) : (
        !appliedSearch && (
          <Button
            className="flex items-center justify-center"
            size={isDesktop ? "large" : "small"}
            style="primary"
            onClick={() => navigate("/invoices/new")}
          >
            <PlusIcon className="mr-2.5" size={isDesktop ? 16 : 12} />
            <span>{i18n.t("invoices.createNewInvoice")}</span>
          </Button>
        )
      )}
    </EmptyStates>
  );
};

export default NoInvoices;
