import React from "react";

import { useUserContext } from "context/UserContext";
import { i18n } from "../../../i18n";

const Footer = ({ selectedRowCount, handleSubmitModal, handleSelectAll }) => {
  const { isDesktop } = useUserContext();

  return isDesktop ? (
    <div
      className="flex items-center justify-between rounded-lg px-6 py-4"
      style={{ boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center pt-3">
        <span className="text-sm font-medium text-foreground">
          {selectedRowCount}{" "}
          {i18n.t("invoices.entriesSelected", { count: selectedRowCount })}
        </span>
        {selectedRowCount > 0 && (
          <button
            type="button"
            className="tracking-wide ml-4 text-base font-medium text-primary"
            onClick={handleSelectAll}
          >
            {i18n.t("invoices.resetSelectedEntries")}
          </button>
        )}
      </div>
      <button
        type="button"
        className={`rounded py-2 px-7 text-base font-bold tracking-widest text-white
          ${
            selectedRowCount
              ? "cursor-pointer bg-primary"
              : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          }`}
        onClick={handleSubmitModal}
      >
        {i18n.t("invoices.addEntries")}
      </button>
    </div>
  ) : (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-c1">
      <button
        type="button"
        className={`w-full rounded py-2 px-7 text-base font-bold tracking-widest text-white
          ${
            selectedRowCount
              ? "cursor-pointer bg-primary"
              : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          }`}
        onClick={handleSubmitModal}
      >
        {selectedRowCount == 1
          ? i18n.t("invoices.addEntry", { count: selectedRowCount })
          : i18n.t("invoices.addEntries_plural", {
              count: selectedRowCount || "",
            })}
      </button>
    </div>
  );
};

export default Footer;
