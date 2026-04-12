import React from "react";

import { useUserContext } from "context/UserContext";
import { XIcon } from "miruIcons";

import Filters from "./Filters";
import { i18n } from "../../../i18n";

const TimeEntrySelectionHeader = ({
  setMultiLineItemModal,
  teamMembers,
  filterParams,
  setFilterParams,
  selectedInput,
  setSelectedInput,
  filterIntialValues,
  handleSelectAll,
}) => {
  const { isDesktop } = useUserContext();

  return (
    <div>
      {isDesktop && (
        <div className="flex justify-between px-6 pb-2 pt-6">
          <span className="text-base font-extrabold text-foreground">
            {i18n.t("invoices.selectTimeEntries")}
          </span>
          <button type="button" onClick={() => setMultiLineItemModal(false)}>
            <XIcon color="#CDD6DF" size={16} />
          </button>
        </div>
      )}
      <Filters
        filterIntialValues={filterIntialValues}
        filterParams={filterParams}
        handleSelectAll={handleSelectAll}
        selectedInput={selectedInput}
        setFilterParams={setFilterParams}
        setSelectedInput={setSelectedInput}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default TimeEntrySelectionHeader;
