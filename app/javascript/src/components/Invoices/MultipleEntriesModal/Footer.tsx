import React from "react";

import { useUserContext } from "context/UserContext";

const Footer = ({ selectedRowCount, handleSubmitModal, handleSelectAll }) => {
  const { isDesktop } = useUserContext();

  return isDesktop ? (
    <div
      className="flex items-center justify-between rounded-lg px-6 py-4"
      style={{ boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center pt-3">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          {selectedRowCount} entries selected
        </span>
        {selectedRowCount > 0 && (
          <button
            className="tracking-wide ml-4 text-base font-medium text-miru-han-purple-1000"
            onClick={handleSelectAll}
          >
            Reset Selected Entries
          </button>
        )}
      </div>
      <button
        className={`rounded py-2 px-7 text-base font-bold tracking-widest text-white
          ${
            selectedRowCount
              ? "cursor-pointer bg-miru-han-purple-1000"
              : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          }`}
        onClick={handleSubmitModal}
      >
        ADD ENTRIES
      </button>
    </div>
  ) : (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-c1">
      <button
        className={`w-full rounded py-2 px-7 text-base font-bold tracking-widest text-white
          ${
            selectedRowCount
              ? "cursor-pointer bg-miru-han-purple-1000"
              : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          }`}
        onClick={handleSubmitModal}
      >
        {`Add ${selectedRowCount || ""}`}
        {selectedRowCount == 1 ? " entry" : " entries"}
      </button>
    </div>
  );
};

export default Footer;
