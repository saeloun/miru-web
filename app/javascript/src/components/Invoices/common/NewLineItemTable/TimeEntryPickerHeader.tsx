import React from "react";
import { i18n } from "../../../../i18n";

const TimeEntryPickerHeader = ({ setShowMultilineModal, setLineItem }) => (
  <div className="flex items-center justify-center px-3 pt-6 pb-2 lg:justify-start">
    <button
      type="button"
      className="hidden text-xs font-bold tracking-widest text-primary lg:inline"
      onClick={() => {
        setShowMultilineModal(true);
        setLineItem({});
      }}
    >
      {i18n.t("invoices.selectTimeEntries")}
    </button>
    <button
      type="button"
      className="text-xs font-bold tracking-widest text-primary lg:hidden"
      onClick={() => {
        setShowMultilineModal(true);
        setLineItem({});
      }}
    >
      {i18n.t("invoices.selectTimeEntries")}
    </button>
  </div>
);

export default TimeEntryPickerHeader;
